# 📊 Google Sheets - Setup Rapido (5 minuti)

Guida veloce per configurare l'integrazione Google Sheets.

> **Nota:** Per la guida completa vedi `GOOGLE_SHEETS_SETUP.md`

---

## ⚡ Setup Veloce

### 1. Crea Foglio Google Sheets
1. Vai su [sheets.google.com](https://sheets.google.com)
2. Crea nuovo foglio
3. Rinomina: "Questionari PFAS Miteni"
4. Copia lo **Spreadsheet ID** dalla URL:
   ```
   https://docs.google.com/spreadsheets/d/[COPIA QUESTO ID]/edit
   ```

---

### 2. Crea Service Account

1. Vai su [console.cloud.google.com](https://console.cloud.google.com)
2. Crea nuovo progetto: `miteni-chatbot`
3. Abilita "**Google Sheets API**" (cerca nella Library)
4. Vai su "**Credentials**" > "**Create Credentials**" > "**Service Account**"
5. Nome: `miteni-chatbot-sa`
6. Ruolo: **Editor**
7. Crea chiave: **JSON** (scarica il file)

---

### 3. Condividi Foglio

1. Apri il file JSON scaricato
2. Copia il valore di `"client_email"` (es. `miteni-...@...iam.gserviceaccount.com`)
3. Vai sul tuo Google Sheet
4. Click "**Share**"
5. Incolla l'email del service account
6. Permesso: **Editor**
7. Click "**Send**"

✅ Fatto!

---

### 4. Configura .env.local

```bash
# Copia da env.example
cp env.example .env.local

# Aggiungi queste 3 variabili:

# ID del foglio (dalla URL)
GOOGLE_SHEETS_SPREADSHEET_ID=il-tuo-spreadsheet-id

# Nome foglio (opzionale)
GOOGLE_SHEETS_SHEET_NAME=Questionari PFAS

# Credenziali (JSON in UNA SOLA RIGA tra apici singoli)
GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account","project_id":"miteni...","private_key":"-----BEGIN...",...}'
```

**Come formattare il JSON:**
```bash
# Opzione A: Da terminale (macOS/Linux)
cat percorso/file-scaricato.json | jq -c

# Opzione B: Manualmente
# Apri il JSON, copia tutto, rimuovi spazi/newline, metti tra apici singoli
```

---

### 5. Inizializza e Testa

```bash
# Avvia server
npm run dev

# Test connessione
curl http://localhost:3000/api/admin/sheets/test
# Risposta: {"success": true, "message": "Connessione OK: ..."}

# Inizializza foglio (crea headers)
curl -X POST http://localhost:3000/api/admin/sheets/init
# Risposta: {"success": true, "message": "Foglio inizializzato..."}
```

✅ **Tutto configurato!**

---

## 🧪 Test Finale

1. Apri browser: `http://localhost:3000`
2. Compila alcune domande del questionario
3. Vai sul tuo Google Sheet
4. **Dovresti vedere una nuova riga con i dati!** 🎉

---

## 📊 Cosa Viene Salvato

Ogni riga contiene:
- Timestamp
- Session ID
- Stato attuale (NOME, R1, FINE...)
- Nome, Cognome, Email, Telefono
- Tutte le 17 risposte (R1-R17)
- Completato (Sì/No)
- Ultima modifica

---

## 🛠️ Comandi Utili

```bash
# Test connessione
curl http://localhost:3000/api/admin/sheets/test

# Sync manuale di tutte le sessioni
curl -X POST http://localhost:3000/api/admin/sheets/sync

# Check logs
tail -f data/logs/app-*.log | grep "Google Sheets"
```

---

## ❓ Troubleshooting

### Errore: "GOOGLE_SHEETS_CREDENTIALS non configurato"
✅ Aggiungi la variabile in `.env.local` (JSON tra apici singoli!)

### Errore: "The caller does not have permission"
✅ Hai condiviso il foglio con l'email del service account?

### Errore: "Spreadsheet not found"
✅ Verifica che `GOOGLE_SHEETS_SPREADSHEET_ID` sia corretto

### Nessuna riga appare
✅ Check logs: `tail -f data/logs/app-*.log`

---

## 🔒 Sicurezza

⚠️ **MAI committare `.env.local` su git!**
⚠️ **Tratta il file JSON come una password**

---

## 📚 Documentazione Completa

Per dettagli completi vedi: **`GOOGLE_SHEETS_SETUP.md`**

---

**Setup completato in 5 minuti! 🚀**

