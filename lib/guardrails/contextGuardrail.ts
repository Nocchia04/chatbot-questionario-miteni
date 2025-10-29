// /lib/guardrails/contextGuardrail.ts

/**
 * Guardrail per verificare che le domande siano nel contesto PFAS/Miteni
 */

// Keywords che indicano domande nel contesto corretto
const VALID_CONTEXT_KEYWORDS = [
  "pfas", "pfoa", "pfos", "genx", "c6o4",
  "miteni", "mitsubishi", "icig",
  "trissino", "vicenza", "verona", "padova", "veneto",
  "inquinamento", "contaminazione", "inquinato", "contaminato",
  "acqua", "falda", "acquedotto", "pozzo", "rubinetto",
  "sostanze", "chimiche", "perfluorurati", "perfluoroalchiliche",
  "veleno", "tossico", "cancerogeno",
  "sangue", "analisi", "valori", "biomonitoraggio",
  "zona rossa", "aree contaminate",
  
  "risarcimento", "indennizzo", "compenso", "rimborso",
  "azione collettiva", "class action", "causa", "processo",
  "avvocato", "legale", "tribunale", "sentenza",
  "danni", "danno", "danneggiato",
  "finanziamento contenzioso", "spv", "litigation",
  "aderire", "aderente", "adesione",
  "documenti", "certificato", "residenza",
  "costi", "spese", "gratuito", "anticipare",
  "tempistiche", "tempo", "anni",
  
  "salute", "malattia", "malato", "patologia",
  "tumore", "cancro", "tiroide", "colesterolo", "diabete",
  "sintomi", "dottore", "medico", "ospedale", "asl",
  
  "casa", "abitazione", "immobile", "terreno", "proprietà",
  "residente", "abitare", "abitato", "vissuto",
  
  "mamme no pfas", "greenpeace", "legambiente",
  "questionario", "domanda", "compilare", "pratica",
  "aiuto", "assistenza", "supporto",
  
  "famiglia", "figli", "bambini", "parente", "deceduto",
  "preoccupato", "paura", "ansia", "sicuro", "proteggere",
];

// Keywords che indicano domande completamente off-topic
const OFF_TOPIC_KEYWORDS = [
  // Ricette/cibo
  "ricetta",
  "cucinare",
  "cucina",
  "mangiare",
  "cibo",
  "pasta",
  "pizza",
  "carbonara",
  "ingredienti",
  
  // Meteo
  "meteo",
  "tempo",
  "pioggia",
  "sole",
  
  // Sport
  "calcio",
  "basket",
  "partita",
  "gol",
  
  // Tech non correlato
  "computer",
  "smartphone",
  "app",
  "gioco",
  "videogioco",
  
  // Entertainment
  "film",
  "serie tv",
  "musica",
  "canzone",
  
  // Altro
  "scherzo",
  "barzelletta",
  "storia",
  "favola",
];

/**
 * Controlla se una domanda è nel contesto PFAS/Miteni
 */
export function isInContext(userMessage: string): {
  inContext: boolean;
  confidence: "high" | "medium" | "low";
  reason?: string;
} {
  const lowered = userMessage.toLowerCase();
  
  // Check 1: Domande molto corte generiche (probabilmente risposta al questionario)
  if (lowered.length < 20 && !lowered.includes("?")) {
    return {
      inContext: true,
      confidence: "high",
      reason: "Short answer, likely responding to questionnaire",
    };
  }
  
  // Check 2: Contiene keywords esplicitamente OFF-TOPIC?
  const hasOffTopicKeyword = OFF_TOPIC_KEYWORDS.some(keyword => 
    lowered.includes(keyword)
  );
  
  if (hasOffTopicKeyword) {
    return {
      inContext: false,
      confidence: "high",
      reason: "Contains off-topic keywords",
    };
  }
  
  // Check 3: Contiene keywords VALIDE del contesto?
  const hasValidKeyword = VALID_CONTEXT_KEYWORDS.some(keyword => 
    lowered.includes(keyword)
  );
  
  if (hasValidKeyword) {
    return {
      inContext: true,
      confidence: "high",
      reason: "Contains valid PFAS/Miteni context keywords",
    };
  }
  
  // Check 4: È una domanda generica senza context?
  // Domande che iniziano con "come si", "cosa è", "perché" senza keywords valide
  const genericQuestionPatterns = [
    /^come si (fa|fanno|prepara|cucina|gioca)/i,
    /^cosa (è|sono) (il|la|i|le|un|una) [^pfas]/i,
    /^perché (il|la|i|le) [^pfas]/i,
    /^quando (è|sono|si) [^pfas]/i,
    /^dove (è|sono|si trova) [^pfas]/i,
  ];
  
  const isGenericQuestion = genericQuestionPatterns.some(pattern => 
    pattern.test(lowered)
  );
  
  if (isGenericQuestion) {
    return {
      inContext: false,
      confidence: "medium",
      reason: "Generic question without PFAS/Miteni context",
    };
  }
  
  // Check 5: Domande filosofiche o astratte
  const philosophicalPatterns = [
    /qual è il senso/i,
    /perché esist/i,
    /cosa significa la vita/i,
  ];
  
  const isPhilosophical = philosophicalPatterns.some(pattern => 
    pattern.test(lowered)
  );
  
  if (isPhilosophical) {
    return {
      inContext: false,
      confidence: "high",
      reason: "Philosophical/abstract question",
    };
  }
  
  // Default: potrebbe essere nel contesto (es. domanda vaga ma ok)
  // Lasciamo decidere all'AI con un hint
  return {
    inContext: true,
    confidence: "low",
    reason: "Unclear, letting AI decide",
  };
}

/**
 * Genera una risposta educata quando l'utente fa domande off-topic
 */
export function getOffTopicResponse(): string {
  const responses = [
    "Mi dispiace, posso aiutarla solo con domande relative all'inquinamento da PFAS e al caso Miteni. Torniamo al questionario?",
    
    "Capisco, ma sono qui specificamente per assisterla con la pratica PFAS. Continuiamo con le domande del questionario?",
    
    "Per quella domanda non posso aiutarla, mi occupo esclusivamente del caso PFAS Miteni. Torniamo alla compilazione?",
    
    "Sono specializzato solo su questioni PFAS e risarcimenti Miteni. Possiamo continuare con il questionario?",
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

