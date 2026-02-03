import { NextRequest, NextResponse } from 'next/server';
import { getGuideById, updateGuide, deleteGuide, trackEvent } from '@/lib/db-repository';

interface RouteParams {
  params: Promise<{ guideId: string }>;
}

// GET /api/guides/[guideId] - Get a single guide
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { guideId } = await params;
    const guide = getGuideById(guideId);

    if (!guide) {
      return NextResponse.json(
        { error: 'Guide not found' },
        { status: 404 }
      );
    }

    // Track view event
    trackEvent({
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

// PUT /api/guides/[guideId] - Update a guide
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { guideId } = await params;
    const body = await request.json();

    const existingGuide = getGuideById(guideId);
    if (!existingGuide) {
      return NextResponse.json(
        { error: 'Guide not found' },
        { status: 404 }
      );
    }

    const updatedGuide = updateGuide({
      ...existingGuide,
      ...body,
      id: guideId, // Ensure ID doesn't change
    });

    // Track update event
    trackEvent({
      eventType: 'guide_updated',
      guideId,
      metadata: { updatedFields: Object.keys(body) },
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({ guide: updatedGuide });
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
    const deleted = deleteGuide(guideId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Guide not found' },
        { status: 404 }
      );
    }

    // Track delete event
    trackEvent({
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
