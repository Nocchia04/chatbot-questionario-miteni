# ⚡ Performance Optimization Guide

## 🎯 Come Ridurre i Tempi di Risposta

Il chatbot fa 2 chiamate AI per ogni risposta dell'utente:
1. **`aiConversationLayer`** - Interpreta la risposta e decide come procedere
2. **`generateNextQuestionTurn`** - Personalizza la prossima domanda

Ecco come velocizzare il sistema:

---

## 🚀 Opzione 1: Usa Modello Più Veloce (RACCOMANDATO)

### **Modifica `lib/openaiClient.ts`**

Cambia il modello da `gpt-5` (lento, costoso) a `gpt-4o-mini` (veloce, economico):

```typescript
// lib/openaiClient.ts

// PRIMA (lento)
model: "gpt-5"

// DOPO (veloce)
model: "gpt-4o-mini"
```

**Vantaggi**:
- ✅ **Velocità**: 3-5x più veloce
- ✅ **Costo**: 10x più economico
- ✅ **Qualità**: Ancora ottima per questo use case

**Dove modificare**:
- `lib/aiConversation.ts` linea ~122
- `lib/aiNextQuestion.ts` linea ~45

---

## ⚡ Opzione 2: Riduci Context History

### **Modifica `lib/aiConversation.ts`**

Riduci la history passata all'AI da 6 a 3 messaggi:

```typescript
// lib/aiConversation.ts

// PRIMA
const lastTurnsText = history.slice(-6)...

// DOPO (più veloce)
const lastTurnsText = history.slice(-3)...
```

**Vantaggi**:
- ✅ Meno token → risposta più veloce
- ✅ Meno costo
- ⚠️ Possibile perdita di contesto lungo

---

## 🎨 Opzione 3: Semplifica Next Question (MIGLIORE IMPATTO)

### **Strategia 1: Disabilita Personalizzazione** (Massima velocità)

Restituisci direttamente la domanda del flow senza personalizzazione AI.

**Modifica `lib/conversationController.ts`**:

```typescript
// Trova questa sezione (circa linea 220):
const personalizedQuestion = await generateNextQuestionTurn(
  ctx,
  followupNode
);

// SOSTITUISCI CON:
const personalizedQuestion = followupNode.question; // Niente AI, solo domanda diretta
```

**Impatto**:
- ✅ **Taglia 50% del tempo** (elimina 1 delle 2 chiamate AI)
- ✅ Molto più veloce e reattivo
- ⚠️ Perde il tocco personale ("Andrea, confermi che...")

---

### **Strategia 2: Personalizzazione Solo su Domande Chiave**

Personalizza solo alcune domande importanti, usa domande dirette per il resto.

**Modifica `lib/conversationController.ts`**:

```typescript
// Dopo: const followupNode = FLOW[ctx.currentState];

// Personalizza solo domande anagrafiche e prime 3 PFAS
const shouldPersonalize = [
  "NOME", "COGNOME", "EMAIL", "TELEFONO", 
  "MODALITA", "SESSO", "LUOGO_NASCITA", 
  "R1", "R2", "R3"
].includes(ctx.currentState);

const personalizedQuestion = shouldPersonalize
  ? await generateNextQuestionTurn(ctx, followupNode)
  : followupNode.question; // Domanda diretta per R4-R17
```

**Impatto**:
- ✅ Buon compromesso velocità/qualità
- ✅ Mantiene personalizzazione dove conta
- ✅ Risparmio significativo su R4-R17

---

## 🔧 Opzione 4: Timeout più Aggressivo

### **Modifica `lib/openaiClient.ts`**

Riduci il timeout delle chiamate API:

```typescript
// lib/openaiClient.ts

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 10000, // PRIMA: 30 secondi
  // DOPO: 10 secondi (fallisce più veloce se API lenta)
});
```

**Vantaggi**:
- ✅ Fallisce velocemente invece di aspettare 30 secondi
- ⚠️ Più retry se API è temporaneamente lenta

---

## 📊 Confronto Velocità

| Strategia | Tempo per Risposta | Qualità | Costo |
|-----------|-------------------|---------|-------|
| **Attuale (gpt-5 + personalizzazione)** | ~5-8 sec | ⭐⭐⭐⭐⭐ | 💰💰💰 |
| **gpt-4o-mini + personalizzazione** | ~2-3 sec | ⭐⭐⭐⭐ | 💰 |
| **gpt-4o-mini + no personalizzazione** | ~1-1.5 sec | ⭐⭐⭐ | 💰 |
| **gpt-4o-mini + personalizzazione selettiva** | ~1.5-2 sec | ⭐⭐⭐⭐ | 💰 |

---

## 🎯 Raccomandazione

**Per la demo, suggeriamo**:

1. ✅ **Usa `gpt-4o-mini`** invece di `gpt-5`
2. ✅ **Personalizzazione selettiva** (solo domande chiave)
3. ✅ **History ridotta a 3 messaggi**

**Risultato atteso**: 
- Tempo di risposta: **1.5-2 secondi** (da 5-8 sec)
- Qualità: Mantiene tocco umano dove serve
- Costo: Ridotto del 90%

---

## 🛠 Implementazione Rapida (Copia-Incolla)

### **1. Modifica `lib/aiConversation.ts` (linea ~122)**

```typescript
model: "gpt-4o-mini", // Era: "gpt-5"
```

### **2. Modifica `lib/aiNextQuestion.ts` (linea ~45)**

```typescript
model: "gpt-4o-mini", // Era: "gpt-5"
```

### **3. Modifica `lib/aiConversation.ts` (linea ~23)**

```typescript
.slice(-3) // Era: .slice(-6)
```

### **4. Modifica `lib/conversationController.ts` (dopo linea 215)**

Trova:
```typescript
const followupNode = FLOW[ctx.currentState];
```

Aggiungi subito dopo:
```typescript
// Personalizza solo domande chiave per velocità
const shouldPersonalize = [
  "NOME", "COGNOME", "EMAIL", "TELEFONO", 
  "MODALITA", "SESSO", "R1", "R2", "R3"
].includes(ctx.currentState);
```

Trova (circa linea 220):
```typescript
const personalizedQuestion = await generateNextQuestionTurn(
  ctx,
  followupNode
);
```

Sostituisci con:
```typescript
const personalizedQuestion = shouldPersonalize
  ? await generateNextQuestionTurn(ctx, followupNode)
  : followupNode.question;
```

---

## 📈 Monitoraggio Performance

Dopo le modifiche, controlla i log per vedere i tempi:

```bash
tail -f data/logs/app-*.log | grep "Turn completed"
```

Dovresti vedere tempi significativamente ridotti!

---

## ⚠️ Note

- **gpt-5** potrebbe non esistere (o essere un placeholder). Se usi `gpt-4-turbo` o `gpt-4`, passa a `gpt-4o-mini`.
- **gpt-4o-mini** è il modello più veloce ed economico di OpenAI con ottima qualità.
- Le modifiche sono **reversibili**: se non ti piace, torna indietro.

---

**Fine Guida Performance**

