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
    // Verifica se siamo su Vercel (ambiente serverless)
    const isVercel = process.env.VERCEL === '1';
    
    if (isVercel) {
      logger.info("🌐 Ambiente Vercel rilevato - scheduler disabilitati");
      logger.info("💡 Le sessioni verranno mantenute solo in memoria (RAM)");
    } else {
      // Avvia gli scheduler per backup e cleanup automatici (solo in locale)
      initializeSchedulers();
      logger.info("📅 Scheduler attivati per backup e cleanup");
    }

    initialized = true;
    logger.info("✅ Applicazione inizializzata con successo");
  } catch (error: any) {
    logger.error("❌ Errore nell'inizializzazione", undefined, {
      error: error.message,
      stack: error.stack,
    });
  }
}

