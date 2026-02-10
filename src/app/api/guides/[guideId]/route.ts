import { NextRequest, NextResponse } from 'next/server';
import { getGuideById, updateGuide, createGuide, deleteGuide, trackEvent } from '@/lib/db-repository';
import type { VoterGuide } from '@/types';

interface RouteParams {
  params: Promise<{ guideId: string }>;
}

// GET /api/guides/[guideId] - Get a single guide
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { guideId } = await params;
    const guide = await getGuideById(guideId);

    if (!guide) {
      return NextResponse.json(
        { error: 'Guide not found' },
        { status: 404 }
      );
    }

    // Track view event
    await trackEvent({
      eventType: 'guide_viewed',
      guideId,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({ guide });
  } catch (error) {
    console.error('Error fetching guide:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guide' },
      { status: 500 }
    );
  }
}

// PUT /api/guides/[guideId] - Update or create a guide (upsert)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { guideId } = await params;
    const body = await request.json();

    const existingGuide = await getGuideById(guideId);

    let resultGuide: VoterGuide;
    let eventType: string;

    if (!existingGuide) {
      // Guide doesn't exist in cloud - create it
      const now = new Date().toISOString();
      const newGuide: VoterGuide = {
        id: guideId,
        name: body.name || 'Untitled Guide',
        authorName: body.authorName || 'Anonymous',
        authorPhoto: body.authorPhoto,
        authorBio: body.authorBio,
        bannerPhoto: body.bannerPhoto,
        ballotId: body.ballotId,
        ballotName: body.ballotName,
        ballotLocation: body.ballotLocation,
        isPublished: body.isPublished || false,
        socialLinks: body.socialLinks,
        createdAt: body.createdAt || now,
        updatedAt: now,
        recommendations: body.recommendations || [],
        skippedRaces: body.skippedRaces || [],
        skippedCandidates: body.skippedCandidates || [],
      };
      resultGuide = await createGuide(newGuide);
      eventType = 'guide_created_from_sync';
    } else {
      // Guide exists - update it
      resultGuide = await updateGuide({
        ...existingGuide,
        ...body,
        id: guideId, // Ensure ID doesn't change
      });
      eventType = 'guide_updated';
    }

    // Track event
    await trackEvent({
      eventType,
      guideId,
      metadata: { updatedFields: Object.keys(body) },
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({ guide: resultGuide });
  } catch (error) {
    console.error('Error updating guide:', error);
    return NextResponse.json(
      { error: 'Failed to update guide' },
      { status: 500 }
    );
  }
}

// DELETE /api/guides/[guideId] - Delete a guide
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { guideId } = await params;
    const deleted = await deleteGuide(guideId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Guide not found' },
        { status: 404 }
      );
    }

    // Track delete event
    await trackEvent({
      eventType: 'guide_deleted',
      guideId,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting guide:', error);
    return NextResponse.json(
      { error: 'Failed to delete guide' },
      { status: 500 }
    );
  }
}
