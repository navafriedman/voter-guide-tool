import { NextRequest, NextResponse } from 'next/server';
import { getAllGuides, createGuide, trackEvent } from '@/lib/db-repository';
import type { VoterGuide } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// GET /api/guides - List all guides
export async function GET() {
  try {
    const guides = await getAllGuides();
    return NextResponse.json({ guides });
  } catch (error) {
    console.error('Error fetching guides:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guides' },
      { status: 500 }
    );
  }
}

// POST /api/guides - Create a new guide
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date().toISOString();

    const guide: VoterGuide = {
      id: body.id || uuidv4(),
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
      createdAt: now,
      updatedAt: now,
      recommendations: body.recommendations || [],
      skippedRaces: body.skippedRaces || [],
      skippedCandidates: body.skippedCandidates || [],
    };

    const created = await createGuide(guide);

    // Track event
    await trackEvent({
      eventType: 'guide_created',
      guideId: created.id,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({ guide: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating guide:', error);
    return NextResponse.json(
      { error: 'Failed to create guide' },
      { status: 500 }
    );
  }
}
