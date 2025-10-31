// /lib/flow.ts

export type StateId =
  | "NOME"
  | "COGNOME"
  | "SESSO"
  | "LUOGO_NASCITA"
  | "PROVINCIA_NASCITA"
  | "TELEFONO"
  | "EMAIL"
  | "DATA_NASCITA"
  | "MODALITA"
  | "R1"
  | "R2"
  | "R3"
  | "R4"
  | "R5"
  | "R6"
  | "R7"
  | "R8"
  | "R9"
  | "R10"
  | "R11"
  | "R12"
  | "R13"
  | "R14"
  | "R15"
  | "R16"
  | "R17"
  | "RIEPILOGO"
  | "CONFERMA_FINALE"
  | "FINE";

export type ConversationContext = {
  sessionId: string;
  currentState: StateId;
  data: Record<string, any>; // risposte utente strutturate
  flowVersion: string;
  history: { from: "user" | "bot"; text: string }[];
};

export type FlowNode = {
  question: string; // domanda legale "ufficiale"
  saveKey?: string; // chiave sotto cui salvo la risposta
  next: (ctx: ConversationContext, answer: string) => StateId;
};

export const FLOW: Record<StateId, FlowNode> = {
  NOME: {
    question: "Buongiorno. Per iniziare, qual è il suo nome?",
    saveKey: "nome",
    next: () => "COGNOME",
  },
  COGNOME: {
    question: "Perfetto. Il suo cognome?",
    saveKey: "cognome",
    next: () => "EMAIL",
  },
  EMAIL: {
    question: "Qual è la sua email?",
    saveKey: "email",
    next: () => "TELEFONO",
  },
  TELEFONO: {
    question: "Il suo numero di telefono?",
    saveKey: "telefono",
    next: () => "MODALITA",
  },
  MODALITA: {
    question:
      "Grazie. Preferisce compilare il questionario qui in chat o preferisce che la chiamiamo al telefono per completarlo insieme?",
    saveKey: "modalita",
    next: (ctx, answer) => {
      // Usa il valore normalizzato dalla validazione (TELEFONO o CHAT)
      const modalitaNormalized = ctx.data.modalita?.normalized;
      
      if (modalitaNormalized === "TELEFONO") {
        return "FINE";
      }
      
      return "SESSO";
    },
  },
  SESSO: {
    question: "Perfetto. Continuiamo allora.\n\nQual è il suo sesso? (M per Maschio, F per Femmina)",
    saveKey: "sesso",
    next: () => "LUOGO_NASCITA",
  },
  LUOGO_NASCITA: {
    question: "In quale città è nato/a?",
    saveKey: "luogoNascita",
    next: () => "PROVINCIA_NASCITA",
  },
  PROVINCIA_NASCITA: {
    question: "In quale provincia? (può scrivere il nome completo o la sigla, es. Vicenza o VI)",
    saveKey: "provinciaNascita",
    next: () => "DATA_NASCITA",
  },
  DATA_NASCITA: {
    question: "Qual è la sua data di nascita? (formato: gg/mm/aaaa, es. 15/03/1985)",
    saveKey: "dataNascita",
    next: () => "R1",
  },

  R1: {
    question:
      "Cosa sa dell'inquinamento da PFAS e dei relativi responsabili?",
    saveKey: "R1",
    next: () => "R2",
  },
  R2: {
    question:
      "Da quanto tempo lo sa e da quale fonte l'ha scoperto?",
    saveKey: "R2",
    next: () => "R3",
  },
  R3: {
    question: "Per cosa usate l'acqua del rubinetto?",
    saveKey: "R3",
    next: () => "R4",
  },
  R4: {
    question:
      "Se non la usate più, cosa usate al posto dell'acqua del rubinetto (bottiglie, filtri, autobotti…)?",
    saveKey: "R4",
    next: () => "R5",
  },
  R5: {
    question:
      "Cosa vi ha consigliato il Comune o enti simili? Avete copia degli avvisi?",
    saveKey: "R5",
    next: () => "R6",
  },
  R6: {
    question:
      "I PFAS possono causare danni alla salute, lo sapeva?",
    saveKey: "R6",
    next: () => "R7",
  },
  R7: {
    question:
      "Avete mai eseguito i controlli per vedere i valori dei PFAS nel sangue? Se sì, tramite ASL o privatamente?",
    saveKey: "R7",
    next: () => "R8",
  },
  R8: {
    question:
      "Quali sono i valori? Ha il referto di queste analisi/visite?",
    saveKey: "R8",
    next: () => "R9",
  },
  R9: {
    question:
      "Ha fatto ulteriori visite specifiche legate a questo problema?",
    saveKey: "R9",
    next: () => "R10",
  },
  R10: {
    question: "Se lei vive nella zona rossa, da quanto tempo ci vive?",
    saveKey: "R10",
    next: () => "R11",
  },
  R11: {
    question: "La casa è di proprietà o in affitto?",
    saveKey: "R11",
    next: () => "R12",
  },
  R12: {
    question:
      "Ha provato a venderla/affittarla da quando ha saputo dell'inquinamento? Se sì, ha avuto difficoltà?",
    saveKey: "R12",
    next: () => "R13",
  },
  R13: {
    question:
      "Com'è composto il suo nucleo familiare (persone, parentela, età)? Anche i suoi cari potrebbero avere diritto al risarcimento.",
    saveKey: "R13",
    next: () => "R14",
  },
  R14: {
    question:
      "Lei o qualcuno della sua famiglia vi siete ammalati negli ultimi anni?",
    saveKey: "R14",
    next: () => "R15",
  },
  R15: {
    question:
      "Qualcuno della sua famiglia è venuto a mancare negli ultimi anni per malattie collegate ai PFAS?",
    saveKey: "R15",
    next: () => "R16",
  },
  R16: {
    question:
      "Ha un orto? Se sì, lo usa ancora come prima?",
    saveKey: "R16",
    next: () => "R17",
  },
  R17: {
    question:
      "Ha smesso o ridotto certe attività all'aperto per paura dell'inquinamento?",
    saveKey: "R17",
    next: () => "RIEPILOGO",
  },

  RIEPILOGO: {
    question:
      "Prima di concludere, le mostro un riepilogo di tutte le informazioni che ha fornito. La preghiamo di verificare attentamente.",
    saveKey: "riepilogo",
    next: () => "CONFERMA_FINALE",
  },

  CONFERMA_FINALE: {
    question:
      "Conferma che tutte le informazioni sopra riportate sono corrette e veritiere? (risponda Sì o Confermo per dare validità legale alla sua dichiarazione)",
    saveKey: "confermaFinale",
    next: () => "FINE",
  },

  FINE: {
    question:
      "Grazie per il suo tempo. Abbiamo tutte le informazioni necessarie. La ricontatteremo al più presto. Buona giornata.",
    next: () => "FINE",
  },
};
