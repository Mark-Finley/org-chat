/**
 * Database Setup and Schema
 * SQLite database with users and messages tables
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Create database file in the project root
const dbPath = path.join(__dirname, '..', 'chat.db');

// Ensure the directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    console.error('Database path:', dbPath);
    process.exit(1); // Exit if database can't be opened
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initializeDatabase();
  }
});

/**
 * Initialize database tables
 */
function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating users table:', err.message);
      } else {
        console.log('Users table ready');
      }
    });

    // Messages table
    db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id),
        FOREIGN KEY (receiver_id) REFERENCES users(id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating messages table:', err.message);
      } else {
        console.log('Messages table ready');
      }
    });

    // Create indexes for better query performance
    db.run(`
      CREATE INDEX IF NOT EXISTS idx_messages_sender 
      ON messages(sender_id)
    `);

    db.run(`
      CREATE INDEX IF NOT EXISTS idx_messages_receiver 
      ON messages(receiver_id)
    `);

    db.run(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation 
      ON messages(sender_id, receiver_id, created_at)
    `);
  });
}

/**
 * Helper function to run SQL queries with promises
 * Makes database operations easier to work with async/await
 */
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

/**
 * Helper function to get a single row
 */
function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

/**
 * Helper function to get all rows
 */
function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

module.exports = {
  db,
  runQuery,
  getQuery,
  allQuery
};
