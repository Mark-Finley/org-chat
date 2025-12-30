/**
 * Authentication Routes
 * Handles user registration, login, and logout
 */

const express = require('express');
const bcrypt = require('bcrypt');
const { runQuery, getQuery } = require('../db');

const router = express.Router();

// Number of salt rounds for bcrypt hashing
const SALT_ROUNDS = 10;

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    if (username.length < 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username must be at least 3 characters' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }

    // Check if username already exists
    const existingUser = await getQuery(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username already taken' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert new user into database
    const result = await runQuery(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );

    // Create session
    req.session.userId = result.id;
    req.session.username = username;

    res.json({ 
      success: true, 
      message: 'Registration successful',
      user: {
        id: result.id,
        username: username
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error during registration' 
    });
  }
});

/**
 * POST /api/auth/login
 * Log in an existing user
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    // Find user by username
    const user = await getQuery(
      'SELECT id, username, password FROM users WHERE username = ?',
      [username]
    );

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }

    // Create session
    req.session.userId = user.id;
    req.session.username = user.username;

    res.json({ 
      success: true, 
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error during login' 
    });
  }
});

/**
 * POST /api/auth/logout
 * Log out the current user
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error during logout' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Logout successful' 
    });
  });
});

/**
 * GET /api/auth/check
 * Check if user is authenticated
 */
router.get('/check', (req, res) => {
  if (req.session.userId) {
    res.json({ 
      authenticated: true,
      user: {
        id: req.session.userId,
        username: req.session.username
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

module.exports = router;
