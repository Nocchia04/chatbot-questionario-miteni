// /lib/conversationController.ts
import { FLOW, ConversationContext } from "./flow";
import { saveSession, findExistingSessionByEmail } from "./sessionStore";
import { aiConversationLayer } from "./aiConversation";
import { generateNextQuestionTurn } from "./aiNextQuestion";
import { validateByKey } from "./validation/inputValidation";
import { logger } from "./utils/logger";
import { isInContext, getOffTopicResponse } from "./guardrails/contextGuardrail";
import { upsertSheetRow } from "./integrations/googleSheets";
import { generateSummary } from "./utils/generateSummary";
import { findMatchingFAQ } from "./knowledge/faqRisarcimento";

export type HandleAnswerResult = {
  botMessages: string[];
  done: boolean;
};

export async function handleAnswer(
  ctx: ConversationContext,
  userMessage: string
): Promise<HandleAnswerResult> {
  logger.info("Handling user message", ctx.sessionId, { 
    state: ctx.currentState, 
    messageLength: userMessage.length 
  });

  // se siamo già alla fine
  if (ctx.currentState === "FINE") {
    // Messaggio diverso se ha scelto telefono vs completato il questionario
    const hasCompletedFull = ctx.data.R17?.normalized;
    const finalMessage = hasCompletedFull
      ? "Grazie per aver completato il questionario. Abbiamo tutte le informazioni necessarie. La ricontatteremo al più presto per i prossimi passi. Buona giornata."
      : "Perfetto. Abbiamo registrato i suoi dati. La ricontatteremo al più presto al numero che ci ha fornito per completare il questionario insieme. Grazie.";
    
    return {
      botMessages: [finalMessage],
      done: true,
    };
  }

  const currentNode = FLOW[ctx.currentState];

  // 1. FAQ HANDLER: Controlla se è una domanda FAQ comune
  const matchingFAQ = findMatchingFAQ(userMessage);
  if (matchingFAQ && userMessage.includes("?")) {
    logger.info("FAQ match found", ctx.sessionId, { faq: matchingFAQ.domanda });
    
    ctx.history.push({ from: "user", text: userMessage });
    ctx.history.push({ from: "bot", text: matchingFAQ.risposta });
    saveSession(ctx);
    
    return {
      botMessages: [matchingFAQ.risposta],
      done: false,
    };
  }

  // 2. GUARDRAIL: Verifica che la domanda sia nel contesto PFAS/Miteni
  const contextCheck = isInContext(userMessage);
  
  if (!contextCheck.inContext && contextCheck.confidence === "high") {
    // Domanda chiaramente off-topic (es. "Come si fa la carbonara?")
    logger.warn("Off-topic question detected", ctx.sessionId, { 
      message: userMessage,
      reason: contextCheck.reason 
    });
    
    const offTopicReply = getOffTopicResponse();
    
    ctx.history.push({ from: "user", text: userMessage });
    ctx.history.push({ from: "bot", text: offTopicReply });
    saveSession(ctx);
    
    return {
      botMessages: [offTopicReply],
      done: false,
    };
  }

  // 2. facciamo ragionare l'AI per capire cos'è successo in questo turno
  const aiResult = await aiConversationLayer(
    ctx,
    currentNode.question,
    userMessage,
    ctx.history,
    contextCheck.confidence // Passiamo confidence all'AI
  );
  // aiResult = { kind, botReply, interpretedAnswer, advance }
  
  logger.info("AI result", ctx.sessionId, { 
    state: ctx.currentState,
    kind: aiResult.kind, 
    advance: aiResult.advance,
    hasInterpretedAnswer: !!aiResult.interpretedAnswer,
    interpretedAnswer: aiResult.interpretedAnswer?.substring(0, 50), // primi 50 char per debug
    contextConfidence: contextCheck.confidence,
    userMessageLength: userMessage.length
  });

  // 3. aggiorniamo la history con l'input utente
  //    NOTA: La risposta bot verrà aggiunta alla fine, quando sappiamo esattamente cosa mandare al frontend
  ctx.history.push({ from: "user", text: userMessage });

  // Caso A: l'utente ha fatto una FAQ / ha espresso paura / ha chiesto info.
  // kind === "faq"
  if (aiResult.kind === "faq") {
    // NON salviamo nulla nel questionario
    // NON avanziamo di stato
    // NON chiediamo subito la prossima domanda
    // Rispondiamo solo empatia+spiegazione.

    logger.info("FAQ detected", ctx.sessionId, {
      state: ctx.currentState,
      userMessage: userMessage.substring(0, 100),
      botReply: aiResult.botReply.substring(0, 100)
    });

    // Aggiungi la risposta bot alla history
    ctx.history.push({ from: "bot", text: aiResult.botReply });

    // Persistiamo lo stato così com'è
    saveSession(ctx);

    return {
      botMessages: [aiResult.botReply],
      done: false, // Non possiamo essere in FINE qui (controllato sopra)
    };
  }

  // Caso B: l'utente sta rispondendo alla domanda corrente del questionario.
  // kind === "answer"

  // 4. Se abbiamo una risposta valida alla domanda attuale, salviamola
  if (aiResult.interpretedAnswer && currentNode.saveKey) {
    // 4.1 Validazione input se necessario
    const validation = validateByKey(currentNode.saveKey, aiResult.interpretedAnswer);
    
    if (!validation.isValid) {
      // La risposta non è valida, chiedi di nuovo
      logger.warn("Validation failed", ctx.sessionId, { 
        state: ctx.currentState,
        key: currentNode.saveKey,
        interpretedAnswer: aiResult.interpretedAnswer,
        error: validation.error,
        userMessage: userMessage.substring(0, 100) // primi 100 char
      });
      
      const validationErrorMessage = `${validation.error}\n\nPer favore, riprova.`;
      
      ctx.history.push({ from: "bot", text: validationErrorMessage });
      saveSession(ctx);
      
      return {
        botMessages: [validationErrorMessage],
        done: false,
      };
    }
    
    // Salva la risposta validata e normalizzata
    ctx.data[currentNode.saveKey] = {
      original: userMessage,
      normalized: validation.normalized || aiResult.interpretedAnswer,
    };
    
    logger.info("Answer saved", ctx.sessionId, { 
      key: currentNode.saveKey, 
      value: validation.normalized 
    });

    // 4.2 RESUME: Se è l'email, controlla se esiste già una sessione per questa email
    if (currentNode.saveKey === "email") {
      const email = validation.normalized || aiResult.interpretedAnswer;
      const existingSession = await findExistingSessionByEmail(email);
      
      // Se esiste una sessione diversa da quella corrente
      if (existingSession && existingSession.sessionId !== ctx.sessionId) {
        if (existingSession.currentState === "FINE") {
          // Sessione già completata
          logger.info("Sessione già completata trovata", ctx.sessionId, { 
            existingSessionId: existingSession.sessionId 
          });
          
          const alreadyCompletedMsg = 
            "Vedo che hai già completato il questionario con questa email in precedenza. " +
            "Se hai bisogno di aggiornare le tue informazioni, contattaci direttamente. Grazie! 🙏";
          
          ctx.history.push({ from: "bot", text: alreadyCompletedMsg });
          ctx.currentState = "FINE";
          saveSession(ctx);
          
          return {
            botMessages: [alreadyCompletedMsg],
            done: true,
          };
        } else {
          // Sessione incompleta - RESUME
          logger.info("Sessione incompleta trovata, resume", ctx.sessionId, { 
            existingSessionId: existingSession.sessionId,
            resumeState: existingSession.currentState 
          });
          
          const resumeMsg = 
            `Bentornato/a! 👋 Vedo che avevi già iniziato a compilare il questionario. ` +
            `Riprenderemo da dove avevi interrotto.`;
          
          // Copia i dati dalla sessione esistente alla corrente
          ctx.data = { ...existingSession.data };
          ctx.currentState = existingSession.currentState;
          ctx.history = [...existingSession.history, ...ctx.history];
          
          ctx.history.push({ from: "bot", text: resumeMsg });
          saveSession(ctx);
          
          // Genera la prossima domanda
          const resumeNode = FLOW[ctx.currentState];
          const nextQuestionText = await generateNextQuestionTurn(
            ctx,
            resumeNode
          );
          
          ctx.history.push({ from: "bot", text: nextQuestionText });
          saveSession(ctx);
          
          return {
            botMessages: [resumeMsg, nextQuestionText],
            done: false,
          };
        }
      }
    }

    // Salva su Google Sheets (async, non blocca il flusso)
    upsertSheetRow(ctx).catch((err) => {
      logger.error("Errore sync Google Sheets", ctx.sessionId, { 
        error: err.message 
      });
    });
  }

  // 6. Se l'AI dice che possiamo avanzare, avanziamo allo stato successivo
  // SAFETY: Se kind="answer" MA advance=false, forziamo advance=true per evitare loop infiniti
  const shouldAdvance = aiResult.advance || (aiResult.kind === "answer" && aiResult.interpretedAnswer);
  
  if (!shouldAdvance && aiResult.kind === "answer") {
    logger.warn("AI returned answer without advance, forcing advance to prevent loop", ctx.sessionId, {
      state: ctx.currentState,
      interpretedAnswer: aiResult.interpretedAnswer
    });
  }
  
  if (shouldAdvance) {
    const nextState = currentNode.next(
      ctx,
      aiResult.interpretedAnswer || ""
    );
    ctx.currentState = nextState;
    
    logger.info("State advanced", ctx.sessionId, { 
      from: currentNode.saveKey, 
      to: nextState 
    });
  }

  // 6. Calcoliamo la prossima domanda (che può essere la stessa se non siamo avanzati)
  const followupNode = FLOW[ctx.currentState];

  // 7. CASO SPECIALE: Se siamo arrivati allo stato RIEPILOGO per la prima volta, generiamo il summary automaticamente
  //    (Controlliamo se il riepilogo non è ancora stato generato)
  if (ctx.currentState === "RIEPILOGO" && !ctx.data.riepilogo) {
    logger.info("Generazione riepilogo finale", ctx.sessionId);
    
    const summary = generateSummary(ctx);
    
    // Salviamo il summary nei dati
    ctx.data.riepilogo = {
      normalized: summary,
      raw: summary
    };
    
    // Componiamo il messaggio finale: summary + domanda di verifica
    const summaryMessage = `${summary}\n\n${followupNode.question}`;
    
    ctx.history.push({ from: "bot", text: summaryMessage });
    saveSession(ctx);
    
    // Sync con Google Sheets
    upsertSheetRow(ctx).catch((err) => {
      logger.error("Errore sync riepilogo Google Sheets", ctx.sessionId, { 
        error: err.message 
      });
    });
    
    logger.info("Riepilogo generato e salvato", ctx.sessionId);
    
    return {
      botMessages: [summaryMessage],
      done: false,
    };
  }

  // 8. Personalizziamo la domanda successiva a partire dalle info raccolte
  const personalizedQuestion = await generateNextQuestionTurn(
    ctx,
    followupNode
  );

  // 8. Decidiamo come costruire la bolla finale da mandare al frontend.
  //    Stessa euristica di prima per evitare doppioni lunghi.
  const isDirectQuestion =
    personalizedQuestion.trim().includes("?") &&
    personalizedQuestion.trim().length > 10;

  let finalBotBubble: string;
  if (isDirectQuestion) {
    // se la domanda personalizzata è già chiara e diretta ("Andrea, confermi che...?"),
    // mostriamo solo quella
    finalBotBubble = personalizedQuestion.trim();
  } else {
    // altrimenti mostriamo ringraziamento/empatia + la domanda
    finalBotBubble = `${aiResult.botReply.trim()}\n\n${personalizedQuestion.trim()}`.trim();
  }

  // 9. IMPORTANTE: Aggiungiamo alla history SOLO il messaggio finale che viene mostrato
  //    Questo evita che messaggi "nascosti" appaiano quando si ricarica la chat
  ctx.history.push({ from: "bot", text: finalBotBubble });

  // 10. Persistiamo la sessione aggiornata
  saveSession(ctx);
  
  // Se abbiamo appena completato, sync finale su Google Sheets
  if (ctx.currentState === "FINE") {
    upsertSheetRow(ctx).catch((err) => {
      logger.error("Errore sync finale Google Sheets", ctx.sessionId, { 
        error: err.message 
      });
    });
  }
  
  logger.info("Turn completed", ctx.sessionId, { 
    state: ctx.currentState, 
    done: ctx.currentState === "FINE" 
  });

  // 11. Rispondiamo al frontend con UNA sola bolla
  return {
    botMessages: [finalBotBubble],
    done: ctx.currentState === "FINE",
  };
}
