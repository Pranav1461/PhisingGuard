import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Send,
  Radio,
  Activity,
  ShieldAlert,
  KeyRound,
  GraduationCap,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Lock,
  RefreshCw,
  Layers,
  Inbox,
  Check
} from 'lucide-react';
import {
  getSimulatorTemplates,
  sendSimulatorEmail,
  createSimulatorSession,
  recordSimulatorEvent,
  getLatestSimulatorEvent,
  getSimulatorSessions,
  resetSimulator,
  captureCredentials
} from '../services/api/simulator';
import type {
  SimulatorTemplateItem,
  EmailDispatchResponse,
  LatestSimulatorEventResponse,
  SimulatorSessionDetailResponse
} from '../services/api/types';

type MainTab = 'campaign' | 'monitor' | 'demo';
type DemoStage = 'setup' | 'message' | 'login' | 'submitted';

/* Fictional default service for mock demonstrations */
const FICTIONAL_SERVICE = {
  name: 'NordVault Mail',
  sender: 'accounts@nordvault-mail.nfo',
  subject: 'Action required: verify your mailbox',
  body: `Dear customer,

We detected unusual sign-in activity on your account from an unrecognized device. Your NordVault Mail mailbox will be locked in 24 hours unless you verify your account.

To keep your mailbox secure, please confirm your password to restore full access.`,
  ctaText: 'Click here to verify your account',
};

export const SimulatorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const paramSessionId = searchParams.get('session_id');
  const paramMode = searchParams.get('mode');
  const paramEmail = searchParams.get('email');

  // If opened with session_id query param (recipient clicked email link), targetMode is active
  const isTargetMode = Boolean(paramSessionId);

  // Tab & General State
  const [activeTab, setActiveTab] = useState<MainTab>('campaign');
  const [templates, setTemplates] = useState<SimulatorTemplateItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('nordvault-security');
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Campaign Dispatch State
  const [dispatchEmail, setDispatchEmail] = useState('');
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<EmailDispatchResponse | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Monitor & Live Polling State
  const [dashboard, setDashboard] = useState<LatestSimulatorEventResponse | null>(null);
  const [sessionsHistory, setSessionsHistory] = useState<SimulatorSessionDetailResponse[]>([]);
  const [isPolling, setIsPolling] = useState(true);
  const [lastPollTime, setLastPollTime] = useState<Date>(new Date());
  const [refreshingMonitor, setRefreshingMonitor] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Victim / Target Flow & Demo State
  const [demoStage, setDemoStage] = useState<DemoStage>(paramMode === 'login' ? 'login' : 'setup');
  const [targetEmail, setTargetEmail] = useState(paramEmail || '');
  const [sessionId, setSessionId] = useState<string | null>(paramSessionId || null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submittingLogin, setSubmittingLogin] = useState(false);
  const [capturedData, setCapturedData] = useState<{ username: string; password: string } | null>(null);
  const [targetError, setTargetError] = useState<string | null>(null);

  // Ref to prevent double-logging link_clicked on mount
  const hasLoggedClickRef = useRef(false);

  // 1. Load available templates
  useEffect(() => {
    async function loadTemplates() {
      setLoadingTemplates(true);
      try {
        const data = await getSimulatorTemplates();
        setTemplates(data);
        if (data.length > 0 && !selectedTemplate) {
          setSelectedTemplate(data[0].id);
        }
      } catch {
        // Fallback to local default if offline
        setTemplates([
          {
            id: 'nordvault-security',
            name: 'NordVault Security Alert (Mailbox Lock)',
            category: 'Security / Urgency',
            difficulty: 'Medium',
            subject: 'Action Required: Unusual Sign-in Detected on Your NordVault Account',
            sender_name: 'NordVault Security Team',
            sender_email_display: 'security-alerts@nordvault-mail.nfo',
            lure_description: 'Simulates an urgent account security alert claiming your mailbox will be locked in 24 hours.'
          },
          {
            id: 'storage-quota',
            name: 'Cloud Storage Full (Fear of Loss)',
            category: 'Infrastructure / Fear of Loss',
            difficulty: 'Easy',
            subject: 'Storage Alert: Your Cloud Storage is 99.4% Full (Incoming Emails Blocked)',
            sender_name: 'CloudDrive Storage Admin',
            sender_email_display: 'no-reply@cloud-storage-notifications.com',
            lure_description: 'Simulates a cloud storage quota exceeded warning threatening incoming email deletion.'
          },
          {
            id: 'hr-policy-update',
            name: 'HR & Payroll Compliance Review',
            category: 'Corporate / Policy',
            difficulty: 'Hard',
            subject: 'Mandatory Action: Review & Acknowledge Updated 2026 Remote Work Policy',
            sender_name: 'Human Resources Portal',
            sender_email_display: 'compliance@hr-internal-portal.org',
            lure_description: 'Simulates an internal HR compliance mandate requiring immediate acknowledgment to avoid payroll hold.'
          }
        ]);
      }
      setLoadingTemplates(false);
    }
    loadTemplates();
  }, []);

  // 2. If opened via trackable link (?session_id=sim-xxxx), auto-record link_clicked
  useEffect(() => {
    if (paramSessionId && !hasLoggedClickRef.current) {
      hasLoggedClickRef.current = true;
      setSessionId(paramSessionId);
      if (paramEmail) setUsername(paramEmail);

      recordSimulatorEvent({
        session_id: paramSessionId,
        event_type: 'link_clicked',
        username_entered: paramEmail || null,
        password_entered: false
      }).catch((err) => {
        console.warn('Target link click log notice:', err);
      });
    }
  }, [paramSessionId, paramEmail]);

  // 3. Live Polling Effect for Admin Monitor
  const fetchMonitorData = useCallback(async () => {
    try {
      const [latestRes, historyRes] = await Promise.all([
        getLatestSimulatorEvent(),
        getSimulatorSessions().catch(() => [])
      ]);
      setDashboard(latestRes);
      setSessionsHistory(historyRes);
      setLastPollTime(new Date());
    } catch {
      // non-blocking
    }
  }, []);

  useEffect(() => {
    if (isTargetMode) return; // Don't poll in target view

    fetchMonitorData();
    if (!isPolling) return;

    const interval = setInterval(() => {
      fetchMonitorData();
    }, 2500);

    return () => clearInterval(interval);
  }, [isPolling, isTargetMode, fetchMonitorData]);

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setRefreshingMonitor(true);
    await fetchMonitorData();
    setRefreshingMonitor(false);
  };

  // Dispatch real educational phishing email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchEmail.trim() || !dispatchEmail.includes('@')) {
      setDispatchError('Please enter a valid recipient email address.');
      return;
    }

    setDispatching(true);
    setDispatchError(null);
    setDispatchResult(null);

    try {
      const res = await sendSimulatorEmail({
        target_email: dispatchEmail.trim(),
        template_id: selectedTemplate
      });
      setDispatchResult(res);
      // Refresh monitor data so the new session is tracked immediately
      fetchMonitorData();
    } catch (err: any) {
      setDispatchError(err.message || 'Failed to dispatch educational phishing email.');
    }
    setDispatching(false);
  };

  // Copy tracking link to clipboard
  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Reset database state
  const handleResetHistory = async () => {
    if (!window.confirm('Reset all simulation sessions and activity logs?')) return;
    setResetting(true);
    try {
      await resetSimulator();
      await fetchMonitorData();
    } catch {
      // non-blocking
    }
    setResetting(false);
  };

  // ── Target / Victim Actions ──
  const handleTargetSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeSessionId = sessionId || 'sim-demo-manual';
    setSubmittingLogin(true);
    setTargetError(null);

    // Save what was typed strictly in browser memory for educational reveal
    setCapturedData({ username, password });

    try {
      // Send credentials to backend for real-time capture
      await captureCredentials({
        session_id: activeSessionId,
        username: username,
        password: password,
        user_agent: navigator.userAgent
      });

      // Also record the event for timeline
      await recordSimulatorEvent({
        session_id: activeSessionId,
        event_type: 'login_submitted',
        username_entered: username,
        password_entered: password.length > 0,
        password_value: password // Transmitted back solely for educational feedback
      });
    } catch (err: any) {
      setTargetError(err.message || 'Notice: Interaction recorded in local session.');
    }

    setSubmittingLogin(false);
    setDemoStage('submitted');
  };

  // ─────────────────────────────────────────────────────────────
  // A. TARGET / VICTIM MODE (Rendered when recipient clicks email link)
  // ─────────────────────────────────────────────────────────────
  if (isTargetMode) {
    return (
      <div className="max-w-2xl mx-auto py-4">
        {/* Educational Awareness Banner */}
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              <strong>PhishGuard Educational Simulation</strong> &bull; Tracking ID: <code className="font-mono text-white/80">{paramSessionId}</code>
            </span>
          </div>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-amber-500/20 text-[11px] font-medium text-amber-300">
            Training Demonstration
          </span>
        </div>

        {targetError && (
          <p role="alert" className="mb-4 flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            {targetError}
          </p>
        )}

        {demoStage === 'login' && (
          <div className="max-w-md mx-auto">
            {/* Fake Login Card */}
            <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md overflow-hidden shadow-2xl shadow-black/60">
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-white/[0.02]">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 mx-2 h-6 rounded bg-white/5 flex items-center px-2.5">
                  <Lock className="w-3 h-3 text-amber-400/80 mr-1.5 shrink-0" />
                  <span className="text-[11px] text-white/40 font-mono truncate">
                    https://nordvault-mail.nfo/auth/verify?session={paramSessionId}
                  </span>
                </div>
              </div>

              {/* Login form */}
              <div className="p-7">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-500/20 flex items-center justify-center mb-3 border border-blue-500/30">
                    <Lock className="w-6 h-6 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">NordVault Secure Access</h2>
                  <p className="text-xs text-white/40 mt-1">Sign in to confirm identity & unlock mailbox</p>
                </div>

                <form onSubmit={handleTargetSubmitLogin} className="space-y-4">
                  <div>
                    <label htmlFor="target-user" className="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wider">
                      Email or Username
                    </label>
                    <input
                      id="target-user"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="you@domain.com"
                      autoComplete="off"
                      required
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <div className="mb-1.5">
                      <label htmlFor="target-pwd" className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                        Password
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        id="target-pwd"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        autoComplete="off"
                        required
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 pr-10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/50 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingLogin}
                    className="w-full mt-2 btn btn-solid h-[44px] text-sm font-semibold rounded-lg shadow-lg shadow-blue-600/20"
                  >
                    {submittingLogin ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <KeyRound className="w-4 h-4 mr-2" />
                    )}
                    Verify & Unlock Mailbox
                  </button>
                </form>

                <p className="mt-5 text-center text-[11px] text-white/30 leading-relaxed">
                  🛡️ This is a simulated login form for security training.
                  Do not enter real passwords.
                </p>
              </div>
            </div>
          </div>
        )}

        {demoStage === 'submitted' && (
          <div className="space-y-6">
            {/* Main Reveal Banner */}
            <div className="rounded-xl border-2 border-red-500/40 bg-red-500/10 p-7 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                <ShieldAlert className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">You fell for the simulation!</h2>
              <p className="mt-2 text-sm text-white/60 max-w-lg mx-auto leading-relaxed">
                If this had been a real cyber attack, the attacker would have immediately stolen your login credentials
                and gained full unauthorized access to your account.
              </p>

              {/* What the attacker captured */}
              <div className="mt-6 rounded-lg border border-white/10 bg-black/60 p-5 max-w-md mx-auto text-left shadow-inner">
                <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-red-400" />
                  What the attacker captured in plain text:
                </p>
                <div className="space-y-2.5">
                  <div>
                    <span className="text-[10px] text-white/30 font-mono uppercase">Entered Username / Email:</span>
                    <p className="text-sm font-mono text-white bg-white/5 rounded px-3 py-1.5 mt-0.5 border border-white/5 truncate">
                      {capturedData?.username || '(empty)'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/30 font-mono uppercase">Entered Password:</span>
                    <p className="text-sm font-mono text-red-400 bg-red-500/10 rounded px-3 py-1.5 mt-0.5 border border-red-500/20 font-bold truncate">
                      {capturedData?.password || '(empty)'}
                    </p>
                  </div>
                </div>
                <p className="mt-3.5 text-[11px] text-white/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                  Safety notice: Your credentials were only processed in your browser memory for this demonstration.
                </p>
              </div>
            </div>

            {/* Educational Breakdown */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
              <h3 className="font-semibold text-white text-base flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-400" />
                How to Spot This Phishing Lure in the Future
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="rounded-lg bg-white/[0.02] border border-white/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold">
                    <Clock className="w-4 h-4" />
                    Artificial Urgency
                  </div>
                  <p className="text-white/50 leading-relaxed">
                    Phishing attacks claim your account will be "locked in 24 hours" to induce panic and bypass rational suspicion.
                  </p>
                </div>
                <div className="rounded-lg bg-white/[0.02] border border-white/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 font-semibold">
                    <ExternalLink className="w-4 h-4" />
                    Deceptive Domain URL
                  </div>
                  <p className="text-white/50 leading-relaxed">
                    Always inspect the address bar. Attackers register similar looking domains (e.g. <code>.nfo</code> instead of official domains).
                  </p>
                </div>
                <div className="rounded-lg bg-white/[0.02] border border-white/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-green-400 font-semibold">
                    <ShieldAlert className="w-4 h-4" />
                    Direct Navigation
                  </div>
                  <p className="text-white/50 leading-relaxed">
                    Never click email links for account verification. Open your browser and navigate to the official portal directly.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center pt-2">
              <a
                href="/simulator"
                className="btn btn-ghost h-[42px] px-6 text-sm inline-flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Return to PhishGuard Hub
              </a>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // B. MAIN ADMIN & SIMULATOR HUB VIEW
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen">
      {/* Ambient Background Animation */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-purple-900/5"
        />
        <motion.div
          animate={{
            x: [0, 100, -100, 0],
            y: [0, -50, 50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -80, 80, 0],
            y: [0, 60, -60, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
        />
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 max-w-4xl mx-auto space-y-8 pt-4 pb-8"
      >
      {/* Header */}
      <header className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-medium mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          End-to-End Educational Email Simulator
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Phishing Simulator & Training Engine
        </h1>
        <p className="mt-3 text-white/50 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          Dispatch realistic educational phishing simulations to test addresses, track recipient interactions in real-time,
          and deliver interactive educational awareness reveals.
        </p>
      </header>

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex items-center justify-center p-1 rounded-xl bg-white/[0.03] border border-white/8 max-w-md mx-auto"
      >
        <button
          type="button"
          onClick={() => setActiveTab('campaign')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'campaign'
              ? 'bg-white/10 text-white shadow-sm border border-white/15'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          Dispatch Email
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('monitor')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'monitor'
              ? 'bg-white/10 text-white shadow-sm border border-white/15'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Live Monitor
          {dashboard?.has_events && (
            <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-2 h-2 rounded-full bg-green-400"
            />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('demo')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'demo'
              ? 'bg-white/10 text-white shadow-sm border border-white/15'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Interactive Demo
        </button>
      </motion.div>

      {/* ════════════════ TAB 1: CAMPAIGN DISPATCHER ════════════════ */}
      <AnimatePresence mode="wait">
        {activeTab === 'campaign' && (
          <motion.div
            key="campaign"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-xl border border-white/8 bg-white/[0.03] backdrop-blur-sm p-6 sm:p-8"
              whileHover={{ y: -2, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.4)" }}
            >
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-blue-400" />
                Launch Real Email Phishing Simulation
              </h2>
              <p className="text-sm text-white/50 leading-relaxed mb-6">
                Enter your real test/dummy email address. PhishGuard will dispatch an authentic educational lure containing
                a unique tracking token and academic disclaimers.
              </p>

              {dispatchError && (
                <p role="alert" className="mb-6 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  {dispatchError}
                </p>
              )}

              <form onSubmit={handleSendEmail} className="space-y-6">
                <div>
                  <label htmlFor="dispatch-email" className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
                    Target Test Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="dispatch-email"
                      type="email"
                      value={dispatchEmail}
                      onChange={(e) => setDispatchEmail(e.target.value)}
                      placeholder="e.g. your-test-inbox@gmail.com"
                      required
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/50 transition-all"
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-white/30">
                    Tip: Use your own test mailbox or dummy account to experience the recipient attack path firsthand.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">
                    Select Educational Phishing Scenario
                  </label>
                  {loadingTemplates ? (
                    <div className="flex items-center justify-center p-8 text-white/30">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading scenarios…
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {templates.map((tpl) => {
                        const isSelected = selectedTemplate === tpl.id;
                        return (
                          <div
                            key={tpl.id}
                            onClick={() => setSelectedTemplate(tpl.id)}
                            className={`cursor-pointer rounded-lg border p-4 transition-all ${
                              isSelected
                                ? 'border-blue-500/60 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                                : 'border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/5 text-white/60">
                                {tpl.difficulty}
                              </span>
                              {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                            </div>
                            <h4 className="text-sm font-semibold text-white truncate">{tpl.name}</h4>
                            <p className="text-xs text-white/40 mt-1 line-clamp-2 leading-relaxed">
                              {tpl.lure_description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={dispatching}
                    className="w-full sm:w-auto btn btn-solid h-[44px] px-6 text-sm font-semibold rounded-lg shadow-lg shadow-blue-600/20"
                  >
                    {dispatching ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Send Educational Email
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDispatchEmail('student.test@college.edu');
                    }}
                    className="text-xs text-white/40 hover:text-white/70 transition-colors"
                  >
                    Fill sample test email
                  </button>
                </div>
              </form>
            </motion.div>

            {dispatchResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-green-500/30 bg-green-500/5 p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Simulation Email Dispatched!</h3>
                      <p className="text-xs text-white/50">{dispatchResult.message}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-1 rounded bg-green-500/20 text-green-300 font-semibold uppercase">
                    {dispatchResult.provider}
                  </span>
                </div>

                <div className="rounded-lg border border-white/10 bg-black/40 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span>Generated Tracking URL:</span>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(dispatchResult.tracking_url)}
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedLink ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                  <div className="p-2.5 rounded bg-white/5 font-mono text-xs text-white/80 break-all border border-white/5 select-all">
                    {dispatchResult.tracking_url}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <a
                    href={dispatchResult.tracking_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-solid h-[38px] px-4 text-xs inline-flex items-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Simulation Link (Target View)
                  </a>
                  <button
                    type="button"
                    onClick={() => setActiveTab('monitor')}
                    className="btn btn-ghost h-[38px] px-4 text-xs inline-flex items-center gap-2"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    Go to Live Monitor
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════ TAB 2: LIVE ACTIVITY MONITOR ════════════════ */}
      {activeTab === 'monitor' && (
        <motion.div
          key="monitor"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Real-time Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/8 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Radio className="w-6 h-6 text-green-400" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-400 animate-ping" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Live Interaction Stream
                  <span className="text-[11px] font-normal text-white/40">(polling every 2.5s)</span>
                </h3>
                <p className="text-xs text-white/40 mt-0.5">Last updated: {lastPollTime.toLocaleTimeString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPolling(!isPolling)}
                className={`btn h-[36px] px-3 text-xs ${isPolling ? 'btn-ghost text-green-400' : 'btn-ghost text-white/40'}`}
              >
                {isPolling ? '● Polling Active' : '○ Paused'}
              </button>
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={refreshingMonitor}
                className="btn btn-ghost h-[36px] px-3 text-xs"
                title="Refresh Now"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshingMonitor ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                onClick={handleResetHistory}
                disabled={resetting}
                className="btn btn-ghost h-[36px] px-3 text-xs text-red-400/80 hover:text-red-400"
                title="Reset All History"
              >
                <RotateCcw className={`w-3.5 h-3.5 mr-1 ${resetting ? 'animate-spin' : ''}`} />
                Reset
              </button>
            </div>
          </div>

          {/* Live Progress Pipeline for Latest Event */}
          {dashboard?.latest_event ? (
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/6 pb-4 gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">Active Target Session</span>
                  <p className="text-base font-bold text-white font-mono">{dashboard.latest_event.session_id}</p>
                </div>
                <div className="text-xs text-white/60">
                  Target: <strong className="text-white font-mono">{dashboard.latest_event.target_email}</strong>
                </div>
              </div>

              {/* 3-Step Live Progression Pipeline */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Step 1: Dispatched */}
                <div className="rounded-lg bg-white/[0.02] border border-white/8 p-4">
                  <div className="flex items-center gap-2 text-blue-400 text-xs font-bold mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    1. Email Dispatched
                  </div>
                  <p className="text-xs text-white/60">Phishing scenario sent to victim inbox.</p>
                  <span className="text-[10px] text-white/30 mt-2 block font-mono">Status: Delivered</span>
                </div>

                {/* Step 2: Link Clicked */}
                {(() => {
                  const isClicked =
                    dashboard.latest_event.event_type === 'link_clicked' ||
                    dashboard.latest_event.event_type === 'login_submitted' ||
                    dashboard.latest_event.session_status === 'clicked' ||
                    dashboard.latest_event.session_status === 'submitted' ||
                    dashboard.latest_event.session_status === 'completed';
                  return (
                    <div className={`rounded-lg border p-4 transition-all ${isClicked ? 'border-amber-500/40 bg-amber-500/10' : 'border-white/5 bg-white/[0.01] opacity-40'}`}>
                      <div className="flex items-center gap-2 text-xs font-bold mb-2">
                        {isClicked ? <CheckCircle2 className="w-4 h-4 text-amber-400" /> : <Clock className="w-4 h-4 text-white/30" />}
                        <span className={isClicked ? 'text-amber-300' : 'text-white/40'}>2. Link Opened</span>
                      </div>
                      <p className="text-xs text-white/60">
                        {isClicked ? 'Target clicked the simulation link in inbox.' : 'Waiting for recipient to click link…'}
                      </p>
                      <span className="text-[10px] text-white/30 mt-2 block font-mono">
                        {isClicked ? 'Status: Lure Visited' : 'Pending Click'}
                      </span>
                    </div>
                  );
                })()}

                {/* Step 3: Credentials Captured — shows actual username + password */}
                {(() => {
                  const isSubmitted =
                    dashboard.latest_event.event_type === 'login_submitted' ||
                    dashboard.latest_event.session_status === 'submitted' ||
                    dashboard.latest_event.session_status === 'completed';
                  return (
                    <div className={`rounded-lg border p-4 transition-all ${isSubmitted ? 'border-red-500/50 bg-red-500/10' : 'border-white/5 bg-white/[0.01] opacity-40'}`}>
                      <div className="flex items-center gap-2 text-xs font-bold mb-2">
                        {isSubmitted ? <ShieldAlert className="w-4 h-4 text-red-400" /> : <Clock className="w-4 h-4 text-white/30" />}
                        <span className={isSubmitted ? 'text-red-300' : 'text-white/40'}>3. Credentials Captured</span>
                      </div>
                      {isSubmitted ? (
                        <div className="space-y-2">
                          <div>
                            <span className="text-[10px] text-white/30 uppercase font-mono">Username:</span>
                            <p className="text-xs font-mono text-white bg-white/5 rounded px-2 py-1 mt-0.5 border border-white/5 truncate">
                              {dashboard.latest_event.username_entered || '—'}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] text-white/30 uppercase font-mono">Password:</span>
                            <p className="text-xs font-mono text-red-300 bg-red-500/10 rounded px-2 py-1 mt-0.5 border border-red-500/20 font-bold truncate">
                              {dashboard.latest_event.password_value}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-white/40 mt-1">Waiting for login interaction…</p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-12 text-center space-y-3">
              <Inbox className="w-10 h-10 text-white/20 mx-auto" />
              <h4 className="text-sm font-semibold text-white">No active simulation sessions</h4>
              <p className="text-xs text-white/40 max-w-sm mx-auto">
                Dispatch an email from the <strong>Dispatch Email</strong> tab or run a browser test to view live interaction metrics here.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('campaign')}
                className="btn btn-solid h-[38px] px-5 text-xs inline-flex items-center gap-2 mt-2"
              >
                <Send className="w-3.5 h-3.5" />
                Launch Simulation
              </button>
            </div>
          )}

          {/* ── Victims Captured Panel ── */}
          {sessionsHistory.filter(s => s.status === 'submitted' || s.status === 'completed').length > 0 && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/[0.04] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  Victims Captured
                  <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">
                    {sessionsHistory.filter(s => s.status === 'submitted' || s.status === 'completed').length} compromised
                  </span>
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleManualRefresh}
                    disabled={refreshingMonitor}
                    className="btn btn-ghost h-[32px] px-3 text-xs flex items-center gap-1.5"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-3 h-3 ${refreshingMonitor ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={handleResetHistory}
                    disabled={resetting}
                    className="btn btn-ghost h-[32px] px-3 text-xs text-red-400/70 hover:text-red-400 flex items-center gap-1.5"
                    title="Clear all sessions"
                  >
                    <RotateCcw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
                    Clear All
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {sessionsHistory
                  .filter(s => s.status === 'submitted' || s.status === 'completed')
                  .map((s, idx) => {
                    const loginEvent = s.events.find(e => e.event_type === 'login_submitted');
                    return (
                      <div key={s.session_id} className="rounded-lg border border-red-500/20 bg-black/30 p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-[11px] font-bold text-red-300">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="text-xs font-semibold text-white">Victim {idx + 1}</p>
                              <p className="text-[11px] text-white/40 font-mono">{s.session_id}</p>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold uppercase tracking-wider shrink-0">
                            {s.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <div className="rounded bg-white/[0.03] border border-white/5 px-3 py-2">
                            <span className="text-[10px] text-white/30 uppercase font-mono block mb-1">Email</span>
                            <span className="text-white/80 font-mono truncate block">{s.target_email}</span>
                          </div>
                          <div className="rounded bg-white/[0.03] border border-white/5 px-3 py-2">
                            <span className="text-[10px] text-white/30 uppercase font-mono block mb-1">Username Entered</span>
                            <span className="text-white/80 font-mono truncate block">
                              {loginEvent?.username_entered || s.target_email || '—'}
                            </span>
                          </div>
                          <div className="rounded bg-red-500/10 border border-red-500/20 px-3 py-2">
                            <span className="text-[10px] text-red-400/60 uppercase font-mono block mb-1">Password Entered</span>
                            <span className={`font-mono font-bold truncate block ${loginEvent?.password_entered ? 'text-red-300' : 'text-white/30'}`}>
                              {loginEvent?.password_entered ? '✓ Submitted' : '—'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[10px] text-white/25">
                          <span>Captured: {new Date(s.created_at).toLocaleString()}</span>
                          <span className="font-mono">{s.events.length} event{s.events.length !== 1 ? 's' : ''} recorded</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Session History Feed */}
          {sessionsHistory.length > 0 && (
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  All Sessions Log
                  <span className="text-[11px] font-normal text-white/30">({sessionsHistory.length} total)</span>
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleManualRefresh}
                    disabled={refreshingMonitor}
                    className="btn btn-ghost h-[32px] px-3 text-xs flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3 h-3 ${refreshingMonitor ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={handleResetHistory}
                    disabled={resetting}
                    className="btn btn-ghost h-[32px] px-3 text-xs text-red-400/70 hover:text-red-400 flex items-center gap-1.5"
                  >
                    <RotateCcw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
                    Reset
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-white/40 border-b border-white/8">
                      <th className="py-2.5 pr-4 font-medium">#</th>
                      <th className="py-2.5 pr-4 font-medium">Session ID</th>
                      <th className="py-2.5 pr-4 font-medium">Target Email</th>
                      <th className="py-2.5 pr-4 font-medium">Status</th>
                      <th className="py-2.5 pr-4 font-medium">Events</th>
                      <th className="py-2.5 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {sessionsHistory.map((s, idx) => (
                      <tr key={s.session_id} className="text-white/70 hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 pr-4 text-white/30 font-mono">{idx + 1}</td>
                        <td className="py-3 pr-4 font-mono text-white/90">{s.session_id}</td>
                        <td className="py-3 pr-4">{s.target_email}</td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            s.status === 'submitted' || s.status === 'completed'
                              ? 'bg-red-500/20 text-red-300'
                              : s.status === 'clicked'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4 font-mono text-white/50">{s.events.length}</td>
                        <td className="py-3 text-white/40">{new Date(s.created_at).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ════════════════ TAB 3: LOCAL INTERACTIVE DEMO ════════════════ */}
      {activeTab === 'demo' && (
        <motion.div
          key="demo"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Stepper */}
          <div className="flex items-center justify-center gap-1 sm:gap-2 text-xs">
            {[
              { key: 'setup', label: '1. Setup', icon: GraduationCap },
              { key: 'message', label: '2. Email Lure', icon: Mail },
              { key: 'login', label: '3. Fake Login', icon: KeyRound },
              { key: 'submitted', label: '4. Educational Reveal', icon: Eye },
            ].map((s) => {
              const activeIdx = demoStage === 'submitted' ? 3 : demoStage === 'login' ? 2 : demoStage === 'message' ? 1 : 0;
              const sIdx = ['setup', 'message', 'login', 'submitted'].indexOf(s.key);
              const isActive = sIdx === activeIdx;
              const isDone = sIdx < activeIdx;
              const Icon = s.icon;
              return (
                <React.Fragment key={s.key}>
                  {sIdx > 0 && <div className={`w-6 sm:w-10 h-px transition-colors ${sIdx <= activeIdx ? 'bg-white/30' : 'bg-white/8'}`} />}
                  <span
                    onClick={() => setDemoStage(s.key as DemoStage)}
                    className={`cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all ${
                      isActive
                        ? 'bg-white/10 text-white border border-white/15'
                        : isDone
                        ? 'text-white/50 hover:text-white'
                        : 'text-white/20'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{s.label}</span>
                  </span>
                </React.Fragment>
              );
            })}
          </div>

          {demoStage === 'setup' && (
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-6 space-y-4 max-w-lg mx-auto">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-400" />
                Browser Demonstration Setup
              </h3>
              <p className="text-xs text-white/50 leading-relaxed">
                Experience the full phishing simulation directly in your browser without waiting for an email delivery.
              </p>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">
                  Fictional Target Email
                </label>
                <input
                  type="email"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <button
                type="button"
                onClick={async () => {
                  const sess = await createSimulatorSession(targetEmail);
                  setSessionId(sess.session_id);
                  setUsername(targetEmail);
                  setDemoStage('message');
                }}
                className="w-full btn btn-solid h-[42px] text-sm font-semibold mt-2"
              >
                Proceed to Simulated Email &rarr;
              </button>
            </div>
          )}

          {demoStage === 'message' && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div className="rounded-xl border border-white/8 bg-white/[0.03] overflow-hidden shadow-2xl">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/6 bg-white/[0.02]">
                  <span className="text-[11px] text-white/40 font-mono">NordVault Mail &bull; Inbox</span>
                </div>
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold shrink-0">
                      NV
                    </div>
                    <div>
                      <p className="text-xs text-white/40">From: <span className="text-white/70">{FICTIONAL_SERVICE.sender}</span></p>
                      <p className="text-sm font-bold text-white mt-0.5">{FICTIONAL_SERVICE.subject}</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed whitespace-pre-line mb-6">
                    {FICTIONAL_SERVICE.body}
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      if (sessionId) {
                        recordSimulatorEvent({
                          session_id: sessionId,
                          event_type: 'link_clicked',
                          username_entered: targetEmail,
                          password_entered: false
                        }).catch(() => {});
                      }
                      setDemoStage('login');
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {FICTIONAL_SERVICE.ctaText}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {demoStage === 'login' && (
            <div className="max-w-md mx-auto">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md overflow-hidden shadow-2xl shadow-black/60">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-white/[0.02]">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex-1 mx-2 h-6 rounded bg-white/5 flex items-center px-2.5">
                    <span className="text-[11px] text-white/40 font-mono truncate">
                      https://nordvault-mail.nfo/auth/verify
                    </span>
                  </div>
                </div>
                <div className="p-7">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-500/20 flex items-center justify-center mb-3 border border-blue-500/30">
                      <Lock className="w-6 h-6 text-blue-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white">{FICTIONAL_SERVICE.name}</h2>
                    <p className="text-xs text-white/40 mt-1">Sign in to confirm identity</p>
                  </div>

                  <form onSubmit={handleTargetSubmitLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wider">
                        Email Address
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="you@domain.com"
                        required
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wider">
                        Password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingLogin}
                      className="w-full btn btn-solid h-[42px] text-sm font-semibold mt-2"
                    >
                      {submittingLogin ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
                      Sign In & Unlock
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {demoStage === 'submitted' && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="rounded-xl border-2 border-red-500/40 bg-red-500/10 p-7 text-center">
                <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-white">Demonstration Complete</h2>
                <p className="text-xs text-white/60 mt-1">
                  What was typed was captured and logged for this awareness demonstration.
                </p>

                <div className="mt-5 rounded-lg border border-white/10 bg-black/60 p-4 text-left font-mono text-xs space-y-2">
                  <div>
                    <span className="text-white/30 text-[10px] uppercase">Username:</span>
                    <p className="text-white">{capturedData?.username || username || '(none)'}</p>
                  </div>
                  <div>
                    <span className="text-white/30 text-[10px] uppercase">Password:</span>
                    <p className="text-red-400 font-bold">{capturedData?.password || password || '(none)'}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDemoStage('setup');
                    setUsername('');
                    setPassword('');
                    setCapturedData(null);
                  }}
                  className="btn btn-ghost h-[40px] px-5 text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-2" />
                  Run Demo Again
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('monitor')}
                  className="btn btn-solid h-[40px] px-5 text-xs"
                >
                  <Activity className="w-3.5 h-3.5 mr-2" />
                  View in Live Monitor
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
      </motion.div>
    </div>
  );
};

export default SimulatorPage;
