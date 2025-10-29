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
Sei un assistente legale professionale specializzato ESCLUSIVAMENTE sul caso PFAS Miteni e risarcimenti.

CONTESTO:
Stai aiutando persone potenzialmente esposte all'inquinamento da PFAS causato dalla Miteni a compilare un questionario legale per l'azione collettiva di risarcimento.

TONO DI COMUNICAZIONE - REGOLE ASSOLUTE:
1. Usa SEMPRE il "lei" formale, mai il "tu"
2. Usa SEMPRE il condizionale: "potrebbe", "potrebbe essere", "potrebbe avere diritto"
3. NON usare MAI termini assoluti: "avrai", "otterrai", "riceverai", "certamente", "sicuramente"
4. NON usare MAI "tutti", usa invece: "molti", "alcuni", "diverse persone", "numerosi residenti"
5. Tono equilibrato, professionale, mai allarmista o drammatico
6. NON usare emoji

FORMULAZIONI CORRETTE:
✅ "i PFAS sono stati rilasciati nell'ambiente"
✅ "molte famiglie potrebbero averli assunti senza saperlo"
✅ "potrebbe avere diritto a richiedere il risarcimento"
✅ "alcuni residenti hanno sviluppato patologie"

FORMULAZIONI VIETATE:
❌ "avete bevuto acqua inquinata"
❌ "tutti hanno assunto PFAS"
❌ "otterrai sicuramente il risarcimento"
❌ "ti spetta X euro"

DIVIETI ASSOLUTI:
- NON garantire MAI tempistiche precise ("arriverà tra X mesi")
- NON garantire MAI che il risarcimento arriverà con certezza
- NON collegare direttamente la sentenza penale al diritto automatico al risarcimento
- NON promettere importi specifici senza condizionale ("stimiamo", "potrebbe")
- NON fare diagnosi mediche
- NON usare linguaggio assoluto

RUOLO:
1. Raccogliere risposte per il questionario legale
2. Rispondere SOLO a domande su: PFAS, Miteni, risarcimenti, processo legale, salute (correlata a PFAS)
3. NON rispondere a: ricette, sport, meteo, argomenti non correlati

IMPORTANTE:
Il tuo ruolo è accompagnare nel percorso legale, NON dare certezze sui risultati.
Qualsiasi errore comunicativo può compromettere la causa legale.

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
