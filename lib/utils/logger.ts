// /lib/utils/logger.ts
import fs from "fs";
import path from "path";

// Rileva se siamo su Vercel (ambiente serverless)
const IS_VERCEL = process.env.VERCEL === '1';

const LOGS_DIR = path.join(process.cwd(), "data", "logs");

// Assicurati che la directory esista (solo se NON siamo su Vercel)
function ensureLogsDir() {
  if (IS_VERCEL) {
    return; // Skip su Vercel
  }
  
  try {
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
  } catch (error) {
    console.warn("⚠️ Impossibile creare directory logs (normale su Vercel)");
  }
}

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

type LogEntry = {
  timestamp: string;
  level: LogLevel;
  message: string;
  sessionId?: string;
  metadata?: Record<string, any>;
};

/**
 * Logger strutturato che scrive su console e file (file solo in locale)
 */
class Logger {
  private currentDate = this.getDateString();
  private logFilePath: string | null = this.getLogFilePath();

  private getDateString(): string {
    return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  }

  private getLogFilePath(): string | null {
    if (IS_VERCEL) {
      return null; // Nessun file su Vercel
    }
    
    ensureLogsDir();
    return path.join(LOGS_DIR, `app-${this.currentDate}.log`);
  }

  private checkRotateLog() {
    const today = this.getDateString();
    if (today !== this.currentDate) {
      this.currentDate = today;
      this.logFilePath = this.getLogFilePath();
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, message, sessionId, metadata } = entry;
    let logLine = `[${timestamp}] [${level}]`;

    if (sessionId) {
      logLine += ` [${sessionId}]`;
    }

    logLine += ` ${message}`;

    if (metadata && Object.keys(metadata).length > 0) {
      logLine += ` ${JSON.stringify(metadata)}`;
    }

    return logLine;
  }

  private writeLog(entry: LogEntry) {
    const logLine = this.formatLogEntry(entry);

    // Scrivi su console con emoji
    const emoji = {
      INFO: "ℹ️",
      WARN: "⚠️",
      ERROR: "❌",
      DEBUG: "🔍",
    }[entry.level];

    console.log(`${emoji} ${logLine}`);

    // Scrivi su file SOLO se NON siamo su Vercel
    if (!IS_VERCEL && this.logFilePath) {
      this.checkRotateLog();
      
      try {
        fs.appendFileSync(this.logFilePath, logLine + "\n", "utf-8");
      } catch (error) {
        console.error("Errore nello scrivere il log su file:", error);
      }
    }
  }

  info(message: string, sessionId?: string, metadata?: Record<string, any>) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: "INFO",
      message,
      sessionId,
      metadata,
    });
  }

  warn(message: string, sessionId?: string, metadata?: Record<string, any>) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: "WARN",
      message,
      sessionId,
      metadata,
    });
  }

  error(message: string, sessionId?: string, metadata?: Record<string, any>) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: "ERROR",
      message,
      sessionId,
      metadata,
    });
  }

  debug(message: string, sessionId?: string, metadata?: Record<string, any>) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: "DEBUG",
      message,
      sessionId,
      metadata,
    });
  }
}

export const logger = new Logger();

