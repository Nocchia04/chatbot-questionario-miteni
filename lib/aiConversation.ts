// /lib/aiConversation.ts
import { openai } from "./openaiClient";
import { ConversationContext } from "./flow";
import { withRetry, aiCircuitBreaker } from "./utils/aiRetry";
import { logger } from "./utils/logger";

export type ConversationAIResult = {
  botReply: string;               // cosa dire ORA all'utente (tono umano)
  interpretedAnswer: string | null; // risposta pulita alla domanda corrente, se c'è
  advance: boolean;               // possiamo andare avanti alla prossima domanda?
  kind: "answer" | "faq";         // "answer" = utente sta rispondendo alla domanda corrente
                                   // "faq"    = utente fa una domanda di contesto/paura
};

export async function aiConversationLayer(
  ctx: ConversationContext,
  currentQuestion: string,
  userMessage: string,
  history: { from: "user" | "bot"; text: string }[],
  contextConfidence: "high" | "medium" | "low" = "high"
): Promise<ConversationAIResult> {
  // Estratto di conversazione recente (tono, preoccupazioni, ecc.)
  // Ridotto a 4 messaggi per velocità (era 6)
  const lastTurnsText = history
    .slice(-4)
    .map((msg) =>
      msg.from === "user"
        ? `Utente: ${msg.text}`
        : `Assistente: ${msg.text}`
    )
    .join("\n");

  const systemPrompt = `
Sei un assistente legale empatico specializzato ESCLUSIVAMENTE sul caso PFAS Miteni.

CONTESTO:
Stai aiutando persone potenzialmente esposte all'inquinamento da PFAS causato dalla Miteni a compilare un questionario legale per richiedere risarcimento.

RUOLO DOPPIO:
1. Raccogli risposte per il questionario legale.
2. Rispondi SOLO a domande relative a:
   - PFAS (cosa sono, rischi sanitari, inquinamento)
   - Caso Miteni (responsabili, processo legale)
   - Questionario (cosa serve, perché certe domande)
   - Preoccupazioni dell'utente legate al caso
   - Salute (in relazione ai PFAS)
   - Risarcimenti e processo legale

LIMITI RIGIDI - NON RISPONDERE MAI A:
- Domande generiche non correlate a PFAS/Miteni
- Ricette, sport, intrattenimento, meteo
- Argomenti completamente fuori contesto
- Conversazioni casual o scherzi

SE LA DOMANDA È FUORI CONTESTO:
Rispondi educatamente che puoi aiutare solo con il caso PFAS e riporta gentilmente al questionario.

IMPORTANTISSIMO:
- Non fare diagnosi mediche personali.
- Non promettere rimborsi o soldi garantiti.
- Non spaventare.
- Se l'utente è ansioso sui PFAS, rassicuralo con calma.
- Se la domanda è vaga ma potrebbe essere correlata, chiedi chiarimenti.

OUTPUT:
Devi restituire SOLO un JSON di questo tipo:

{
  "kind": "answer" oppure "faq",
  "botReply": "testo che l'assistente dice ORA all'utente (tono umano, max ~4 frasi)",
  "interpretedAnswer": "testo pulito della risposta alla domanda corrente SE l'utente ha risposto a quella domanda, altrimenti null",
  "advance": true o false
}

Spiegazione campi:
- "kind":
   - "answer" se l'utente sta cercando di rispondere alla domanda corrente del questionario.
   - "faq" se l'utente sta chiedendo informazioni/dubbi/paure/contesto, NON una risposta alla domanda.
- "botReply":
   - Se kind = "faq": rispondi alla domanda dell'utente in modo rassicurante e umano, e ricordagli che stiamo compilando la pratica.
   - Se kind = "answer": ringrazia, conferma di aver capito, tono caldo.
- "interpretedAnswer":
   - Se kind = "answer": estrai la risposta alla DOMANDA CORRENTE in modo chiaro e breve (non inventare).
   - Se kind = "faq": deve essere null.
- "advance":
   - true solo se kind="answer" E la risposta è abbastanza chiara da poter salvare e passare alla prossima domanda.
   - false in tutti gli altri casi.
`;

  const contextHint = contextConfidence === "low" 
    ? "\n⚠️ ATTENZIONE: Questa domanda potrebbe essere fuori contesto. Verifica che sia correlata a PFAS/Miteni prima di rispondere."
    : "";

  const userPrompt = `
CONTESTO CONVERSAZIONE (ultimi turni):
${lastTurnsText || "(nessuna history precedente)"}

DOMANDA DEL QUESTIONARIO A CUI STIAMO PROVANDO A RISPONDERE ORA:
"${currentQuestion}"

MESSAGGIO APPENA RICEVUTO DALL'UTENTE:
"${userMessage}"${contextHint}

COSA DEVI FARE:
1. PRIMA DI TUTTO: Verifica che il messaggio sia correlato a PFAS/Miteni/questionario.
   - Se NON è correlato (es. ricette, sport, domande generiche), restituisci kind="faq" con un messaggio che invita a tornare al questionario.
   
2. SE È CORRELATO: Capire se l'utente ti ha dato una risposta alla domanda corrente oppure ti sta chiedendo una cosa di contesto PFAS/paura.

3. Restituisci il JSON con kind, botReply, interpretedAnswer e advance, come spiegato sopra.

RICORDA: Rispondi SOLO con il JSON valido, senza testo aggiuntivo.
`;

  // Chiamata AI con retry e circuit breaker
  let rawText = "";
  
  try {
    const response = await aiCircuitBreaker.execute(() =>
      withRetry(
        async () => {
          return await openai.responses.create({
            model: "gpt-4o-mini", // Più veloce ed economico di gpt-5
            input: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          });
        },
        {
          maxRetries: 3,
          baseDelay: 1000,
          onRetry: (attempt, error) => {
            logger.warn("AI call retry", undefined, { attempt, error: error.message });
          },
        }
      )
    );

    rawText = response.output_text?.trim() || "";
  } catch (error: any) {
    logger.error("AI call failed after retries", undefined, { error: error.message });
    // Ritorna fallback in caso di errore persistente
    return {
      kind: "faq",
      botReply:
        "Mi dispiace, ho avuto un problema tecnico. Puoi riprovare tra un momento? 🙏",
      interpretedAnswer: null,
      advance: false,
    };
  }

  try {
    const parsed = JSON.parse(rawText);

    const validKind =
      parsed.kind === "answer" || parsed.kind === "faq";

    if (
      validKind &&
      typeof parsed.botReply === "string" &&
      "interpretedAnswer" in parsed &&
      "advance" in parsed
    ) {
      return {
        kind: parsed.kind,
        botReply: parsed.botReply,
        interpretedAnswer: parsed.interpretedAnswer,
        advance: parsed.advance,
      };
    }
  } catch (e) {
    // se il modello non ha restituito JSON valido, andiamo in fallback
  }

  // fallback difensivo
  return {
    kind: "faq",
    botReply:
      "Ti capisco 🙏. Ti rispondo con calma e poi continuiamo con la pratica. Dimmi pure se hai altre domande.",
    interpretedAnswer: null,
    advance: false,
  };
}
