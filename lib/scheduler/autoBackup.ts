// /lib/scheduler/autoBackup.ts
import { backupAllSessions, cleanupOldSessions } from "../storage/fileStorage";
import { logger } from "../utils/logger";

/**
 * Backup automatico giornaliero
 */
export function startAutoBackup() {
  // Backup ogni 24 ore (in millisecondi)
  const BACKUP_INTERVAL = 24 * 60 * 60 * 1000;
  
  logger.info("Auto-backup scheduler avviato");
  
  // Primo backup dopo 1 ora dall'avvio
  setTimeout(() => {
    performBackup();
    // Poi ripeti ogni 24 ore
    setInterval(performBackup, BACKUP_INTERVAL);
  }, 60 * 60 * 1000);
}

/**
 * Cleanup automatico settimanale
 */
export function startAutoCleanup() {
  // Cleanup ogni 7 giorni
  const CLEANUP_INTERVAL = 7 * 24 * 60 * 60 * 1000;
  
  logger.info("Auto-cleanup scheduler avviato");
  
  // Primo cleanup dopo 24 ore dall'avvio
  setTimeout(() => {
    performCleanup();
    // Poi ripeti ogni 7 giorni
    setInterval(performCleanup, CLEANUP_INTERVAL);
  }, 24 * 60 * 60 * 1000);
}

async function performBackup() {
  try {
    logger.info("Inizio backup automatico");
    const backupPath = await backupAllSessions();
    
    if (backupPath) {
      logger.info("Backup automatico completato", undefined, { path: backupPath });
    } else {
      logger.error("Backup automatico fallito");
    }
  } catch (error: any) {
    logger.error("Errore nel backup automatico", undefined, { error: error.message });
  }
}

async function performCleanup() {
  try {
    logger.info("Inizio cleanup automatico sessioni vecchie");
    const deletedCount = await cleanupOldSessions(30); // Elimina sessioni > 30 giorni
    
    logger.info("Cleanup automatico completato", undefined, { deletedCount });
  } catch (error: any) {
    logger.error("Errore nel cleanup automatico", undefined, { error: error.message });
  }
}

/**
 * Inizializza tutti gli scheduler
 */
export function initializeSchedulers() {
  startAutoBackup();
  startAutoCleanup();
  
  logger.info("Tutti gli scheduler inizializzati");
}

