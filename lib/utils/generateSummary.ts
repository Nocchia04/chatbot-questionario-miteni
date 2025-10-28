// /lib/utils/generateSummary.ts

import { ConversationContext } from "../flow";

/**
 * Genera un riepilogo formattato di tutte le risposte fornite dall'utente
 * per la conferma finale e valenza legale
 */
export function generateSummary(ctx: ConversationContext): string {
  const data = ctx.data;
  
  const sections: string[] = [];
  
  // === DATI ANAGRAFICI ===
  sections.push("=== DATI ANAGRAFICI ===");
  sections.push(`Nome: ${data.nome?.normalized || "N/A"}`);
  sections.push(`Cognome: ${data.cognome?.normalized || "N/A"}`);
  sections.push(`Email: ${data.email?.normalized || "N/A"}`);
  sections.push(`Telefono: ${data.telefono?.normalized || "N/A"}`);
  sections.push(`Sesso: ${data.sesso?.normalized || "N/A"}`);
  sections.push(`Luogo di nascita: ${data.luogoNascita?.normalized || "N/A"}`);
  sections.push(`Provincia di nascita: ${data.provinciaNascita?.normalized || "N/A"}`);
  sections.push(`Data di nascita: ${data.dataNascita?.normalized || "N/A"}`);
  sections.push(`Modalità compilazione: ${data.modalita?.normalized || "N/A"}`);
  sections.push("");
  
  // === QUESTIONARIO PFAS ===
  sections.push("=== QUESTIONARIO PFAS ===");
  sections.push("");
  
  const questions = [
    { key: "R1", text: "Cosa sa dell'inquinamento da PFAS e dei relativi responsabili?" },
    { key: "R2", text: "Da quanto tempo lo sa e da quale fonte l'ha scoperto?" },
    { key: "R3", text: "Per cosa usate l'acqua del rubinetto?" },
    { key: "R4", text: "Se non la usate più, cosa usate al posto dell'acqua del rubinetto?" },
    { key: "R5", text: "Cosa vi ha consigliato il Comune o enti simili? Avete copia degli avvisi?" },
    { key: "R6", text: "I PFAS possono causare danni alla salute, lo sapeva?" },
    { key: "R7", text: "Avete mai eseguito i controlli per vedere i valori dei PFAS nel sangue?" },
    { key: "R8", text: "Quali sono i valori? Ha il referto di queste analisi/visite?" },
    { key: "R9", text: "Ha fatto ulteriori visite specifiche legate a questo problema?" },
    { key: "R10", text: "Se lei vive nella zona rossa, da quanto tempo ci vive?" },
    { key: "R11", text: "La casa è di proprietà o in affitto?" },
    { key: "R12", text: "Ha provato a venderla/affittarla da quando ha saputo dell'inquinamento?" },
    { key: "R13", text: "Com'è composto il suo nucleo familiare?" },
    { key: "R14", text: "Lei o qualcuno della sua famiglia vi siete ammalati negli ultimi anni?" },
    { key: "R15", text: "Qualcuno della sua famiglia è venuto a mancare per malattie collegate ai PFAS?" },
    { key: "R16", text: "Ha un orto? Se sì, lo usa ancora come prima?" },
    { key: "R17", text: "Ha smesso o ridotto certe attività all'aperto per paura dell'inquinamento?" },
  ];
  
  questions.forEach((q, index) => {
    const answer = data[q.key]?.normalized || data[q.key]?.raw || "N/A";
    sections.push(`${index + 1}. ${q.text}`);
    sections.push(`   Risposta: ${answer}`);
    sections.push("");
  });
  
  sections.push("=== FINE RIEPILOGO ===");
  
  return sections.join("\n");
}

