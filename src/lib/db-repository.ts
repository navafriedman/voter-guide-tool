import { getDb, initializeDb } from './db';
import type { VoterGuide, BallotData, CandidateRecommendation, SkippedCandidate, RecommendationStatus } from '@/types';

// ============================================
// VOTER GUIDES
// ============================================

export async function getAllGuides(): Promise<VoterGuide[]> {
  await initializeDb();
  const db = getDb();
  const result = await db.execute(`
    SELECT * FROM voter_guides ORDER BY updated_at DESC
  `);

  const guides: VoterGuide[] = [];
  for (const row of result.rows) {
    guides.push(await rowToGuide(row as unknown as DbGuideRow));
  }
  return guides;
}

export async function getGuideById(id: string): Promise<VoterGuide | null> {
  await initializeDb();
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT * FROM voter_guides WHERE id = ?`,
    args: [id],
  });

  if (result.rows.length === 0) return null;
  return rowToGuide(result.rows[0] as unknown as DbGuideRow);
}

export async function createGuide(guide: VoterGuide): Promise<VoterGuide> {
  await initializeDb();
  const db = getDb();
  const now = new Date().toISOString();

  await db.execute({
    sql: `
      INSERT INTO voter_guides (
        id, name, author_name, author_photo, author_bio, banner_photo,
        ballot_id, ballot_name, ballot_location, is_published, social_links,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      guide.id,
      guide.name,
      guide.authorName,
      guide.authorPhoto || null,
      guide.authorBio || null,
      guide.bannerPhoto || null,
      guide.ballotId || null,
      guide.ballotName || null,
      guide.ballotLocation || null,
      guide.isPublished ? 1 : 0,
      guide.socialLinks ? JSON.stringify(guide.socialLinks) : null,
      guide.createdAt || now,
      now,
    ],
  });

  // Save recommendations if any
  if (guide.recommendations?.length) {
    for (const rec of guide.recommendations) {
      await saveRecommendation(guide.id, rec);
    }
  }

  // Save skipped races if any
  if (guide.skippedRaces?.length) {
    for (const raceId of guide.skippedRaces) {
      await addSkippedRace(guide.id, raceId);
    }
  }

  // Save skipped candidates if any
  if (guide.skippedCandidates?.length) {
    for (const sc of guide.skippedCandidates) {
      await addSkippedCandidate(guide.id, sc.raceId, sc.candidateId);
    }
  }

  return (await getGuideById(guide.id))!;
}

export async function updateGuide(guide: VoterGuide): Promise<VoterGuide> {
  await initializeDb();
  const db = getDb();
  const now = new Date().toISOString();

  await db.execute({
    sql: `
      UPDATE voter_guides SET
        name = ?,
        author_name = ?,
        author_photo = ?,
        author_bio = ?,
        banner_photo = ?,
        ballot_id = ?,
        ballot_name = ?,
        ballot_location = ?,
        is_published = ?,
        social_links = ?,
        updated_at = ?
      WHERE id = ?
    `,
    args: [
      guide.name,
      guide.authorName,
      guide.authorPhoto || null,
      guide.authorBio || null,
      guide.bannerPhoto || null,
      guide.ballotId || null,
      guide.ballotName || null,
      guide.ballotLocation || null,
      guide.isPublished ? 1 : 0,
      guide.socialLinks ? JSON.stringify(guide.socialLinks) : null,
      now,
      guide.id,
    ],
  });

  return (await getGuideById(guide.id))!;
}

export async function deleteGuide(id: string): Promise<boolean> {
  await initializeDb();
  const db = getDb();
  const result = await db.execute({
    sql: 'DELETE FROM voter_guides WHERE id = ?',
    args: [id],
  });
  return result.rowsAffected > 0;
}

// ============================================
// RECOMMENDATIONS
// ============================================

export async function getRecommendations(guideId: string): Promise<CandidateRecommendation[]> {
  await initializeDb();
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT race_id, candidate_id, status, reason FROM recommendations WHERE guide_id = ?`,
    args: [guideId],
  });

  return result.rows.map(row => ({
    raceId: row.race_id as string,
    candidateId: row.candidate_id as string,
    status: row.status as RecommendationStatus,
    reason: (row.reason as string) || undefined,
  }));
}

export async function saveRecommendation(guideId: string, rec: CandidateRecommendation): Promise<void> {
  await initializeDb();
  const db = getDb();
  const now = new Date().toISOString();

  await db.execute({
    sql: `
      INSERT INTO recommendations (guide_id, race_id, candidate_id, status, reason, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(guide_id, race_id, candidate_id)
      DO UPDATE SET status = excluded.status, reason = excluded.reason, updated_at = excluded.updated_at
    `,
    args: [guideId, rec.raceId, rec.candidateId, rec.status, rec.reason || null, now, now],
  });

  // Update guide's updated_at
  await db.execute({
    sql: 'UPDATE voter_guides SET updated_at = ? WHERE id = ?',
    args: [now, guideId],
  });
}

export async function deleteRecommendation(guideId: string, raceId: string, candidateId: string): Promise<void> {
  await initializeDb();
  const db = getDb();
  await db.execute({
    sql: `DELETE FROM recommendations WHERE guide_id = ? AND race_id = ? AND candidate_id = ?`,
    args: [guideId, raceId, candidateId],
  });
}

// ============================================
// SKIPPED ITEMS
// ============================================

export async function getSkippedRaces(guideId: string): Promise<string[]> {
  await initializeDb();
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT race_id FROM skipped_races WHERE guide_id = ?`,
    args: [guideId],
  });

  return result.rows.map(row => row.race_id as string);
}

export async function addSkippedRace(guideId: string, raceId: string): Promise<void> {
  await initializeDb();
  const db = getDb();
  const now = new Date().toISOString();

  await db.execute({
    sql: `INSERT OR IGNORE INTO skipped_races (guide_id, race_id, created_at) VALUES (?, ?, ?)`,
    args: [guideId, raceId, now],
  });
}

export async function removeSkippedRace(guideId: string, raceId: string): Promise<void> {
  await initializeDb();
  const db = getDb();
  await db.execute({
    sql: `DELETE FROM skipped_races WHERE guide_id = ? AND race_id = ?`,
    args: [guideId, raceId],
  });
}

export async function getSkippedCandidates(guideId: string): Promise<SkippedCandidate[]> {
  await initializeDb();
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT race_id, candidate_id FROM skipped_candidates WHERE guide_id = ?`,
    args: [guideId],
  });

  return result.rows.map(row => ({
    raceId: row.race_id as string,
    candidateId: row.candidate_id as string,
  }));
}

export async function addSkippedCandidate(guideId: string, raceId: string, candidateId: string): Promise<void> {
  await initializeDb();
  const db = getDb();
  const now = new Date().toISOString();

  await db.execute({
    sql: `INSERT OR IGNORE INTO skipped_candidates (guide_id, race_id, candidate_id, created_at) VALUES (?, ?, ?, ?)`,
    args: [guideId, raceId, candidateId, now],
  });
}

export async function removeSkippedCandidate(guideId: string, raceId: string, candidateId: string): Promise<void> {
  await initializeDb();
  const db = getDb();
  await db.execute({
    sql: `DELETE FROM skipped_candidates WHERE guide_id = ? AND race_id = ? AND candidate_id = ?`,
    args: [guideId, raceId, candidateId],
  });
}

// ============================================
// BALLOT DATA
// ============================================

export async function getBallotData(id: string): Promise<BallotData | null> {
  await initializeDb();
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT * FROM ballot_data WHERE id = ?`,
    args: [id],
  });

  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id as string,
    name: row.name as string,
    location: (row.location as string) || undefined,
    races: JSON.parse(row.data as string),
  };
}

export async function saveBallotData(ballot: BallotData): Promise<BallotData> {
  await initializeDb();
  const db = getDb();
  const now = new Date().toISOString();

  await db.execute({
    sql: `
      INSERT INTO ballot_data (id, name, location, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id)
      DO UPDATE SET name = excluded.name, location = excluded.location, data = excluded.data, updated_at = excluded.updated_at
    `,
    args: [ballot.id, ballot.name, ballot.location || null, JSON.stringify(ballot.races), now, now],
  });

  return (await getBallotData(ballot.id))!;
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

export async function trackEvent(event: UserEvent): Promise<void> {
  await initializeDb();
  const db = getDb();
  const now = new Date().toISOString();

  await db.execute({
    sql: `
      INSERT INTO user_events (
        event_type, guide_id, race_id, candidate_id,
        metadata, session_id, user_agent, ip_address, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      event.eventType,
      event.guideId || null,
      event.raceId || null,
      event.candidateId || null,
      event.metadata ? JSON.stringify(event.metadata) : null,
      event.sessionId || null,
      event.userAgent || null,
      event.ipAddress || null,
      now,
    ],
  });
}

export async function getEvents(options: {
  eventType?: string;
  guideId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ events: DbEventRow[]; total: number }> {
  await initializeDb();
  const db = getDb();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

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
  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM user_events ${whereClause}`,
    args: params,
  });
  const total = Number(countResult.rows[0].count);

  // Get events with pagination
  const limit = options.limit || 100;
  const offset = options.offset || 0;

  const eventsResult = await db.execute({
    sql: `SELECT * FROM user_events ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    args: [...params, limit, offset],
  });

  const events = eventsResult.rows.map(row => ({
    id: row.id as number,
    event_type: row.event_type as string,
    guide_id: row.guide_id as string | null,
    race_id: row.race_id as string | null,
    candidate_id: row.candidate_id as string | null,
    metadata: row.metadata as string | null,
    session_id: row.session_id as string | null,
    user_agent: row.user_agent as string | null,
    ip_address: row.ip_address as string | null,
    created_at: row.created_at as string,
  }));

  return { events, total };
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
  banner_photo: string | null;
  ballot_id: string | null;
  ballot_name: string | null;
  ballot_location: string | null;
  is_published: number;
  social_links: string | null;
  created_at: string;
  updated_at: string;
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

async function rowToGuide(row: DbGuideRow): Promise<VoterGuide> {
  const guideId = row.id;

  return {
    id: row.id,
    name: row.name,
    authorName: row.author_name,
    authorPhoto: row.author_photo || undefined,
    authorBio: row.author_bio || undefined,
    bannerPhoto: row.banner_photo || undefined,
    ballotId: row.ballot_id || undefined,
    ballotName: row.ballot_name || undefined,
    ballotLocation: row.ballot_location || undefined,
    isPublished: row.is_published === 1,
    socialLinks: row.social_links ? JSON.parse(row.social_links) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    recommendations: await getRecommendations(guideId),
    skippedRaces: await getSkippedRaces(guideId),
    skippedCandidates: await getSkippedCandidates(guideId),
  };
}
