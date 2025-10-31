# OnlyFans API Consumer POC

This is a proof-of-concept application that consumes the OnlyFans API to fetch user earnings and transactions. The app includes user registration, authentication, and stores OnlyFans API responses in a PostgreSQL database for later analysis and querying.

## Features

- User registration with OnlyFans account ID
- JWT-based authentication
- Earnings retrieval from OnlyFans API (currently simulated with mock API)
- Transaction retrieval from OnlyFans API (currently simulated with mock API)
- PostgreSQL database for user management and API response storage
- Knex.js for database migrations
- JSONB storage of OnlyFans API responses for flexible querying

## Architecture

- Main API consumer app (Node.js/Express) - runs on port 8080
- Mock OnlyFans API server (Node.js/Express) for simulation - runs on port 8081
- PostgreSQL database - runs on port 5433

## Setup

1. Install dependencies for both servers:
   ```bash
   npm install
   cd mock-server
   npm install
   ```

2. Start the PostgreSQL database using Docker Compose:
   ```bash
   docker-compose up -d
   ```

3. Run database migrations:
   ```bash
   npm run migrate
   ```

4. Start the mock OnlyFans API server:
   ```bash
   cd mock-server
   npm start
   # or for development with auto-restart:
   npm run dev
   ```

5. In a new terminal, start the main API consumer app:
   ```bash
   npm start
   # or for development with auto-restart:
   npm run dev
   ```

## Data Storage

This application stores OnlyFans API responses in JSONB format in PostgreSQL for optimal querying:

- Earnings data is stored in the `onlyfans_earnings` table with foreign key to the user
- Transaction data is stored in the `onlyfans_transactions` table with foreign key to the user
- Only the relevant data portion of responses is saved (excluding metadata like `_meta`)
- JSONB format allows for efficient querying of nested response fields

## API Endpoints

### Registration
- `POST /register`
  - Body: `{ "username": "string", "email": "string", "password": "string", "onlyfansAccountId": "string" }`
  - Registers a new user and stores their OnlyFans account ID in the database

### Fetch Earnings
- `GET /earnings/:onlyfansAccountId`
  - Headers: `Authorization: Bearer <JWT_TOKEN>`
  - Retrieves earnings for the specified OnlyFans account ID (must belong to the authenticated user)
  - Stores the relevant portion of the response in the database

### Fetch Transactions
- `GET /transactions/:onlyfansAccountId`
  - Headers: `Authorization: Bearer <JWT_TOKEN>`
  - Retrieves transactions for the specified OnlyFans account ID (must belong to the authenticated user)
  - Stores the relevant portion of the response in the database

## Database Migrations

This application uses Knex.js for database migrations:

- Migrations are stored in the `/migrations-knex` directory as JavaScript files
- Each migration file is prefixed with a timestamp (e.g., `20251031162228_initial_schema.js`)
- Knex tracks applied migrations in the `knex_migrations` table
- Run `npm run migrate` to apply pending migrations
- Run `npm run migrate:make <migration-name>` to create a new migration
- Run `npm run migrate:rollback` to rollback the last migration batch

## Database Structure

The application uses the following tables:
- `users` - stores user information including OnlyFans account ID
- `onlyfans_earnings` - stores earnings data retrieved from the OnlyFans API in JSONB format
- `onlyfans_transactions` - stores transaction data retrieved from the OnlyFans API in JSONB format

## Testing

A test script is provided to verify all API functionality:
```bash
./test_api.sh
```

This script registers a new user, retrieves the JWT token, and uses it to fetch both earnings and transactions.

## Querying Stored Data

The application stores OnlyFans API responses in JSONB format, allowing for flexible querying of the data. Here are useful queries for extracting information from both tables:

### Earnings Data Queries

Query all relevant earnings fields:
```sql
SELECT 
    e.id AS earnings_id,
    e.user_id,
    e.retrieved_at,
    -- Total earnings data
    (e.earnings_data->'list'->'total'->>'all'->>'total_net')::numeric AS total_net,
    (e.earnings_data->'list'->'total'->>'all'->>'total_gross')::numeric AS total_gross,
    -- Post earnings
    (e.earnings_data->'list'->'total'->'post'->>'total_net')::numeric AS post_total_net,
    (e.earnings_data->'list'->'total'->'post'->>'total_gross')::numeric AS post_total_gross,
    -- Tips earnings
    (e.earnings_data->'list'->'total'->'tips'->>'total_net')::numeric AS tips_total_net,
    (e.earnings_data->'list'->'total'->'tips'->>'total_gross')::numeric AS tips_total_gross,
    -- Subscribes earnings
    (e.earnings_data->'list'->'total'->'subscribes'->>'total_net')::numeric AS subscribes_total_net,
    (e.earnings_data->'list'->'total'->'subscribes'->>'total_gross')::numeric AS subscribes_total_gross,
    -- Chat messages earnings
    (e.earnings_data->'list'->'total'->'chat_messages'->>'total_net')::numeric AS chat_total_net,
    (e.earnings_data->'list'->'total'->'chat_messages'->>'total_gross')::numeric AS chat_total_gross
FROM onlyfans_earnings e;
```

### Transactions Data Queries

Query all relevant transaction fields:
```sql
SELECT 
    t.id AS transaction_id,
    t.user_id,
    t.retrieved_at,
    trans_data ->> 'id' AS transaction_id,
    (trans_data ->> 'amount')::numeric AS amount,
    (trans_data ->> 'vatAmount')::numeric AS vat_amount,
    (trans_data ->> 'taxAmount')::numeric AS tax_amount,
    (trans_data ->> 'mediaTaxAmount')::numeric AS media_tax_amount,
    (trans_data ->> 'net')::numeric AS net_amount,
    (trans_data ->> 'fee')::numeric AS fee,
    trans_data ->> 'createdAt' AS created_at,
    trans_data ->> 'currency' AS currency,
    trans_data ->> 'description' AS description,
    trans_data ->> 'status' AS status,
    trans_data ->> 'payoutPendingDays' AS payout_pending_days,
    -- User details from transaction
    (trans_data->'user'->>'id') AS user_id,
    trans_data->'user'->>'username' AS username,
    trans_data->'user'->>'name' AS name,
    trans_data->'user'->>'isVerified' AS is_verified
FROM onlyfans_transactions t
CROSS JOIN jsonb_array_elements(transactions_data->'list') AS trans_data;
```

### Aggregated Data Queries

Get aggregated earnings by user:
```sql
SELECT 
    user_id,
    SUM((earnings_data->'list'->'total'->'all'->>'total_net')::numeric) AS total_net,
    SUM((earnings_data->'list'->'total'->'all'->>'total_gross')::numeric) AS total_gross
FROM onlyfans_earnings
GROUP BY user_id;
```

Get aggregated transactions by user:
```sql
SELECT 
    t.user_id,
    SUM((trans_data ->> 'amount')::numeric) AS total_amount,
    SUM((trans_data ->> 'net')::numeric) AS total_net,
    COUNT(*) AS total_transactions
FROM onlyfans_transactions t
CROSS JOIN jsonb_array_elements(transactions_data->'list') AS trans_data
GROUP BY t.user_id;
```
