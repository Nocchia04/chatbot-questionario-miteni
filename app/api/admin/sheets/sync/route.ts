// /app/api/admin/sheets/sync/route.ts
import { NextResponse } from "next/server";
import { bulkExportToSheets } from "@/lib/integrations/googleSheets";
import { listAllSessions, loadSessionFromFile } from "@/lib/storage/fileStorage";
import { logger } from "@/lib/utils/logger";

/**
 * Sync manuale di tutte le sessioni su Google Sheets
 */
export async function POST() {
  try {
    logger.info("Sync manuale Google Sheets richiesto");
    
    // Carica tutte le sessioni da file
    const sessionIds = await listAllSessions();
    const contexts = [];
    
    for (const sessionId of sessionIds) {
      const ctx = await loadSessionFromFile(sessionId);
      if (ctx) {
        contexts.push(ctx);
      }
    }
    
    // Bulk export a Google Sheets
    const result = await bulkExportToSheets(contexts);
    
    return NextResponse.json({
      success: true,
      message: `Sync completato: ${result.success}/${contexts.length} sessioni salvate`,
      stats: result,
    });
  } catch (error: any) {
    logger.error("Errore sync Google Sheets", undefined, { error: error.message });
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

