'use client';

import { useState, useRef } from 'react';
import { User, Globe, Star, Check, X, Ban, ChevronLeft, ChevronRight, Menu, ArrowLeft, UserCheck, HelpCircle } from 'lucide-react';
import type { VoterGuide, BallotData, Race, Candidate, RecommendationStatus } from '@/types';

interface PublicGuideViewProps {
  guide: VoterGuide;
  ballot: BallotData;
}

const statusConfig: Record<RecommendationStatus, { label: string; bgColor: string; textColor: string; icon: React.ReactNode }> = {
  top_pick: {
    label: 'Top pick',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    icon: <Star className="w-3 h-3" fill="currentColor" />
  },
  yes: {
    label: 'Yes',
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-700',
    icon: <Check className="w-3 h-3" />
  },
  no: {
    label: 'No',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    icon: <X className="w-3 h-3" />
  },
  strong_no: {
    label: 'Strong no',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    icon: <Ban className="w-3 h-3" />
  },
  no_recommendation: {
    label: 'No recommendation',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    icon: <HelpCircle className="w-3 h-3" />
  },
  none: {
    label: '',
    bgColor: '',
    textColor: '',
    icon: null
  },
};

const partyColors: Record<string, { bg: string; text: string }> = {
  'Democrat': { bg: 'bg-blue-500', text: 'text-white' },
  'Democratic': { bg: 'bg-blue-500', text: 'text-white' },
  'Republican': { bg: 'bg-red-500', text: 'text-white' },
  'Independent': { bg: 'bg-purple-500', text: 'text-white' },
  'Libertarian': { bg: 'bg-yellow-500', text: 'text-black' },
  'Green': { bg: 'bg-green-500', text: 'text-white' },
};

function CandidatePublicCard({
  candidate,
  raceId,
  guide
}: {
  candidate: Candidate;
  raceId: string;
  guide: VoterGuide;
}) {
  const recommendation = guide.recommendations.find(
    r => r.raceId === raceId && r.candidateId === candidate.id
  );
  const status = recommendation?.status || 'none';
  const reason = recommendation?.reason;
  const config = statusConfig[status];
  const partyStyle = candidate.party ? partyColors[candidate.party] || { bg: 'bg-gray-500', text: 'text-white' } : null;

  return (
    <div className="flex-shrink-0 w-64 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Candidate Photo */}
      <div className="p-4 pb-2 flex justify-center">
        {candidate.photoUrl ? (
          <img
            src={candidate.photoUrl}
            alt={candidate.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
            <User className="w-10 h-10 text-gray-400" />
          </div>
        )}
      </div>

      {/* Candidate Info */}
      <div className="px-4 pb-2 text-center">
        <h4 className="font-semibold text-gray-900 text-sm">{candidate.name}</h4>

        {/* Party Badge */}
        {partyStyle && (
          <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded ${partyStyle.bg} ${partyStyle.text}`}>
            {candidate.party}
          </span>
        )}

        {/* Title */}
        {candidate.title && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{candidate.title}</p>
        )}
      </div>

      {/* Recommendation Badge */}
      {status !== 'none' && (
        <div className="px-4 py-2 flex justify-center">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
            {config.icon}
            {config.label}
          </span>
        </div>
      )}

      {/* Commentary */}
      <div className="px-4 pb-4 min-h-[60px]">
        {reason ? (
          <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">{reason}</p>
        ) : status !== 'none' ? (
          <p className="text-xs text-gray-400 italic">
            The author of this voter guide has not weighed in on this candidate.
          </p>
        ) : (
          <p className="text-xs text-gray-400 italic">
            No recommendation
          </p>
        )}
      </div>
    </div>
  );
}

function RacePublicSection({
  race,
  guide
}: {
  race: Race;
  guide: VoterGuide;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const raceName = race.district ? `${race.name} - ${race.district}` : race.name;
  const isUncontested = race.candidates.length === 1;

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 280;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(updateScrollButtons, 300);
    }
  };

  // Sort candidates: top_pick first, then yes, then others with recommendations, then none
  const sortedCandidates = [...race.candidates].sort((a, b) => {
    const recA = guide.recommendations.find(r => r.raceId === race.id && r.candidateId === a.id);
    const recB = guide.recommendations.find(r => r.raceId === race.id && r.candidateId === b.id);
    const statusOrder: Record<RecommendationStatus, number> = { top_pick: 0, yes: 1, no: 2, strong_no: 3, no_recommendation: 4, none: 5 };
    const orderA = statusOrder[recA?.status || 'none'];
    const orderB = statusOrder[recB?.status || 'none'];
    return orderA - orderB;
  });

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-bold text-gray-900">{raceName}</h3>
        {isUncontested && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
            <UserCheck className="w-3 h-3" />
            Uncontested
          </span>
        )}
      </div>

      <div className="relative">
        {/* Scroll Left Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 -ml-5"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Candidates Scroll Container */}
        <div
          ref={scrollContainerRef}
          onScroll={updateScrollButtons}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {sortedCandidates.map(candidate => (
            <CandidatePublicCard
              key={candidate.id}
              candidate={candidate}
              raceId={race.id}
              guide={guide}
            />
          ))}
        </div>

        {/* Scroll Right Button */}
        {canScrollRight && race.candidates.length > 3 && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 -mr-5"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}

export function PublicGuideView({ guide, ballot }: PublicGuideViewProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Get races that have at least one recommendation
  const racesWithRecommendations = ballot.races.filter(race =>
    race.candidates.some(candidate =>
      guide.recommendations.some(
        r => r.raceId === race.id && r.candidateId === candidate.id && r.status !== 'none'
      )
    )
  );

  // Get all unique race names for filter chips
  const raceFilters = racesWithRecommendations.map(race => ({
    id: race.id,
    name: race.district ? `${race.name} - ${race.district}` : race.name
  }));

  // Filter races based on active filter
  const displayedRaces = activeFilter
    ? racesWithRecommendations.filter(r => r.id === activeFilter)
    : racesWithRecommendations;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <header className="bg-[#E85A4F] text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
            VG
          </div>
          <button className="p-2 hover:bg-white/10 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <a href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to guides
        </a>

        {/* Title with Author */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 font-medium mb-1">Local Voter Guide</p>
          <div className="flex items-center gap-3">
            {guide.authorPhoto ? (
              <img
                src={guide.authorPhoto}
                alt={guide.authorName}
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-500" />
              </div>
            )}
            <h1 className="text-xl font-bold text-gray-900">{guide.authorName}</h1>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="md:flex">
            {/* Hero Image */}
            <div className="md:w-1/3 bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center min-h-[200px] relative overflow-hidden">
              {guide.bannerPhoto ? (
                <img
                  src={guide.bannerPhoto}
                  alt="Banner"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="text-white text-center p-8">
                  <p className="text-2xl font-bold leading-tight opacity-90">
                    LIKE THE POWER<br />
                    OF THE PEOPLE<br />
                    &apos;CAUSE THE POWER
                  </p>
                </div>
              )}
            </div>

            {/* Guide Info */}
            <div className="md:w-2/3 p-6">
              {guide.ballotName && (
                <p className="text-sm text-gray-500 mb-2">
                  {guide.ballotName} {guide.ballotLocation && `• ${guide.ballotLocation}`}
                </p>
              )}
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{guide.name}</h2>
              {guide.authorBio && (
                <p className="text-gray-600 text-sm leading-relaxed">{guide.authorBio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Filter Section */}
        {raceFilters.length > 0 && (
          <div className="mb-8">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Filter {guide.authorName}&apos;s picks
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setActiveFilter(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === null
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              {raceFilters.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeFilter === filter.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {filter.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Races */}
        <div className="space-y-8">
          {displayedRaces.map(race => (
            <RacePublicSection
              key={race.id}
              race={race}
              guide={guide}
            />
          ))}
        </div>

        {/* About Author Section */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {guide.authorPhoto ? (
                <img
                  src={guide.authorPhoto}
                  alt={guide.authorName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-500" />
                </div>
              )}
            </div>
            <div className="flex-grow">
              <h3 className="text-lg font-bold text-gray-900 mb-2">About {guide.authorName}</h3>
              {guide.authorBio ? (
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{guide.authorBio}</p>
              ) : (
                <p className="text-gray-400 text-sm italic mb-4">No bio provided.</p>
              )}

              {guide.socialLinks && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Connect with {guide.authorName}</p>
                  <div className="flex gap-3">
                    {guide.socialLinks.website && (
                      <a
                        href={guide.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                    {guide.socialLinks.twitter && (
                      <a
                        href={`https://twitter.com/${guide.socialLinks.twitter.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      </a>
                    )}
                    {guide.socialLinks.facebook && (
                      <a
                        href={guide.socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      </a>
                    )}
                    {guide.socialLinks.instagram && (
                      <a
                        href={`https://instagram.com/${guide.socialLinks.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold mb-4">Get ready to vote on Election Day</h4>
              <p className="text-sm text-gray-400">
                Check our resources to help you get ready for Election Day from registering to finding your polling place.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Check your registration</a></li>
                <li><a href="#" className="hover:text-white">Where to vote</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Share your feedback</h4>
              <p className="text-sm text-gray-400">
                Sign up to share feedback on this beta and you could get a $50 gift card.
              </p>
            </div>
            <div>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="flex-grow px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:border-gray-500"
                />
                <button className="px-4 py-2 bg-[#E85A4F] text-white rounded-lg hover:bg-[#d14d42] transition-colors">
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between text-sm text-gray-500">
            <p>© 2025 Voter Guide Tool</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white">Report Issue</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
              <a href="#" className="hover:text-white">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
