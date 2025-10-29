# Questionario PFAS Miteni - Quick Reference

---

## 🎯 TL;DR

Sistema conversazionale AI-powered per raccolta dati azione collettiva PFAS Miteni.

**Tech Stack**: Next.js 15 + TypeScript + OpenAI GPT-4o-mini + Google Sheets  
**Status**: Beta Testing  
**Deploy**: Vercel Serverless  
**Timeline**: 3 settimane (con AI assistance)

---

## 🤖 AI-Assisted Development

### Strumenti

- **Cursor AI + Claude 4.5 Sonnet**: Sviluppo codice, refactoring, debugging
- **ChatGPT-5**: Documentazione, FAQ, copy legale

### Contributo LLM per Area

| Area | AI | Human Review |
|------|-----|--------------|
| Boilerplate | 90% | Architecture |
| Business Logic | 60% | Validation, edge cases |
| UI Components | 75% | UX, accessibility |
| Documentazione | 85% | Accuracy, legal review |
| FAQ | 60% | Legal approval |
| CSS | 80% | Brand, responsive |

### Quality Assurance

✅ **100% codice LLM-generated sottoposto a review umana**  
✅ 0 errori TypeScript in production  
✅ 0 linting errors  
✅ 100% FAQ approvate legalmente  
✅ Test coverage ~60% (target 80% v1.0)

### Motivazioni Uso AI

1. **Time-to-market**: 3 settimane vs 8-10 settimane stimato
2. **Iterazioni rapide**: Feature complesse in ore vs giorni
3. **Beta testing**: Priorità velocità per raccolta feedback
4. **Quality**: Review umana garantisce production-grade

---

## 🏗️ Architettura Key Points

### FSM (Finite State Machine)
Flusso conversazionale deterministico con transizioni basate su validazione.

### Dual-Layer Validation
1. **AI**: Normalizza linguaggio naturale
2. **Programmatic**: Valida formato/range

### Context Guardrails
70+ keywords per rilevare domande off-topic (es. "carbonara" → redirect a questionario)

### Knowledge Base
11 FAQ pre-approvate che bypassano AI per compliance legale

### Regole Comunicative Critiche
- ✅ SEMPRE: Condizionale, "lei" formale, tono professionale
- ❌ MAI: Assoluti, emoji, garantire tempistiche/importi certi

---

## 📊 Performance

- **Target**: < 2s response time (P95)
- **AI response**: ~800ms (P50), ~1.5s (P95)
- **FAQ response**: ~50ms (bypass AI)
- **Modello**: GPT-4o-mini (5x più veloce di GPT-4)
- **Context**: 4 turni history (ottimizzato per velocità)

---

## 🔒 Sicurezza

- Rate limiting IP-based
- Input sanitization
- API keys in environment variables
- Google Service Account least-privilege
- Session ephemeral su serverless
- CORS restrictive

---

## 🚀 Deploy

**Locale**:
```bash
npm install
cp env.example .env.local
# Configurare .env.local
npm run dev
```

**Vercel**:
1. Push su GitHub
2. Connetti a Vercel
3. Config environment variables
4. Auto-deploy su push main

**Prod URL**: https://chatbot-questionario-miteni.vercel.app

---

## 📈 Monitoring

**Health Check**: `GET /api/health`  
**Logs**: Vercel Function Logs (prod) / Console + file (local)  
**Backup**: Auto ogni 6h (solo local)

---

## ⚠️ Limitazioni

- **Vercel**: No persistent filesystem, cold start latency
- **Google Sheets**: Rate limits, performance degradation > 10k rows
- **Soluzione futura**: Redis/Vercel KV + PostgreSQL

---

## 🔮 Roadmap

**v1.0**: Redis storage, 80% test coverage, monitoring  
**v1.1**: Voice input, document upload, analytics dashboard  
**v2.0**: PostgreSQL, microservices, mobile app, fine-tuned AI

---

## 📞 Contatti

**Finanziamento del Contenzioso S.p.A.**  
Brescia, Italia  
RisarcimentoMiteni.it

---

**Last Update**: 29 Ottobre 2025  
**Version**: 3.2.0 Beta

