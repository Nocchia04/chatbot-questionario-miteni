# 📋 CHANGELOG v3.0 - Ristrutturazione Completa Questionario

**Data**: 28 Ottobre 2025  
**Versione**: 3.0.0  
**Tipo**: Major Update - Ristrutturazione Completa

---

## 🎯 Panoramica

Ristrutturazione completa del chatbot secondo le specifiche del questionario PFAS Miteni:
- ✅ **Nuovi campi anagrafici** (Sesso, Luogo di Nascita, Provincia, Data di Nascita)
- ✅ **Domande R1-R17** aggiornate con i testi ufficiali
- ✅ **Resume automatico della sessione** tramite email
- ✅ **Integrazione Google Sheets** con nuova struttura colonne
- ✅ **Gestione modalità** (Chat o Telefono)

---

## 📝 Modifiche Principali

### 1. **Flusso del Questionario** (`lib/flow.ts`)

#### **Nuovi Stati Anagrafici**
Aggiunti 4 nuovi stati per completare i dati anagrafici:
- `SESSO` - Raccolta del sesso (M/F)
- `LUOGO_NASCITA` - Città di nascita
- `PROVINCIA_NASCITA` - Provincia di nascita (sigla)
- `DATA_NASCITA` - Data di nascita (gg/mm/aaaa)

#### **Ordine di Raccolta Dati**
```
NOME → COGNOME → SESSO → LUOGO_NASCITA → PROVINCIA_NASCITA → 
TELEFONO → EMAIL → DATA_NASCITA → MODALITA → R1...R17 → FINE
```

#### **Domande R1-R17 Aggiornate**
Tutte le domande sono state aggiornate con i testi ufficiali forniti:

| ID | Domanda |
|----|---------|
| R1 | Cosa sa dell'inquinamento da PFAS e dei relativi responsabili? |
| R2 | Da quanto tempo lo sa e da quale fonte l'ha scoperto? |
| R3 | Per cosa usate l'acqua del rubinetto? |
| R4 | Se non la usate più, cosa usate al posto dell'acqua del rubinetto? |
| R5 | Cosa vi ha consigliato il Comune o enti simili? Avete copia degli avvisi? |
| R6 | I PFAS possono causare danni alla salute, lo sapeva? |
| R7 | Avete mai eseguito i controlli per vedere i valori dei PFAS nel sangue? |
| R8 | Quali sono i valori? Ha il referto di queste analisi/visite? |
| R9 | Ha fatto ulteriori visite specifiche legate a questo problema? |
| R10 | Se lei vive nella zona rossa, da quanto tempo ci vive? |
| R11 | La casa è di proprietà o in affitto? |
| R12 | Ha provato a venderla/affittarla da quando ha saputo dell'inquinamento? |
| R13 | Com'è composto il suo nucleo familiare? |
| R14 | Lei o qualcuno della sua famiglia vi siete ammalati negli ultimi anni? |
| R15 | Qualcuno della sua famiglia è venuto a mancare per malattie collegate ai PFAS? |
| R16 | Ha un orto? Se sì, lo usa ancora come prima? |
| R17 | Ha smesso o ridotto certe attività all'aperto per paura dell'inquinamento? |

---

### 2. **Validazioni** (`lib/validation/inputValidation.ts`)

#### **Nuove Funzioni di Validazione**

**`validateSesso(input: string)`**
- Accetta: `M`, `F`, `MASCHIO`, `FEMMINA`, `UOMO`, `DONNA`
- Normalizza sempre a `M` o `F`
- Case-insensitive

**`validateProvincia(input: string)`**
- Formato: 2 lettere (es. `VI`, `PD`, `VE`)
- Convertita in maiuscolo automaticamente
- Validazione pattern regex

**`validateDataNascita(input: string)`**
- Formato richiesto: `gg/mm/aaaa` (es. `15/03/1985`)
- Validazioni:
  - Range mese: 1-12
  - Range giorno: 1-31
  - Anno: 1900 - anno corrente
  - Età minima: 18 anni
  - Età massima: 120 anni
- Normalizza con zero padding (es. `5/3/1985` → `05/03/1985`)

---

### 3. **Resume Sessione** (`lib/conversationController.ts`, `lib/sessionStore.ts`, `lib/storage/fileStorage.ts`)

#### **Funzionalità Implementata**
Quando l'utente fornisce l'email, il sistema:
1. Cerca se esiste già una sessione con quella email
2. Se trovata:
   - **Completata** (`currentState === "FINE"`) → Informa l'utente che ha già completato
   - **Incompleta** → **RESUME automatico** dalla domanda successiva
3. Se non trovata → Continua normalmente

#### **Nuove Funzioni**

**`findSessionByEmail(email: string)` in `fileStorage.ts`**
- Cerca tra tutte le sessioni salvate
- Match case-insensitive sull'email normalizzata
- Ritorna `ConversationContext | null`

**`findExistingSessionByEmail(email: string)` in `sessionStore.ts`**
- Wrapper con logging e gestione cache
- Utilizzata dal `conversationController`

#### **Esperienza Utente**
```
👤 Utente: andrea@email.com
🤖 Bot: Bentornato/a! 👋 Vedo che avevi già iniziato a compilare 
       il questionario. Riprenderemo da dove avevi interrotto.
       
       [Continua con la domanda successiva...]
```

---

### 4. **Google Sheets** (`lib/integrations/googleSheets.ts`)

#### **Nuova Struttura Colonne**
Le colonne sono state completamente ristrutturate secondo le specifiche:

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
J: R1
K: R2
...
Z: R17
```

**Colonne rimosse**:
- ❌ Timestamp
- ❌ Session ID
- ❌ Stato
- ❌ Completato
- ❌ Ultima Modifica

#### **Logica di Upsert**
- **Identificazione riga**: Cerca per EMAIL (colonna G)
- **Prima del salvataggio**: Verifica che l'email sia stata fornita
- **Insert**: Nuova riga dalla riga 2 (dopo header)
- **Update**: Aggiorna riga esistente se email trovata

#### **Funzioni Modificate**
- `contextToRow()` → Nuova mappatura dati
- `findRowByEmail()` → Rimpiazza `findRowBySessionId()`
- `upsertSheetRow()` → Controllo email prima del salvataggio
- `initializeSheet()` → Verifica header esistenti prima di crearli

---

### 5. **Gestione Modalità** (`lib/flow.ts`)

#### **Domanda MODALITA**
```
"Preferisci compilare il questionario qui in chat o preferisci 
che ti chiamiamo al telefono per completarlo insieme?"
```

#### **Logica di Branch**
```typescript
next: (ctx, answer) => {
  const lowered = answer.toLowerCase();
  if (lowered.includes("telefono") || 
      lowered.includes("chiamata") || 
      lowered.includes("chiamare")) {
    return "FINE"; // ❌ Chiude la chat
  }
  return "R1"; // ✅ Continua con domande
}
```

#### **Comportamento**
- **Scelta "Telefono"**:
  - Stato → `FINE`
  - Google Sheets → Salva dati anagrafici + modalità "telefono"
  - Colonne R1-R17 → Vuote
  
- **Scelta "Chat"**:
  - Procede con le domande R1-R17
  - Google Sheets → Aggiornato man mano con le risposte

---

## 🔧 Aggiornamenti Tecnici

### **TypeScript**
- ✅ Tutti i tipi aggiornati per i nuovi stati
- ✅ Build completato senza errori
- ✅ Strict type checking mantenuto

### **Logging**
- ✅ Log strutturato per tutte le operazioni
- ✅ Tracciamento resume sessioni
- ✅ Debug info per validazioni

### **Performance**
- ✅ Ricerca sessioni per email ottimizzata
- ✅ Cache in-memory mantenuta
- ✅ Salvataggio asincrono su Google Sheets

---

## 📊 Struttura Dati

### **ConversationContext**
```typescript
{
  sessionId: string,
  currentState: StateId,
  data: {
    nome: { original: string, normalized: string },
    cognome: { original: string, normalized: string },
    sesso: { original: string, normalized: "M" | "F" },
    luogoNascita: { original: string, normalized: string },
    provinciaNascita: { original: string, normalized: string },
    telefono: { original: string, normalized: string },
    email: { original: string, normalized: string },
    dataNascita: { original: string, normalized: "gg/mm/aaaa" },
    modalita: { original: string, normalized: string },
    R1: { original: string, normalized: string },
    ...
    R17: { original: string, normalized: string }
  },
  history: Message[],
  flowVersion: string
}
```

---

## 🧪 Testing

### **Scenari da Testare**

#### 1. **Flusso Completo - Chat**
```
NOME → COGNOME → SESSO → LUOGO → PROVINCIA → TELEFONO → 
EMAIL → DATA → MODALITA (Chat) → R1...R17 → FINE
```
**Risultato atteso**: Google Sheets con tutte le colonne compilate

#### 2. **Flusso Breve - Telefono**
```
NOME → COGNOME → SESSO → LUOGO → PROVINCIA → TELEFONO → 
EMAIL → DATA → MODALITA (Telefono) → FINE
```
**Risultato atteso**: Google Sheets con dati anagrafici, R1-R17 vuote

#### 3. **Resume - Sessione Incompleta**
```
Sessione 1: NOME → COGNOME → [abbandona]
Sessione 2: NOME → COGNOME → EMAIL (stessa) → [RESUME]
```
**Risultato atteso**: Carica dati precedenti, riprende da EMAIL

#### 4. **Resume - Sessione Completata**
```
Sessione 1: [completa tutto] → FINE
Sessione 2: NOME → COGNOME → EMAIL (stessa) → [BLOCCO]
```
**Risultato atteso**: "Hai già completato il questionario"

#### 5. **Validazioni**
- Sesso: `maschio` → `M` ✅
- Provincia: `vi` → `VI` ✅
- Data: `5/3/1985` → `05/03/1985` ✅
- Email duplicata → Resume ✅

---

## 📖 Documentazione Aggiornata

- ✅ `CHANGELOG_v3.0_RESTRUCTURE.md` (questo file)
- ✅ `env.example` - Già aggiornato per Google Sheets
- ✅ `GOOGLE_SHEETS_SETUP.md` - Già presente
- ✅ `QUICK_START.md` - Già aggiornato

---

## 🚀 Deploy

### **Checklist Pre-Deploy**
- [ ] Verificare `.env.local` con tutte le variabili
- [ ] Testare il flusso completo in locale
- [ ] Verificare Google Sheets connessione
- [ ] Verificare che gli header del foglio siano corretti
- [ ] Testare resume con email esistente
- [ ] Verificare validazioni (sesso, data, provincia)

### **Variabili Ambiente Richieste**
```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=1ojzYokodglYKQSDxTJrPOhIMVwPhCVIdTw1mOqmN3xQ
GOOGLE_SHEETS_SHEET_NAME=Foglio1
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account",...}
```

---

## 📞 Supporto

Per domande o problemi relativi a questa versione:
1. Verificare i log in `data/logs/`
2. Controllare le sessioni in `data/sessions/`
3. Verificare Google Sheets manualmente
4. Consultare `GOOGLE_SHEETS_SETUP.md` per configurazione

---

## 🎉 Ringraziamenti

Versione sviluppata secondo le specifiche fornite per il questionario PFAS Miteni.

**Compatibilità**: Node.js 18+, Next.js 16, TypeScript 5+

---

**Fine Changelog v3.0**

