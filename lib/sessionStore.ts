// /lib/sessionStore.ts
import { ConversationContext } from "./flow";
import { 
  saveSessionToFile, 
  loadSessionFromFile,
  findSessionByEmail 
} from "./storage/fileStorage";
import { logger } from "./utils/logger";

// Cache in memoria per performance (opzionale, ma utile)
const sessionsCache: Record<string, ConversationContext> = {};

export function createSession(sessionId: string): ConversationContext {
  const ctx: ConversationContext = {
    sessionId,
    currentState: "NOME",
    data: {},
    flowVersion: "v1.0",
    history: [],
  };
  
  sessionsCache[sessionId] = ctx;
  
  // Salva subito su file in modo asincrono
  saveSessionToFile(ctx).catch((err) => {
    logger.error("Errore nel salvataggio iniziale sessione", sessionId, { error: err.message });
  });
  
  logger.info("Nuova sessione creata", sessionId);
  
  return ctx;
}

export async function getSession(sessionId: string): Promise<ConversationContext | null> {
  // Prima controlla la cache
  if (sessionsCache[sessionId]) {
    return sessionsCache[sessionId];
  }
  
  // Se non in cache, carica da file
  const ctx = await loadSessionFromFile(sessionId);
  
  if (ctx) {
    // Metti in cache per i prossimi accessi
    sessionsCache[sessionId] = ctx;
    logger.debug("Sessione caricata da file", sessionId);
  }
  
  return ctx;
}

export function saveSession(ctx: ConversationContext) {
  // Log per debug
  logger.debug("💾 Salvataggio sessione", ctx.sessionId, {
    state: ctx.currentState,
    historyLength: ctx.history.length,
    dataKeys: Object.keys(ctx.data).length
  });
  
  // Aggiorna la cache
  sessionsCache[ctx.sessionId] = ctx;
  
  // Salva su file in modo SINCRONO per garantire persistenza
  try {
    // Non usiamo await perché questa funzione non è async
    // Ma saveSessionToFile ora usa writeFileSync internamente
    saveSessionToFile(ctx).catch((err) => {
      logger.error("Errore nel salvare sessione", ctx.sessionId, { error: err.message });
    });
  } catch (err: any) {
    logger.error("Errore nel salvare sessione", ctx.sessionId, { error: err.message });
  }
}

/**
 * Cerca una sessione esistente per email
 */
export async function findExistingSessionByEmail(email: string): Promise<ConversationContext | null> {
  try {
    const ctx = await findSessionByEmail(email);
    
    if (ctx) {
      // Metti in cache
      sessionsCache[ctx.sessionId] = ctx;
      logger.info("Sessione esistente trovata per email", ctx.sessionId, { email });
    }
    
    return ctx;
  } catch (error: any) {
    logger.error("Errore nella ricerca sessione per email", undefined, { 
      email, 
      error: error.message 
    });
    return null;
  }
}
