#!/bin/bash

# Test script for Chat Completion API
# Usage: ./test_chat_api.sh

echo "🧪 Testing Chat Completion API"
echo ""

# Configuration (update these)
BASE_URL="http://localhost:8000"
EMAIL="test@example.com"
PASSWORD="password123"
WORKSPACE_ID=""  # Will be fetched automatically

echo "1️⃣ Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Login failed. Please check credentials."
    exit 1
fi

echo "✅ Login successful"
echo ""

echo "2️⃣ Getting workspace..."
WORKSPACES_RESPONSE=$(curl -s -X GET "$BASE_URL/workspaces/" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

WORKSPACE_ID=$(echo $WORKSPACES_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$WORKSPACE_ID" ]; then
    echo "❌ No workspace found. Please create one first."
    exit 1
fi

echo "✅ Workspace ID: $WORKSPACE_ID"
echo ""

echo "3️⃣ Testing chat query..."
QUERY_RESPONSE=$(curl -s -X POST "$BASE_URL/chat/query" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"workspace_id\": \"$WORKSPACE_ID\",
    \"message\": \"What is the main topic of the documents?\"
  }")

echo "Response:"
echo "$QUERY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$QUERY_RESPONSE"
echo ""

echo "✅ Test complete!"

