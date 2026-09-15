/**
 * ReviewCTA — reusable feedback/review button for PhishGuard.
 *
 * Opens the configured Google Form in a new tab.
 * If VITE_REVIEW_FORM_URL is not set (or is the placeholder), the button
 * is rendered but disabled so it never navigates to an invalid URL.
 *
 * Usage:
 *   import { ReviewCTA } from '../components/ReviewCTA';
 *   <ReviewCTA />
 *   <ReviewCTA compact />   // icon-only version for tight spaces
 */

import React from 'react';
import { Star } from 'lucide-react';

interface ReviewCTAProps {
  /** When true, renders a smaller inline button without the subtitle */
  compact?: boolean;
  className?: string;
}

const REVIEW_URL = import.meta.env.VITE_REVIEW_FORM_URL;

/** Returns true only when the env var is set and not the placeholder sentinel */
function isConfigured(url: string | undefined): url is string {
  return (
    typeof url === 'string' &&
    url.trim().length > 0 &&
    url.trim() !== 'YOUR_GOOGLE_FORM_URL_HERE'
  );
}

export const ReviewCTA: React.FC<ReviewCTAProps> = ({ compact = false, className = '' }) => {
  const configured = isConfigured(REVIEW_URL);

  const handleClick = () => {
    if (configured) {
      window.open(REVIEW_URL, '_blank', 'noopener,noreferrer');
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={!configured}
        title={configured ? 'Leave a review — opens Google Form' : 'Review form not yet configured'}
        aria-label="Leave a review for PhishGuard"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/8 text-amber-300 text-xs font-medium transition-all hover:border-amber-400/50 hover:bg-amber-500/15 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      >
        <Star className="w-3.5 h-3.5 fill-amber-400/60" aria-hidden="true" />
        Leave a Review
      </button>
    );
  }

  return (
    <div className={`rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${className}`}>
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
        <Star className="w-5 h-5 text-amber-400 fill-amber-400/40" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-tight">
          Help us improve PhishGuard
        </p>
        <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
          Share your experience — it takes less than a minute.
        </p>
      </div>
      <button
        type="button"
        onClick={handleClick}
        disabled={!configured}
        aria-label="Leave a review for PhishGuard — opens Google Form in a new tab"
        className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 text-sm font-medium transition-all hover:border-amber-400/60 hover:bg-amber-500/20 hover:text-amber-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
      >
        <Star className="w-4 h-4 fill-amber-400/50" aria-hidden="true" />
        Leave a Review
      </button>
    </div>
  );
};

export default ReviewCTA;
