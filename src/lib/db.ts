import Database from 'better-sqlite3';
import path from 'path';

// Database file location
const DB_PATH = path.join(process.cwd(), 'data', 'voter-guide.db');

// Singleton database instance
let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    // Ensure data directory exists
    const fs = require('fs');
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(db: Database.Database) {
  // Voter Guides table
  db.exec(`
    CREATE TABLE IF NOT EXISTS voter_guides (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_photo TEXT,
      author_bio TEXT,
      ballot_name TEXT,
      ballot_location TEXT,
      is_published INTEGER DEFAULT 0,
      social_links TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Recommendations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guide_id TEXT NOT NULL,
      race_id TEXT NOT NULL,
      candidate_id TEXT NOT NULL,
      status TEXT NOT NULL,
      reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (guide_id) REFERENCES voter_guides(id) ON DELETE CASCADE,
      UNIQUE(guide_id, race_id, candidate_id)
    )
  `);

  // Skipped races table
  db.exec(`
    CREATE TABLE IF NOT EXISTS skipped_races (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guide_id TEXT NOT NULL,
      race_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (guide_id) REFERENCES voter_guides(id) ON DELETE CASCADE,
      UNIQUE(guide_id, race_id)
    )
  `);

  // Skipped candidates table
  db.exec(`
    CREATE TABLE IF NOT EXISTS skipped_candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guide_id TEXT NOT NULL,
      race_id TEXT NOT NULL,
      candidate_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (guide_id) REFERENCES voter_guides(id) ON DELETE CASCADE,
      UNIQUE(guide_id, race_id, candidate_id)
    )
  `);

  // Ballot data table (stores imported CSV data)
  db.exec(`
    CREATE TABLE IF NOT EXISTS ballot_data (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // User events table for tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      guide_id TEXT,
      race_id TEXT,
      candidate_id TEXT,
      metadata TEXT,
      session_id TEXT,
      user_agent TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL
    )
  `);

  // Create indexes for faster queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_recommendations_guide ON recommendations(guide_id);
    CREATE INDEX IF NOT EXISTS idx_skipped_races_guide ON skipped_races(guide_id);
    CREATE INDEX IF NOT EXISTS idx_skipped_candidates_guide ON skipped_candidates(guide_id);
    CREATE INDEX IF NOT EXISTS idx_user_events_guide ON user_events(guide_id);
    CREATE INDEX IF NOT EXISTS idx_user_events_type ON user_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_user_events_created ON user_events(created_at);
  `);
}

// Helper to close the database (for testing)
export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
