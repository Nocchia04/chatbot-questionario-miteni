// /app/api/admin/sheets/test/route.ts
import { NextResponse } from "next/server";
import { testGoogleSheetsConnection } from "@/lib/integrations/googleSheets";
import { logger } from "@/lib/utils/logger";

export async function GET() {
  try {
    logger.info("Test connessione Google Sheets richiesto");
    
    const result = await testGoogleSheetsConnection();
    
    return NextResponse.json(result);
  } catch (error: any) {
    logger.error("Errore test Google Sheets", undefined, { error: error.message });
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

