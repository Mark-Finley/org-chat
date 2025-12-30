# 🏢 Org Chat - Internal Organization Chat Application

A beginner-friendly, real-time chat application designed for internal organizational communication on a local intranet. No internet dependency required.

## Features

✅ **Phase 1 (MVP) - Implemented:**
- User registration and login with password hashing
- Session-based authentication
- Real-time private messaging using Socket.IO (WebSockets)
- Online/offline user status indicators
- Message persistence in SQLite database
- Chat history loading
- Typing indicators
- Clean, professional UI with Bootstrap 5 via CDN

## Tech Stack

- **Backend:** Node.js + Express.js
- **Real-time Communication:** Socket.IO
- **Database:** SQLite (for easy local setup; can be switched to PostgreSQL/MySQL)
- **Frontend:** HTML, CSS, Vanilla JavaScript, Bootstrap 5 via CDN
- **Authentication:** Session-based with bcrypt password hashing

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installation

1. **Clone or download this repository**

2. **Navigate to the project directory:**
   ```bash
   cd org-chat
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

## Running the Application

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on port 3000 by default. You'll see:
```
========================================
  Org Chat Server Running
========================================
  Local:    http://localhost:3000
  Network:  Check your local IP address
========================================
```

## Accessing the Application

### On the same machine:
Open your browser and go to: `http://localhost:3000`

### From other computers on the same network:

1. Find your computer's local IP address:
   - **Windows:** Open Command Prompt and run `ipconfig`
   - **Mac/Linux:** Open Terminal and run `ifconfig` or `ip addr`

2. Look for an address like `192.168.x.x` or `10.x.x.x`

3. On other computers, open a browser and go to: `http://YOUR-IP-ADDRESS:3000`
   - Example: `http://192.168.1.100:3000`

## Usage Guide

### First Time Setup

1. **Register an Account:**
   - Open the application in your browser
   - Click "Register here" on the login page
   - Choose a username (min 3 characters) and password (min 6 characters)
   - Click "Register"

2. **Login:**
   - Enter your username and password
   - Click "Login"

### Using the Chat

1. **View Online Users:**
   - The left sidebar shows all registered users
   - Green badge = Online, Gray badge = Offline

2. **Start a Conversation:**
   - Click on any user in the list
   - Type your message in the input box at the bottom
   - Press Enter or click "Send"

3. **Real-time Features:**
   - Messages appear instantly for online users
   - See when someone is typing
   - Chat history is preserved

4. **Logout:**
   - Click the "Logout" button in the top-right of the sidebar

## Project Structure

```
org-chat/
├── server/
│   ├── app.js              # Main Express + Socket.IO setup
│   ├── db.js               # SQLite database configuration
│   ├── routes/
│   │   ├── auth.js         # Authentication routes (login/register)
│   │   ├── users.js        # User management routes
│   │   └── messages.js     # Message history routes
│   └── sockets/
│       └── chat.js         # Socket.IO event handlers
├── public/
│   ├── index.html          # Login/Register page
│   ├── chat.html           # Main chat interface
│   ├── css/
│   │   └── styles.css      # Custom styling
│   └── js/
│       └── chat.js         # Frontend JavaScript logic
├── package.json
└── README.md
```

## Database

The application uses SQLite for development, which creates a `chat.db` file in the project root.

### Database Schema

**Users Table:**
- `id` - Unique user identifier
- `username` - Unique username
- `password` - Bcrypt hashed password
- `created_at` - Account creation timestamp

**Messages Table:**
- `id` - Unique message identifier
- `sender_id` - ID of the user who sent the message
- `receiver_id` - ID of the user who receives the message
- `message` - Message content
- `created_at` - Message timestamp

### Migrating to PostgreSQL/MySQL

To migrate to a production database:

1. Install the appropriate driver:
   ```bash
   npm install pg      # For PostgreSQL
   npm install mysql2  # For MySQL
   ```

2. Update [server/db.js](server/db.js) to use the new database connection

3. Keep the same SQL schema (it's compatible with PostgreSQL/MySQL)

## Security Considerations

⚠️ **Important for Production:**

1. **Change the session secret** in [server/app.js](server/app.js):
   ```javascript
   secret: 'your-secure-random-secret-here'
   ```

2. **Enable HTTPS** for production and set `secure: true` for cookies

3. **Add rate limiting** to prevent brute force attacks

4. **Implement input validation** and sanitization

5. **Use environment variables** for sensitive configuration

## Troubleshooting

### Port already in use
If port 3000 is already in use, you can change it:
```bash
PORT=3001 npm start
```

### Cannot connect from other computers
- Check your firewall settings
- Ensure the server is running
- Verify you're using the correct IP address
- Make sure all devices are on the same network

### Database errors
- Delete `chat.db` and restart the server to recreate the database
- Check file permissions in the project directory

## Future Enhancements (Phase 2)

Potential features for future development:
- 👥 Group chats
- 📁 File sharing
- 🔍 Message search
- 📱 Mobile responsive improvements
- 🔔 Desktop notifications
- ✅ Read receipts
- 😊 Emoji support
- 🎨 User avatars
- 📊 Admin dashboard


## Support

For questions or issues, contact your IT administrator.

---

**Built with ❤️ for internal organizational use on local networks** 🏢
