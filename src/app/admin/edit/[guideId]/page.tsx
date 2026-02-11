'use client';

import { useState, useMemo, use, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Vote, AlertCircle, Share2 } from 'lucide-react';
import { GuideEditor } from '@/components/GuideEditor';
import type { VoterGuide, BallotData } from '@/types';
import { getGuideById, getBallotData, saveGuide, saveBallotData } from '@/lib/storage';
import { fetchGuide, fetchBallot, trackWithSession } from '@/lib/api-client';
import { useHydrated } from '@/lib/hooks';

interface EditGuidePageProps {
  params: Promise<{ guideId: string }>;
}

export default function EditGuidePage({ params }: EditGuidePageProps) {
  const { guideId } = use(params);
  const hydrated = useHydrated();
  const [guideState, setGuideState] = useState<VoterGuide | null>(null);
  const [ballotState, setBallotState] = useState<BallotData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedFromDb, setLoadedFromDb] = useState(false);

  // First try localStorage
  const localGuide = useMemo(() => {
    if (!hydrated) return null;
    return getGuideById(guideId);
  }, [hydrated, guideId]);

  const localBallot = useMemo<BallotData | null>(() => {
    if (!hydrated) return null;
    return getBallotData();
  }, [hydrated]);

  // Fetch from database if needed (guide missing OR ballot missing)
  useEffect(() => {
    async function loadFromDatabase() {
      if (!hydrated || isLoading || loadedFromDb) return;

      // Determine what we need to fetch
      // Also re-fetch guide if it's missing ballotId (stale cache)
      const needGuide = !localGuide || !localGuide.ballotId;
      const needBallot = !localBallot;

      // If we have everything locally, no need to fetch
      if (!needGuide && !needBallot) {
        setLoadedFromDb(true);
        return;
      }

      setIsLoading(true);
      try {
        let guideToUse = localGuide;

        // Fetch guide if we don't have it
        if (needGuide) {
          console.log('Fetching guide from database...', guideId);
          const dbGuide = await fetchGuide(guideId);
          console.log('Fetched guide:', dbGuide?.name, 'ballotId:', dbGuide?.ballotId);

          if (dbGuide) {
            saveGuide(dbGuide);
            setGuideState(dbGuide);
            guideToUse = dbGuide;
            trackWithSession('shared_link_accessed', { guideId: dbGuide.id });
          }
        }

        // Fetch ballot if we don't have it (and we have a guide with ballotId)
        if (needBallot && guideToUse?.ballotId) {
          console.log('Fetching ballot from database...', guideToUse.ballotId);
          const dbBallot = await fetchBallot(guideToUse.ballotId);
          console.log('Fetched ballot:', dbBallot?.name, 'races:', dbBallot?.races?.length);
          if (dbBallot) {
            saveBallotData(dbBallot);
            setBallotState(dbBallot);
          }
        }

        setLoadedFromDb(true);
      } catch (error) {
        console.error('Failed to load from database:', error);
        setLoadedFromDb(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadFromDatabase();
  }, [hydrated, localGuide, localBallot, guideId, isLoading, loadedFromDb]);

  const guide = guideState ?? localGuide;
  const ballot = ballotState ?? localBallot;
  const notFound = hydrated && !guide && loadedFromDb && !isLoading;

  const handleGuideUpdate = (updatedGuide: VoterGuide) => {
    setGuideState(updatedGuide);
  };

  if (!hydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">
          {isLoading ? 'Loading guide from server...' : 'Loading...'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-400 hover:text-gray-600">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Vote className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {guide ? `Edit: ${guide.name}` : 'Edit Voter Guide'}
                  </h1>
                  <p className="text-sm text-gray-500">Update your endorsements</p>
                </div>
              </div>
            </div>
            {guide && (
              <button
                onClick={() => {
                  const editUrl = `${window.location.origin}/admin/edit/${guideId}`;
                  navigator.clipboard.writeText(editUrl);
                  alert('Edit link copied! Share this link with collaborators.');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
              >
                <Share2 className="w-4 h-4" />
                Copy Edit Link
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Not Found */}
        {notFound && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-red-800 mb-2">Guide Not Found</h2>
            <p className="text-red-600 mb-4">
              The voter guide you&apos;re looking for doesn&apos;t exist or has been deleted.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        )}

        {/* No ballot warning */}
        {!ballot && !notFound && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">No ballot data loaded</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  You need to load ballot data to edit this guide.{' '}
                  <Link href="/admin" className="underline hover:no-underline">
                    Go to Admin Panel
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Edit Guide */}
        {guide && ballot && (
          <GuideEditor
            guide={guide}
            ballot={ballot}
            onGuideUpdate={handleGuideUpdate}
          />
        )}
      </main>
    </div>
  );
}
