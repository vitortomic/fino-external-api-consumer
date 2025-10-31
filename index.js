require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'onlyfans_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Connect to database and run migrations
async function initializeDatabase() {
  console.log('Database initialized successfully');
}

// Initialize Express app
const app = express();
app.use(express.json());

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Registration endpoint
app.post('/register', async (req, res) => {
  try {
    const { username, email, password, onlyfansAccountId } = req.body;

    // Validate required fields
    if (!username || !email || !password || !onlyfansAccountId) {
      return res.status(400).json({ error: 'All fields are required: username, email, password, onlyfansAccountId' });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user into database
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, onlyfans_account_id) VALUES ($1, $2, $3, $4) RETURNING id, username, email, onlyfans_account_id',
      [username, email, hashedPassword, onlyfansAccountId]
    );

    // Create JWT token
    const token = jwt.sign(
      { id: result.rows[0].id, username: result.rows[0].username },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: result.rows[0],
      token: token
    });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === '23505') { // PostgreSQL unique violation
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch earnings from OnlyFans API
app.get('/earnings/:onlyfansAccountId', authenticateToken, async (req, res) => {
  try {
    const { onlyfansAccountId } = req.params;

    // Validate onlyfansAccountId parameter
    if (!onlyfansAccountId) {
      return res.status(400).json({ error: 'OnlyFans account ID is required' });
    }

    // Verify that the authenticated user owns this account ID
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE onlyfans_account_id = $1 AND id = $2',
      [onlyfansAccountId, req.user.id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied: You do not own this OnlyFans account' });
    }

    // Call the mock OnlyFans API with the account ID
    const response = await fetch(`http://localhost:8081/api/${onlyfansAccountId}/payouts/earning-statistics`);
    
    if (!response.ok) {
      throw new Error(`OnlyFans API error: ${response.statusText}`);
    }

    const fullResponse = await response.json();
    
    // Extract only the relevant data part (excluding _meta, etc.)
    const earningsData = fullResponse.data;
    
    // Store the earnings response in the database
    await pool.query(
      'INSERT INTO onlyfans_earnings (user_id, earnings_data) VALUES ($1, $2)',
      [req.user.id, earningsData]
    );

    res.json({
      message: 'Earnings retrieved successfully',
      accountId: onlyfansAccountId,
      earnings: fullResponse
    });
  } catch (err) {
    console.error('Earnings fetch error:', err);
    res.status(500).json({ error: 'Error fetching earnings from OnlyFans API' });
  }
});

// Fetch transactions from OnlyFans API
app.get('/transactions/:onlyfansAccountId', authenticateToken, async (req, res) => {
  try {
    const { onlyfansAccountId } = req.params;
    const { limit = 10, marker = null } = req.query;

    // Validate onlyfansAccountId parameter
    if (!onlyfansAccountId) {
      return res.status(400).json({ error: 'OnlyFans account ID is required' });
    }

    // Verify that the authenticated user owns this account ID
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE onlyfans_account_id = $1 AND id = $2',
      [onlyfansAccountId, req.user.id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied: You do not own this OnlyFans account' });
    }

    // Build query parameters
    let queryParams = `limit=${limit}`;
    if (marker) {
      queryParams += `&marker=${marker}`;
    }

    // Call the mock OnlyFans API with the account ID
    const response = await fetch(`http://localhost:8081/api/${onlyfansAccountId}/payouts/transactions?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`OnlyFans API error: ${response.statusText}`);
    }

    const fullResponse = await response.json();
    
    // Extract only the relevant data part (excluding _meta, etc.)
    const transactionsData = fullResponse.data;
    
    // Store the transactions response in the database
    await pool.query(
      'INSERT INTO onlyfans_transactions (user_id, transactions_data) VALUES ($1, $2)',
      [req.user.id, transactionsData]
    );

    res.json({
      message: 'Transactions retrieved successfully',
      accountId: onlyfansAccountId,
      transactions: fullResponse
    });
  } catch (err) {
    console.error('Transactions fetch error:', err);
    res.status(500).json({ error: 'Error fetching transactions from OnlyFans API' });
  }
});

// Start the server
const PORT = process.env.PORT || 8080;

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize server:', err);
  });