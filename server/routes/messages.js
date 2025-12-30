/**
 * Message Routes
 * Handles fetching message history between users
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
 * GET /api/messages/:userId
 * Get message history with a specific user
 */
router.get('/:userId', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const otherUserId = parseInt(req.params.userId);

    if (isNaN(otherUserId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID' 
      });
    }

    // Fetch all messages between the two users
    const messages = await allQuery(`
      SELECT 
        m.id,
        m.sender_id,
        m.receiver_id,
        m.message,
        m.created_at,
        u.username as sender_username
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE 
        (m.sender_id = ? AND m.receiver_id = ?) OR 
        (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
    `, [currentUserId, otherUserId, otherUserId, currentUserId]);

    res.json({ 
      success: true, 
      messages 
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching messages' 
    });
  }
});

module.exports = router;
