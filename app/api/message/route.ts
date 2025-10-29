// /app/api/message/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession, createSession, saveSession } from "@/lib/sessionStore";
import { handleAnswer } from "@/lib/conversationController";
import { FLOW } from "@/lib/flow";
import { logger } from "@/lib/utils/logger";
import { initializeApp } from "@/lib/init";
import { checkRateLimit, addRateLimitHeaders } from "@/lib/middleware/rateLimit";

// Forza il runtime Node.js (non Edge) su Vercel per compatibilità con file system
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Inizializza l'app al primo import
initializeApp();

// CORS headers per tutte le risposte
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Gestisci richieste OPTIONS (CORS preflight)
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  // Rate limiting check
  const rateLimitResult = checkRateLimit(req);
  
  if (rateLimitResult && rateLimitResult.limited) {
    const response = NextResponse.json(
      {
        error: true,
        message: "Troppe richieste. Per favore riprova tra qualche secondo.",
        rateLimited: true,
      },
      { status: 429 }
    );
    
    if (rateLimitResult) {
      addRateLimitHeaders(response.headers, rateLimitResult);
    }
    
    return response;
  }

  try {
    const body = await req.json().catch(() => ({}));

    let { sessionId, userMessage } = body as {
      sessionId?: string;
      userMessage?: string;
    };

    // se non arriva sessionId, crealo
    if (!sessionId) {
      sessionId = Math.random().toString(36).slice(2);
      logger.info("Nuova sessione creata", sessionId);
    } else {
      logger.debug("Sessione esistente ricevuta", sessionId);
    }

    // recupera o crea il contesto per quella sessione
    let ctx = await getSession(sessionId);
    if (!ctx) {
      ctx = createSession(sessionId);
      logger.info("Contesto creato per sessione", sessionId);
    } else {
      logger.debug("Contesto recuperato per sessione", sessionId);
    }

    // prima chiamata: nessun messaggio utente ancora
    if (!userMessage) {
      const node = FLOW[ctx.currentState];
      // salviamo in history la prima domanda che poniamo
      ctx.history.push({ from: "bot", text: node.question });
      
      // IMPORTANTE: Salva la sessione con la history!
      saveSession(ctx);

      logger.info("Prima interazione iniziata", sessionId, { 
        state: ctx.currentState,
        historyLength: ctx.history.length
      });

      return NextResponse.json({
        sessionId,
        botMessages: [node.question],
        done: false,
      }, { headers: corsHeaders });
    }

    // chiamata normale: abbiamo un messaggio dell'utente
    const result = await handleAnswer(ctx, userMessage);

    const response = NextResponse.json({
      sessionId,
      botMessages: result.botMessages,
      done: result.done,
    }, { headers: corsHeaders });
    
    // Aggiungi header rate limit
    if (rateLimitResult) {
      addRateLimitHeaders(response.headers, rateLimitResult);
    }
    
    return response;
  } catch (err: any) {
    logger.error("Errore API /api/message", undefined, { 
      error: err.message, 
      stack: err.stack 
    });

    return NextResponse.json(
      {
        error: true,
        message:
          "Errore interno nel server. Se vuoi lasciami il tuo numero e ti richiamiamo.",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
