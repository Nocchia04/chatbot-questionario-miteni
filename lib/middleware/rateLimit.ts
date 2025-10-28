// /lib/middleware/rateLimit.ts
import { NextRequest } from "next/server";
import { logger } from "../utils/logger";

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

// Store in-memory (per production usa Redis o simili)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configurazione
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "60", 10);
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10); // 1 minuto

/**
 * Pulisce entry scadute dallo store
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Ottiene l'identificatore del client (IP o sessionId)
 */
function getClientIdentifier(req: NextRequest): string {
  // Prova a ottenere l'IP reale (considera proxy e CDN)
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIp || "unknown";
  
  return ip;
}

/**
 * Rate limiter middleware
 * Ritorna null se OK, altrimenti un oggetto con l'errore
 */
export function checkRateLimit(req: NextRequest): {
  limited: boolean;
  remaining: number;
  resetTime: number;
} | null {
  // Pulisci entries scadute ogni tanto
  if (Math.random() < 0.1) {
    cleanupExpiredEntries();
  }

  const identifier = getClientIdentifier(req);
  const now = Date.now();

  let entry = rateLimitStore.get(identifier);

  // Se non esiste o è scaduta, creane una nuova
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + WINDOW_MS,
    };
    rateLimitStore.set(identifier, entry);

    return {
      limited: false,
      remaining: MAX_REQUESTS - 1,
      resetTime: entry.resetTime,
    };
  }

  // Incrementa il contatore
  entry.count++;

  // Controlla se ha superato il limite
  if (entry.count > MAX_REQUESTS) {
    logger.warn("Rate limit exceeded", undefined, {
      identifier,
      count: entry.count,
      maxRequests: MAX_REQUESTS,
    });

    return {
      limited: true,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  return {
    limited: false,
    remaining: MAX_REQUESTS - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Helper per aggiungere header rate limit alla response
 */
export function addRateLimitHeaders(
  headers: Headers,
  result: { limited: boolean; remaining: number; resetTime: number }
) {
  headers.set("X-RateLimit-Limit", MAX_REQUESTS.toString());
  headers.set("X-RateLimit-Remaining", result.remaining.toString());
  headers.set(
    "X-RateLimit-Reset",
    Math.ceil(result.resetTime / 1000).toString()
  );

  if (result.limited) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
    headers.set("Retry-After", retryAfter.toString());
  }
}

/**
 * Resetta il rate limit per un identifier specifico (utile per testing)
 */
export function resetRateLimit(identifier: string) {
  rateLimitStore.delete(identifier);
}

/**
 * Ottiene statistiche del rate limiter
 */
export function getRateLimitStats() {
  cleanupExpiredEntries();
  
  return {
    activeClients: rateLimitStore.size,
    maxRequests: MAX_REQUESTS,
    windowMs: WINDOW_MS,
  };
}

