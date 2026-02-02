'use client';

import { useMemo, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, Edit, Vote } from 'lucide-react';
import { PublicGuideView } from '@/components/PublicGuideView';
import type { VoterGuide, BallotData } from '@/types';
import { getGuideById, getBallotData } from '@/lib/storage';
import { useHydrated } from '@/lib/hooks';

interface PublicGuidePageProps {
  params: Promise<{ guideId: string }>;
}

export default function PublicGuidePage({ params }: PublicGuidePageProps) {
  const { guideId } = use(params);
  const hydrated = useHydrated();

  const ballot = useMemo<BallotData | null>(() => {
    if (!hydrated) return null;
    return getBallotData();
  }, [hydrated]);

  const guide = useMemo<VoterGuide | null>(() => {
    if (!hydrated) return null;
    return getGuideById(guideId);
  }, [hydrated, guideId]);

  const notFound = hydrated && !guide;

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <Vote className="w-5 h-5" />
              <span className="text-sm font-medium">Voter Guide Tool</span>
            </Link>
            {guide && (
              <Link
                href={`/admin/edit/${guide.id}`}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 py-8">
        {/* Not Found */}
        {notFound && (
          <div className="max-w-xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6 text-center">
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

        {/* Unpublished Warning */}
        {guide && !guide.isPublished && (
          <div className="max-w-3xl mx-auto bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">Draft Mode</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  This guide is not published yet. Only you can see it.{' '}
                  <Link href={`/admin/edit/${guide.id}`} className="underline hover:no-underline">
                    Publish it
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No ballot warning */}
        {!ballot && guide && (
          <div className="max-w-3xl mx-auto bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">Ballot data not loaded</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  The ballot data for this guide needs to be loaded to view candidate details.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Guide Content */}
        {guide && ballot && (
          <PublicGuideView guide={guide} ballot={ballot} />
        )}
      </main>
    </div>
  );
}
