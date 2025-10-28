# 🚀 Quick Start - Miteni Chatbot v2.0

## ⚡ Avvio Rapido

### 1. Configura API Key
```bash
# Crea file .env.local
echo "OPENAI_API_KEY=your_key_here" > .env.local
```

### 2. Installa e Avvia
```bash
npm install
npm run dev
```

### 3. Apri Browser
```
http://localhost:3000
```

---

## 📊 Monitoring

### Controlla Stato Sistema
```bash
curl http://localhost:3000/api/health | jq
```

### Visualizza Log Real-time
```bash
tail -f data/logs/app-$(date +%Y-%m-%d).log
```

---

## 🛠️ Operazioni Admin

### Backup Manuale
```bash
curl -X POST http://localhost:3000/api/admin/backup
```

### Export CSV
```bash
curl -X POST http://localhost:3000/api/admin/export
```

### Cleanup Sessioni Vecchie
```bash
curl -X POST http://localhost:3000/api/admin/cleanup \
  -H "Content-Type: application/json" \
  -d '{"daysOld": 30}'
```

### Google Sheets (se configurato)
```bash
# Test connessione
curl http://localhost:3000/api/admin/sheets/test

# Inizializza foglio
curl -X POST http://localhost:3000/api/admin/sheets/init

# Sync tutte le sessioni
curl -X POST http://localhost:3000/api/admin/sheets/sync
```

---

## 📂 Dove Sono i Dati?

```
data/
├── sessions/    → Sessioni utenti (JSON)
├── backups/     → Backup automatici
└── logs/        → Log applicazione
```

---

## ✨ Cosa È Stato Migliorato?

### v2.0 - Core Improvements
✅ **Persistenza** → Sessioni salvate su file (non si perdono più!)  
✅ **Validazione** → Email, telefono, nomi validati automaticamente  
✅ **Retry AI** → Se OpenAI fallisce, riprova automaticamente  
✅ **Logging** → Log strutturati su console e file  
✅ **Backup** → Automatici ogni 24h  
✅ **Cleanup** → Sessioni vecchie eliminate ogni 7 giorni  
✅ **Health Check** → Endpoint `/api/health` per monitoring  
✅ **Type Safety** → TypeScript strict mode compliant

### v2.1 - UX & Security
✅ **Loading States** → Typing indicator animato  
✅ **Auto-Scroll** → Chat scrolla automaticamente  
✅ **Input Validation** → Frontend + Backend  
✅ **Rate Limiting** → 60 req/min per IP  
✅ **Keyboard Shortcuts** → Enter per inviare

### v2.2 - Context Protection
✅ **Guardrails** → Blocca domande off-topic (es. "carbonara")  
✅ **Focalizzazione** → Bot rimane SOLO su PFAS/Miteni  
✅ **Prompt Migliorato** → AI più restrittiva e precisa  
✅ **Smart Blocking** → 2 livelli (keyword + AI)

### v2.3 - Google Sheets Integration
✅ **Auto-Save** → Ogni risposta salvata su Google Sheets in tempo reale  
✅ **Cloud Backup** → Dati sicuri e accessibili ovunque  
✅ **Update Intelligente** → Nessun duplicato, sempre aggiornato  
✅ **Bulk Export** → Sync di tutte le sessioni con 1 comando  
✅ **Admin API** → Test, init, sync via endpoints  

---

## 🔧 Troubleshooting

### AI non risponde?
1. Verifica `OPENAI_API_KEY` in `.env.local`
2. Controlla circuit breaker: `curl localhost:3000/api/health`

### Sessioni non si salvano?
1. Controlla directory `data/` esista
2. Verifica permessi scrittura

### Backup non funzionano?
1. Guarda log: `tail data/logs/app-*.log`
2. Riavvia server

---

## 📚 Documentazione Completa

Vedi `README_IMPROVEMENTS.md` per documentazione dettagliata.

---

**Pronto? Let's go! 🚀**

