/**
 * Socket.IO Chat Handlers
 * Handles real-time messaging events
 */

const { runQuery } = require('../db');

// Store online users: Map of userId -> socket.id
const onlineUsers = new Map();

/**
 * Initialize Socket.IO chat handlers
 * @param {Server} io - Socket.IO server instance
 * @param {Socket} socket - Individual socket connection
 */
function initializeChatSocket(io, socket) {
  const session = socket.request.session;
  const userId = session.userId;
  const username = session.username;

  // Add user to online users list
  onlineUsers.set(userId, socket.id);

  // Notify all clients about the updated online users list
  io.emit('user-online', {
    userId: userId,
    username: username
  });

  // Send current online users list to the newly connected user
  const onlineUsersList = Array.from(onlineUsers.keys());
  socket.emit('online-users', onlineUsersList);

  // Broadcast the online users list to all other clients
  socket.broadcast.emit('online-users', onlineUsersList);

  /**
   * Handle private message sending
   */
  socket.on('private-message', async (data) => {
    try {
      const { receiverId, message } = data;

      // Validate input
      if (!receiverId || !message || message.trim() === '') {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }

      // Save message to database
      const result = await runQuery(
        'INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
        [userId, receiverId, message.trim()]
      );

      // Prepare message object
      const messageData = {
        id: result.id,
        sender_id: userId,
        receiver_id: receiverId,
        sender_username: username,
        message: message.trim(),
        created_at: new Date().toISOString()
      };

      // Send message to receiver if they're online
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('private-message', messageData);
      }

      // Send confirmation back to sender
      socket.emit('message-sent', messageData);

    } catch (error) {
      console.error('Error handling private message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  /**
   * Handle typing indicator
   */
  socket.on('typing', (data) => {
    const { receiverId, isTyping } = data;
    
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user-typing', {
        userId: userId,
        username: username,
        isTyping: isTyping
      });
    }
  });

  /**
   * Handle user disconnect
   */
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${username} (ID: ${socket.id})`);

    // Remove user from online users list
    onlineUsers.delete(userId);

    // Notify all clients about the user going offline
    io.emit('user-offline', {
      userId: userId,
      username: username
    });

    // Broadcast updated online users list
    const onlineUsersList = Array.from(onlineUsers.keys());
    io.emit('online-users', onlineUsersList);
  });
}

module.exports = initializeChatSocket;
