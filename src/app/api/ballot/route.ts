import { NextRequest, NextResponse } from 'next/server';
import { getBallotData, saveBallotData, trackEvent } from '@/lib/db-repository';
import type { BallotData } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// GET /api/ballot?id=xxx - Get ballot data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Ballot ID is required' },
        { status: 400 }
      );
    }

    const ballot = await getBallotData(id);
    if (!ballot) {
      return NextResponse.json(
        { error: 'Ballot not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ballot });
  } catch (error) {
    console.error('Error fetching ballot:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ballot' },
      { status: 500 }
    );
  }
}

// POST /api/ballot - Save ballot data (from CSV import)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const ballot: BallotData = {
      id: body.id || uuidv4(),
      name: body.name || 'Untitled Ballot',
      location: body.location,
      races: body.races || [],
    };

    const saved = await saveBallotData(ballot);

    // Track event
    await trackEvent({
      eventType: 'ballot_imported',
      metadata: {
        ballotId: saved.id,
        raceCount: saved.races.length,
        candidateCount: saved.races.reduce((sum, r) => sum + r.candidates.length, 0),
      },
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({ ballot: saved }, { status: 201 });
  } catch (error) {
    console.error('Error saving ballot:', error);
    return NextResponse.json(
      { error: 'Failed to save ballot' },
      { status: 500 }
    );
  }
}
