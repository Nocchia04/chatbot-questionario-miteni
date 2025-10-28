// /lib/openaiClient.ts
import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️ OPENAI_API_KEY non è definita in .env.local");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
