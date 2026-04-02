const Database = require('better-sqlite3');
const db = new Database('./prisma/dev.db');

try {
  db.exec('ALTER TABLE User ADD COLUMN role TEXT NOT NULL DEFAULT "user"');
  console.log('✅ role column added to User table');
} catch (e) {
  if (e.message.includes('duplicate column')) {
    console.log('ℹ️  role column already exists, skipping');
  } else {
    console.error('❌ Error:', e.message);
  }
}

db.close();
