# 📊 Google Sheets Integration - Setup Completo

Questa guida ti spiega passo-passo come configurare l'integrazione con Google Sheets per salvare automaticamente tutti i questionari PFAS.

---

## 🎯 Cosa Otterrai

Dopo questa configurazione:
- ✅ Ogni risposta del questionario viene salvata **automaticamente** su Google Sheets
- ✅ Dati aggiornati in **tempo reale**
- ✅ Possibilità di esportare in Excel, CSV
- ✅ Condivisione facile con team legale
- ✅ Backup cloud permanente

---

## 📋 Prerequisiti

- ✅ Account Google (Gmail)
- ✅ 10-15 minuti di tempo
- ✅ Accesso a Google Cloud Console

---

## 🚀 Setup Passo-Passo

### Step 1: Crea un Foglio Google Sheets

1. Vai su [Google Sheets](https://sheets.google.com)
2. Clicca su "+" per creare un nuovo foglio
3. Rinomina il foglio in: **"Questionari PFAS Miteni"**
4. Copia l'**ID del foglio** dalla URL:
   ```
   https://docs.google.com/spreadsheets/d/[QUESTO-È-LO-SPREADSHEET-ID]/edit
   ```
5. Salva questo ID, ti servirà dopo

---

### Step 2: Crea un Progetto Google Cloud

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Clicca su "**Select a Project**" in alto
3. Clicca su "**NEW PROJECT**"
4. Nome progetto: `miteni-chatbot` (o quello che preferisci)
5. Clicca "**CREATE**"
6. Attendi che il progetto venga creato (~30 secondi)

---

### Step 3: Abilita Google Sheets API

1. Nel tuo progetto, vai su "**APIs & Services**" > "**Library**"
2. Cerca "**Google Sheets API**"
3. Clicca sul risultato
4. Clicca "**ENABLE**"
5. Attendi che si abiliti

---

### Step 4: Crea Service Account

1. Vai su "**APIs & Services**" > "**Credentials**"
2. Clicca "**+ CREATE CREDENTIALS**" in alto
3. Seleziona "**Service Account**"
4. Compila i campi:
   - **Service account name**: `miteni-chatbot-sa`
   - **Service account ID**: (si auto-genera)
   - **Description**: "Service account for Miteni PFAS chatbot"
5. Clicca "**CREATE AND CONTINUE**"
6. In "**Grant this service account access to project**":
   - Seleziona ruolo: "**Editor**" (o "Viewer" se vuoi solo lettura)
7. Clicca "**CONTINUE**"
8. Clicca "**DONE**"

---

### Step 5: Crea e Scarica la Chiave JSON

1. Nella lista "**Service Accounts**", trova quella appena creata
2. Clicca sul nome del service account
3. Vai su tab "**KEYS**"
4. Clicca "**ADD KEY**" > "**Create new key**"
5. Seleziona tipo: "**JSON**"
6. Clicca "**CREATE**"
7. Verrà scaricato un file JSON sul tuo computer
8. **⚠️ IMPORTANTE**: Questo file contiene credenziali sensibili! Non committarlo mai su git!

Il file JSON scaricato avrà questa struttura:
```json
{
  "type": "service_account",
  "project_id": "miteni-chatbot-xxxxx",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "miteni-chatbot-sa@miteni-chatbot-xxxxx.iam.gserviceaccount.com",
  "client_id": "123456789...",
  ...
}
```

---

### Step 6: Condividi il Foglio con il Service Account

1. Apri il file JSON scaricato
2. Copia il valore di `"client_email"` (es. `miteni-chatbot-sa@...iam.gserviceaccount.com`)
3. Vai sul tuo **Google Sheet** (quello creato nello Step 1)
4. Clicca su "**Share**" (Condividi) in alto a destra
5. Incolla l'email del service account
6. Permesso: "**Editor**" (se vuoi che possa scrivere)
7. Clicca "**Send**" (o "Done" se non vuoi inviare notifica)

✅ **Ora il service account può accedere al foglio!**

---

### Step 7: Configura il File .env.local

1. Apri il file `.env.local` nel progetto (o crealo da `env.example`)

2. Aggiungi queste variabili:

```bash
# Google Sheets - Spreadsheet ID
GOOGLE_SHEETS_SPREADSHEET_ID=il-tuo-spreadsheet-id-copiato-prima

# Google Sheets - Nome foglio (opzionale, default "Questionari PFAS")
GOOGLE_SHEETS_SHEET_NAME=Questionari PFAS

# Google Sheets - Credenziali (JSON stringify in UNA SOLA RIGA)
GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
```

**⚠️ Come formattare GOOGLE_SHEETS_CREDENTIALS:**

Opzione A - Manuale:
1. Apri il file JSON scaricato
2. Copia TUTTO il contenuto
3. Minifica in una sola riga (rimuovi spazi e newline)
4. Incollalo tra apici singoli: `'{ ... }'`

Opzione B - Da Terminale:
```bash
# Minifica il JSON e copia negli appunti (macOS)
cat /path/to/downloaded-key.json | jq -c | pbcopy

# Poi incolla nel .env.local tra apici singoli
```

**Esempio finale `.env.local`:**
```bash
OPENAI_API_KEY=sk-...

GOOGLE_SHEETS_SPREADSHEET_ID=1A2B3C4D5E6F7G8H9I0J
GOOGLE_SHEETS_SHEET_NAME=Questionari PFAS
GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account","project_id":"miteni-chatbot-123456","private_key_id":"abc...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIE...==\n-----END PRIVATE KEY-----\n","client_email":"miteni-chatbot-sa@miteni-chatbot-123456.iam.gserviceaccount.com",...}'
```

---

### Step 8: Inizializza il Foglio

Una volta configurato `.env.local`, esegui:

```bash
# Testa la connessione
curl http://localhost:3000/api/admin/sheets/test

# Se tutto OK, inizializza il foglio (crea headers)
curl -X POST http://localhost:3000/api/admin/sheets/init
```

**Response attesa:**
```json
{
  "success": true,
  "message": "Foglio Google Sheets inizializzato con successo"
}
```

✅ Il foglio ora ha tutte le colonne necessarie!

---

## 🧪 Testing

### Test Manuale

1. Avvia il chatbot: `npm run dev`
2. Apri browser: `http://localhost:3000`
3. Compila qualche domanda del questionario
4. Vai sul tuo Google Sheet
5. Dovresti vedere una nuova riga con i dati!

### Test API

```bash
# Test connessione
curl http://localhost:3000/api/admin/sheets/test

# Sync manuale di tutte le sessioni esistenti
curl -X POST http://localhost:3000/api/admin/sheets/sync
```

---

## 📊 Struttura del Foglio

Il foglio avrà queste colonne:

| Colonna | Descrizione |
|---------|-------------|
| Timestamp | Data/ora creazione |
| Session ID | ID univoco sessione |
| Stato | Stato corrente (NOME, R1, FINE, ...) |
| Nome | Nome normalizzato |
| Cognome | Cognome normalizzato |
| Email | Email normalizzata |
| Telefono | Telefono (+39...) |
| Modalità | Chat o Telefono |
| R1-R17 | Risposte alle 17 domande |
| Completato | Sì/No |
| Ultima Modifica | Timestamp ultimo update |

---

## 🔄 Funzionalità

### Auto-Save
- Ogni risposta viene salvata **automaticamente** su Google Sheets
- Se fallisce, non blocca il questionario (fail-safe)
- Log degli errori in `data/logs/`

### Update Intelligente
- Se la sessione esiste già → **UPDATE** della riga
- Se è nuova → **INSERT** nuova riga
- Nessun duplicato!

### Bulk Export
```bash
# Esporta tutte le sessioni da file a Sheets
curl -X POST http://localhost:3000/api/admin/sheets/sync
```

---

## 🛠️ Troubleshooting

### Errore: "GOOGLE_SHEETS_CREDENTIALS non configurato"
✅ **Fix**: Verifica che `.env.local` contenga la variabile (con apici singoli)

### Errore: "Invalid JSON in GOOGLE_SHEETS_CREDENTIALS"
✅ **Fix**: Il JSON deve essere minificato in UNA SOLA RIGA e tra apici singoli

### Errore: "The caller does not have permission"
✅ **Fix**: Hai condiviso il foglio con l'email del service account?

### Errore: "Spreadsheet not found"
✅ **Fix**: Verifica `GOOGLE_SHEETS_SPREADSHEET_ID` sia corretto

### Nessuna riga appare sul foglio
✅ **Fix**: 
1. Controlla i log: `tail -f data/logs/app-*.log`
2. Verifica connessione: `curl localhost:3000/api/admin/sheets/test`
3. Verifica permessi sul foglio

---

## 🔒 Sicurezza

### ⚠️ Best Practices

1. **MAI committare `.env.local` su git**
   - È già nel `.gitignore`
   - Contiene credenziali sensibili!

2. **MAI condividere il file JSON delle credenziali**
   - Trattalo come una password
   - Conservalo in un password manager

3. **Limita i permessi del Service Account**
   - Usa "Viewer" se serve solo lettura
   - Usa "Editor" solo se necessario

4. **Rotazione credenziali**
   - Cambia le credenziali ogni 90 giorni
   - Elimina chiavi vecchie da Google Cloud Console

---

## 📈 Advanced: Formule e Analytics

Una volta che hai i dati su Sheets, puoi:

### Formule Utili

```
# Conta questionari completati
=COUNTIF(Z:Z, "Sì")

# Percentuale completamento
=COUNTIF(Z:Z, "Sì") / COUNTA(B:B) * 100

# Filtra per zona rossa
=FILTER(A:Z, REGEXMATCH(T:T, "Vicenza"))
```

### Grafici
1. Seleziona dati
2. Insert > Chart
3. Scegli tipo (Pie, Bar, Line)

### Pivot Tables
1. Data > Pivot Table
2. Analizza per stato, città, ecc.

---

## 🔄 Backup Automatico

I dati sono già backuppati in 3 posti:

1. **File locali**: `data/sessions/*.json`
2. **Google Sheets**: Cloud automatico
3. **Backup JSON**: `data/backups/backup-*.json` (ogni 24h)

✅ Triple redundancy!

---

## 📞 Support

Se hai problemi:

1. **Check logs**: `tail -f data/logs/app-*.log`
2. **Test connessione**: `curl localhost:3000/api/admin/sheets/test`
3. **Verifica permessi**: Foglio condiviso con service account?
4. **Riavvia server**: `Ctrl+C` e `npm run dev`

---

## ✅ Checklist Finale

- [ ] Foglio Google Sheets creato
- [ ] Spreadsheet ID copiato
- [ ] Progetto Google Cloud creato
- [ ] Google Sheets API abilitata
- [ ] Service Account creato
- [ ] Chiave JSON scaricata
- [ ] Foglio condiviso con service account email
- [ ] `.env.local` configurato con 3 variabili
- [ ] Test connessione OK
- [ ] Foglio inizializzato con headers
- [ ] Test manuale compilazione → dati appaiono

---

**Tutto configurato! 🎉**

Ora ogni questionario sarà salvato automaticamente su Google Sheets in tempo reale!

