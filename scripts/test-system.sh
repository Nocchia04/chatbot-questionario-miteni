#!/bin/bash

# Script di test per verificare tutte le funzionalità del sistema

echo "🧪 Testing Miteni Chatbot v2.0"
echo "================================"
echo ""

# Colori
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
HEALTH=$(curl -s ${BASE_URL}/api/health)
if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✓ Health check OK${NC}"
    echo "$HEALTH" | jq -C '.' 2>/dev/null || echo "$HEALTH"
else
    echo -e "${RED}✗ Health check FAILED${NC}"
fi
echo ""

# Test 2: Nuova Sessione
echo "2️⃣  Testing New Session..."
SESSION=$(curl -s -X POST ${BASE_URL}/api/message \
  -H "Content-Type: application/json" \
  -d '{}')
SESSION_ID=$(echo "$SESSION" | jq -r '.sessionId' 2>/dev/null)

if [[ ! -z "$SESSION_ID" && "$SESSION_ID" != "null" ]]; then
    echo -e "${GREEN}✓ Session created: ${SESSION_ID}${NC}"
else
    echo -e "${RED}✗ Session creation FAILED${NC}"
    exit 1
fi
echo ""

# Test 3: Invia Messaggio
echo "3️⃣  Testing Message Send..."
RESPONSE=$(curl -s -X POST ${BASE_URL}/api/message \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"${SESSION_ID}\", \"userMessage\": \"Mario\"}")

BOT_MSG=$(echo "$RESPONSE" | jq -r '.botMessages[0]' 2>/dev/null)
if [[ ! -z "$BOT_MSG" && "$BOT_MSG" != "null" ]]; then
    echo -e "${GREEN}✓ Message received${NC}"
    echo "Bot reply: $BOT_MSG"
else
    echo -e "${RED}✗ Message send FAILED${NC}"
fi
echo ""

# Test 4: Verifica File Sessione
echo "4️⃣  Testing Session Persistence..."
if [[ -f "data/sessions/${SESSION_ID}.json" ]]; then
    echo -e "${GREEN}✓ Session file exists${NC}"
    cat "data/sessions/${SESSION_ID}.json" | jq -C '.' 2>/dev/null || cat "data/sessions/${SESSION_ID}.json"
else
    echo -e "${YELLOW}⚠ Session file not found (might be async)${NC}"
fi
echo ""

# Test 5: Backup Manuale
echo "5️⃣  Testing Manual Backup..."
BACKUP=$(curl -s -X POST ${BASE_URL}/api/admin/backup)
BACKUP_SUCCESS=$(echo "$BACKUP" | jq -r '.success' 2>/dev/null)

if [[ "$BACKUP_SUCCESS" == "true" ]]; then
    echo -e "${GREEN}✓ Backup created${NC}"
    echo "$BACKUP" | jq -C '.' 2>/dev/null || echo "$BACKUP"
else
    echo -e "${RED}✗ Backup FAILED${NC}"
fi
echo ""

# Test 6: Export CSV
echo "6️⃣  Testing CSV Export..."
EXPORT=$(curl -s -X POST ${BASE_URL}/api/admin/export)
EXPORT_SUCCESS=$(echo "$EXPORT" | jq -r '.success' 2>/dev/null)

if [[ "$EXPORT_SUCCESS" == "true" ]]; then
    echo -e "${GREEN}✓ CSV exported${NC}"
    echo "$EXPORT" | jq -C '.' 2>/dev/null || echo "$EXPORT"
else
    echo -e "${RED}✗ Export FAILED${NC}"
fi
echo ""

# Test 7: Verifica Log
echo "7️⃣  Testing Logs..."
LOG_FILE="data/logs/app-$(date +%Y-%m-%d).log"
if [[ -f "$LOG_FILE" ]]; then
    echo -e "${GREEN}✓ Log file exists${NC}"
    echo "Last 5 lines:"
    tail -5 "$LOG_FILE"
else
    echo -e "${YELLOW}⚠ Log file not found${NC}"
fi
echo ""

# Summary
echo "================================"
echo "✅ Test completati!"
echo ""
echo "📊 Per vedere lo stato completo:"
echo "   curl ${BASE_URL}/api/health | jq"
echo ""
echo "📝 Per vedere i log:"
echo "   tail -f ${LOG_FILE}"
echo ""

