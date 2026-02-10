import { createClient, type Client } from '@libsql/client';

// Singleton database client
let client: Client | null = null;
let initialized = false;

export function getDb(): Client {
  if (!client) {
    // Use Turso cloud database if configured, otherwise use local file
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (url && authToken) {
      // Production: Use Turso cloud database
      client = createClient({
        url,
        authToken,
      });
    } else {
      // Development: Use local SQLite file
      const path = require('path');
      const fs = require('fs');
      const dbPath = path.join(process.cwd(), 'data', 'voter-guide.db');
      const dataDir = path.dirname(dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      client = createClient({
        url: `file:${dbPath}`,
      });
    }
  }
  return client;
}

export async function initializeDb(): Promise<void> {
  if (initialized) return;

  const db = getDb();

  // Voter Guides table (with all columns including new ones)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS voter_guides (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_photo TEXT,
      author_bio TEXT,
      banner_photo TEXT,
      ballot_id TEXT,
      ballot_name TEXT,
      ballot_location TEXT,
      is_published INTEGER DEFAULT 0,
      social_links TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Recommendations table
  await db.execute(`
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
  await db.execute(`
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
  await db.execute(`
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
  await db.execute(`
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
  await db.execute(`
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
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_recommendations_guide ON recommendations(guide_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_skipped_races_guide ON skipped_races(guide_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_skipped_candidates_guide ON skipped_candidates(guide_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_user_events_guide ON user_events(guide_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_user_events_type ON user_events(event_type)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_user_events_created ON user_events(created_at)`);

  // Add missing columns to existing tables (for migrations)
  try {
    await db.execute(`ALTER TABLE voter_guides ADD COLUMN ballot_id TEXT`);
  } catch {
    // Column already exists, ignore
  }
  try {
    await db.execute(`ALTER TABLE voter_guides ADD COLUMN banner_photo TEXT`);
  } catch {
    // Column already exists, ignore
  }

  initialized = true;
}

// Helper to close the database (for testing)
export function closeDb() {
  if (client) {
    client.close();
    client = null;
    initialized = false;
  }
}
