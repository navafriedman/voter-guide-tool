import { getDb } from './db';
import type { VoterGuide, BallotData, CandidateRecommendation, SkippedCandidate, RecommendationStatus } from '@/types';

// ============================================
// VOTER GUIDES
// ============================================

export function getAllGuides(): VoterGuide[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM voter_guides ORDER BY updated_at DESC
  `).all() as DbGuideRow[];

  return rows.map(rowToGuide);
}

export function getGuideById(id: string): VoterGuide | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT * FROM voter_guides WHERE id = ?
  `).get(id) as DbGuideRow | undefined;

  if (!row) return null;
  return rowToGuide(row);
}

export function createGuide(guide: VoterGuide): VoterGuide {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO voter_guides (
      id, name, author_name, author_photo, author_bio,
      ballot_name, ballot_location, is_published, social_links,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    guide.id,
    guide.name,
    guide.authorName,
    guide.authorPhoto || null,
    guide.authorBio || null,
    guide.ballotName || null,
    guide.ballotLocation || null,
    guide.isPublished ? 1 : 0,
    guide.socialLinks ? JSON.stringify(guide.socialLinks) : null,
    guide.createdAt || now,
    now
  );

  // Save recommendations if any
  if (guide.recommendations?.length) {
    for (const rec of guide.recommendations) {
      saveRecommendation(guide.id, rec);
    }
  }

  // Save skipped races if any
  if (guide.skippedRaces?.length) {
    for (const raceId of guide.skippedRaces) {
      addSkippedRace(guide.id, raceId);
    }
  }

  // Save skipped candidates if any
  if (guide.skippedCandidates?.length) {
    for (const sc of guide.skippedCandidates) {
      addSkippedCandidate(guide.id, sc.raceId, sc.candidateId);
    }
  }

  return getGuideById(guide.id)!;
}

export function updateGuide(guide: VoterGuide): VoterGuide {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE voter_guides SET
      name = ?,
      author_name = ?,
      author_photo = ?,
      author_bio = ?,
      ballot_name = ?,
      ballot_location = ?,
      is_published = ?,
      social_links = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    guide.name,
    guide.authorName,
    guide.authorPhoto || null,
    guide.authorBio || null,
    guide.ballotName || null,
    guide.ballotLocation || null,
    guide.isPublished ? 1 : 0,
    guide.socialLinks ? JSON.stringify(guide.socialLinks) : null,
    now,
    guide.id
  );

  return getGuideById(guide.id)!;
}

export function deleteGuide(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM voter_guides WHERE id = ?').run(id);
  return result.changes > 0;
}

// ============================================
// RECOMMENDATIONS
// ============================================

export function getRecommendations(guideId: string): CandidateRecommendation[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT race_id, candidate_id, status, reason
    FROM recommendations WHERE guide_id = ?
  `).all(guideId) as DbRecommendationRow[];

  return rows.map(row => ({
    raceId: row.race_id,
    candidateId: row.candidate_id,
    status: row.status as RecommendationStatus,
    reason: row.reason || undefined,
  }));
}

export function saveRecommendation(guideId: string, rec: CandidateRecommendation): void {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO recommendations (guide_id, race_id, candidate_id, status, reason, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(guide_id, race_id, candidate_id)
    DO UPDATE SET status = excluded.status, reason = excluded.reason, updated_at = excluded.updated_at
  `).run(
    guideId,
    rec.raceId,
    rec.candidateId,
    rec.status,
    rec.reason || null,
    now,
    now
  );

  // Update guide's updated_at
  db.prepare('UPDATE voter_guides SET updated_at = ? WHERE id = ?').run(now, guideId);
}

export function deleteRecommendation(guideId: string, raceId: string, candidateId: string): void {
  const db = getDb();
  db.prepare(`
    DELETE FROM recommendations
    WHERE guide_id = ? AND race_id = ? AND candidate_id = ?
  `).run(guideId, raceId, candidateId);
}

// ============================================
// SKIPPED ITEMS
// ============================================

export function getSkippedRaces(guideId: string): string[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT race_id FROM skipped_races WHERE guide_id = ?
  `).all(guideId) as { race_id: string }[];

  return rows.map(row => row.race_id);
}

export function addSkippedRace(guideId: string, raceId: string): void {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT OR IGNORE INTO skipped_races (guide_id, race_id, created_at)
    VALUES (?, ?, ?)
  `).run(guideId, raceId, now);
}

export function removeSkippedRace(guideId: string, raceId: string): void {
  const db = getDb();
  db.prepare(`
    DELETE FROM skipped_races WHERE guide_id = ? AND race_id = ?
  `).run(guideId, raceId);
}

export function getSkippedCandidates(guideId: string): SkippedCandidate[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT race_id, candidate_id FROM skipped_candidates WHERE guide_id = ?
  `).all(guideId) as { race_id: string; candidate_id: string }[];

  return rows.map(row => ({
    raceId: row.race_id,
    candidateId: row.candidate_id,
  }));
}

export function addSkippedCandidate(guideId: string, raceId: string, candidateId: string): void {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT OR IGNORE INTO skipped_candidates (guide_id, race_id, candidate_id, created_at)
    VALUES (?, ?, ?, ?)
  `).run(guideId, raceId, candidateId, now);
}

export function removeSkippedCandidate(guideId: string, raceId: string, candidateId: string): void {
  const db = getDb();
  db.prepare(`
    DELETE FROM skipped_candidates WHERE guide_id = ? AND race_id = ? AND candidate_id = ?
  `).run(guideId, raceId, candidateId);
}

// ============================================
// BALLOT DATA
// ============================================

export function getBallotData(id: string): BallotData | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT * FROM ballot_data WHERE id = ?
  `).get(id) as DbBallotRow | undefined;

  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    location: row.location || undefined,
    races: JSON.parse(row.data),
  };
}

export function saveBallotData(ballot: BallotData): BallotData {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO ballot_data (id, name, location, data, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id)
    DO UPDATE SET name = excluded.name, location = excluded.location, data = excluded.data, updated_at = excluded.updated_at
  `).run(
    ballot.id,
    ballot.name,
    ballot.location || null,
    JSON.stringify(ballot.races),
    now,
    now
  );

  return getBallotData(ballot.id)!;
}

// ============================================
// USER EVENTS (TRACKING)
// ============================================

export interface UserEvent {
  eventType: string;
  guideId?: string;
  raceId?: string;
  candidateId?: string;
  metadata?: Record<string, unknown>;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
}

export function trackEvent(event: UserEvent): void {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO user_events (
      event_type, guide_id, race_id, candidate_id,
      metadata, session_id, user_agent, ip_address, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    event.eventType,
    event.guideId || null,
    event.raceId || null,
    event.candidateId || null,
    event.metadata ? JSON.stringify(event.metadata) : null,
    event.sessionId || null,
    event.userAgent || null,
    event.ipAddress || null,
    now
  );
}

export function getEvents(options: {
  eventType?: string;
  guideId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
} = {}): { events: DbEventRow[]; total: number } {
  const db = getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (options.eventType) {
    conditions.push('event_type = ?');
    params.push(options.eventType);
  }
  if (options.guideId) {
    conditions.push('guide_id = ?');
    params.push(options.guideId);
  }
  if (options.startDate) {
    conditions.push('created_at >= ?');
    params.push(options.startDate);
  }
  if (options.endDate) {
    conditions.push('created_at <= ?');
    params.push(options.endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countRow = db.prepare(`
    SELECT COUNT(*) as count FROM user_events ${whereClause}
  `).get(...params) as { count: number };

  // Get events with pagination
  const limit = options.limit || 100;
  const offset = options.offset || 0;

  const events = db.prepare(`
    SELECT * FROM user_events ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as DbEventRow[];

  return { events, total: countRow.count };
}

// ============================================
// HELPER TYPES AND FUNCTIONS
// ============================================

interface DbGuideRow {
  id: string;
  name: string;
  author_name: string;
  author_photo: string | null;
  author_bio: string | null;
  ballot_name: string | null;
  ballot_location: string | null;
  is_published: number;
  social_links: string | null;
  created_at: string;
  updated_at: string;
}

interface DbRecommendationRow {
  race_id: string;
  candidate_id: string;
  status: string;
  reason: string | null;
}

interface DbBallotRow {
  id: string;
  name: string;
  location: string | null;
  data: string;
}

export interface DbEventRow {
  id: number;
  event_type: string;
  guide_id: string | null;
  race_id: string | null;
  candidate_id: string | null;
  metadata: string | null;
  session_id: string | null;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
}

function rowToGuide(row: DbGuideRow): VoterGuide {
  const guideId = row.id;

  return {
    id: row.id,
    name: row.name,
    authorName: row.author_name,
    authorPhoto: row.author_photo || undefined,
    authorBio: row.author_bio || undefined,
    ballotName: row.ballot_name || undefined,
    ballotLocation: row.ballot_location || undefined,
    isPublished: row.is_published === 1,
    socialLinks: row.social_links ? JSON.parse(row.social_links) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    recommendations: getRecommendations(guideId),
    skippedRaces: getSkippedRaces(guideId),
    skippedCandidates: getSkippedCandidates(guideId),
  };
}
