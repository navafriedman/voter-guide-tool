import { NextRequest, NextResponse } from 'next/server';
import { getEvents, trackEvent } from '@/lib/db-repository';

// GET /api/events - Get events with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const options = {
      eventType: searchParams.get('eventType') || undefined,
      guideId: searchParams.get('guideId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const result = await getEvents(options);

    return NextResponse.json({
      events: result.events.map(e => ({
        id: e.id,
        eventType: e.event_type,
        guideId: e.guide_id,
        raceId: e.race_id,
        candidateId: e.candidate_id,
        metadata: e.metadata ? JSON.parse(e.metadata) : null,
        sessionId: e.session_id,
        createdAt: e.created_at,
      })),
      total: result.total,
      limit: options.limit,
      offset: options.offset,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST /api/events - Track a new event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    await trackEvent({
      eventType: body.eventType,
      guideId: body.guideId,
      raceId: body.raceId,
      candidateId: body.candidateId,
      metadata: body.metadata,
      sessionId: body.sessionId,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error tracking event:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}
