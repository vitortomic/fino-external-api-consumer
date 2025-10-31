#!/bin/bash

# Configuration
API_BASE_URL="http://localhost:8080"
ONLYFANS_ACCOUNT_ID="12345"
USERNAME="testuser_$(date +%s)"
EMAIL="test_$(date +%s)@example.com"
PASSWORD="password123"

echo "Starting OnlyFans API Consumer test script..."
echo

# 1. Register a new user
echo "Step 1: Registering new user..."
REGISTRATION_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"${USERNAME}\",
    \"email\": \"${EMAIL}\",
    \"password\": \"${PASSWORD}\",
    \"onlyfansAccountId\": \"${ONLYFANS_ACCOUNT_ID}\"
  }")

# Check if registration was successful
if echo "$REGISTRATION_RESPONSE" | grep -q "token"; then
    echo "✓ Registration successful"
    JWT_TOKEN=$(echo "$REGISTRATION_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    USER_ID=$(echo "$REGISTRATION_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)
    echo "  - User ID: $USER_ID"
    echo "  - Username: $USERNAME"
    echo "  - Email: $EMAIL"
    echo
else
    echo "✗ Registration failed"
    echo "Response: $REGISTRATION_RESPONSE"
    exit 1
fi

# 2. Fetch earnings using the JWT token
echo "Step 2: Fetching earnings..."
EARNINGS_RESPONSE=$(curl -s -X GET "${API_BASE_URL}/earnings/${ONLYFANS_ACCOUNT_ID}" \
  -H "Authorization: Bearer ${JWT_TOKEN}")

if echo "$EARNINGS_RESPONSE" | grep -q "earnings"; then
    echo "✓ Earnings retrieved successfully"
    EARNINGS_NET=$(echo "$EARNINGS_RESPONSE" | grep -o '"total_net":[0-9.]*' | head -1 | cut -d':' -f2)
    echo "  - Total net earnings: $EARNINGS_NET"
    echo
else
    echo "✗ Earnings retrieval failed"
    echo "Response: $EARNINGS_RESPONSE"
    exit 1
fi

# 3. Fetch transactions using the JWT token
echo "Step 3: Fetching transactions..."
TRANSACTIONS_RESPONSE=$(curl -s -X GET "${API_BASE_URL}/transactions/${ONLYFANS_ACCOUNT_ID}" \
  -H "Authorization: Bearer ${JWT_TOKEN}")

if echo "$TRANSACTIONS_RESPONSE" | grep -q "transactions"; then
    echo "✓ Transactions retrieved successfully"
    TRANSACTION_COUNT=$(echo "$TRANSACTIONS_RESPONSE" | grep -o '"amount":[0-9.]*' | wc -l)
    echo "  - Number of transactions: $TRANSACTION_COUNT"
    echo
else
    echo "✗ Transactions retrieval failed"
    echo "Response: $TRANSACTIONS_RESPONSE"
    exit 1
fi

echo "All operations completed successfully!"
echo
echo "Summary:"
echo "  - User registered: $USERNAME"
echo "  - Earnings fetched for account: $ONLYFANS_ACCOUNT_ID"
echo "  - Transactions fetched for account: $ONLYFANS_ACCOUNT_ID"
echo "  - JWT token used: ${JWT_TOKEN:0:20}..."