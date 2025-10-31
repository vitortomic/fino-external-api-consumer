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