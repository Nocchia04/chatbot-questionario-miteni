# 🎥 Guida alla Demo - Miteni Chatbot

## 📋 Setup Pre-Demo

### **1. Verifica Server Attivo**
```bash
cd /Users/nocchia/Desktop/AITALIA/mitenichat
npm run dev
```

Il server sarà su: **http://localhost:3001** (o 3000 se porta libera)

### **2. Verifica Google Sheets**
```bash
# Test connessione
curl -X POST http://localhost:3001/api/admin/sheets/test

# Se serve, inizializza headers
curl -X POST http://localhost:3001/api/admin/sheets/init
```

### **3. Apri Google Sheets in una tab**
[Apri Foglio](https://docs.google.com/spreadsheets/d/1ojzYokodglYKQSDxTJrPOhIMVwPhCVIdTw1mOqmN3xQ)

Tienilo aperto per mostrare i dati che si salvano in tempo reale!

---

## 🎬 Scenario Demo 1: Flusso "Telefono" (Breve)

**Obiettivo**: Mostrare che se l'utente preferisce essere contattato al telefono, il questionario termina subito.

### **Script**:
```
🤖: Ciao 👋 Per iniziare, qual è il tuo nome?
👤: Mario

🤖: Perfetto. Il tuo cognome?
👤: Rossi

🤖: Qual è la tua email?
👤: mario.rossi@demo.com

🤖: Il tuo numero di telefono?
👤: 3331234567

🤖: Grazie! 🙏 Preferisci compilare il questionario qui in 
    chat o preferisci che ti chiamiamo al telefono...?
👤: Preferisco che mi chiamiate al telefono

🤖: Grazie 🙌 Abbiamo finito. Ti ricontatteremo per i 
    prossimi passi.
```

### **Verifica Google Sheets**:
Mostra che è stata salvata una riga con:
- ✅ NOME: Mario
- ✅ COGNOME: Rossi
- ✅ EMAIL: mario.rossi@demo.com
- ✅ TELEFONO: 3331234567
- ✅ MODALITÀ: "telefono" (o simile)
- ✅ SESSO, LUOGO, PROVINCIA, DATA, R1-R17: **VUOTE**

**Messaggio chiave**: "Come vedete, se l'utente preferisce il telefono, raccogliamo solo i dati essenziali e lo ricontatteremo. Questo permette di non perdere contatti anche se la persona non ha tempo per il questionario completo."

---

## 🎬 Scenario Demo 2: Flusso "Chat" Completo

**Obiettivo**: Mostrare il flusso completo con tutte le domande + mapping automatico provincia.

### **Script Parte 1: Dati Anagrafici**
```
👤: Andrea
👤: Bianchi
👤: andrea.bianchi@demo.com
👤: 3337654321

🤖: Grazie! 🙏 Preferisci compilare il questionario qui in 
    chat o preferisci che ti chiamiamo al telefono...?
👤: Qui in chat va benissimo

🤖: Perfetto! Continuiamo allora. 😊
    Qual è il tuo sesso? (M per Maschio, F per Femmina)
👤: Maschio

🤖: In quale città sei nato/a?
👤: Vicenza

🤖: In quale provincia? (puoi scrivere il nome completo o 
    la sigla, es. Vicenza o VI)
👤: Vicenza  ← 🎯 DIMOSTRA IL MAPPING AUTOMATICO!

🤖: Qual è la tua data di nascita? (formato: gg/mm/aaaa)
👤: 15/03/1975
```

**Verifica Google Sheets**:
Mostra la riga in tempo reale con:
- NOME, COGNOME, EMAIL, TELEFONO, MODALITÀ: "chat"
- SESSO: "M"
- LUOGO: "Vicenza"
- PROVINCIA: **"VI"** ← Mapping automatico!
- DATA: "15/03/1975"

**Messaggio chiave**: "Notate che quando l'utente ha scritto 'Vicenza', il sistema ha automaticamente riconosciuto che si tratta della provincia di Vicenza e ha salvato 'VI'. Funziona con tutte le 107 province italiane!"

### **Script Parte 2: Domande PFAS (R1-R3, poi salta)**
```
🤖: Cosa sa dell'inquinamento da PFAS e dei relativi 
    responsabili?
👤: So che è stato causato dalla Miteni e ha inquinato 
    l'acqua di molti comuni del vicentino.

🤖: Da quanto tempo lo sa e da quale fonte l'ha scoperto?
👤: Da circa 3 anni, l'ho saputo dalle notizie locali e 
    dal Comune.

🤖: Per cosa usate l'acqua del rubinetto?
👤: Ora solo per lavarsi, non la beviamo più.
```

**Verifica Google Sheets**:
Mostra che le risposte R1, R2, R3 appaiono in tempo reale nel foglio.

**Messaggio chiave**: "Per la demo non completiamo tutte le 17 domande, ma vedete che il sistema salva progressivamente ogni risposta. Se l'utente abbandona, possiamo riprendere da dove si era interrotto."

---

## 🎬 Scenario Demo 3: Resume Sessione

**Obiettivo**: Mostrare che se l'utente torna con la stessa email, il sistema riprende da dove aveva lasciato.

### **Setup**:
Usa lo stesso utente del Demo 2 (andrea.bianchi@demo.com) che ha risposto solo a R1-R3.

### **Script**:
```
[Apri una NUOVA finestra in incognito]

👤: Marco
👤: Verdi
👤: andrea.bianchi@demo.com  ← STESSA EMAIL!

🤖: Bentornato/a! 👋 Vedo che avevi già iniziato a 
    compilare il questionario. Riprenderemo da dove 
    avevi interrotto.
    
    [Continua con R4...]
```

**Messaggio chiave**: "Il sistema ha riconosciuto l'email e ha ripreso dal punto esatto dove l'utente aveva lasciato. Tutti i dati precedenti sono stati caricati automaticamente. Questo è fondamentale per non far perdere tempo alle persone e non far ripartire da zero."

---

## 🎬 Scenario Demo 4: Mapping Province Avanzato

**Obiettivo**: Mostrare la flessibilità del sistema nel riconoscere le province.

### **Test Rapidi** (durante una conversazione):
```
Provincia: "padova"      → Salva: "PD" ✅
Provincia: "VENEZIA"     → Salva: "VE" ✅
Provincia: "VI"          → Salva: "VI" ✅
Provincia: "Treviso"     → Salva: "TV" ✅
```

**Messaggio chiave**: "Il sistema è molto flessibile: maiuscole, minuscole, nome completo o sigla... funziona sempre!"

---

## 🎬 Scenario Demo 5: Domande Generiche

**Obiettivo**: Mostrare che il bot risponde a domande sul PFAS ma blocca off-topic.

### **Script 1: Domanda IN-CONTEXT**
```
[Durante il questionario]

👤: Ma cos'è esattamente il PFAS?

🤖: I PFAS (sostanze perfluoroalchiliche) sono sostanze 
    chimiche artificiali usate in molti prodotti industriali. 
    Sono pericolose perché persistono nell'ambiente e nel 
    corpo umano per lungo tempo...
    
    [Poi riporta al questionario]
```

**Messaggio chiave**: "Il bot è in grado di rispondere a domande legittime sul caso PFAS, fornendo informazioni utili senza interrompere il flusso."

### **Script 2: Domanda OFF-TOPIC**
```
👤: Come si fa la carbonara?

🤖: Mi dispiace, posso aiutarti solo con domande relative 
    al caso PFAS Miteni e al questionario. Torniamo al 
    questionario, dove eravamo rimasti? 😊
```

**Messaggio chiave**: "Il sistema blocca automaticamente domande completamente fuori contesto, mantenendo il focus sull'obiettivo."

---

## 📊 Demo Admin Tools (Opzionale)

### **Health Check**
```bash
curl http://localhost:3001/api/health
```

Mostra lo stato del sistema: sessioni attive, rate limiter, ecc.

### **Statistiche Sessioni**
Mostra il file `data/sessions/` con tutte le sessioni salvate localmente.

---

## 🎯 Punti Chiave da Enfatizzare

1. **Flessibilità**: Chat o Telefono, l'utente sceglie
2. **Persistenza**: Nessun dato perso, tutto salvato in tempo reale
3. **Resume**: Può tornare in qualsiasi momento
4. **Intelligenza**: Riconosce province, valida input, risponde a domande
5. **Efficienza**: Riduce drasticamente il lavoro manuale del back-office
6. **Scalabilità**: Può gestire centinaia di utenti contemporaneamente

---

## 📋 Checklist Pre-Demo

- [ ] Server avviato (`npm run dev`)
- [ ] Google Sheets aperto in una tab
- [ ] Test connessione Google Sheets (`/api/admin/sheets/test`)
- [ ] Browser principale + finestra in incognito pronte
- [ ] Console pulita (F12 → Console)
- [ ] Script stampati o a portata di mano

---

## 🎥 Ordine Consigliato Demo

1. **Intro** (1 min): Spiega il problema e l'obiettivo
2. **Demo 1 - Telefono** (2 min): Flusso breve
3. **Demo 2 - Chat** (5 min): Flusso completo + mapping provincia
4. **Demo 3 - Resume** (2 min): Riprendi sessione
5. **Demo 4 - Guardrails** (2 min): FAQ + off-topic
6. **Google Sheets Review** (2 min): Mostra i dati salvati
7. **Q&A** (variabile)

**Durata totale**: ~15 minuti + Q&A

---

## 💡 Tips per la Demo

1. **Parla mentre digiti**: Spiega cosa stai facendo
2. **Mostra Google Sheets in parallelo**: Aggiorna la tab dopo ogni risposta
3. **Vai veloce sui campi noiosi**: Focus sulle funzionalità uniche (mapping, resume)
4. **Prepara dati realistici**: Non "test test", ma "Mario Rossi", "andrea.bianchi@gmail.com"
5. **Gestisci errori con naturalezza**: Se qualcosa va storto, spiega che è una demo e riparti

---

## 🚀 Buona Demo!

Se tutto va bene, avrai dimostrato un sistema:
- ✅ Funzionale al 100%
- ✅ Intelligente e flessibile
- ✅ Pronto per la produzione
- ✅ In grado di risparmiare centinaia di ore di lavoro manuale

**Break a leg! 🎭**

---

**Fine Guida Demo**


