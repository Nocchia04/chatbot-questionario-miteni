export function detectIntent(userMessage: string): "ANSWER" | "FAQ" {
    const lower = userMessage.toLowerCase();
  
    const faqKeywords = [
      "pfas",
      "chi siete",
      "cosa succede dopo",
      "avvocato",
      "risarcimento",
      "fa male",
      "pericoloso",
      "analisi del sangue",
      "valori nel sangue",
      "mio figlio",
      "mio bambino",
    ];
  
    if (faqKeywords.some(k => lower.includes(k))) {
      return "FAQ";
    }
  
    return "ANSWER";
}
  