import { NextRequest, NextResponse } from 'next/server';
import { getGuideById, getBallotData } from '@/lib/db-repository';

interface RouteParams {
  params: Promise<{ guideId: string }>;
}

// GET /api/debug/[guideId] - Debug endpoint to check database state
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { guideId } = await params;

    // Get guide from database
    const guide = await getGuideById(guideId);

    if (!guide) {
      return NextResponse.json({
        guideExists: false,
        message: 'Guide not found in database'
      });
    }

    // Check if ballot exists
    let ballot = null;
    if (guide.ballotId) {
      ballot = await getBallotData(guide.ballotId);
    }

    return NextResponse.json({
      guideExists: true,
      guideName: guide.name,
      ballotId: guide.ballotId || 'NOT SET',
      ballotExists: !!ballot,
      ballotName: ballot?.name || 'N/A',
      ballotRaceCount: ballot?.races?.length || 0,
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: String(error) },
      { status: 500 }
    );
  }
}
