// /lib/aiNextQuestion.ts
import { openai } from "./openaiClient";
import { ConversationContext, FlowNode } from "./flow";
import { withRetry, aiCircuitBreaker } from "./utils/aiRetry";
import { logger } from "./utils/logger";

/**
 * Produce una versione personalizzata della prossima domanda legale.
 * NON cambia il senso della domanda, solo il tono/context.
 */
export async function generateNextQuestionTurn(
  ctx: ConversationContext,
  nextNode: FlowNode
): Promise<string> {
  // Riassunto sintetico degli ultimi dati noti dell'utente
  // Ridotto a 4 per velocità (era 6)
  const knownBits = Object.entries(ctx.data)
    .map(([key, value]) => {
      if (!value) return null;
      if (typeof value === "object" && value.normalized) {
        return `${key}: ${value.normalized}`;
      }
      if (typeof value === "string") {
        return `${key}: ${value}`;
      }
      return null;
    })
    .filter(Boolean)
    .slice(-4)
    .join(" | ");

  // Pezzetto di history recente per aiutare il tono
  const lastTurnsText = ctx.history
    .slice(-4)
    .map((msg) =>
      msg.from === "user"
        ? `Utente: ${msg.text}`
        : `Assistente: ${msg.text}`
    )
    .join("\n");

  const systemPrompt = `
Sei un assistente legale empatico.
Devi fare la prossima domanda del questionario legale
in modo comprensibile e personalizzato,
ma SENZA cambiare il senso legale della domanda originale.

Regole:
- Tono caldo, semplice, non robotico.
- Puoi fare riferimento a dettagli che l'utente ha già detto, per dimostrare che ascolti.
- Non promettere risarcimenti garantiti.
- Non fare diagnosi.
- Alla fine DEVE comunque risultare chiaro cosa deve rispondere l'utente.
- Una domanda sola, max 2 frasi brevi.
`;

  const userPrompt = `
DATI CHE ABBIAMO RACCOLTO (ultimi punti chiave):
${knownBits || "(nessun dato significativo salvato ancora)"}

ANDAMENTO DEL DIALOGO FINO AD ORA:
${lastTurnsText || "(poco contesto finora)"}

DOMANDA LEGALE UFFICIALE DA PORRE ORA (non alterare il significato, solo riscriverla con tatto umano):
"${nextNode.question}"

Riscrivi questa domanda in modo umano e personale per l'utente.
`;

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
          maxRetries: 2,
          baseDelay: 800,
          onRetry: (attempt, error) => {
            logger.warn("AI personalization retry", undefined, { attempt, error: error.message });
          },
        }
      )
    );

    const personalized = response.output_text?.trim() || nextNode.question;
    return personalized;
  } catch (error: any) {
    logger.error("AI personalization failed, using default question", undefined, { 
      error: error.message 
    });
    // Fallback: ritorna la domanda originale
    return nextNode.question;
  }
}
