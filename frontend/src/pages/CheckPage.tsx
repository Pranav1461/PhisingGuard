import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Search,
  Check,
  X,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Info,
  RefreshCw,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { analyzeURL } from '../services/api/analysis';
import type { AnalyzeURLResponse, ProviderStatus } from '../services/api/types';

/* Meaningful analysis-progress steps shown while waiting (designdoc §9) */
const analysisSteps = [
  'Validating URL',
  'Checking threat intelligence',
  'Analyzing URL structure',
  'Running ML model',
  'Building risk assessment',
];

type RunStatus = 'idle' | 'loading' | 'success' | 'error';

function classificationBadge(classification: string) {
  switch (classification) {
    case 'PHISHING':
      return { label: 'PHISHING', tone: 'destructive', Icon: ShieldAlert };
    case 'SUSPICIOUS':
      return { label: 'SUSPICIOUS', tone: 'warning', Icon: AlertTriangle };
    default:
      return { label: 'SAFE', tone: 'success', Icon: ShieldCheck };
  }
}

function riskTone(score: number) {
  if (score >= 65) return { color: 'text-destructive', ring: 'ring-destructive', bar: 'bg-destructive', label: 'HIGH RISK' };
  if (score >= 30) return { color: 'text-warning', ring: 'ring-warning', bar: 'bg-warning', label: 'MODERATE RISK' };
  return { color: 'text-success', ring: 'ring-success', bar: 'bg-success', label: 'LOW RISK' };
}

export const CheckPage: React.FC = () => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<RunStatus>('idle');
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<AnalyzeURLResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const resultRef = useRef<HTMLDivElement>(null);

  // Advance the progress step display during loading
  useEffect(() => {
    if (status !== 'loading') return;
    setStepIndex(0);
    const id = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, analysisSteps.length - 1));
    }, Math.floor(14000 / analysisSteps.length));
    return () => clearInterval(id);
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please enter a URL to analyze.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setError(null);
    setResult(null);
    try {
      const res = await analyzeURL(trimmed);
      setResult(res);
      setStatus('success');
      // Scroll result into view for better UX on mobile
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }));
    } catch (err: any) {
      setError(err.message || 'We could not complete the analysis. Please try again.');
      setStatus('error');
    }
  };

  const badge = result ? classificationBadge(result.classification) : null;
  const tone = result ? riskTone(result.risk_score) : null;
  const providerOrder = ['virustotal', 'urlscan', 'urlhaus'];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">Check a website</h1>
        <p className="mt-3 text-white/50 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          Paste a suspicious URL. PhishGuard checks it against multiple threat sources and a local
          machine-learned model, then explains the result.
        </p>
      </div>

      {/* ---------- INPUT ---------- */}
      <form onSubmit={handleSubmit} className="rounded-lg border border-white/8 bg-white/[0.03] p-4 sm:p-5">
        <label htmlFor="url-input" className="block text-sm font-medium text-white/70 mb-2">
          Website URL
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="url-input"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a suspicious website URL… e.g. https://example.com"
            disabled={status === 'loading'}
            aria-describedby={error ? 'url-error' : undefined}
            className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="btn btn-solid h-[42px] px-5 text-sm w-full sm:w-auto"
          >
            {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" /> : <Search className="w-4 h-4 mr-2" aria-hidden="true" />}
            Analyze URL
          </button>
        </div>
        {status === 'error' && error && (
          <p id="url-error" role="alert" className="mt-3 flex items-start gap-2 text-sm text-destructive">
            <X className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
      </form>

      {/* ---------- LOADING STATE ---------- */}
      <AnimatePresence mode="wait">
        {status === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-6 rounded-md border border-border bg-background p-5 sm:p-6"
            role="status"
            aria-live="polite"
          >
            <p className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" aria-hidden="true" />
              Analyzing URL…
            </p>
            <ol className="space-y-2.5">
              {analysisSteps.map((step, i) => (
                <li key={step} className="flex items-center gap-3 text-sm">
                  {i < stepIndex && (
                    <Check className="w-4 h-4 text-green-400 shrink-0" aria-hidden="true" />
                  )}
                  {i === stepIndex && (
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" aria-hidden="true" />
                  )}
                  {i > stepIndex && (
                    <span className="w-4 h-4 rounded-full border border-white/10 shrink-0" aria-hidden="true" />
                  )}
                  <span className={i <= stepIndex ? 'text-white' : 'text-white/40'}>{step}</span>
                </li>
              ))}
            </ol>
          </motion.div>
        )}

        {/* ---------- RESULT ---------- */}
        {status === 'success' && result && badge && tone && (
          <motion.div
            ref={resultRef}
            key="result"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 space-y-5"
          >
            {/* Risk score + classification banner */}
            <div className="rounded-lg border border-white/8 bg-white/[0.03] p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="flex items-center gap-5">
                  <RiskGauge score={result.risk_score} colorClass={tone.color} />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-white/40">{tone.label}</p>
                    <span
                      className={`mt-1 inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold ring-1 ${
                        badge.tone === 'destructive'
                          ? 'bg-red-500/10 text-red-400 ring-red-500/30'
                          : badge.tone === 'warning'
                          ? 'bg-amber-500/10 text-amber-400 ring-amber-500/40'
                          : 'bg-green-500/10 text-green-400 ring-green-500/30'
                      }`}
                    >
                      <badge.Icon className="w-4 h-4" aria-hidden="true" />
                      {badge.label}
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono break-all text-white">{result.normalized_url}</p>
                  <p className="mt-1 text-xs text-white/40">
                    Domain: <span className="font-mono">{result.domain}</span>
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    ML phishing probability:{' '}
                    <span className="font-mono">{Math.round(result.ml_probability * 100)}%</span>
                  </p>
                </div>
              </div>

              {/* Recommendation */}
              <div className="mt-5 rounded-md bg-white/5 border border-white/8 p-4">
                <p className="text-sm font-semibold text-white mb-2">Recommendation</p>
                <ul className="space-y-1.5">
                  {result.recommendations.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-sm text-white/50">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-white/30 shrink-0" aria-hidden="true" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Provider evidence */}
            <div className="rounded-lg border border-white/8 bg-white/[0.03] p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Security evidence</h2>
              <div className="space-y-3">
                {providerOrder.map((name) => {
                  const p: ProviderStatus | undefined = result.providers[name];
                  if (!p) return null;
                  return <ProviderRow key={name} provider={p} />;
                })}
              </div>
            </div>

            {/* Why was this flagged (expandable explainability) */}
            {(result.evidence.length > 0 || result.reasons.length > 0) && (
              <div className="rounded-lg border border-white/8 bg-white/[0.03] p-5 sm:p-6">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                  Why was this result reached?
                </h2>
                <div className="space-y-2">
                  {result.evidence.map((ev) => {
                    const isOpen = expanded === `ev-${ev.title}`;
                    return (
                      <div key={ev.title} className="rounded-md border border-white/8">
                        <button
                          type="button"
                          onClick={() => setExpanded(isOpen ? null : `ev-${ev.title}`)}
                          aria-expanded={isOpen}
                          className="flex items-center justify-between w-full px-4 py-3 text-left text-sm font-medium text-white hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded-md"
                        >
                          <span className="flex items-center gap-2">
                            <RiskDot level={ev.risk_level} />
                            {ev.title}
                            <span className="hidden sm:inline text-xs text-white/30 font-normal">· {ev.category}</span>
                          </span>
                          <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: reduceMotion ? 0 : 0.2 }}
                              className="overflow-hidden"
                            >
                              <p className="px-4 pb-3 text-sm text-white/40 leading-relaxed">{ev.description}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
                {result.reasons.length > 0 && (
                  <ul className="mt-4 space-y-1.5">
                    {result.reasons.map((r) => (
                      <li key={r} className="flex items-start gap-2 text-sm text-white/50">
                        <Info className="w-4 h-4 mt-0.5 text-blue-400 shrink-0" aria-hidden="true" />
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Run again */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setStatus('idle');
                  setResult(null);
                  setUrl('');
                }}
                className="btn btn-ghost h-[40px] px-5 text-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                Analyze another URL
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 rounded-lg border border-white/5 bg-white/[0.02] p-4">
        <p className="text-xs sm:text-sm text-white/40 leading-relaxed">
          Analysis results are based on available evidence. A result of "SAFE" reflects that no immediate
          threat indicators were found — it is not a guarantee. Some provider requests may be rate-limited
          by free-tier quotas; this is shown transparently rather than hidden.
        </p>
      </div>
    </div>
  );
};

function ProviderRow({ provider }: { provider: ProviderStatus }) {
  const state = providerState(provider);
  const Icon = state.icon;
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-white/8 bg-white/[0.03] p-3.5">
      <div className="flex items-start gap-3 min-w-0">
        <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${state.bg} ${state.color}`} aria-hidden="true">
          <Icon className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white capitalize">{provider.provider}</p>
          <p className="mt-0.5 text-xs text-white/40 leading-relaxed">{provider.message}</p>
        </div>
      </div>
      <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${state.badge}`}>{state.label}</span>
    </div>
  );
}

function providerState(p: ProviderStatus) {
  if (p.status === 'unavailable' || p.status === 'error')
    return { label: 'Unavailable', icon: X, color: 'text-white/40', bg: 'bg-white/5', badge: 'bg-white/5 text-white/30' };
  if (p.status === 'rate_limited')
    return { label: 'Rate limited', icon: Info, color: 'text-amber-400', bg: 'bg-amber-500/10', badge: 'bg-amber-500/10 text-amber-400' };
  if (p.matched)
    return { label: 'Detected', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', badge: 'bg-red-500/10 text-red-400' };
  return { label: 'No match', icon: Check, color: 'text-green-400', bg: 'bg-green-500/10', badge: 'bg-green-500/10 text-green-400' };
}

/* ── SVG Circular Risk Gauge ── */
function RiskGauge({ score, colorClass }: { score: number; colorClass: string }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const strokeColor = score >= 65 ? '#ef4444' : score >= 30 ? '#f59e0b' : '#10b981';

  return (
    <div className="relative h-24 w-24 shrink-0" aria-label={`Risk score: ${score} out of 100`}>
      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
        {/* Track */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="7"
        />
        {/* Progress arc */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${strokeColor}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-2xl font-bold ${colorClass}`}>{score}</span>
      </div>
    </div>
  );
}

function RiskDot({ level }: { level: string }) {
  const color =
    level === 'critical' || level === 'high'
      ? 'bg-destructive'
      : level === 'medium'
      ? 'bg-warning'
      : 'bg-success';
  return <span className={`h-2 w-2 rounded-full ${color} shrink-0`} aria-hidden="true" />;
}

export default CheckPage;
