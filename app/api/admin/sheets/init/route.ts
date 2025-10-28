// /app/api/admin/sheets/init/route.ts
import { NextResponse } from "next/server";
import { initializeSheet } from "@/lib/integrations/googleSheets";
import { logger } from "@/lib/utils/logger";

export async function POST() {
  try {
    logger.info("Inizializzazione Google Sheets richiesta");
    
    const success = await initializeSheet();
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: "Foglio Google Sheets inizializzato con successo",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Impossibile inizializzare il foglio (verifica configurazione)",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error("Errore inizializzazione Google Sheets", undefined, { 
      error: error.message 
    });
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

