# Guida Deploy su Vercel

## ⚠️ Limitazioni di Vercel

Vercel è una piattaforma **serverless** con alcune limitazioni:

### ❌ NON Supportato
- **File system write**: Non è possibile salvare sessioni su disco
- **Scheduler persistenti**: Non è possibile eseguire backup automatici
- **Sessioni permanenti**: Le sessioni vengono perse al riavvio delle funzioni serverless

### ✅ Supportato
- **Sessioni in memoria (RAM)**: Le sessioni rimangono attive durante la durata della funzione
- **Google Sheets**: Funziona perfettamente come storage permanente
- **Tutte le API**: Le route API funzionano normalmente

---

## 🔧 Modifiche Implementate per Vercel

Il codice è stato aggiornato per rilevare automaticamente quando è in esecuzione su Vercel:

### 1. **Disabilitazione Scheduler** (`lib/init.ts`)
```typescript
const isVercel = process.env.VERCEL === '1';

if (isVercel) {
  logger.info("🌐 Ambiente Vercel rilevato - scheduler disabilitati");
  logger.info("💡 Le sessioni verranno mantenute solo in memoria (RAM)");
}
```

### 2. **Skip File System Write** (`lib/storage/fileStorage.ts`)
```typescript
export async function saveSessionToFile(ctx: ConversationContext) {
  // Skip su Vercel - le sessioni rimangono solo in memoria (RAM)
  if (isVercel) {
    return;
  }
  // ... salvataggio normale
}
```

---

## 📦 Setup per Deploy su Vercel

### 1. Variabili d'Ambiente

Nel dashboard di Vercel, aggiungi queste variabili d'ambiente:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=1ojzYokodglYKQSDxTJrPOhIMVwPhCVIdTw1mOqmN3xQ
GOOGLE_SHEETS_SHEET_NAME=Foglio1  # o "Questionari PFAS"
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account",...}  # JSON completo
```

**IMPORTANTE**: Il JSON delle credenziali Google deve essere su una singola riga (senza a capo).

### 2. Deploy da Git

#### Opzione A: Deploy automatico
1. Vai su [vercel.com](https://vercel.com)
2. Clicca "New Project"
3. Importa il repository GitHub/GitLab
4. Vercel rileverà automaticamente Next.js
5. Aggiungi le variabili d'ambiente
6. Clicca "Deploy"

#### Opzione B: Deploy da CLI
```bash
# Installa Vercel CLI
npm i -g vercel

# Deploy (prima volta)
cd /Users/nocchia/Desktop/AITALIA/mitenichat
vercel

# Deploy successivi (produzione)
vercel --prod
```

---

## ⚙️ Build Settings su Vercel

Vercel dovrebbe rilevare automaticamente:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

Se non funziona, verifica che `next.config.ts` non abbia configurazioni incompatibili.

---

## 🔍 Come Funzionano le Sessioni su Vercel

### In Locale (Development)
- ✅ Sessioni salvate su disco in `/data/sessions/`
- ✅ Ripristino sessioni dopo riavvio
- ✅ Backup automatici
- ✅ Scheduler attivi

### Su Vercel (Production)
- ⚠️ Sessioni mantenute solo in **memoria (RAM)**
- ⚠️ Sessioni perse al "cold start" della funzione serverless
- ✅ Google Sheets come storage permanente
- ✅ Client-side localStorage per ripristino sessione

### Flusso su Vercel
1. **Utente apre chat** → Nuova sessione creata in RAM
2. **Utente risponde** → Sessione aggiornata in RAM + Google Sheets
3. **Funzione termina** → Sessione RAM persa
4. **Utente riapre chat** → localStorage recupera sessionId
5. **Backend cerca sessione** → Non trovata in RAM
6. **Frontend mostra history** → Caricata da localStorage

**Risultato**: L'utente vede lo storico grazie a localStorage, ma il backend non ha la sessione in RAM.

---

## ⚠️ Problema: Sessioni Non Persistenti su Vercel

### Sintomo
- L'utente riapre la chat e vede i messaggi vecchi (da localStorage)
- Ma quando invia un nuovo messaggio, il bot ricomincia da capo

### Causa
- Le funzioni serverless di Vercel **non condividono RAM** tra esecuzioni
- Il `sessionStore` in-memory viene resettato ad ogni cold start

### Soluzione: Usare Storage Esterno

Per avere sessioni persistenti su Vercel, devi usare uno storage esterno:

#### Opzione 1: **Vercel KV (Redis)** (Consigliata)
```bash
# Installa
npm install @vercel/kv

# In .env
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

#### Opzione 2: **Database (PostgreSQL/MongoDB)**
- Supabase (PostgreSQL gratuito)
- MongoDB Atlas (gratuito)
- PlanetScale (MySQL)

#### Opzione 3: **Accettare il Limite**
- Usare solo localStorage per ripristino lato client
- Salvare tutto su Google Sheets ad ogni risposta
- Ricostruire la sessione da Google Sheets quando necessario

---

## 🧪 Test Post-Deploy

### 1. Verifica Variabili d'Ambiente
```bash
curl https://tuo-dominio.vercel.app/api/health
```

Dovresti vedere:
```json
{
  "status": "healthy",
  "uptime": "...",
  "environment": "production"
}
```

### 2. Test Chat
1. Apri `https://tuo-dominio.vercel.app`
2. Compila alcune domande
3. Chiudi il browser
4. Riapri → Dovresti vedere i messaggi precedenti (localStorage)

### 3. Verifica Google Sheets
- Apri il foglio Google
- Verifica che i dati vengano salvati correttamente

---

## 🐛 Troubleshooting

### Errore 405 Method Not Allowed
**Causa**: Funzioni serverless non si inizializzano correttamente

**Soluzione**:
1. Verifica che tutte le variabili d'ambiente siano configurate
2. Controlla i log su Vercel: Dashboard → Function → Logs
3. Verifica che `lib/init.ts` non faccia crash

### Errore 500 Internal Server Error
**Causa**: Credenziali Google Sheets non valide o mancanti

**Soluzione**:
1. Verifica `GOOGLE_SHEETS_CREDENTIALS` sia JSON valido su **una sola riga**
2. Verifica che il Service Account abbia accesso al foglio

### Chat riaperta ricomincia da capo
**Causa**: Sessioni non persistenti (normale su Vercel serverless)

**Soluzione**:
- Implementa Vercel KV (Redis) per persistenza
- Oppure ricostruisci sessione da Google Sheets

### OpenAI API non funziona
**Causa**: `OPENAI_API_KEY` non configurata

**Soluzione**:
- Vai su Vercel Dashboard → Settings → Environment Variables
- Aggiungi `OPENAI_API_KEY`
- Rideploy: `vercel --prod`

---

## 🚀 Deploy Completato!

Dopo il deploy, la tua app sarà disponibile su:
```
https://tuo-progetto.vercel.app
```

### Prossimi Passi:
1. ✅ Configura un dominio personalizzato (opzionale)
2. ✅ Monitora i log per errori
3. ✅ Testa il flusso completo
4. ✅ Verifica Google Sheets riceva i dati

### Limitazioni da Ricordare:
- ⚠️ Sessioni non persistenti (RAM-only)
- ⚠️ Nessun backup automatico
- ✅ Google Sheets funziona perfettamente
- ✅ localStorage mantiene history lato client

---

## 📊 Metriche Vercel

Monitora:
- **Function Invocations**: Quante volte le API vengono chiamate
- **Function Duration**: Tempo medio di esecuzione
- **Bandwidth**: Traffico dati
- **Edge Network**: Performance globale

Dashboard Vercel → Analytics

---

**Buon deploy! 🎉**

Per domande o problemi, consulta:
- [Documentazione Vercel](https://vercel.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Vercel KV (Redis)](https://vercel.com/docs/storage/vercel-kv)

