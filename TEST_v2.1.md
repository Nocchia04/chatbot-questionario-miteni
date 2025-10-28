# 🧪 Test Rapido v2.1

## ⚡ Test in 2 Minuti

### 1. Configura API Key
```bash
cd /Users/nocchia/Desktop/AITALIA/mitenichat
cp env.example .env.local
# Modifica .env.local con la tua API key
```

### 2. Avvia Server
```bash
npm run dev
```

### 3. Apri Browser
```
http://localhost:3000
```

---

## ✅ Checklist Nuove Features

### 🎯 Test Loading States
- [ ] Invia un messaggio
- [ ] Vedi pallini animati (typing indicator)
- [ ] Pulsante diventa "..." durante invio
- [ ] Input disabilitato durante elaborazione

### 🎯 Test Auto-Scroll
- [ ] Invia 10+ messaggi
- [ ] Chat scrolla automaticamente in basso
- [ ] Non serve scrollare manualmente

### 🎯 Test Validazione Frontend
- [ ] Prova a inviare messaggio vuoto → vedi errore rosso
- [ ] Inizia a scrivere → errore sparisce
- [ ] Scrivi 1001 caratteri → vedi errore "troppo lungo"

### 🎯 Test Keyboard Shortcuts
- [ ] Scrivi un messaggio
- [ ] Premi Enter → messaggio inviato
- [ ] No bisogno di cliccare "Invia"

### 🎯 Test Rate Limiting
```bash
# In un altro terminale
for i in {1..70}; do
  curl -s -X POST http://localhost:3000/api/message \
    -H "Content-Type: application/json" \
    -d '{"sessionId":"test","userMessage":"test"}' \
    | jq -r '.message' &
done

# Dopo ~60 richieste vedrai:
# "Troppe richieste. Per favore riprova tra qualche secondo."
```

### 🎯 Test Health Check
```bash
curl http://localhost:3000/api/health | jq

# Verifica che ci sia:
# - rateLimit.activeClients
# - rateLimit.maxRequests: 60
# - sessions.*
```

---

## 🎨 Visual Checklist

### UI Miglioramenti
- [ ] Typing indicator con 3 pallini animati
- [ ] Messaggi con animazione fadeIn
- [ ] Input con bordo rosso su errore
- [ ] Messaggio finale su sfondo verde
- [ ] Pulsante disabilitato (grigio) quando non si può inviare

### UX Miglioramenti  
- [ ] Placeholder: "Scrivi qui... (premi Enter per inviare)"
- [ ] Focus automatico su input dopo risposta bot
- [ ] Scroll smooth (non "jump")
- [ ] Delay 500ms prima della risposta bot (più naturale)

---

## 🐛 Common Issues

### Issue: "Cannot read property 'scrollIntoView'"
**Fix:** Normale, succede durante primo render. Si risolve da solo.

### Issue: Rate limit triggers troppo presto
**Fix:** Modifica `.env.local`:
```bash
RATE_LIMIT_MAX_REQUESTS=120
```

### Issue: Typing indicator non appare
**Fix:** Controlla console browser per errori API.

---

## 📊 Expected Behavior

### Flusso Normale
1. Utente scrive messaggio
2. Utente preme Enter (o click Invia)
3. Messaggio appare subito nella chat
4. Input si svuota e disabilita
5. Dopo ~500ms appaiono pallini animati
6. Dopo qualche secondo arriva risposta bot
7. Pallini spariscono
8. Risposta appare con animazione fadeIn
9. Chat scrolla automaticamente
10. Focus torna sull'input

### Flusso con Errore
1. Utente lascia input vuoto
2. Clicca Invia
3. Bordo diventa rosso
4. Appare messaggio: "Il messaggio non può essere vuoto."
5. Utente inizia a scrivere
6. Errore sparisce
7. Può inviare normalmente

### Flusso Rate Limited
1. Utente invia 61+ messaggi in 1 minuto
2. API risponde con 429
3. Bot dice: "Troppe richieste. Per favore riprova..."
4. Utente può continuare dopo 1 minuto

---

## 🎯 Performance Expectations

| Metric | Target | Actual |
|--------|--------|--------|
| First paint | < 1s | ~500ms |
| Time to interactive | < 2s | ~1s |
| Message send latency | < 3s | 1-2s |
| Auto-scroll latency | < 100ms | ~50ms |
| Typing indicator delay | 500ms | 500ms |

---

## ✅ Tutto Funziona?

Se tutti i test passano, sei pronto per:
- 🚀 Deploy in staging
- 📊 Mostrare al team
- 🎉 Usare in produzione

---

## 🆘 Need Help?

1. Controlla log: `data/logs/app-*.log`
2. Health check: `curl localhost:3000/api/health`
3. Riavvia server: `Ctrl+C` e `npm run dev`

---

**Happy Testing! 🎉**

