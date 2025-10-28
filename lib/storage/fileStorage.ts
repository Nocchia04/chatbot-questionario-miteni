// /lib/storage/fileStorage.ts
import fs from "fs";
import path from "path";
import { ConversationContext } from "../flow";

// Directory per salvare le sessioni
const SESSIONS_DIR = path.join(process.cwd(), "data", "sessions");
const BACKUP_DIR = path.join(process.cwd(), "data", "backups");
const LOGS_DIR = path.join(process.cwd(), "data", "logs");

// Verifica se siamo su Vercel (ambiente serverless senza file system write)
const isVercel = process.env.VERCEL === '1';

// Inizializza le directory se non esistono (solo se NON siamo su Vercel)
function ensureDirectories() {
  if (isVercel) {
    // Su Vercel non possiamo creare directory
    return;
  }
  
  [SESSIONS_DIR, BACKUP_DIR, LOGS_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * Salva una sessione su file system
 * NOTA: Su Vercel (serverless) questo viene skippato perché il file system è read-only
 */
export async function saveSessionToFile(ctx: ConversationContext): Promise<void> {
  // Skip su Vercel - le sessioni rimangono solo in memoria (RAM)
  if (isVercel) {
    // console.log(`💾 [Vercel] Sessione mantenuta in memoria: ${ctx.sessionId}`);
    return;
  }
  
  try {
    ensureDirectories();
    
    const filePath = path.join(SESSIONS_DIR, `${ctx.sessionId}.json`);
    const data = {
      ...ctx,
      lastUpdated: new Date().toISOString(),
    };
    
    // Usa writeFileSync per salvataggio SINCRONO e sicuro
    fs.writeFileSync(
      filePath, 
      JSON.stringify(data, null, 2), 
      "utf-8"
    );
    
    console.log(`💾 Sessione salvata su file: ${ctx.sessionId} (${ctx.history.length} messaggi)`);
  } catch (error) {
    console.error(`❌ Errore nel salvare sessione ${ctx.sessionId}:`, error);
    // Non fare throw su Vercel - continua comunque
    if (!isVercel) {
      throw error;
    }
  }
}

/**
 * Carica una sessione da file system
 * NOTA: Su Vercel (serverless) questo ritorna sempre null perché non c'è persistenza su disco
 */
export async function loadSessionFromFile(
  sessionId: string
): Promise<ConversationContext | null> {
  // Skip su Vercel - non ci sono file da leggere
  if (isVercel) {
    return null;
  }
  
  try {
    ensureDirectories();
    
    const filePath = path.join(SESSIONS_DIR, `${sessionId}.json`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const content = await fs.promises.readFile(filePath, "utf-8");
    const data = JSON.parse(content);
    
    // Rimuovi lastUpdated prima di restituire
    const { lastUpdated, ...ctx } = data;
    
    return ctx as ConversationContext;
  } catch (error) {
    console.error(`❌ Errore nel caricare sessione ${sessionId}:`, error);
    return null;
  }
}

/**
 * Lista tutte le sessioni salvate
 */
export async function listAllSessions(): Promise<string[]> {
  try {
    ensureDirectories();
    
    const files = await fs.promises.readdir(SESSIONS_DIR);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""));
  } catch (error) {
    console.error("❌ Errore nel listare sessioni:", error);
    return [];
  }
}

/**
 * Elimina sessioni più vecchie di X giorni
 */
export async function cleanupOldSessions(daysOld: number = 30): Promise<number> {
  try {
    ensureDirectories();
    
    const files = await fs.promises.readdir(SESSIONS_DIR);
    const now = Date.now();
    const maxAge = daysOld * 24 * 60 * 60 * 1000;
    let deletedCount = 0;
    
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      
      const filePath = path.join(SESSIONS_DIR, file);
      const stats = await fs.promises.stat(filePath);
      const age = now - stats.mtimeMs;
      
      if (age > maxAge) {
        await fs.promises.unlink(filePath);
        deletedCount++;
      }
    }
    
    return deletedCount;
  } catch (error) {
    console.error("❌ Errore nel cleanup sessioni:", error);
    return 0;
  }
}

/**
 * Crea backup di tutte le sessioni
 */
export async function backupAllSessions(): Promise<string | null> {
  try {
    ensureDirectories();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFileName = `backup-${timestamp}.json`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);
    
    const sessionIds = await listAllSessions();
    const sessions: Record<string, any> = {};
    
    for (const sessionId of sessionIds) {
      const ctx = await loadSessionFromFile(sessionId);
      if (ctx) {
        sessions[sessionId] = ctx;
      }
    }
    
    await fs.promises.writeFile(
      backupPath,
      JSON.stringify({ timestamp, count: sessionIds.length, sessions }, null, 2),
      "utf-8"
    );
    
    console.log(`✅ Backup creato: ${backupFileName} (${sessionIds.length} sessioni)`);
    return backupPath;
  } catch (error) {
    console.error("❌ Errore nel creare backup:", error);
    return null;
  }
}

/**
 * Esporta tutte le sessioni in formato CSV
 */
export async function exportSessionsToCSV(): Promise<string | null> {
  try {
    ensureDirectories();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const csvFileName = `export-${timestamp}.csv`;
    const csvPath = path.join(BACKUP_DIR, csvFileName);
    
    const sessionIds = await listAllSessions();
    const rows: string[] = [];
    
    // Header CSV
    rows.push("sessionId,currentState,nome,cognome,email,telefono,lastUpdated,dataKeys");
    
    for (const sessionId of sessionIds) {
      const ctx = await loadSessionFromFile(sessionId);
      if (!ctx) continue;
      
      const nome = ctx.data.nome?.normalized || "";
      const cognome = ctx.data.cognome?.normalized || "";
      const email = ctx.data.email?.normalized || "";
      const telefono = ctx.data.telefono?.normalized || "";
      const dataKeys = Object.keys(ctx.data).join(";");
      
      // Trova lastUpdated dal file
      const filePath = path.join(SESSIONS_DIR, `${sessionId}.json`);
      const stats = await fs.promises.stat(filePath);
      const lastUpdated = stats.mtime.toISOString();
      
      rows.push(
        `"${sessionId}","${ctx.currentState}","${nome}","${cognome}","${email}","${telefono}","${lastUpdated}","${dataKeys}"`
      );
    }
    
    await fs.promises.writeFile(csvPath, rows.join("\n"), "utf-8");
    
    console.log(`✅ Export CSV creato: ${csvFileName} (${sessionIds.length} sessioni)`);
    return csvPath;
  } catch (error) {
    console.error("❌ Errore nell'export CSV:", error);
    return null;
  }
}

/**
 * Cerca una sessione per email
 */
export async function findSessionByEmail(email: string): Promise<ConversationContext | null> {
  try {
    ensureDirectories();
    
    const sessionIds = await listAllSessions();
    const normalizedEmail = email.trim().toLowerCase();
    
    for (const sessionId of sessionIds) {
      const ctx = await loadSessionFromFile(sessionId);
      if (!ctx) continue;
      
      const sessionEmail = ctx.data.email?.normalized?.toLowerCase();
      if (sessionEmail === normalizedEmail) {
        return ctx;
      }
    }
    
    return null;
  } catch (error) {
    console.error("❌ Errore nella ricerca sessione per email:", error);
    return null;
  }
}

/**
 * Ottieni statistiche delle sessioni
 */
export async function getSessionStats(): Promise<{
  total: number;
  byState: Record<string, number>;
  completed: number;
  inProgress: number;
}> {
  try {
    ensureDirectories();
    
    const sessionIds = await listAllSessions();
    const byState: Record<string, number> = {};
    let completed = 0;
    
    for (const sessionId of sessionIds) {
      const ctx = await loadSessionFromFile(sessionId);
      if (!ctx) continue;
      
      byState[ctx.currentState] = (byState[ctx.currentState] || 0) + 1;
      if (ctx.currentState === "FINE") {
        completed++;
      }
    }
    
    return {
      total: sessionIds.length,
      byState,
      completed,
      inProgress: sessionIds.length - completed,
    };
  } catch (error) {
    console.error("❌ Errore nelle statistiche:", error);
    return { total: 0, byState: {}, completed: 0, inProgress: 0 };
  }
}

