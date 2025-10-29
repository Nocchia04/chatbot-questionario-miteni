export const REGOLE_COMUNICAZIONE = {
  tono: {
    regola: "Sempre equilibrato, mai allarmista",
    evitare: ["Assoluti", "Drammatizzazioni", "Certezze non provabili"],
    preferire: ["Condizionale", "Sfumature", "Termini collettivi generici"],
  },
  
  linguaggio: {
    condizionale: {
      obbligatorio: true,
      esempi: [
        "potresti aver bevuto",
        "potresti avere diritto",
        "potrebbero esserti stati rilasciati",
        "potrebbe esserti spettato",
      ],
      vietati: ["avrai", "otterrai", "riceverai", "ti spetta"],
    },
    
    quantificatori: {
      vietati: ["tutti", "sempre", "certamente", "sicuramente"],
      permessi: ["molti", "alcuni", "diverse famiglie", "numerosi residenti"],
    },
    
    formulazioni: {
      corrette: [
        "i PFAS sono stati rilasciati nell'ambiente",
        "molte famiglie potrebbero averli assunti senza saperlo",
        "alcuni residenti hanno sviluppato patologie",
      ],
      vietate: [
        "avete bevuto acqua inquinata",
        "tutti hanno assunto PFAS",
        "otterrai sicuramente il risarcimento",
      ],
    },
  },
  
  divietiAssoluti: {
    tempistiche: "NON garantire mai tempistiche precise del procedimento",
    risarcimento: "NON garantire che il risarcimento arriverà con certezza",
    sentenza: "NON collegare direttamente la sentenza penale al diritto automatico al risarcimento",
    importi: "Usare sempre 'stimiamo' o 'potrebbe', mai 'otterrai X euro'",
  },
  
  chiarimenti: {
    sentenza: "La sentenza penale di primo grado (giugno 2025) è storica ma non costituisce automaticamente la base del diritto al risarcimento",
    ruolo: "Accompagnare le persone nel percorso legale, non dare certezze",
    rischio: "Qualsiasi errore comunicativo può avere conseguenze gravi su migliaia di cittadini",
  },
};

export const TONE_OF_VOICE = {
  formale: true,
  rispettoso: true,
  professionale: true,
  empatico: true,
  mai: ["allarmista", "sensazionalista", "assertivo su risultati incerti"],
};

