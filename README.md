# Questionario Digitale PFAS Miteni

## Panoramica

Sistema di acquisizione dati strutturati mediante interfaccia conversazionale assistita da intelligenza artificiale, progettato per la raccolta di informazioni anagrafiche e questionari standardizzati relativi al caso PFAS Miteni.

## Architettura

### Paradigma Conversazionale

Il sistema adotta un approccio question-driven per la raccolta dati, sostituendo form statici con un'interfaccia dialogica che migliora l'engagement dell'utente e riduce l'abbandono della compilazione.

### Stack Tecnologico

**Runtime**: Node.js 18+ con Next.js 15 (App Router)  
**Language**: TypeScript 5.x con strict mode  
**AI Layer**: OpenAI GPT-4o-mini per comprensione linguaggio naturale  
**Storage**: File system locale (sviluppo) / Redis/KV (produzione)  
**Data Export**: Google Sheets API v4 con Service Account authentication  
**Deployment**: Vercel Edge Network (serverless)

## Scelte Progettuali

### 1. Architettura a Macchina a Stati

Il flusso conversazionale è modellato come FSM (Finite State Machine) in `lib/flow.ts`. Ogni stato rappresenta un punto di acquisizione dati con transizioni deterministiche basate su logica di validazione.

**Motivazione**: Garantisce coerenza del flusso, tracciabilità dello stato utente e resilienza a interruzioni (session resume).

### 2. AI-Assisted Input Processing

L'integrazione OpenAI non sostituisce la validazione strutturale ma funge da layer semantico per:
- Disambiguazione intent utente (risposta vs. domanda fuori contesto)
- Normalizzazione linguaggio naturale in formato strutturato
- Gestione conversazionale di input ambigui o incompleti

**Motivazione**: Riduce friction cognitivo per l'utente mantenendo qualità dati attraverso validazione programmatica a valle.

### 3. Dual-Layer Validation

Ogni input attraversa due fasi di validazione:

1. **AI Interpretation** (`lib/aiConversation.ts`): Estrae intent e normalizza semantica
2. **Programmatic Validation** (`lib/validation/inputValidation.ts`): Verifica formato, range, coerenza

**Motivazione**: Combina flessibilità del linguaggio naturale con garanzie di integrità dati.

### 4. Context Guardrails

Sistema di rilevamento off-topic (`lib/guardrails/contextGuardrail.ts`) basato su keyword matching e confidence scoring per limitare il dominio conversazionale allo scope PFAS/Miteni.

**Motivazione**: Previene deriva conversazionale e garantisce focus sul task di data collection.

### 5. Session Persistence Strategy

**Locale**: File system JSON con auto-backup  
**Produzione (Vercel)**: In-memory con fallback graceful  
**Resume Logic**: Identificazione utente via email con merge intelligente di sessioni parziali

**Motivazione**: 
- File system locale per debugging e audit trail
- In-memory su serverless per performance e compliance con vincoli piattaforma
- Email-based resume per UX continuity senza richiedere autenticazione

### 6. Asynchronous Data Export

Google Sheets sync tramite `upsertSheetRow` con pattern fire-and-forget e retry logic.

**Motivazione**: Disaccoppia latenza I/O remoto dal response time percepito dall'utente. Il fallback garantisce che errori di export non bloccano progressione utente.

### 7. Rate Limiting & Circuit Breaker

**Rate Limiting**: IP-based con sliding window  
**Circuit Breaker**: Protezione chiamate OpenAI con exponential backoff

**Motivazione**: Protezione da abusi, contenimento costi API, graceful degradation sotto carico.

### 8. Serverless-First Design

Tutti i moduli critici (logger, storage, schedulers) implementano rilevamento ambiente Vercel con fallback appropriati.

**Motivazione**: Portabilità deployment locale ↔ serverless senza modifiche codice. Rispetta vincoli read-only filesystem di Lambda-like environments.

## Flusso Dati

```
User Input → Frontend (React)
           ↓
    POST /api/message
           ↓
    Session Retrieval/Creation
           ↓
    Context Guardrail Check
           ↓
    AI Semantic Interpretation
           ↓
    Programmatic Validation
           ↓
    State Transition (FSM)
           ↓
    Google Sheets Upsert (async)
           ↓
    Response + Next Question
```

## Struttura Dati

### Conversation Context

```typescript
{
  sessionId: string,
  currentState: StateId,
  data: {
    [key: string]: {
      raw: string,
      normalized: string
    }
  },
  history: Array<{
    from: "user" | "bot",
    text: string
  }>,
  metadata: {
    createdAt: ISO8601,
    lastModified: ISO8601,
    completed: boolean
  }
}
```

### Google Sheets Schema

Mappatura 1:1 tra `context.data` keys e colonne foglio. Operazione upsert basata su email come chiave primaria.

## Performance

**Target Response Time**: < 2s (P95)  
**Strategie di Ottimizzazione**:
- Modello AI lightweight (gpt-4o-mini vs. gpt-4)
- Context window ridotto (ultimi 4 turni vs. full history)
- Parallel processing non-blocking per Google Sheets
- Edge caching risorse statiche

## Sicurezza & Privacy

- API keys gestite via environment variables (mai committate)
- Rate limiting per prevenire scraping
- Sanitizzazione input pre-storage
- CORS policy restrictive
- Google Service Account con least-privilege permissions

## Limitazioni Architetturali

**Vercel Serverless**: 
- No persistent file system → sessioni in-memory (ephemeral)
- Cold start latency su low-traffic routes
- Timeout esecuzione funzione (10s default, 60s max)

**Soluzione Consigliata per Produzione**: Migrazione a Redis/Vercel KV per session storage persistente.

## Configurazione

Vedere `env.example` per variabili d'ambiente richieste.

**Setup Google Sheets**:
1. Creare Service Account su Google Cloud Console
2. Abilitare Google Sheets API
3. Condividere foglio target con email Service Account
4. Inizializzare headers: `POST /api/health` (verifica), `sheets/init` se necessario

## Deployment

**Locale**: `npm run dev`  
**Produzione**: Push su GitHub → Auto-deploy Vercel

Configurare environment variables nel dashboard Vercel prima del primo deploy.

## Monitoring

**Logs**: Console output (locale) / Vercel Function Logs (produzione)  
**Health Check**: `GET /api/health` → status + metrics

## Manutenzione

**Backup Sessioni**: Automatico ogni 6h (solo locale)  
**Cleanup**: Sessioni >30gg rimosse automaticamente (solo locale)  
**Audit**: Logs strutturati con timestamp, sessionId, metadata per troubleshooting

---

**Versione**: 3.1.0  
**Ultimo Aggiornamento**: 2025-10-29
