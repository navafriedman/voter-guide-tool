import { NextRequest, NextResponse } from 'next/server';
import { getGuideById, saveRecommendation, deleteRecommendation, trackEvent } from '@/lib/db-repository';
import type { CandidateRecommendation } from '@/types';

interface RouteParams {
  params: Promise<{ guideId: string }>;
}

// POST /api/guides/[guideId]/recommendations - Add/update a recommendation
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { guideId } = await params;
    const body = await request.json() as CandidateRecommendation;

    const guide = getGuideById(guideId);
    if (!guide) {
      return NextResponse.json(
        { error: 'Guide not found' },
        { status: 404 }
      );
    }

    // If status is 'none', delete the recommendation instead
    if (body.status === 'none') {
      deleteRecommendation(guideId, body.raceId, body.candidateId);
    } else {
      saveRecommendation(guideId, body);
    }

    // Track recommendation event
    trackEvent({
      eventType: 'recommendation_changed',
      guideId,
      raceId: body.raceId,
      candidateId: body.candidateId,
      metadata: {
        status: body.status,
        hasReason: !!body.reason,
      },
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    // Return updated guide
    const updatedGuide = getGuideById(guideId);
    return NextResponse.json({ guide: updatedGuide });
  } catch (error) {
    console.error('Error saving recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to save recommendation' },
      { status: 500 }
    );
  }
}
