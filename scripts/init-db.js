const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

// Simple environment loading since dotenv is not a dependency
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.development');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          let val = parts.slice(1).join('=').trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          if (process.env[key] === undefined) {
            process.env[key] = val;
          }
        }
      }
    });
  }
}

loadEnv();

const dbPath = process.env.DATABASE_PATH || './data/db.sqlite';
const dbDir = path.dirname(path.resolve(process.cwd(), dbPath));

console.log(`[Database Init] Checking directory: ${dbDir}`);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`[Database Init] Created directory: ${dbDir}`);
}

const db = new Database(dbPath);
console.log(`[Database Init] Connected to database at: ${dbPath}`);

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS signatures (
    form_slug TEXT NOT NULL,
    regno TEXT NOT NULL,
    signature_token TEXT NOT NULL,
    signature_base64 TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (form_slug, regno)
  );
`);

console.log('[Database Init] Tables validated/created.');

db.close();
console.log('[Database Init] Setup completed successfully.');
