// /app/api/admin/export/route.ts
import { NextResponse } from "next/server";
import { exportSessionsToCSV } from "@/lib/storage/fileStorage";
import { logger } from "@/lib/utils/logger";

export async function POST() {
  try {
    logger.info("Export CSV richiesto");
    
    const csvPath = await exportSessionsToCSV();
    
    if (!csvPath) {
      return NextResponse.json(
        { error: "Impossibile creare export CSV" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: "Export CSV creato con successo",
      path: csvPath,
    });
  } catch (error: any) {
    logger.error("Errore nell'export CSV", undefined, { error: error.message });
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

