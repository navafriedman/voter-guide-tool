'use client';

import { useState, use, useEffect } from 'react';
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
  const [guide, setGuide] = useState<VoterGuide | null>(null);
  const [ballot, setBallot] = useState<BallotData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Single effect to load everything
  useEffect(() => {
    if (!hydrated) return;

    async function loadData() {
      console.log('Loading data for guide:', guideId);

      try {
        // Step 1: Try to get guide from localStorage first, then DB
        let currentGuide = getGuideById(guideId);
        console.log('Local guide:', currentGuide?.name, 'ballotId:', currentGuide?.ballotId);

        // If no local guide or missing ballotId, fetch from DB
        if (!currentGuide || !currentGuide.ballotId) {
          console.log('Fetching guide from DB...');
          const dbGuide = await fetchGuide(guideId);
          console.log('DB guide:', dbGuide?.name, 'ballotId:', dbGuide?.ballotId);

          if (dbGuide) {
            saveGuide(dbGuide);
            currentGuide = dbGuide;
            trackWithSession('shared_link_accessed', { guideId: dbGuide.id });
          }
        }

        if (currentGuide) {
          setGuide(currentGuide);
        }

        // Step 2: Try to get ballot from localStorage first, then DB
        let currentBallot = getBallotData();
        console.log('Local ballot:', currentBallot?.name);

        // If no local ballot and guide has ballotId, fetch from DB
        if (!currentBallot && currentGuide?.ballotId) {
          console.log('Fetching ballot from DB...', currentGuide.ballotId);
          const dbBallot = await fetchBallot(currentGuide.ballotId);
          console.log('DB ballot:', dbBallot?.name, 'races:', dbBallot?.races?.length);

          if (dbBallot) {
            saveBallotData(dbBallot);
            currentBallot = dbBallot;
          }
        }

        if (currentBallot) {
          setBallot(currentBallot);
        }

        console.log('Load complete:', { hasGuide: !!currentGuide, hasBallot: !!currentBallot });
      } catch (err) {
        console.error('Failed to load:', err);
        setError('Failed to load guide');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [hydrated, guideId]);

  const handleGuideUpdate = (updatedGuide: VoterGuide) => {
    setGuide(updatedGuide);
  };
  const notFound = !isLoading && !guide && !error;

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
