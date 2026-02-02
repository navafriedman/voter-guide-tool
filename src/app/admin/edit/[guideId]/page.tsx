'use client';

import { useState, useMemo, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Vote, AlertCircle } from 'lucide-react';
import { GuideEditor } from '@/components/GuideEditor';
import type { VoterGuide, BallotData } from '@/types';
import { getGuideById, getBallotData } from '@/lib/storage';
import { useHydrated } from '@/lib/hooks';

interface EditGuidePageProps {
  params: Promise<{ guideId: string }>;
}

export default function EditGuidePage({ params }: EditGuidePageProps) {
  const { guideId } = use(params);
  const hydrated = useHydrated();
  const [guideState, setGuideState] = useState<VoterGuide | null>(null);

  const ballot = useMemo<BallotData | null>(() => {
    if (!hydrated) return null;
    return getBallotData();
  }, [hydrated]);

  const initialGuide = useMemo(() => {
    if (!hydrated) return null;
    return getGuideById(guideId);
  }, [hydrated, guideId]);

  const guide = guideState ?? initialGuide;
  const notFound = hydrated && !initialGuide;

  const handleGuideUpdate = (updatedGuide: VoterGuide) => {
    setGuideState(updatedGuide);
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
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
