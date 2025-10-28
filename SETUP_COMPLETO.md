# 🚀 Setup Completo - Miteni Chatbot v3.0

## ✅ Tutto Pronto!

Il sistema è stato completamente ristrutturato secondo le tue specifiche. Ecco cosa è stato implementato:

---

## 📋 Funzionalità Implementate

### 1. **Questionario Completo** ✅
- ✅ Nuovi campi anagrafici: SESSO, LUOGO_NASCITA, PROVINCIA_NASCITA, DATA_NASCITA
- ✅ Ordine corretto: NOME → COGNOME → SESSO → LUOGO → PROVINCIA → TELEFONO → EMAIL → DATA → MODALITÀ
- ✅ Domande R1-R17 con i testi ufficiali forniti
- ✅ Gestione modalità Chat/Telefono

### 2. **Validazioni Intelligenti** ✅
- ✅ Sesso: Accetta M/F, maschio/femmina, uomo/donna → normalizza a M/F
- ✅ Provincia: 2 lettere (es. VI, PD, VE) → maiuscolo automatico
- ✅ Data di nascita: gg/mm/aaaa, età 18-120 anni, normalizzazione automatica
- ✅ Email: Validazione RFC standard
- ✅ Telefono: Validazione numeri italiani

### 3. **Resume Automatico** ✅
- ✅ Riconoscimento utente tramite email
- ✅ Ripresa automatica dalla domanda successiva
- ✅ Blocco se questionario già completato
- ✅ Merge automatico dei dati precedenti

### 4. **Google Sheets Integrato** ✅
- ✅ Salvataggio real-time dopo ogni risposta
- ✅ Struttura colonne aggiornata (NOME | COGNOME | SESSO | ... | MODALITÀ | R1-R17)
- ✅ Upsert intelligente (cerca per email, no duplicati)
- ✅ Admin endpoints per test e sincronizzazione

---

## 🔧 Come Usare

### **Passo 1: Avvia il Server**
```bash
cd /Users/nocchia/Desktop/AITALIA/mitenichat
npm run dev
```

Il chatbot sarà disponibile su: **http://localhost:3000**

---

### **Passo 2: Configura Google Sheets**

**Verifica che `.env.local` contenga**:
```bash
GOOGLE_SHEETS_SPREADSHEET_ID=1ojzYokodglYKQSDxTJrPOhIMVwPhCVIdTw1mOqmN3xQ
GOOGLE_SHEETS_SHEET_NAME=Foglio1  # o il nome del tuo tab
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account",...}
```

**Se gli header non sono presenti**, esegui:
```bash
curl -X POST http://localhost:3000/api/admin/sheets/init
```

---

### **Passo 3: Testa il Sistema**

#### **Scenario 1: Flusso Completo Chat**
1. Vai su `http://localhost:3000`
2. Rispondi a tutte le domande:
   - Nome: `Mario`
   - Cognome: `Rossi`
   - Sesso: `M`
   - Luogo di nascita: `Vicenza`
   - Provincia: `VI`
   - Telefono: `3331234567`
   - Email: `mario.rossi@test.com`
   - Data di nascita: `15/03/1980`
   - Modalità: `In chat`
   - R1-R17: [rispondi a tutte]

3. **Verifica Google Sheets** → Dovrebbe esserci una riga con tutti i dati compilati

#### **Scenario 2: Flusso Breve Telefono**
1. Nuova sessione (finestra in incognito)
2. Compila fino a MODALITÀ
3. Quando chiede "Preferisci in chat o al telefono?", rispondi: `Al telefono`
4. **Verifica** → Il bot termina subito, Google Sheets ha i dati anagrafici ma R1-R17 vuote

#### **Scenario 3: Resume Sessione**
1. Inizia una conversazione, arriva fino a EMAIL: `test.resume@example.com`
2. Chiudi il browser
3. Riapri, ricompila i primi dati, usa la stessa email: `test.resume@example.com`
4. **Verifica** → Il bot dice "Bentornato!" e riprende dalla domanda successiva

---

## 📊 Struttura Google Sheets

**Colonne (A-Z)**:
```
A: NOME
B: COGNOME
C: SESSO
D: LUOGO DI NASCITA
E: PROVINCIA DI NASCITA
F: TELEFONO
G: EMAIL
H: DATA DI NASCITA
I: MODALITÀ
J: R1  (Cosa sa dell'inquinamento...)
K: R2  (Da quanto tempo lo sa...)
L: R3  (Per cosa usate l'acqua...)
M: R4  (Alternative acqua...)
N: R5  (Consigli Comune...)
O: R6  (PFAS danni salute...)
P: R7  (Controlli sangue...)
Q: R8  (Valori referti...)
R: R9  (Visite specifiche...)
S: R10 (Tempo zona rossa...)
T: R11 (Casa proprietà/affitto...)
U: R12 (Vendita difficoltà...)
V: R13 (Nucleo familiare...)
W: R14 (Malattie familiari...)
X: R15 (Decessi familiari...)
Y: R16 (Orto...)
Z: R17 (Attività ridotte...)
```

---

## 🛠 Admin Tools

### **Test Connessione Google Sheets**
```bash
curl -X POST http://localhost:3000/api/admin/sheets/test
```
Risposta: `{ "success": true, "message": "..." }`

### **Inizializza Headers**
```bash
curl -X POST http://localhost:3000/api/admin/sheets/init
```
Crea la prima riga con gli header se non esiste.

### **Sincronizza Tutte le Sessioni**
```bash
curl -X POST http://localhost:3000/api/admin/sheets/sync
```
Esporta tutte le sessioni locali su Google Sheets (bulk sync).

### **Health Check**
```bash
curl http://localhost:3000/api/health
```
Risposta con stato del sistema, sessioni attive, rate limiter, ecc.

---

## 📖 Documentazione

- **`CHANGELOG_v3.0_RESTRUCTURE.md`** - Tutte le modifiche implementate
- **`TESTING_GUIDE.md`** - Guida completa ai test
- **`GOOGLE_SHEETS_SETUP.md`** - Setup Google Sheets (se serve riconfigurare)
- **`QUICK_START.md`** - Guida rapida all'uso

---

## 🎯 Flusso Completo del Questionario

```
1. NOME           → "Qual è il tuo nome?"
2. COGNOME        → "Il tuo cognome?"
3. SESSO          → "Qual è il tuo sesso? (M/F)"
4. LUOGO_NASCITA  → "In quale città sei nato/a?"
5. PROVINCIA      → "In quale provincia? (sigla)"
6. TELEFONO       → "Il tuo numero di telefono?"
7. EMAIL          → "Qual è la tua email?"
                     [QUI: controlla se esiste già sessione]
8. DATA_NASCITA   → "Qual è la tua data di nascita?"
9. MODALITA       → "Preferisci in chat o al telefono?"
   ├─ "Telefono" → FINE (salva su Google Sheets, R1-R17 vuote)
   └─ "Chat"     → R1
   
10. R1  → "Cosa sa dell'inquinamento da PFAS..."
11. R2  → "Da quanto tempo lo sa..."
12. R3  → "Per cosa usate l'acqua del rubinetto..."
13. R4  → "Alternative all'acqua del rubinetto..."
14. R5  → "Cosa vi ha consigliato il Comune..."
15. R6  → "I PFAS possono causare danni..."
16. R7  → "Controlli PFAS nel sangue..."
17. R8  → "Valori e referti..."
18. R9  → "Visite specifiche..."
19. R10 → "Tempo nella zona rossa..."
20. R11 → "Casa proprietà o affitto..."
21. R12 → "Difficoltà vendita/affitto..."
22. R13 → "Nucleo familiare..."
23. R14 → "Malattie familiari..."
24. R15 → "Decessi familiari..."
25. R16 → "Orto..."
26. R17 → "Attività ridotte..."
27. FINE → "Grazie 🙌 Abbiamo finito..."
```

---

## 🐛 Troubleshooting Rapido

### Problema: Google Sheets non si aggiorna
**Soluzione**:
```bash
# Verifica credenziali
echo $GOOGLE_SHEETS_CREDENTIALS | jq

# Verifica che il service account abbia accesso
# Apri il foglio, Share → Aggiungi l'email del service account

# Test connessione
curl -X POST http://localhost:3000/api/admin/sheets/test
```

### Problema: Resume non funziona
**Soluzione**:
```bash
# Controlla sessioni salvate
ls -la data/sessions/

# Verifica log
tail -f data/logs/app-*.log | grep -i "resume\|email"
```

### Problema: Validazioni non funzionano
**Soluzione**: Controlla i log per errori di validazione
```bash
tail -f data/logs/app-*.log | grep -i "validation"
```

---

## 🚀 Deploy su Produzione

Quando sei pronto per il deploy:

1. **Verifica ambiente**:
   - ✅ Tutte le variabili in `.env.local` sono corrette
   - ✅ Google Sheets configurato e accessibile
   - ✅ Service Account ha permessi
   - ✅ Test locali superati

2. **Build di produzione**:
```bash
npm run build
npm start
```

3. **Deploy su Vercel** (opzionale):
```bash
vercel --prod
```

Ricorda di impostare le variabili d'ambiente su Vercel:
- `OPENAI_API_KEY`
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SHEETS_SHEET_NAME`
- `GOOGLE_SHEETS_CREDENTIALS`

---

## 📞 Supporto

Se hai problemi:
1. Controlla i log: `data/logs/app-*.log`
2. Verifica le sessioni: `data/sessions/`
3. Consulta `TESTING_GUIDE.md`
4. Consulta `GOOGLE_SHEETS_SETUP.md`

---

## 🎉 Tutto Pronto!

Il sistema è **completo e funzionale**. Puoi iniziare a testarlo seguendo la guida in `TESTING_GUIDE.md`.

**Buon lavoro! 🚀**

---

**Fine Setup Completo**

