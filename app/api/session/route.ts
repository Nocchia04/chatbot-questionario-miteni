// /app/api/session/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/sessionStore";

// Forza il runtime Node.js (non Edge) su Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * GET /api/session?sessionId=xxx
 * Carica una sessione esistente con tutto lo storico
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId mancante" },
        { status: 400, headers: corsHeaders }
      );
    }

    const session = await getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Sessione non trovata" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Ritorna la sessione completa con lo storico
    return NextResponse.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        currentState: session.currentState,
        data: session.data,
        history: session.history,
        done: session.currentState === "FINE",
      },
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("Errore nel caricare sessione:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500, headers: corsHeaders }
    );
  }
}

