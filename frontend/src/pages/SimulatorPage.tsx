import React, { useCallback, useState } from 'react';
import {
  Mail,
  KeyRound,
  GraduationCap,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  ExternalLink,
  Lock,
  RotateCcw,
} from 'lucide-react';
import {
  createSimulatorSession,
  recordSimulatorEvent,
  getLatestSimulatorEvent,
  resetSimulator,
} from '../services/api/simulator';
import type { LatestSimulatorEventResponse } from '../services/api/types';

type Stage = 'setup' | 'message' | 'login' | 'submitted';

/* Fictional service — intentionally NOT a real brand (PRD §18) */
const FICTIONAL_SERVICE = {
  name: 'NordVault Mail',
  sender: 'accounts@nordvault-mail.nfo',
  subject: 'Action required: verify your mailbox',
  body: `Dear customer,

We detected unusual sign-in activity on your account. Your NordVault Mail mailbox will be locked in 24 hours unless you verify your account.

To keep your mailbox secure, please confirm your password to restore full access.`,
  ctaText: 'Click here to verify your account',
};

export const SimulatorPage: React.FC = () => {
  const [stage, setStage] = useState<Stage>('setup');
  const [targetEmail, setTargetEmail] = useState('demo@example.test');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<LatestSimulatorEventResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [capturedData, setCapturedData] = useState<{ username: string; password: string } | null>(null);

  const refreshDashboard = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getLatestSimulatorEvent();
      setDashboard(data);
    } catch { /* ignore */ }
    setRefreshing(false);
  }, []);

  /* ── Start simulation ── */
  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail.trim()) return;
    setStarting(true);
    setError(null);
    try {
      const session = await createSimulatorSession(targetEmail);
      setSessionId(session.session_id);
      setUsername(targetEmail);
      setStage('message');
    } catch (err: any) {
      setError(err.message || 'Failed to initialize the simulation.');
    }
    setStarting(false);
  };

  /* ── Open fake login page ── */
  const handleOpenPage = async () => {
    if (!sessionId) return;
    try {
      await recordSimulatorEvent({
        session_id: sessionId,
        event_type: 'link_clicked',
        password_entered: false,
      });
    } catch { /* non-blocking */ }
    setStage('login');
  };

  /* ── Submit login ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) return;

    // Capture what was typed for educational reveal
    setCapturedData({ username, password });

    try {
      await recordSimulatorEvent({
        session_id: sessionId,
        event_type: 'login_submitted',
        username_entered: username,
        password_entered: password.length > 0,
        password_value: password,  // Sent back for educational display, NOT stored in DB
      });
    } catch (err: any) {
      setError(err.message || 'Could not record the event.');
    }
    setStage('submitted');
    setRevealed(true);
    refreshDashboard().catch(() => {});
  };

  const handleReset = async () => {
    try { await resetSimulator(); } catch { /* ok */ }
    setDashboard({ has_events: false, latest_event: null });
    setSessionId(null);
    setStage('setup');
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setRevealed(false);
    setCapturedData(null);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">Phishing simulator</h1>
        <p className="mt-3 text-white/50 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          A controlled, educational demonstration of how a fake login page works. Everything is fictional —
          no real account is used, and no password is ever stored on a server.
        </p>
      </header>

      {error && (
        <p role="alert" className="mb-4 flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {/* ── STEPPER ── */}
      <div className="mb-8 flex items-center justify-center gap-1 sm:gap-2 text-xs">
        {[
          { key: 'setup', label: 'Setup', icon: GraduationCap },
          { key: 'message', label: 'Message', icon: Mail },
          { key: 'login', label: 'Login', icon: KeyRound },
          { key: 'submitted', label: 'Reveal', icon: Eye },
        ].map((s) => {
          const activeIdx = stage === 'submitted' ? 3 : stage === 'login' ? 2 : stage === 'message' ? 1 : 0;
          const sIdx = ['setup', 'message', 'login', 'submitted'].indexOf(s.key);
          const isActive = sIdx === activeIdx;
          const isDone = sIdx < activeIdx;
          const Icon = s.icon;
          return (
            <React.Fragment key={s.key}>
              {sIdx > 0 && <div className={`w-8 sm:w-12 h-px transition-colors ${sIdx <= activeIdx ? 'bg-white/30' : 'bg-white/8'}`} />}
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all ${
                isActive ? 'bg-white/10 text-white border border-white/15' :
                isDone ? 'text-white/40' : 'text-white/20'
              }`}>
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
              </span>
            </React.Fragment>
          );
        })}
      </div>

      {/* ════════════════ STAGE: SETUP ════════════════ */}
      {stage === 'setup' && (
        <form onSubmit={handleStart} className="rounded-lg border border-white/8 bg-white/[0.03] backdrop-blur-sm p-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-white/60" aria-hidden="true" />
            Set up a demonstration
          </h2>
          <p className="mt-2 text-sm text-white/40 leading-relaxed">
            Enter any fictional email address. You will see a phishing email, click the link, and fill in the login form.
            Then see exactly what an attacker would have captured — the educational reveal shows the typed password.
          </p>
          <label htmlFor="sim-email" className="block text-sm font-medium text-white/70 mt-4 mb-2">
            Fictional victim email
          </label>
          <input
            id="sim-email"
            type="email"
            value={targetEmail}
            onChange={(e) => setTargetEmail(e.target.value)}
            placeholder="demo@example.test"
            autoComplete="off"
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
          />
          <button
            type="submit"
            disabled={starting}
            className="mt-4 btn btn-solid h-[40px] px-5 text-sm"
          >
            {starting ? <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" /> : <Mail className="w-4 h-4 mr-2" aria-hidden="true" />}
            Begin simulation
          </button>
        </form>
      )}

      {/* ════════════════ STAGE: MESSAGE ════════════════ */}
      {stage === 'message' && (
        <div className="space-y-4">
          {/* Email card */}
          <div className="rounded-lg border border-white/8 bg-white/[0.03] overflow-hidden">
            {/* Email header bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/6 bg-white/[0.02]">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
              </div>
              <span className="text-[11px] text-white/30 ml-2 font-mono">NordVault Mail — Inbox</span>
            </div>

            {/* Email body */}
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold shrink-0">
                  NV
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-white/30">From: <span className="text-white/50">{FICTIONAL_SERVICE.sender}</span></p>
                  <p className="text-sm font-semibold text-white mt-0.5">{FICTIONAL_SERVICE.subject}</p>
                </div>
              </div>
              <p className="text-sm text-white/50 leading-relaxed whitespace-pre-line">{FICTIONAL_SERVICE.body}</p>

              {/* CTA button inside email */}
              <button
                type="button"
                onClick={handleOpenPage}
                className="mt-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
              >
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
                {FICTIONAL_SERVICE.ctaText}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Educational note */}
          <div className="flex items-start gap-3 text-xs text-white/30 px-1">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500/60" aria-hidden="true" />
            <p>
              This is a simulation. In a real phishing email, look for: urgency ("locked in 24 hours"),
              a mismatched sender domain, and a suspicious link destination.
            </p>
          </div>
        </div>
      )}

      {/* ════════════════ STAGE: LOGIN ════════════════ */}
      {stage === 'login' && (
        <div className="max-w-sm mx-auto">
          {/* Fake login page card */}
          <div className="rounded-lg border border-white/10 bg-white/[0.04] backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/40">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/6 bg-white/[0.02]">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white/15" />
                <span className="w-2 h-2 rounded-full bg-white/15" />
                <span className="w-2 h-2 rounded-full bg-white/15" />
              </div>
              <div className="flex-1 mx-2 h-5 rounded bg-white/5 flex items-center justify-center">
                <span className="text-[10px] text-white/20 font-mono">https://nordvault-mail.nfo/verify</span>
              </div>
            </div>

            {/* Login form */}
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 mx-auto rounded-xl bg-blue-500/15 flex items-center justify-center mb-3">
                  <Lock className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-lg font-bold text-white">{FICTIONAL_SERVICE.name}</h2>
                <p className="text-xs text-white/40 mt-1">Sign in to verify your account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="sim-username" className="block text-sm font-medium text-white/70 mb-1.5">
                    Email address
                  </label>
                  <input
                    id="sim-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="off"
                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="sim-password" className="text-sm font-medium text-white/70">
                      Password
                    </label>
                    <span className="text-[10px] text-white/20 font-mono bg-white/5 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <EyeOff className="w-3 h-3" /> never stored
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="sim-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="off"
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 pr-10 text-sm text-white placeholder:text-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full btn btn-solid h-[42px] text-sm font-semibold"
                >
                  <KeyRound className="w-4 h-4 mr-2" aria-hidden="true" />
                  Sign in
                </button>
              </form>

              <p className="mt-4 text-center text-[11px] text-white/20">
                Fictional page for education only. Enter any dummy values.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ STAGE: REVEAL ════════════════ */}
      {stage === 'submitted' && (
        <div className="space-y-5">
          {revealed && (
            <>
              {/* Main reveal card */}
              <div className="rounded-lg border-2 border-red-500/30 bg-red-500/5 p-6">
                <div className="text-center mb-6">
                  <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" aria-hidden="true" />
                  <h2 className="mt-3 text-xl font-bold text-white">Phishing simulation complete</h2>
                  <p className="mt-2 text-sm text-white/50 leading-relaxed max-w-lg mx-auto">
                    If this had been a real attack, the information you entered could have been
                    captured and used to take over your account.
                  </p>
                </div>

                {/* Captured data display */}
                <div className="rounded-md border border-white/10 bg-black/40 p-5 max-w-md mx-auto">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5" />
                    What the attacker captured
                  </p>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[11px] text-white/25 font-mono">username</span>
                      <p className="text-sm text-white font-mono bg-white/5 rounded px-2.5 py-1.5 mt-0.5 border border-white/5">
                        {capturedData?.username || username || '(empty)'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-white/25 font-mono">password</span>
                      <p className="text-sm text-red-400 font-mono bg-red-500/5 rounded px-2.5 py-1.5 mt-0.5 border border-red-500/10">
                        {capturedData?.password || password || '(empty)'}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] text-white/20 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-green-400/60" />
                    This data was never stored on any server — it exists only in your browser for this educational demo.
                  </p>
                </div>
              </div>

              {/* What this means */}
              <div className="rounded-lg border border-white/8 bg-white/[0.03] p-5">
                <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  What this demonstrates
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-white/45 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-white/20 mt-1">•</span>
                    Phishing emails create <strong className="text-white/70 font-medium">urgency</strong> ("locked in 24 hours") to prevent you from thinking critically.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/20 mt-1">•</span>
                    The fake login page <strong className="text-white/70 font-medium">looks identical</strong> to a real one — same logo, same colors, same layout.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/20 mt-1">•</span>
                    What you type is <strong className="text-white/70 font-medium">captured in plain text</strong> — this is how attackers steal credentials.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/20 mt-1">•</span>
                    Always check the <strong className="text-white/70 font-medium">sender address</strong> and <strong className="text-white/70 font-medium">link URL</strong> before entering credentials.
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn btn-ghost h-[40px] px-5 text-sm"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Run simulation again
                </button>
                {refreshing && (
                  <span className="flex items-center gap-2 text-xs text-white/30">
                    <Loader2 className="w-3 h-3 animate-spin" /> Refreshing dashboard…
                  </span>
                )}
              </div>

              {/* Dashboard readout */}
              {dashboard?.has_events && dashboard.latest_event && (
                <div className="rounded-lg border border-white/8 bg-white/[0.03] p-5">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Monitoring dashboard
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded bg-white/[0.03] border border-white/5 p-3">
                      <span className="text-white/25">Session</span>
                      <p className="text-white/70 font-mono mt-1">{dashboard.latest_event.session_id}</p>
                    </div>
                    <div className="rounded bg-white/[0.03] border border-white/5 p-3">
                      <span className="text-white/25">Event</span>
                      <p className="text-white/70 font-mono mt-1">{dashboard.latest_event.event_type}</p>
                    </div>
                    <div className="rounded bg-white/[0.03] border border-white/5 p-3">
                      <span className="text-white/25">Username entered</span>
                      <p className="text-white/70 font-mono mt-1">{dashboard.latest_event.username_entered || '—'}</p>
                    </div>
                    <div className="rounded bg-white/[0.03] border border-white/5 p-3">
                      <span className="text-white/25">Password field filled</span>
                      <p className={`font-mono mt-1 ${dashboard.latest_event.password_entered ? 'text-red-400' : 'text-green-400'}`}>
                        {dashboard.latest_event.password_entered ? 'Yes — CAPTURED' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SimulatorPage;
