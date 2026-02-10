import { NextRequest, NextResponse } from 'next/server';
import {
  getGuideById,
  addSkippedRace,
  removeSkippedRace,
  addSkippedCandidate,
  removeSkippedCandidate,
  trackEvent
} from '@/lib/db-repository';

interface RouteParams {
  params: Promise<{ guideId: string }>;
}

// POST /api/guides/[guideId]/skip - Skip or unskip a race/candidate
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { guideId } = await params;
    const body = await request.json();

    const guide = await getGuideById(guideId);
    if (!guide) {
      return NextResponse.json(
        { error: 'Guide not found' },
        { status: 404 }
      );
    }

    const { type, raceId, candidateId, skip } = body;

    if (type === 'race') {
      if (skip) {
        await addSkippedRace(guideId, raceId);
      } else {
        await removeSkippedRace(guideId, raceId);
      }

      await trackEvent({
        eventType: skip ? 'race_skipped' : 'race_unskipped',
        guideId,
        raceId,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      });
    } else if (type === 'candidate') {
      if (skip) {
        await addSkippedCandidate(guideId, raceId, candidateId);
      } else {
        await removeSkippedCandidate(guideId, raceId, candidateId);
      }

      await trackEvent({
        eventType: skip ? 'candidate_skipped' : 'candidate_unskipped',
        guideId,
        raceId,
        candidateId,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      });
    }

    // Return updated guide
    const updatedGuide = await getGuideById(guideId);
    return NextResponse.json({ guide: updatedGuide });
  } catch (error) {
    console.error('Error updating skip status:', error);
    return NextResponse.json(
      { error: 'Failed to update skip status' },
      { status: 500 }
    );
  }
}
