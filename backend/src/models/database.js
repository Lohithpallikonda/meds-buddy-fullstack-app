const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database/medsbuddy.db')
const dbDir = path.dirname(dbPath)

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message)
  } else {
    console.log('Connected to SQLite database')
    db.run('PRAGMA foreign_keys = ON')
  }
})

const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err)
      } else {
        resolve({ id: this.lastID, changes: this.changes })
      }
    })
  })
}

const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err)
      } else {
        resolve(row)
      }
    })
  })
}

const allQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows)
      }
    })
  })
}

const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          console.error('Error enabling foreign keys:', err)
          reject(err)
          return
        }
      });

      const createTables = [
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'patient',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS medications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          dosage TEXT NOT NULL,
          frequency TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS medication_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          medication_id INTEGER NOT NULL,
          taken_date DATE NOT NULL,
          status TEXT NOT NULL DEFAULT 'taken',
          notes TEXT,
          proof_image_path TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (medication_id) REFERENCES medications (id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          data TEXT,
          priority TEXT DEFAULT 'medium',
          is_read INTEGER DEFAULT 0,
          read_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sender_id INTEGER NOT NULL,
          recipient_id INTEGER NOT NULL,
          message_type TEXT DEFAULT 'text',
          content TEXT NOT NULL,
          is_read INTEGER DEFAULT 0,
          read_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS caretaker_patients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          caretaker_id INTEGER NOT NULL,
          patient_id INTEGER NOT NULL,
          relationship_type TEXT DEFAULT 'caretaker',
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (caretaker_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (patient_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(caretaker_id, patient_id)
        )`,
        `CREATE TABLE IF NOT EXISTS medication_reminders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          medication_id INTEGER NOT NULL,
          reminder_time TIME NOT NULL,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (medication_id) REFERENCES medications (id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS user_preferences (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL UNIQUE,
          notifications_enabled INTEGER DEFAULT 1,
          email_notifications INTEGER DEFAULT 1,
          reminder_frequency TEXT DEFAULT 'daily',
          theme TEXT DEFAULT 'light',
          language TEXT DEFAULT 'en',
          timezone TEXT DEFAULT 'UTC',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`
      ];

      createTables.forEach(sql => {
        db.run(sql, (err) => {
          if (err) {
            console.error('❌ Database table creation error:', err)
            reject(err);
          }
        });
      });

      const createIndexes = [
        'CREATE INDEX IF NOT EXISTS idx_medications_user_id ON medications(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_medication_logs_medication_id ON medication_logs(medication_id)',
        'CREATE INDEX IF NOT EXISTS idx_medication_logs_taken_date ON medication_logs(taken_date)',
        'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)',
        'CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)',
        'CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id)',
        'CREATE INDEX IF NOT EXISTS idx_caretaker_patients_caretaker_id ON caretaker_patients(caretaker_id)',
        'CREATE INDEX IF NOT EXISTS idx_caretaker_patients_patient_id ON caretaker_patients(patient_id)'
      ];

      createIndexes.forEach(sql => {
        db.run(sql, (err) => {
          if (err) {
            console.error('❌ Database index creation error:', err)
            reject(err);
          }
        });
      });

      console.log('✅ Database initialization queued successfully.');
      resolve();
    });
  });
};

const cleanupOldData = () => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM notifications WHERE created_at < datetime('now', '-30 days')`, function(err) {
      if (err) {
        reject(err)
        return
      }
      
      const notificationsDeleted = this.changes
      
      db.run(`DELETE FROM messages WHERE created_at < datetime('now', '-90 days')`, function(err) {
        if (err) {
          reject(err)
          return
        }
        
        const messagesDeleted = this.changes
        const result = { notificationsDeleted, messagesDeleted }
        
        console.log(`🧹 Cleanup completed: ${notificationsDeleted} notifications, ${messagesDeleted} messages deleted`)
        resolve(result)
      })
    })
  })
}

const getDatabaseStats = () => {
  return new Promise((resolve, reject) => {
    const tables = [
      'users',
      'medications',
      'medication_logs',
      'notifications',
      'messages',
      'caretaker_patients',
      'medication_reminders',
      'user_preferences'
    ]
    
    const stats = {}
    let completed = 0
    
    tables.forEach(table => {
      db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
        if (err) {
          reject(err)
          return
        }
        
        stats[table] = row.count
        completed++
        
        if (completed === tables.length) {
          resolve(stats)
        }
      })
    })
  })
}

const closeDatabase = () => {
  return new Promise((resolve) => {
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err)
      } else {
        console.log('🔌 Database connection closed')
      }
      resolve()
    })
  })
}

module.exports = {
  db,
  runQuery,
  getQuery,
  allQuery,
  initializeDatabase,
  cleanupOldData,
  getDatabaseStats,
  closeDatabase
}