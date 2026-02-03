import type { VoterGuide, BallotData, CandidateRecommendation } from '@/types';

const API_BASE = '/api';

// ============================================
// GUIDES
// ============================================

export async function fetchGuides(): Promise<VoterGuide[]> {
  const response = await fetch(`${API_BASE}/guides`);
  if (!response.ok) throw new Error('Failed to fetch guides');
  const data = await response.json();
  return data.guides;
}

export async function fetchGuide(guideId: string): Promise<VoterGuide | null> {
  const response = await fetch(`${API_BASE}/guides/${guideId}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Failed to fetch guide');
  const data = await response.json();
  return data.guide;
}

export async function createGuideApi(guide: Partial<VoterGuide>): Promise<VoterGuide> {
  const response = await fetch(`${API_BASE}/guides`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(guide),
  });
  if (!response.ok) throw new Error('Failed to create guide');
  const data = await response.json();
  return data.guide;
}

export async function updateGuideApi(guideId: string, updates: Partial<VoterGuide>): Promise<VoterGuide> {
  const response = await fetch(`${API_BASE}/guides/${guideId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update guide');
  const data = await response.json();
  return data.guide;
}

export async function deleteGuideApi(guideId: string): Promise<boolean> {
  const response = await fetch(`${API_BASE}/guides/${guideId}`, {
    method: 'DELETE',
  });
  return response.ok;
}

// ============================================
// RECOMMENDATIONS
// ============================================

export async function saveRecommendationApi(
  guideId: string,
  recommendation: CandidateRecommendation
): Promise<VoterGuide> {
  const response = await fetch(`${API_BASE}/guides/${guideId}/recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recommendation),
  });
  if (!response.ok) throw new Error('Failed to save recommendation');
  const data = await response.json();
  return data.guide;
}

// ============================================
// SKIP FUNCTIONALITY
// ============================================

export async function skipRaceApi(guideId: string, raceId: string, skip: boolean): Promise<VoterGuide> {
  const response = await fetch(`${API_BASE}/guides/${guideId}/skip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'race', raceId, skip }),
  });
  if (!response.ok) throw new Error('Failed to update skip status');
  const data = await response.json();
  return data.guide;
}

export async function skipCandidateApi(
  guideId: string,
  raceId: string,
  candidateId: string,
  skip: boolean
): Promise<VoterGuide> {
  const response = await fetch(`${API_BASE}/guides/${guideId}/skip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'candidate', raceId, candidateId, skip }),
  });
  if (!response.ok) throw new Error('Failed to update skip status');
  const data = await response.json();
  return data.guide;
}

// ============================================
// BALLOT DATA
// ============================================

export async function fetchBallot(ballotId: string): Promise<BallotData | null> {
  const response = await fetch(`${API_BASE}/ballot?id=${ballotId}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Failed to fetch ballot');
  const data = await response.json();
  return data.ballot;
}

export async function saveBallotApi(ballot: BallotData): Promise<BallotData> {
  const response = await fetch(`${API_BASE}/ballot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ballot),
  });
  if (!response.ok) throw new Error('Failed to save ballot');
  const data = await response.json();
  return data.ballot;
}

// ============================================
// EVENTS (TRACKING)
// ============================================

export async function trackEventApi(event: {
  eventType: string;
  guideId?: string;
  raceId?: string;
  candidateId?: string;
  metadata?: Record<string, unknown>;
  sessionId?: string;
}): Promise<void> {
  try {
    await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
  } catch (error) {
    // Silently fail for tracking - don't break the user experience
    console.warn('Failed to track event:', error);
  }
}

export interface EventFilter {
  eventType?: string;
  guideId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface EventResult {
  events: Array<{
    id: number;
    eventType: string;
    guideId: string | null;
    raceId: string | null;
    candidateId: string | null;
    metadata: Record<string, unknown> | null;
    sessionId: string | null;
    createdAt: string;
  }>;
  total: number;
  limit: number;
  offset: number;
}

export async function fetchEvents(filters: EventFilter = {}): Promise<EventResult> {
  const params = new URLSearchParams();
  if (filters.eventType) params.set('eventType', filters.eventType);
  if (filters.guideId) params.set('guideId', filters.guideId);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.limit) params.set('limit', filters.limit.toString());
  if (filters.offset) params.set('offset', filters.offset.toString());

  const response = await fetch(`${API_BASE}/events?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch events');
  return response.json();
}

// ============================================
// SESSION MANAGEMENT
// ============================================

let sessionId: string | null = null;

export function getSessionId(): string {
  if (!sessionId) {
    // Try to get from sessionStorage first
    if (typeof window !== 'undefined') {
      sessionId = sessionStorage.getItem('voter_guide_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem('voter_guide_session_id', sessionId);
      }
    } else {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
  }
  return sessionId;
}

// Convenience function to track with session
export async function trackWithSession(
  eventType: string,
  data: Omit<Parameters<typeof trackEventApi>[0], 'eventType' | 'sessionId'> = {}
): Promise<void> {
  return trackEventApi({
    ...data,
    eventType,
    sessionId: getSessionId(),
  });
}
