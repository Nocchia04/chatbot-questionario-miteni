// /app/api/admin/backup/route.ts
import { NextResponse } from "next/server";
import { backupAllSessions } from "@/lib/storage/fileStorage";
import { logger } from "@/lib/utils/logger";

export async function POST() {
  try {
    logger.info("Backup manuale richiesto");
    
    const backupPath = await backupAllSessions();
    
    if (!backupPath) {
      return NextResponse.json(
        { error: "Impossibile creare backup" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: "Backup creato con successo",
      path: backupPath,
    });
  } catch (error: any) {
    logger.error("Errore nel backup", undefined, { error: error.message });
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

