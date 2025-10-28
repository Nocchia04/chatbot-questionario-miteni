// /lib/init.ts
/**
 * Inizializzazione dell'applicazione
 * Questo file viene importato all'avvio per configurare scheduler e servizi
 */

import { initializeSchedulers } from "./scheduler/autoBackup";
import { logger } from "./utils/logger";

let initialized = false;

export function initializeApp() {
  if (initialized) {
    return;
  }

  logger.info("🚀 Inizializzazione applicazione Miteni Chatbot");

  try {
    // Avvia gli scheduler per backup e cleanup automatici
    initializeSchedulers();

    initialized = true;
    logger.info("✅ Applicazione inizializzata con successo");
  } catch (error: any) {
    logger.error("❌ Errore nell'inizializzazione", undefined, {
      error: error.message,
      stack: error.stack,
    });
  }
}

