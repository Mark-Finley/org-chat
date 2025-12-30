/**
 * User Routes
 * Handles fetching user information and online users list
 */

const express = require('express');
const { allQuery } = require('../db');

const router = express.Router();

/**
 * Middleware to check if user is authenticated
 */
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  next();
}

/**
 * GET /api/users
 * Get all users (excluding current user)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.session.userId;

    const users = await allQuery(
      'SELECT id, username, created_at FROM users WHERE id != ? ORDER BY username',
      [currentUserId]
    );

    res.json({ 
      success: true, 
      users 
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching users' 
    });
  }
});

/**
 * GET /api/users/current
 * Get current user information
 */
router.get('/current', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.session.userId,
      username: req.session.username
    }
  });
});

module.exports = router;
