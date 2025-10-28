# 🚀 Miteni PFAS Chatbot - Miglioramenti Enterprise

## 📋 Panoramica

Chatbot avanzato per la raccolta dati legali sui casi PFAS Miteni, con architettura enterprise-grade implementata secondo le best practices di produzione.

---

## ✨ Nuove Funzionalità Implementate

### 1. **Persistenza su File System** 💾
- ✅ Sessioni salvate automaticamente su disco in formato JSON
- ✅ Cache in memoria per performance ottimali
- ✅ Recovery automatico dopo crash/restart
- ✅ Directory organizzate: `data/sessions/`, `data/backups/`, `data/logs/`

**Percorso:** `lib/storage/fileStorage.ts`

```typescript
// Le sessioni sono salvate automaticamente su file
// Puoi accedervi in: data/sessions/{sessionId}.json
```

### 2. **Validazione Input Robusta** ✅
- ✅ Validazione nome/cognome (lettere, spazi, apostrofi)
- ✅ Validazione email con regex
- ✅ Validazione telefono italiano (con/senza +39)
- ✅ Normalizzazione automatica dei dati
- ✅ Feedback immediato all'utente in caso di errore

**Percorso:** `lib/validation/inputValidation.ts`

**Esempi:**
```typescript
// Email: trasformata in lowercase, validata
// Telefono: +39 aggiunto automaticamente
// Nome: Prima Lettera Maiuscola automaticamente
```

### 3. **Retry Logic & Error Handling** 🔄
- ✅ Exponential backoff per chiamate AI fallite
- ✅ Circuit breaker pattern per protezione da fallimenti ripetuti
- ✅ Fallback intelligenti in caso di errori persistenti
- ✅ Max 3 retry con delay crescente (1s, 2s, 4s)

**Percorso:** `lib/utils/aiRetry.ts`

**Stati Circuit Breaker:**
- `CLOSED` → normale funzionamento
- `OPEN` → servizio temporaneamente disabilitato dopo troppi errori
- `HALF_OPEN` → tentativo di recovery

### 4. **Session Management Avanzato** 🗂️
- ✅ Cleanup automatico sessioni vecchie (> 30 giorni)
- ✅ Statistiche dettagliate sessioni
- ✅ Export CSV con tutti i dati
- ✅ Backup completi schedulati

**Percorso:** `lib/storage/fileStorage.ts`, `lib/scheduler/autoBackup.ts`

### 5. **Logging Strutturato** 📝
- ✅ Log su console con emoji e colori
- ✅ Log persistenti su file (rotazione giornaliera)
- ✅ Livelli: INFO, WARN, ERROR, DEBUG
- ✅ Metadata strutturati per ogni evento

**Percorso:** `lib/utils/logger.ts`

**File log:** `data/logs/app-YYYY-MM-DD.log`

### 6. **Export & Backup Automatico** 💼
- ✅ Backup automatico ogni 24 ore
- ✅ Cleanup automatico ogni 7 giorni
- ✅ Export CSV manuale via API
- ✅ Backup JSON completi con timestamp

**Percorso:** `lib/scheduler/autoBackup.ts`

### 7. **Health Check & Monitoring** 🏥
- ✅ Endpoint `/api/health` per stato sistema
- ✅ Statistiche sessioni in tempo reale
- ✅ Monitoraggio Circuit Breaker
- ✅ Metriche memoria e uptime

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-28T...",
  "sessions": {
    "total": 42,
    "completed": 15,
    "inProgress": 27,
    "byState": { "NOME": 5, "R1": 12, ... }
  },
  "aiService": {
    "circuitBreaker": "CLOSED",
    "failures": 0
  },
  "uptime": 123456,
  "memory": { "used": 145, "total": 512 }
}
```

### 8. **Type Safety Migliorato** 🔒
- ✅ ValidationResult type per validazioni
- ✅ RetryOptions type per configurazione retry
- ✅ LogEntry type per logging strutturato
- ✅ Strong typing su tutti i nuovi moduli

---

## 🛠️ API Admin

### Backup Manuale
```bash
POST /api/admin/backup
```

### Export CSV
```bash
POST /api/admin/export
```

### Cleanup Sessioni Vecchie
```bash
POST /api/admin/cleanup
Content-Type: application/json

{
  "daysOld": 30
}
```

---

## 📂 Struttura Dati

```
data/
├── sessions/          # Sessioni attive (JSON)
│   ├── abc123.json
│   └── def456.json
├── backups/           # Backup e export
│   ├── backup-2025-10-28T12-00-00.json
│   └── export-2025-10-28T12-00-00.csv
└── logs/              # Log applicazione
    ├── app-2025-10-28.log
    └── app-2025-10-27.log
```

### Formato Sessione
```json
{
  "sessionId": "abc123",
  "currentState": "R5",
  "flowVersion": "v1.0",
  "data": {
    "nome": {
      "original": "mario",
      "normalized": "Mario"
    },
    "email": {
      "original": "MARIO@TEST.IT",
      "normalized": "mario@test.it"
    }
  },
  "history": [
    { "from": "bot", "text": "Ciao..." },
    { "from": "user", "text": "Mario" }
  ],
  "lastUpdated": "2025-10-28T12:34:56.789Z"
}
```

---

## 🚦 Scheduler Automatici

### Backup Automatico
- **Frequenza:** Ogni 24 ore
- **Primo run:** 1 ora dopo avvio server
- **Output:** `data/backups/backup-{timestamp}.json`

### Cleanup Automatico
- **Frequenza:** Ogni 7 giorni
- **Primo run:** 24 ore dopo avvio server
- **Criterio:** Sessioni > 30 giorni

---

## 🔧 Configurazione

### Variabili d'Ambiente
```bash
OPENAI_API_KEY=your_api_key_here
```

### File `.env.local`
```bash
OPENAI_API_KEY=sk-...
```

---

## 📊 Monitoraggio

### Check Health
```bash
curl http://localhost:3000/api/health
```

### Visualizza Log
```bash
tail -f data/logs/app-$(date +%Y-%m-%d).log
```

### Statistiche Sessioni
```bash
curl http://localhost:3000/api/health | jq '.sessions'
```

---

## 🧪 Testing

### Test Validazione
```typescript
import { validateEmail } from '@/lib/validation/inputValidation';

const result = validateEmail('TEST@EXAMPLE.COM');
// result.isValid = true
// result.normalized = 'test@example.com'
```

### Test Retry
```typescript
import { withRetry } from '@/lib/utils/aiRetry';

const result = await withRetry(
  async () => riskyOperation(),
  { maxRetries: 3 }
);
```

---

## 📈 Performance

### Ottimizzazioni Implementate
1. **Cache in memoria** per sessioni frequenti
2. **Async I/O** per scrittura file non bloccante
3. **Lazy initialization** degli scheduler
4. **Circuit breaker** per evitare cascading failures
5. **Log rotation** automatica per gestione disco

### Metriche Attese
- **Latenza media:** < 500ms (con cache hit)
- **Throughput:** > 100 req/s
- **Uptime:** 99.9%
- **Memory:** < 512MB con 1000+ sessioni

---

## 🔐 Sicurezza

### Implementato
- ✅ Input validation per prevenire injection
- ✅ Sanitizzazione automatica dati utente
- ✅ Separazione dati sensibili in file system
- ✅ Log strutturati senza dati personali sensibili

### Da Implementare (Future)
- 🔲 Encryption at rest per sessioni
- 🔲 Rate limiting per API
- 🔲 Authentication per endpoint admin
- 🔲 GDPR compliance tools (data deletion)

---

## 🚀 Deploy

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker (Future)
```dockerfile
# TODO: Dockerfile da creare
```

---

## 📚 Documentazione Codice

### Moduli Principali

| Modulo | Responsabilità |
|--------|----------------|
| `conversationController.ts` | Orchestrazione flusso conversazione |
| `aiConversation.ts` | Interpretazione intent con AI + retry |
| `aiNextQuestion.ts` | Personalizzazione domande + retry |
| `fileStorage.ts` | Persistenza sessioni e backup |
| `inputValidation.ts` | Validazione e normalizzazione input |
| `aiRetry.ts` | Retry logic e circuit breaker |
| `logger.ts` | Logging strutturato |
| `autoBackup.ts` | Scheduler automatici |

---

## 🐛 Troubleshooting

### Problema: Sessioni non vengono salvate
**Soluzione:** Verifica permessi directory `data/` e spazio disco

### Problema: AI calls falliscono sempre
**Soluzione:** 
1. Controlla `OPENAI_API_KEY` in `.env.local`
2. Verifica stato circuit breaker con `GET /api/health`
3. Reset circuit breaker riavviando server

### Problema: Backup non vengono creati
**Soluzione:** Controlla log in `data/logs/` per errori scheduler

---

## 📞 Support

Per domande o problemi:
1. Controlla i log: `data/logs/app-*.log`
2. Verifica health: `GET /api/health`
3. Consulta questa documentazione

---

## 🎯 Prossimi Passi (Roadmap)

### High Priority
- [ ] Integrazione Google Sheets
- [ ] Dashboard admin web
- [ ] Analytics avanzate

### Medium Priority
- [ ] Email notifications
- [ ] Multi-language support
- [ ] PDF export questionari

### Low Priority
- [ ] Mobile app
- [ ] Voice interface
- [ ] AI model fine-tuning

---

## 📄 License

Proprietario - Aitalia

---

**Versione:** 2.0.0 Enterprise  
**Data:** 28 Ottobre 2025  
**Autore:** AI Engineer Team

