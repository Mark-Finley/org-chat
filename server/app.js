/**
 * Main Application Server
 * Express.js + Socket.IO setup with session-based authentication
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');

// Import Socket.IO handlers
const chatSocket = require('./sockets/chat');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Server configuration
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Session configuration
const sessionMiddleware = session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: path.join(__dirname, '..', 'sessions')
  }),
  secret: '9ae373379dde6ab3c76a3470f62d696c5b306e24',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    secure: false // Set to true if using HTTPS
  }
});

app.use(sessionMiddleware);

// Make session available in Socket.IO
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// Root route - redirect to login page
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.redirect('/chat.html');
  } else {
    res.redirect('/index.html');
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  const session = socket.request.session;
  
  // Check if user is authenticated
  if (!session.userId) {
    socket.disconnect();
    return;
  }

  console.log(`User connected: ${session.username} (ID: ${socket.id})`);

  // Initialize chat socket handlers
  chatSocket(io, socket);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  Org Chat Server Running`);
  console.log(`========================================`);
  console.log(`  Local:    http://localhost:${PORT}`);
  console.log(`  Network:  Check your local IP address`);
  console.log(`========================================\n`);
});

module.exports = { app, server, io };
