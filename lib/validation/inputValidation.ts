// /lib/validation/inputValidation.ts

export type ValidationResult = {
  isValid: boolean;
  error?: string;
  normalized?: string;
};

/**
 * Valida un nome (solo lettere e spazi, min 2 caratteri)
 */
export function validateNome(input: string): ValidationResult {
  const trimmed = input.trim();
  
  if (trimmed.length < 2) {
    return {
      isValid: false,
      error: "Il nome deve contenere almeno 2 caratteri.",
    };
  }
  
  // Accetta lettere, spazi, apostrofi, accenti
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
  if (!nameRegex.test(trimmed)) {
    return {
      isValid: false,
      error: "Il nome può contenere solo lettere, spazi e apostrofi.",
    };
  }
  
  // Normalizza: prima lettera maiuscola
  const normalized = trimmed
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  
  return {
    isValid: true,
    normalized,
  };
}

/**
 * Valida un cognome (stesse regole del nome)
 */
export function validateCognome(input: string): ValidationResult {
  return validateNome(input); // Stesse regole
}

/**
 * Valida un'email
 */
export function validateEmail(input: string): ValidationResult {
  const trimmed = input.trim().toLowerCase();
  
  // Regex email semplificata ma efficace
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      error: "L'email non è valida. Assicurati che contenga @ e un dominio valido.",
    };
  }
  
  return {
    isValid: true,
    normalized: trimmed,
  };
}

/**
 * Valida un numero di telefono italiano
 */
export function validateTelefono(input: string): ValidationResult {
  // Rimuovi spazi, trattini, parentesi
  const cleaned = input.replace(/[\s\-()]/g, "");
  
  // Accetta numeri italiani con o senza prefisso internazionale
  // +39, 0039, o direttamente 3xx/0xxx
  const phoneRegex = /^(\+39|0039)?[0-9]{9,10}$/;
  
  if (!phoneRegex.test(cleaned)) {
    return {
      isValid: false,
      error: "Il numero di telefono non è valido. Inserisci un numero italiano (es. 3331234567 o +393331234567).",
    };
  }
  
  // Normalizza aggiungendo +39 se mancante
  let normalized = cleaned;
  if (!normalized.startsWith("+39")) {
    if (normalized.startsWith("0039")) {
      normalized = "+39" + normalized.slice(4);
    } else {
      normalized = "+39" + normalized;
    }
  }
  
  return {
    isValid: true,
    normalized,
  };
}

/**
 * Valida genericamente una risposta testuale (non vuota, min lunghezza)
 */
export function validateTextResponse(
  input: string,
  minLength: number = 2
): ValidationResult {
  const trimmed = input.trim();
  
  if (trimmed.length < minLength) {
    return {
      isValid: false,
      error: `La risposta deve contenere almeno ${minLength} caratteri.`,
    };
  }
  
  return {
    isValid: true,
    normalized: trimmed,
  };
}

/**
 * Valida il sesso (M/F)
 */
export function validateSesso(input: string): ValidationResult {
  const trimmed = input.trim().toUpperCase();
  
  if (trimmed === "M" || trimmed === "MASCHIO" || trimmed === "UOMO") {
    return {
      isValid: true,
      normalized: "M",
    };
  }
  
  if (trimmed === "F" || trimmed === "FEMMINA" || trimmed === "DONNA") {
    return {
      isValid: true,
      normalized: "F",
    };
  }
  
  return {
    isValid: false,
    error: "Inserisci M per Maschio o F per Femmina.",
  };
}

/**
 * Valida la provincia (nome completo o sigla)
 * Supporta mapping automatico: "Vicenza" → "VI"
 */
export function validateProvincia(input: string): ValidationResult {
  // Lazy import per evitare circular dependencies
  const { mapProvinciaSigla } = require("../utils/provinciaMapper");
  
  const sigla = mapProvinciaSigla(input);
  
  if (!sigla) {
    return {
      isValid: false,
      error: "Provincia non riconosciuta. Inserisci il nome completo (es. Vicenza) o la sigla (es. VI).",
    };
  }
  
  return {
    isValid: true,
    normalized: sigla,
  };
}

/**
 * Valida la data di nascita (gg/mm/aaaa)
 */
export function validateDataNascita(input: string): ValidationResult {
  const trimmed = input.trim();
  
  // Formato gg/mm/aaaa
  const dataRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = trimmed.match(dataRegex);
  
  if (!match) {
    return {
      isValid: false,
      error: "Formato data non valido. Usa gg/mm/aaaa (es. 15/03/1985).",
    };
  }
  
  const [, giornoStr, meseStr, annoStr] = match;
  const giorno = parseInt(giornoStr, 10);
  const mese = parseInt(meseStr, 10);
  const anno = parseInt(annoStr, 10);
  
  // Validazione range
  if (mese < 1 || mese > 12) {
    return {
      isValid: false,
      error: "Mese non valido. Deve essere tra 1 e 12.",
    };
  }
  
  if (giorno < 1 || giorno > 31) {
    return {
      isValid: false,
      error: "Giorno non valido. Deve essere tra 1 e 31.",
    };
  }
  
  // Anno ragionevole (tra 1900 e anno corrente)
  const annoCorrente = new Date().getFullYear();
  if (anno < 1900 || anno > annoCorrente) {
    return {
      isValid: false,
      error: `Anno non valido. Deve essere tra 1900 e ${annoCorrente}.`,
    };
  }
  
  // Età ragionevole (almeno 18 anni, max 120)
  const eta = annoCorrente - anno;
  if (eta < 18) {
    return {
      isValid: false,
      error: "Devi avere almeno 18 anni per compilare questo questionario.",
    };
  }
  
  if (eta > 120) {
    return {
      isValid: false,
      error: "Data di nascita non valida. Verifica l'anno inserito.",
    };
  }
  
  // Normalizza con zeri davanti
  const giornoNorm = giorno.toString().padStart(2, "0");
  const meseNorm = mese.toString().padStart(2, "0");
  
  return {
    isValid: true,
    normalized: `${giornoNorm}/${meseNorm}/${anno}`,
  };
}

/**
 * Dispatcher di validazione per chiave domanda
 */
export function validateByKey(
  saveKey: string,
  input: string
): ValidationResult {
  switch (saveKey) {
    case "nome":
      return validateNome(input);
    case "cognome":
      return validateCognome(input);
    case "sesso":
      return validateSesso(input);
    case "luogoNascita":
      return validateTextResponse(input, 2); // Solo non vuoto
    case "provinciaNascita":
      return validateProvincia(input);
    case "telefono":
      return validateTelefono(input);
    case "email":
      return validateEmail(input);
    case "dataNascita":
      return validateDataNascita(input);
    default:
      // Per tutte le altre risposte (R1-R17, modalita, ecc.)
      return validateTextResponse(input, 1);
  }
}

