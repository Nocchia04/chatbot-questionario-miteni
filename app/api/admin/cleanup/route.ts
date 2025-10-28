// /app/api/admin/cleanup/route.ts
import { NextResponse } from "next/server";
import { cleanupOldSessions } from "@/lib/storage/fileStorage";
import { logger } from "@/lib/utils/logger";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const daysOld = body.daysOld || 30;
    
    logger.info("Cleanup sessioni vecchie richiesto", undefined, { daysOld });
    
    const deletedCount = await cleanupOldSessions(daysOld);
    
    return NextResponse.json({
      success: true,
      message: `Cleanup completato: ${deletedCount} sessioni eliminate`,
      deletedCount,
    });
  } catch (error: any) {
    logger.error("Errore nel cleanup", undefined, { error: error.message });
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

