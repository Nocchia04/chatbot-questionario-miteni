# 🧪 Guida al Testing - Miteni Chatbot v3.0

## 📋 Indice
1. [Setup Iniziale](#setup-iniziale)
2. [Test Flusso Completo](#test-flusso-completo)
3. [Test Resume Sessione](#test-resume-sessione)
4. [Test Validazioni](#test-validazioni)
5. [Test Google Sheets](#test-google-sheets)
6. [Troubleshooting](#troubleshooting)

---

## Setup Iniziale

### 1. Avvia il Server
```bash
cd /Users/nocchia/Desktop/AITALIA/mitenichat
npm run dev
```

Il server sarà disponibile su: `http://localhost:3000`

### 2. Verifica Google Sheets
Prima di iniziare, assicurati che:
- ✅ Il foglio Google esista: [Apri foglio](https://docs.google.com/spreadsheets/d/1ojzYokodglYKQSDxTJrPOhIMVwPhCVIdTw1mOqmN3xQ)
- ✅ Gli header siano presenti (riga 1)
- ✅ Il service account abbia accesso al foglio

**Test connessione rapido**:
```bash
curl -X POST http://localhost:3000/api/admin/sheets/test
```

---

## Test Flusso Completo

### Test 1: Flusso Chat (Completo)

**Obiettivo**: Testare il percorso completo da NOME a FINE con modalità Chat.

**Passi**:
1. Apri il browser su `http://localhost:3000`
2. Segui la conversazione rispondendo a tutte le domande:

```
🤖: Ciao 👋 Per iniziare, qual è il tuo nome?
👤: Mario

🤖: Perfetto. Il tuo cognome?
👤: Rossi

🤖: Qual è il tuo sesso? (M per Maschio, F per Femmina)
👤: M

🤖: In quale città sei nato/a?
👤: Vicenza

🤖: In quale provincia? (indica la sigla, es. VI, PD, VE...)
👤: VI

🤖: Il tuo numero di telefono?
👤: 3331234567

🤖: Qual è la tua email?
👤: mario.rossi@example.com

🤖: Qual è la tua data di nascita? (formato: gg/mm/aaaa)
👤: 15/03/1980

🤖: Preferisci compilare il questionario qui in chat o...?
👤: In chat

🤖: Cosa sa dell'inquinamento da PFAS...
👤: [risposta]

... [continua con R1-R17] ...
```

**Verifiche**:
- ✅ Tutte le domande appaiono in ordine
- ✅ Le validazioni funzionano (prova email errata, data errata, ecc.)
- ✅ Google Sheets viene aggiornato progressivamente
- ✅ Al termine, `currentState === "FINE"`
- ✅ Nel foglio Google, la riga contiene tutti i dati

**Risultato Google Sheets Atteso**:
| NOME | COGNOME | SESSO | LUOGO DI NASCITA | ... | MODALITÀ | R1 | R2 | ... | R17 |
|------|---------|-------|------------------|-----|----------|----|----|-----|-----|
| Mario | Rossi | M | Vicenza | ... | chat | ... | ... | ... | ... |

---

### Test 2: Flusso Telefono (Breve)

**Obiettivo**: Testare il branch "telefono" che termina dopo MODALITA.

**Passi**:
1. Apri una **nuova sessione** (finestra in incognito o altro browser)
2. Compila fino a MODALITA:

```
👤: Andrea
👤: Bianchi
👤: M
👤: Padova
👤: PD
👤: 3337654321
👤: andrea.bianchi@example.com
👤: 10/05/1975

🤖: Preferisci compilare il questionario qui in chat o...?
👤: Preferisco al telefono

🤖: Grazie 🙌 Abbiamo finito. Ti ricontatteremo...
```

**Verifiche**:
- ✅ Il bot termina dopo "telefono"
- ✅ Non vengono fatte domande R1-R17
- ✅ Google Sheets contiene:
  - Dati anagrafici completi
  - `MODALITÀ = "telefono"` (o simile)
  - R1-R17 = **VUOTE**

**Risultato Google Sheets Atteso**:
| NOME | COGNOME | MODALITÀ | R1 | R2 | ... | R17 |
|------|---------|----------|----|----|-----|-----|
| Andrea | Bianchi | telefono |  |  |  |  |

---

## Test Resume Sessione

### Test 3: Resume Sessione Incompleta

**Obiettivo**: Verificare che l'utente possa riprendere da dove aveva lasciato.

**Passi**:

#### Fase 1: Abbandono
1. Apri `http://localhost:3000`
2. Compila fino a EMAIL:
```
👤: Luca
👤: Verdi
👤: M
👤: Venezia
👤: VE
👤: 3339876543
👤: luca.verdi@example.com
```
3. **Chiudi il browser** senza completare

#### Fase 2: Ritorno
1. Riapri `http://localhost:3000` (stessa email)
2. Ricompila i primi dati (il sistema chiederà di nuovo):
```
👤: Luca
👤: Verdi
👤: M
👤: Venezia
👤: VE
👤: 3339876543
👤: luca.verdi@example.com  ← STESSA EMAIL
```

**Comportamento Atteso**:
```
🤖: Bentornato/a! 👋 Vedo che avevi già iniziato a compilare 
    il questionario. Riprenderemo da dove avevi interrotto.
    
    [Continua con la prossima domanda...]
```

**Verifiche**:
- ✅ Il bot riconosce l'email
- ✅ Carica i dati precedenti
- ✅ Riprende dalla domanda successiva (DATA_NASCITA)
- ✅ Non rifa le domande già risposte

---

### Test 4: Resume Sessione Completata

**Obiettivo**: Verificare che non si possa rifare un questionario già completato.

**Passi**:
1. Completa un questionario con email: `test.completato@example.com`
2. Arriva fino a `FINE`
3. Riapri una nuova sessione
4. Usa la stessa email: `test.completato@example.com`

**Comportamento Atteso**:
```
🤖: Vedo che hai già completato il questionario con questa 
    email in precedenza. Se hai bisogno di aggiornare le tue 
    informazioni, contattaci direttamente. Grazie! 🙏
```

**Verifiche**:
- ✅ Il bot blocca la compilazione
- ✅ Stato diventa `FINE`
- ✅ Non vengono fatte altre domande

---

## Test Validazioni

### Test 5: Validazione Sesso

**Input validi**:
```
M → M ✅
F → F ✅
maschio → M ✅
FEMMINA → F ✅
uomo → M ✅
donna → F ✅
```

**Input non validi**:
```
👤: altro
🤖: Inserisci M per Maschio o F per Femmina. Per favore, riprova.

👤: X
🤖: Inserisci M per Maschio o F per Femmina. Per favore, riprova.
```

---

### Test 6: Validazione Provincia

**Input validi**:
```
VI → VI ✅
vi → VI ✅
pd → PD ✅
VE → VE ✅
```

**Input non validi**:
```
👤: Vicenza
🤖: Inserisci la sigla della provincia (2 lettere, es. VI, PD, VE).

👤: 123
🤖: Inserisci la sigla della provincia...
```

---

### Test 7: Validazione Data di Nascita

**Input validi**:
```
15/03/1980 → 15/03/1980 ✅
5/3/1980 → 05/03/1980 ✅ (normalizzata)
01/01/2000 → 01/01/2000 ✅
```

**Input non validi**:

**Formato errato**:
```
👤: 1980-03-15
🤖: Formato data non valido. Usa gg/mm/aaaa (es. 15/03/1985).

👤: 15-03-1980
🤖: Formato data non valido...
```

**Mese non valido**:
```
👤: 15/13/1980
🤖: Mese non valido. Deve essere tra 1 e 12.
```

**Età < 18 anni**:
```
👤: 15/03/2015
🤖: Devi avere almeno 18 anni per compilare questo questionario.
```

**Anno futuro**:
```
👤: 15/03/2030
🤖: Anno non valido. Deve essere tra 1900 e 2025.
```

---

### Test 8: Validazione Email

**Input validi**:
```
test@example.com ✅
mario.rossi@gmail.com ✅
user+tag@domain.co.uk ✅
```

**Input non validi**:
```
👤: emailsenzachiocciola
🤖: Inserisci un indirizzo email valido.

👤: email@
🤖: Inserisci un indirizzo email valido.
```

---

## Test Google Sheets

### Test 9: Salvataggio Progressivo

**Obiettivo**: Verificare che Google Sheets venga aggiornato durante la conversazione.

**Passi**:
1. Apri il foglio Google in una tab: [Link foglio](https://docs.google.com/spreadsheets/d/1ojzYokodglYKQSDxTJrPOhIMVwPhCVIdTw1mOqmN3xQ)
2. Inizia una nuova conversazione nel chatbot
3. Rispondi alle prime domande fino a EMAIL
4. **Controlla il foglio** → Dovrebbe apparire una nuova riga con:
   - NOME, COGNOME, SESSO, LUOGO_NASCITA, PROVINCIA_NASCITA, TELEFONO, EMAIL
   - MODALITÀ, R1-R17 ancora vuote
5. Continua con le domande
6. **Aggiorna il foglio** → La riga dovrebbe aggiornarsi con i nuovi dati

**Verifiche**:
- ✅ Salvataggio avviene dopo EMAIL (prima volta)
- ✅ Ogni risposta successiva aggiorna la riga esistente
- ✅ Non vengono create righe duplicate

---

### Test 10: Upsert Corretto

**Obiettivo**: Verificare che lo stesso utente non crei righe duplicate.

**Passi**:
1. Completa un questionario con email: `upsert.test@example.com`
2. Guarda quante righe ci sono nel foglio per quella email (dovrebbe essere 1)
3. Riapri la sessione (resume scenario)
4. L'email verrà riconosciuta e riprenderà
5. **Controlla il foglio** → Dovrebbe esserci ancora **1 sola riga**

**Verifiche**:
- ✅ Non ci sono righe duplicate per la stessa email
- ✅ L'upsert aggiorna la riga esistente

---

### Test 11: API Admin

**Test connessione**:
```bash
curl -X POST http://localhost:3000/api/admin/sheets/test
```

**Risposta attesa**:
```json
{
  "success": true,
  "message": "Google Sheets configurato correttamente",
  "spreadsheetId": "1ojzYokodglYKQSDxTJrPOhIMVwPhCVIdTw1mOqmN3xQ",
  "sheetName": "Foglio1"
}
```

**Inizializzazione header**:
```bash
curl -X POST http://localhost:3000/api/admin/sheets/init
```

**Risposta attesa**:
```json
{
  "success": true,
  "message": "Foglio Google Sheets inizializzato con successo"
}
```

**Sync bulk**:
```bash
curl -X POST http://localhost:3000/api/admin/sheets/sync
```

**Risposta attesa**:
```json
{
  "success": true,
  "message": "Sincronizzazione completata",
  "synced": 5,
  "failed": 0
}
```

---

## Troubleshooting

### Problema 1: Google Sheets non si aggiorna

**Sintomi**: Le risposte non appaiono nel foglio Google.

**Soluzioni**:
1. Verifica le credenziali in `.env.local`
2. Controlla che il service account abbia accesso al foglio
3. Verifica il nome del foglio (SHEET_NAME)
4. Controlla i log in console per errori

**Debug**:
```bash
# Controlla i log
tail -f data/logs/app-*.log | grep "Google Sheets"
```

---

### Problema 2: Resume non funziona

**Sintomi**: Il bot non riconosce l'email precedente.

**Soluzioni**:
1. Verifica che la sessione precedente sia salvata:
```bash
ls -la data/sessions/
```

2. Controlla che l'email sia stata normalizzata correttamente:
```bash
cat data/sessions/<sessionId>.json | grep email
```

3. Verifica i log:
```bash
tail -f data/logs/app-*.log | grep "resume\|email"
```

---

### Problema 3: Validazioni non funzionano

**Sintomi**: Input non validi vengono accettati.

**Soluzioni**:
1. Verifica che `validateByKey` sia chiamata
2. Controlla i log per vedere il risultato della validazione:
```bash
tail -f data/logs/app-*.log | grep "Validation"
```

3. Testa la validazione manualmente nel terminale Node:
```javascript
import { validateSesso } from './lib/validation/inputValidation';
console.log(validateSesso('maschio')); // { isValid: true, normalized: 'M' }
```

---

### Problema 4: Errore "Unable to parse range"

**Sintomi**: `Unable to parse range: Questionari PFAS!A:Z`

**Soluzione**:
1. Il nome del foglio in Google Sheets non corrisponde a `GOOGLE_SHEETS_SHEET_NAME`
2. Opzioni:
   - Rinomina il tab in Google Sheets a "Questionari PFAS"
   - Oppure aggiorna `.env.local`:
   ```bash
   GOOGLE_SHEETS_SHEET_NAME=Foglio1
   ```

---

### Problema 5: Headers mancanti

**Sintomi**: I dati vengono salvati ma senza intestazioni.

**Soluzione**:
```bash
curl -X POST http://localhost:3000/api/admin/sheets/init
```

Questo creerà automaticamente la riga degli header.

---

## 📊 Checklist Completa

Prima di considerare il testing completo, verifica:

- [ ] Test 1: Flusso completo Chat → ✅
- [ ] Test 2: Flusso breve Telefono → ✅
- [ ] Test 3: Resume sessione incompleta → ✅
- [ ] Test 4: Blocco sessione completata → ✅
- [ ] Test 5: Validazione Sesso → ✅
- [ ] Test 6: Validazione Provincia → ✅
- [ ] Test 7: Validazione Data → ✅
- [ ] Test 8: Validazione Email → ✅
- [ ] Test 9: Salvataggio progressivo Google Sheets → ✅
- [ ] Test 10: Upsert senza duplicati → ✅
- [ ] Test 11: API Admin funzionanti → ✅

---

## 🎉 Test Superati!

Se tutti i test sono passati, il sistema è pronto per il deploy! 🚀

**Prossimi passi**:
1. Deploy su ambiente di staging
2. Test con utenti reali
3. Monitoraggio log e metriche
4. Deploy su produzione

---

**Fine Guida al Testing**

