// /lib/integrations/googleSheets.ts
import { google } from "googleapis";
import { ConversationContext } from "../flow";
import { logger } from "../utils/logger";

// Configurazione Google Sheets
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
const SHEET_NAME = process.env.GOOGLE_SHEETS_SHEET_NAME || "Questionari PFAS";

// Headers del foglio (colonne) - Ordine secondo documento originale
const SHEET_HEADERS = [
  "NOME",
  "COGNOME",
  "EMAIL",
  "TELEFONO",
  "MODALITÀ",
  "SESSO",
  "LUOGO DI NASCITA",
  "PROVINCIA DI NASCITA",
  "DATA DI NASCITA",
  "R1",
  "R2",
  "R3",
  "R4",
  "R5",
  "R6",
  "R7",
  "R8",
  "R9",
  "R10",
  "R11",
  "R12",
  "R13",
  "R14",
  "R15",
  "R16",
  "R17",
  "RIEPILOGO",
  "CONFERMA_FINALE",
];

/**
 * Crea il client autenticato Google Sheets
 */
function getGoogleSheetsClient() {
  try {
    // Leggi le credenziali dal .env (Service Account JSON)
    const credentials = process.env.GOOGLE_SHEETS_CREDENTIALS;
    
    if (!credentials) {
      throw new Error("GOOGLE_SHEETS_CREDENTIALS non configurato in .env.local");
    }

    const parsedCredentials = JSON.parse(credentials);

    const auth = new google.auth.GoogleAuth({
      credentials: parsedCredentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    return sheets;
  } catch (error: any) {
    logger.error("Errore creazione client Google Sheets", undefined, {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Verifica che il foglio esista e abbia gli headers corretti
 */
export async function initializeSheet(): Promise<boolean> {
  try {
    if (!SPREADSHEET_ID) {
      logger.warn("GOOGLE_SHEETS_SPREADSHEET_ID non configurato, skip inizializzazione");
      return false;
    }

    const sheets = getGoogleSheetsClient();

    // Verifica se il foglio esiste
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheetExists = response.data.sheets?.some(
      (sheet) => sheet.properties?.title === SHEET_NAME
    );

    if (!sheetExists) {
      // Crea il foglio
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: SHEET_NAME,
                },
              },
            },
          ],
        },
      });

      logger.info("Foglio Google Sheets creato", undefined, { sheetName: SHEET_NAME });
    }

    // Verifica se gli headers esistono già
    const headersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:AA1`,
    });

    if (!headersResponse.data.values || headersResponse.data.values.length === 0) {
      // Aggiungi headers solo se mancano
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [SHEET_HEADERS],
        },
      });

      logger.info("Headers Google Sheets aggiunti");
    } else {
      logger.info("Headers Google Sheets già presenti, skip");
    }

    return true;
  } catch (error: any) {
    logger.error("Errore inizializzazione Google Sheets", undefined, {
      error: error.message,
      stack: error.stack,
    });
    return false;
  }
}

/**
 * Converte ConversationContext in riga per Google Sheets
 * Ordine colonne: NOME | COGNOME | EMAIL | TELEFONO | MODALITÀ | 
 *                 SESSO | LUOGO | PROVINCIA | DATA | R1-R17 | RIEPILOGO | CONFERMA_FINALE
 */
function contextToRow(ctx: ConversationContext): any[] {
  return [
    ctx.data.nome?.normalized || "", // NOME
    ctx.data.cognome?.normalized || "", // COGNOME
    ctx.data.email?.normalized || "", // EMAIL
    ctx.data.telefono?.normalized || "", // TELEFONO
    ctx.data.modalita?.normalized || "", // MODALITÀ
    ctx.data.sesso?.normalized || "", // SESSO
    ctx.data.luogoNascita?.normalized || "", // LUOGO DI NASCITA
    ctx.data.provinciaNascita?.normalized || "", // PROVINCIA DI NASCITA
    ctx.data.dataNascita?.normalized || "", // DATA DI NASCITA
    ctx.data.R1?.normalized || "", // R1
    ctx.data.R2?.normalized || "", // R2
    ctx.data.R3?.normalized || "", // R3
    ctx.data.R4?.normalized || "", // R4
    ctx.data.R5?.normalized || "", // R5
    ctx.data.R6?.normalized || "", // R6
    ctx.data.R7?.normalized || "", // R7
    ctx.data.R8?.normalized || "", // R8
    ctx.data.R9?.normalized || "", // R9
    ctx.data.R10?.normalized || "", // R10
    ctx.data.R11?.normalized || "", // R11
    ctx.data.R12?.normalized || "", // R12
    ctx.data.R13?.normalized || "", // R13
    ctx.data.R14?.normalized || "", // R14
    ctx.data.R15?.normalized || "", // R15
    ctx.data.R16?.normalized || "", // R16
    ctx.data.R17?.normalized || "", // R17
    ctx.data.riepilogo?.normalized || "", // RIEPILOGO
    ctx.data.confermaFinale?.normalized || "", // CONFERMA_FINALE
  ];
}

/**
 * Trova la riga corrispondente a una sessionId
 * NOTA: Cerchiamo tramite EMAIL (colonna C) secondo nuovo ordine
 */
async function findRowByEmail(
  sheets: any,
  email: string
): Promise<number | null> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!C:C`, // Colonna EMAIL (la 3a colonna)
    });

    const values = response.data.values;
    if (!values) return null;

    // Trova l'indice (row number è index + 1, ma header è row 1)
    // Cerchiamo dalla riga 2 in poi (saltando l'header)
    const rowIndex = values.findIndex((row: any[], index: number) => 
      index > 0 && row[0]?.toLowerCase() === email.toLowerCase()
    );
    
    if (rowIndex === -1) return null;
    
    return rowIndex + 1; // +1 perché sheets usa 1-based indexing
  } catch (error: any) {
    logger.error("Errore ricerca riga per email", undefined, {
      email,
      error: error.message,
    });
    return null;
  }
}

/**
 * Inserisce o aggiorna una riga nel foglio Google Sheets
 * Cerca per EMAIL per identificare righe esistenti
 */
export async function upsertSheetRow(ctx: ConversationContext): Promise<boolean> {
  try {
    if (!SPREADSHEET_ID) {
      logger.debug("Google Sheets non configurato, skip upsert");
      return false;
    }

    const sheets = getGoogleSheetsClient();
    const rowData = contextToRow(ctx);

    // Salviamo solo se abbiamo almeno TELEFONO (dopo MODALITÀ potremmo non averlo se sceglie telefono)
    // Ma in realtà salviamo sempre se abbiamo email (che viene prima di MODALITÀ)
    const email = ctx.data.email?.normalized;
    const telefono = ctx.data.telefono?.normalized;
    
    if (!email || !telefono) {
      logger.debug("Dati anagrafici base incompleti, skip Google Sheets", ctx.sessionId);
      return false;
    }

    // Cerca se esiste già una riga per questa email
    const existingRow = await findRowByEmail(sheets, email);

    if (existingRow) {
      // UPDATE: Aggiorna la riga esistente
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${existingRow}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [rowData],
        },
      });

      logger.info("Google Sheets: riga aggiornata", ctx.sessionId, {
        row: existingRow,
        email,
        state: ctx.currentState,
      });
    } else {
      // INSERT: Aggiungi nuova riga (parte dalla riga 2, header è riga 1)
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A2`, // Inizia dalla riga 2 (dopo header)
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [rowData],
        },
      });

      logger.info("Google Sheets: nuova riga inserita", ctx.sessionId, {
        email,
        state: ctx.currentState,
      });
    }

    return true;
  } catch (error: any) {
    logger.error("Errore upsert Google Sheets", ctx.sessionId, {
      error: error.message,
      stack: error.stack,
    });
    
    // Non blocchiamo il flusso se Google Sheets fallisce
    return false;
  }
}

/**
 * Esporta tutte le sessioni da fileStorage a Google Sheets (bulk)
 */
export async function bulkExportToSheets(
  contexts: ConversationContext[]
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const ctx of contexts) {
    const result = await upsertSheetRow(ctx);
    if (result) {
      success++;
    } else {
      failed++;
    }
    
    // Piccolo delay per non sovracaricare API
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  logger.info("Bulk export completato", undefined, { success, failed, total: contexts.length });

  return { success, failed };
}

/**
 * Test connessione Google Sheets
 */
export async function testGoogleSheetsConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    if (!SPREADSHEET_ID) {
      return {
        success: false,
        message: "GOOGLE_SHEETS_SPREADSHEET_ID non configurato",
      };
    }

    const sheets = getGoogleSheetsClient();

    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    return {
      success: true,
      message: `Connessione OK: ${response.data.properties?.title}`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Errore: ${error.message}`,
    };
  }
}

