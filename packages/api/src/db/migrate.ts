import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(__dirname, '..', '..', 'openconductor.db');

// Ensure the directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Create the servers table with FTS support
const createTables = `
  CREATE TABLE IF NOT EXISTS servers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    repository TEXT NOT NULL,
    npm_package TEXT,
    category TEXT NOT NULL CHECK(category IN ('memory', 'filesystem', 'database', 'api', 'custom')),
    tags TEXT NOT NULL, -- JSON array as string
    github_stars INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    last_updated TEXT NOT NULL,
    installation TEXT NOT NULL, -- JSON object as string
    config_example TEXT NOT NULL, -- JSON object as string
    verified BOOLEAN DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Create FTS virtual table for search
  CREATE VIRTUAL TABLE IF NOT EXISTS servers_fts USING fts5(
    name, description, tags,
    content='servers',
    content_rowid='rowid'
  );

  -- Create triggers to keep FTS in sync
  CREATE TRIGGER IF NOT EXISTS servers_ai AFTER INSERT ON servers BEGIN
    INSERT INTO servers_fts(rowid, name, description, tags) VALUES (new.rowid, new.name, new.description, new.tags);
  END;

  CREATE TRIGGER IF NOT EXISTS servers_ad AFTER DELETE ON servers BEGIN
    INSERT INTO servers_fts(servers_fts, rowid, name, description, tags) VALUES('delete', old.rowid, old.name, old.description, old.tags);
  END;

  CREATE TRIGGER IF NOT EXISTS servers_au AFTER UPDATE ON servers BEGIN
    INSERT INTO servers_fts(servers_fts, rowid, name, description, tags) VALUES('delete', old.rowid, old.name, old.description, old.tags);
    INSERT INTO servers_fts(rowid, name, description, tags) VALUES (new.rowid, new.name, new.description, new.tags);
  END;

  -- Create index for better performance
  CREATE INDEX IF NOT EXISTS idx_servers_category ON servers(category);
  CREATE INDEX IF NOT EXISTS idx_servers_verified ON servers(verified);
`;

try {
  console.log('🗄️ Running database migrations...');
  db.exec(createTables);
  console.log('✅ Database migration completed successfully');
} catch (error) {
  console.error('❌ Database migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}