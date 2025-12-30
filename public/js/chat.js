/**
 * Chat Application Frontend Logic
 * Handles Socket.IO connections, user interactions, and real-time messaging
 */

// Global variables
let socket;
let currentUser = null;
let selectedUser = null;
let allUsers = [];
let onlineUserIds = [];
let typingTimeout;

/**
 * Initialize the application
 */
async function init() {
  // Check authentication
  const authCheck = await checkAuth();
  if (!authCheck) {
    window.location.href = '/index.html';
    return;
  }

  currentUser = authCheck.user;
  document.getElementById('current-username').textContent = currentUser.username;

  // Initialize Socket.IO connection
  initializeSocket();

  // Load users list
  await loadUsers();

  // Setup event listeners
  setupEventListeners();
}

/**
 * Check if user is authenticated
 */
async function checkAuth() {
  try {
    const response = await fetch('/api/auth/check');
    const data = await response.json();
    return data.authenticated ? data : null;
  } catch (error) {
    console.error('Auth check failed:', error);
    return null;
  }
}

/**
 * Initialize Socket.IO connection
 */
function initializeSocket() {
  socket = io();

  // Connection successful
  socket.on('connect', () => {
    console.log('Connected to server');
  });

  // Receive online users list
  socket.on('online-users', (userIds) => {
    onlineUserIds = userIds;
    updateUsersOnlineStatus();
  });

  // User came online
  socket.on('user-online', (data) => {
    if (!onlineUserIds.includes(data.userId)) {
      onlineUserIds.push(data.userId);
      updateUsersOnlineStatus();
    }
  });

  // User went offline
  socket.on('user-offline', (data) => {
    onlineUserIds = onlineUserIds.filter(id => id !== data.userId);
    updateUsersOnlineStatus();
  });

  // Receive private message
  socket.on('private-message', (data) => {
    handleIncomingMessage(data);
  });

  // Message sent confirmation
  socket.on('message-sent', (data) => {
    // Message already displayed optimistically, just update if needed
    console.log('Message sent:', data);
  });

  // User typing indicator
  socket.on('user-typing', (data) => {
    if (selectedUser && data.userId === selectedUser.id) {
      showTypingIndicator(data.isTyping);
    }
  });

  // Handle errors
  socket.on('error', (data) => {
    console.error('Socket error:', data);
    alert(data.message);
  });

  // Connection error
  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
  });
}

/**
 * Load all users from the server
 */
async function loadUsers() {
  try {
    const response = await fetch('/api/users');
    const data = await response.json();

    if (data.success) {
      allUsers = data.users;
      renderUsersList();
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

/**
 * Render users list in the sidebar
 */
function renderUsersList() {
  const usersList = document.getElementById('users-list');
  usersList.innerHTML = '';

  if (allUsers.length === 0) {
    usersList.innerHTML = '<div class="text-center text-muted p-3">No other users</div>';
    return;
  }

  allUsers.forEach(user => {
    const isOnline = onlineUserIds.includes(user.id);
    const userItem = document.createElement('button');
    userItem.className = 'list-group-item list-group-item-action user-item';
    userItem.dataset.userId = user.id;
    userItem.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <span>
          <span class="status-indicator ${isOnline ? 'online' : 'offline'}"></span>
          ${user.username}
        </span>
        ${isOnline ? '<span class="badge bg-success">Online</span>' : '<span class="badge bg-secondary">Offline</span>'}
      </div>
    `;

    // Add click event to select user
    userItem.addEventListener('click', () => selectUser(user));

    // Highlight if this is the currently selected user
    if (selectedUser && selectedUser.id === user.id) {
      userItem.classList.add('active');
    }

    usersList.appendChild(userItem);
  });
}

/**
 * Update online status indicators for users
 */
function updateUsersOnlineStatus() {
  renderUsersList();
}

/**
 * Select a user to chat with
 */
async function selectUser(user) {
  selectedUser = user;
  renderUsersList(); // Re-render to highlight selected user

  // Update chat header
  const isOnline = onlineUserIds.includes(user.id);
  document.getElementById('chat-header').innerHTML = `
    <div class="d-flex align-items-center">
      <h5 class="mb-0">
        <span class="status-indicator ${isOnline ? 'online' : 'offline'}"></span>
        ${user.username}
      </h5>
      <span class="ms-2 badge ${isOnline ? 'bg-success' : 'bg-secondary'}">
        ${isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  `;

  // Show message input
  document.getElementById('message-input-container').style.display = 'block';

  // Load chat history
  await loadChatHistory(user.id);

  // Focus on message input
  document.getElementById('message-input').focus();
}

/**
 * Load chat history with a user
 */
async function loadChatHistory(userId) {
  try {
    const response = await fetch(`/api/messages/${userId}`);
    const data = await response.json();

    if (data.success) {
      renderMessages(data.messages);
    }
  } catch (error) {
    console.error('Error loading chat history:', error);
  }
}

/**
 * Render messages in the chat area
 */
function renderMessages(messages) {
  const messagesContainer = document.getElementById('messages-container');
  messagesContainer.innerHTML = '';

  if (messages.length === 0) {
    messagesContainer.innerHTML = '<div class="text-center text-muted py-5">No messages yet. Start the conversation!</div>';
    return;
  }

  messages.forEach(message => {
    appendMessage(message);
  });

  // Scroll to bottom
  scrollToBottom();
}

/**
 * Append a single message to the chat
 */
function appendMessage(message) {
  const messagesContainer = document.getElementById('messages-container');
  const isOwnMessage = message.sender_id === currentUser.id;

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isOwnMessage ? 'message-sent' : 'message-received'}`;
  
  const time = new Date(message.created_at).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  messageDiv.innerHTML = `
    <div class="message-content">
      ${!isOwnMessage ? `<div class="message-sender">${message.sender_username}</div>` : ''}
      <div class="message-text">${escapeHtml(message.message)}</div>
      <div class="message-time">${time}</div>
    </div>
  `;

  messagesContainer.appendChild(messageDiv);
}

/**
 * Handle incoming message from Socket.IO
 */
function handleIncomingMessage(message) {
  // Only display if message is from the currently selected user
  if (selectedUser && message.sender_id === selectedUser.id) {
    appendMessage(message);
    scrollToBottom();
  }
}

/**
 * Send a message
 */
function sendMessage(messageText) {
  if (!selectedUser || !messageText.trim()) {
    return;
  }

  // Emit message through Socket.IO
  socket.emit('private-message', {
    receiverId: selectedUser.id,
    message: messageText.trim()
  });

  // Optimistically display the message
  const optimisticMessage = {
    id: Date.now(), // Temporary ID
    sender_id: currentUser.id,
    receiver_id: selectedUser.id,
    sender_username: currentUser.username,
    message: messageText.trim(),
    created_at: new Date().toISOString()
  };

  appendMessage(optimisticMessage);
  scrollToBottom();
}

/**
 * Show/hide typing indicator
 */
function showTypingIndicator(isTyping) {
  const typingIndicator = document.getElementById('typing-indicator');
  const typingUsername = document.getElementById('typing-username');

  if (isTyping) {
    typingUsername.textContent = selectedUser.username;
    typingIndicator.style.display = 'block';
  } else {
    typingIndicator.style.display = 'none';
  }
}

/**
 * Send typing indicator
 */
function sendTypingIndicator(isTyping) {
  if (selectedUser) {
    socket.emit('typing', {
      receiverId: selectedUser.id,
      isTyping: isTyping
    });
  }
}

/**
 * Scroll messages container to bottom
 */
function scrollToBottom() {
  const messagesContainer = document.getElementById('messages-container');
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Message form submission
  document.getElementById('message-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('message-input');
    const message = input.value.trim();

    if (message) {
      sendMessage(message);
      input.value = '';
      sendTypingIndicator(false); // Stop typing indicator
    }
  });

  // Typing indicator
  document.getElementById('message-input').addEventListener('input', (e) => {
    sendTypingIndicator(true);

    // Clear previous timeout
    clearTimeout(typingTimeout);

    // Set new timeout to stop typing indicator after 2 seconds of inactivity
    typingTimeout = setTimeout(() => {
      sendTypingIndicator(false);
    }, 2000);
  });

  // Logout button
  document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/index.html';
    } catch (error) {
      console.error('Logout error:', error);
    }
  });
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
