// /lib/ai.ts
import { openai } from "./openaiClient";

export async function normalizeUserAnswerWithAI(
  question: string,
  userAnswer: string
) {
  const systemPrompt = `
Sei un assistente che pulisce risposte testuali per un questionario legale.
Regole:
- Non aggiungere informazioni nuove.
- Non fare diagnosi.
- Non promettere risultati legali.
- Se qualcosa è vago, lascialo vago.
Rispondi SOLO con la risposta riscritta, senza testo extra.
`;

  const userPrompt = `
Domanda del questionario:
"${question}"

Risposta dell'utente (grezza):
"${userAnswer}"

Riscrivi la risposta dell'utente in modo chiaro e sintetico.
`;

  const response = await openai.responses.create({
    model: "gpt-5",
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const cleaned = response.output_text?.trim() || userAnswer;

  return {
    normalizedAnswer: cleaned,
    confidence: 0.9,
  };
}
