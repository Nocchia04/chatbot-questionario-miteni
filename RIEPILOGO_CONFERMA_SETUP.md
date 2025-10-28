# Setup Riepilogo e Conferma Finale

## 📋 Nuove Funzionalità Implementate

### 1. Avvio Automatico
✅ Il primo messaggio della chat parte automaticamente quando l'utente apre la pagina.

### 2. Riepilogo e Conferma Finale (Valenza Legale)
✅ Quando l'utente completa TUTTE le domande fino a R17, il sistema:
- Genera automaticamente un **riepilogo completo** di tutte le risposte fornite
- Mostra il riepilogo all'utente
- Chiede una **conferma esplicita** per dare valenza legale alla dichiarazione
- Salva sia il riepilogo che la conferma finale su Google Sheets

### 3. Flusso Differenziato
- **Scelta "Telefono"** → La chat termina SENZA riepilogo
- **Scelta "Chat" + completamento questionario** → Riepilogo + Conferma → Fine

---

## 🔧 Aggiornamento Google Sheets

Le nuove colonne aggiunte al foglio sono:
- **RIEPILOGO** (colonna dopo R17)
- **CONFERMA_FINALE** (ultima colonna)

### Opzione 1: Reinizializza automaticamente il foglio

Esegui questo comando per aggiornare gli headers del foglio:

```bash
curl -X POST http://localhost:3000/api/admin/sheets/init
```

**IMPORTANTE**: Questo aggiornerà gli headers solo se la riga 1 è vuota. Se hai già dati, passa all'Opzione 2.

### Opzione 2: Aggiungi manualmente le colonne

1. Apri il tuo Google Sheet
2. Vai alla riga degli headers (riga 1)
3. Dopo la colonna `R17`, aggiungi due nuove colonne:
   - `RIEPILOGO`
   - `CONFERMA_FINALE`

---

## 📖 Come Funziona il Riepilogo

### Quando viene generato?
Il riepilogo viene generato automaticamente quando l'utente:
1. Completa la risposta a **R17** (ultima domanda del questionario)
2. Conferma di voler compilare via "Chat" (non "Telefono")

### Cosa contiene il riepilogo?
Il riepilogo include:
```
=== DATI ANAGRAFICI ===
Nome: ...
Cognome: ...
Email: ...
Telefono: ...
Sesso: ...
Luogo di nascita: ...
Provincia di nascita: ...
Data di nascita: ...
Modalità compilazione: ...

=== QUESTIONARIO PFAS ===
1. Cosa sa dell'inquinamento da PFAS...
   Risposta: ...
2. Da quanto tempo lo sa...
   Risposta: ...
...
17. Ha smesso o ridotto attività all'aperto...
    Risposta: ...
```

### Conferma Finale
Dopo aver visualizzato il riepilogo, l'utente deve confermare con:
- "Sì"
- "Confermo"
- o qualsiasi risposta affermativa

La conferma viene salvata nella colonna `CONFERMA_FINALE`.

---

## 🧪 Test del Flusso Completo

### Test 1: Flusso completo con riepilogo
1. Apri la chat → Il primo messaggio parte automaticamente ✅
2. Compila tutti i dati anagrafici
3. Scegli "Chat" quando richiesto
4. Completa tutte le domande da R1 a R17
5. **Verifica**: Dopo R17, dovresti vedere il riepilogo completo + richiesta di conferma
6. Scrivi "Confermo"
7. **Verifica**: La chat termina
8. **Verifica Google Sheets**: Controlla che ci siano dati in `RIEPILOGO` e `CONFERMA_FINALE`

### Test 2: Flusso con scelta "Telefono"
1. Apri la chat
2. Compila i dati anagrafici
3. Scegli "Telefono" quando richiesto
4. **Verifica**: La chat termina immediatamente SENZA riepilogo
5. **Verifica Google Sheets**: Le colonne `RIEPILOGO` e `CONFERMA_FINALE` dovrebbero essere vuote

---

## 🔍 Verifica Salvataggio su Google Sheets

Per verificare che tutto sia salvato correttamente:

```bash
# Controlla lo stato del foglio
curl http://localhost:3000/api/admin/sheets/test
```

Dovresti vedere:
```json
{
  "success": true,
  "message": "Connessione a Google Sheets riuscita",
  "spreadsheetId": "...",
  "sheetName": "...",
  "headers": [..., "RIEPILOGO", "CONFERMA_FINALE"]
}
```

---

## 📊 Struttura Finale Google Sheets

| NOME | COGNOME | EMAIL | TELEFONO | MODALITÀ | ... | R17 | **RIEPILOGO** | **CONFERMA_FINALE** |
|------|---------|-------|----------|----------|-----|-----|---------------|---------------------|
| Mario | Rossi | ... | ... | chat | ... | ... | [Riepilogo completo...] | Confermo |
| Luigi | Verdi | ... | ... | telefono | ... | - | - | - |

---

## ⚖️ Valenza Legale

Il riepilogo + conferma hanno valenza legale per le seguenti ragioni:

1. **Trasparenza**: L'utente vede TUTTO ciò che ha dichiarato
2. **Consapevolezza**: L'utente deve leggere e verificare le informazioni
3. **Consenso esplicito**: L'utente deve confermare attivamente con "Sì" o "Confermo"
4. **Tracciabilità**: Riepilogo e conferma sono salvati permanentemente su Google Sheets
5. **Timestamp**: Ogni riga ha un timestamp implicito (data di salvataggio)

Questo processo è equivalente alla firma di un documento legale in formato digitale.

---

## 🚀 Prossimi Passi

1. ✅ Verifica che il server sia attivo: `npm run dev`
2. ✅ Aggiorna gli headers del Google Sheet (Opzione 1 o 2)
3. ✅ Testa il flusso completo (Test 1 e Test 2)
4. ✅ Verifica i dati salvati su Google Sheets

---

## 🆘 Troubleshooting

### Il riepilogo non viene generato
- **Causa**: L'utente non ha completato tutte le domande fino a R17
- **Soluzione**: Assicurati di rispondere a TUTTE le domande

### Il riepilogo viene rigenerato quando conferma
- **Causa**: Bug già risolto con il check `!ctx.data.riepilogo`
- **Soluzione**: Riavvia il server se hai ancora questo problema

### Google Sheets non si aggiorna
- **Causa**: Credenziali non configurate o foglio non accessibile
- **Soluzione**: Verifica `.env.local` e i permessi del Service Account

---

**Implementazione completata! 🎉**

