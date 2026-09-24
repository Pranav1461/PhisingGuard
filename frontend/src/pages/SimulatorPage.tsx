import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Send,
  Radio,
  Activity,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Lock,
  RefreshCw,
  Layers,
  Inbox,
  Check,
  CreditCard,
  Gift,
  Search,
  Filter,
  BookOpen,
  Target,
} from 'lucide-react';
import {
  getSimulatorTemplates,
  sendSimulatorEmail,
  createSimulatorSession,
  recordSimulatorEvent,
  getLatestSimulatorEvent,
  getSimulatorSessions,
  getSimulatorSession,
  resetSimulator,
  captureCredentials,
} from '../services/api/simulator';
import type {
  SimulatorTemplateItem,
  EmailDispatchResponse,
  LatestSimulatorEventResponse,
  SimulatorSessionDetailResponse,
} from '../services/api/types';
import { ReviewCTA } from '../components/ReviewCTA';
import { SimulationInteractPage } from '../components/SimulationInteractPage';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type MainTab = 'campaign' | 'monitor' | 'demo';
type DemoStage = 'setup' | 'email' | 'interact' | 'result';

// Severity levels for the Live Monitor event feed
type EventSeverity = 'info' | 'action' | 'warning' | 'risk' | 'success';

interface MonitorEvent {
  id: string;
  scenarioType: string;
  eventType: string;
  displayMessage: string;
  severity: EventSeverity;
  timestamp: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario metadata helpers
// ─────────────────────────────────────────────────────────────────────────────

const SCENARIO_ICONS: Record<string, React.ElementType> = {
  login: Lock,
  subscription: CreditCard,
  reward: Gift,
};

const SCENARIO_COLORS: Record<string, string> = {
  login:        'text-blue-400   border-blue-500/30   bg-blue-500/10',
  subscription: 'text-amber-400  border-amber-500/30  bg-amber-500/10',
  reward:       'text-purple-400 border-purple-500/30 bg-purple-500/10',
};

// Per-scenario interaction field types (structure only — content comes from scenario data)
const SCENARIO_INTERACTION_FIELDS: Record<string, {
  primaryField: { label: string; placeholder: string; type: string };
  secondaryField?: { label: string; placeholder: string; type: string };
}> = {
  login: {
    primaryField: { label: 'Email or Username', placeholder: 'you@domain.com', type: 'text' },
    secondaryField: { label: 'Password', placeholder: '••••••••••••', type: 'password' },
  },
  subscription: {
    primaryField: { label: 'Card Number', placeholder: '•••• •••• •••• ••••', type: 'text' },
    secondaryField: { label: 'Expiry / CVV', placeholder: 'MM/YY — 3-digit code', type: 'text' },
  },
  reward: {
    primaryField: { label: 'Full Name', placeholder: 'Your full name', type: 'text' },
    secondaryField: { label: 'Bank Account / Sort Code', placeholder: 'For reward transfer', type: 'text' },
  },
};

// Build dynamic interaction config from scenario data
function buildInteractionConfig(tpl: SimulatorTemplateItem) {
  const st = getScenarioType(tpl);
  const fields = SCENARIO_INTERACTION_FIELDS[st] ?? SCENARIO_INTERACTION_FIELDS['login'];
  const org = tpl.fictional_org || tpl.sender_name;

  // Scenario-specific URL bars (fictional domains from templates)
  const urlBarMap: Record<string, string> = {
    login: 'https://verify.mockmail.com/auth',
    subscription: 'https://billing.mockmail.com/update',
    storage: 'https://upgrade.mockmail.com/plan',
    delivery: 'https://track.mockmail.com/confirm',
    reward: 'https://claim.mockmail.com/verify',
    support: 'https://support.mockmail.com/session',
    document: 'https://portal.mockmail.com/verify',
  };

  // Scenario-specific titles/subtitles derived from scenario data
  const titleMap: Record<string, string> = {
    login: 'Verify Your Identity',
    subscription: 'Update Payment Details',
    storage: 'Upgrade Your Storage',
    delivery: 'Confirm Delivery Details',
    reward: 'Claim Your Reward',
    support: 'Secure Support Session',
    document: 'Document Verification Portal',
  };

  const subtitleMap: Record<string, string> = {
    login: `Sign in to restore access to your ${org} account`,
    subscription: `Re-enter billing info to continue your ${org} subscription`,
    storage: `Confirm details to expand ${org} storage and release blocked messages`,
    delivery: `Enter details to reschedule the failed ${org} delivery`,
    reward: `Verify your identity to receive your ${org} prize`,
    support: `${org} Security — a representative is standing by`,
    document: `Confirm your identity to complete the ${org} review`,
  };

  const submitLabelMap: Record<string, string> = {
    login: 'Sign In & Verify',
    subscription: 'Update Payment Method',
    storage: 'Confirm & Upgrade',
    delivery: 'Confirm & Reschedule',
    reward: 'Verify & Claim Prize',
    support: 'Start Secure Session',
    document: 'Submit & Sign Document',
  };

  const warningMap: Record<string, string> = {
    login: 'This simulated login form captures what you type — just like a real phishing site would.',
    subscription: 'This simulated billing page captures card-like inputs — exactly how payment phishing pages operate.',
    storage: 'Storage scams collect account credentials to hijack cloud accounts.',
    delivery: 'Delivery scams harvest home addresses and sometimes request a small "redelivery fee".',
    reward: 'Reward scams extract bank details or personal information under the guise of a prize transfer.',
    support: 'Tech support scams collect credentials under the guise of helping you — real support never needs your password.',
    document: 'HR impersonation scams exploit authority to collect corporate credentials and personal information.',
  };

  return {
    pageTitle: titleMap[st] || 'Verify Your Identity',
    pageSubtitle: subtitleMap[st] || 'Sign in to restore access to your account',
    urlBar: urlBarMap[st] || 'https://example.com/verify',
    ctaLabel: tpl.subject || 'Verify',
    submitLabel: submitLabelMap[st] || 'Submit',
    warningNote: warningMap[st] || 'This is a simulated interaction for security awareness.',
    primaryField: fields.primaryField,
    secondaryField: fields.secondaryField,
  };
}

// Scenario-aware Live Monitor event definitions
const SCENARIO_EVENTS: Record<string, Array<{ type: string; message: string; severity: EventSeverity }>> = {
  login: [
    { type: 'simulation_started',   message: 'Fraud simulation started',         severity: 'info' },
    { type: 'email_opened',         message: 'Phishing email opened',             severity: 'info' },
    { type: 'sender_inspected',     message: 'Sender address inspected',          severity: 'action' },
    { type: 'link_clicked',         message: 'Login page link clicked',           severity: 'warning' },
    { type: 'login_page_opened',    message: 'Fake login page opened',            severity: 'warning' },
    { type: 'username_entered',     message: 'Username / email field filled',     severity: 'warning' },
    { type: 'password_interacted',  message: 'Password field interacted with',    severity: 'risk' },
    { type: 'login_submitted',      message: 'Login credentials submitted',       severity: 'risk' },
  ],
  subscription: [
    { type: 'simulation_started',   message: 'Fraud simulation started',         severity: 'info' },
    { type: 'email_opened',         message: 'Billing notice email opened',       severity: 'info' },
    { type: 'billing_inspected',    message: 'Subscription message inspected',    severity: 'action' },
    { type: 'link_clicked',         message: 'Renewal page link clicked',         severity: 'warning' },
    { type: 'renewal_page_opened',  message: 'Fake renewal page opened',          severity: 'warning' },
    { type: 'plan_viewed',          message: 'Plan details viewed',               severity: 'action' },
    { type: 'renewal_cta_clicked',  message: 'Renewal CTA clicked',              severity: 'warning' },
    { type: 'payment_form_opened',  message: 'Payment form opened',               severity: 'risk' },
    { type: 'payment_submitted',    message: 'Payment details submitted',         severity: 'risk' },
  ],
  storage: [
    { type: 'simulation_started',   message: 'Fraud simulation started',         severity: 'info' },
    { type: 'email_opened',         message: 'Storage warning email opened',      severity: 'info' },
    { type: 'warning_viewed',       message: 'Storage warning viewed',            severity: 'action' },
    { type: 'link_clicked',         message: 'Storage upgrade link clicked',      severity: 'warning' },
    { type: 'storage_page_opened',  message: 'Fake storage upgrade page opened',  severity: 'warning' },
    { type: 'usage_viewed',         message: 'Usage details viewed',              severity: 'action' },
    { type: 'upgrade_cta_clicked',  message: 'Upgrade CTA clicked',              severity: 'warning' },
    { type: 'login_submitted',      message: 'Account credentials submitted',     severity: 'risk' },
  ],
  delivery: [
    { type: 'simulation_started',   message: 'Fraud simulation started',         severity: 'info' },
    { type: 'email_opened',         message: 'Delivery notice email opened',      severity: 'info' },
    { type: 'message_inspected',    message: 'Delivery message inspected',        severity: 'action' },
    { type: 'link_clicked',         message: 'Tracking page link clicked',        severity: 'warning' },
    { type: 'tracking_page_opened', message: 'Delivery tracking page opened',     severity: 'warning' },
    { type: 'package_details_viewed','message': 'Package details viewed',         severity: 'action' },
    { type: 'address_form_opened',  message: 'Address verification form opened',  severity: 'warning' },
    { type: 'login_submitted',      message: 'Address / personal info submitted', severity: 'risk' },
  ],
  reward: [
    { type: 'simulation_started',   message: 'Fraud simulation started',         severity: 'info' },
    { type: 'email_opened',         message: 'Reward email opened',               severity: 'info' },
    { type: 'reward_inspected',     message: 'Reward offer inspected',            severity: 'action' },
    { type: 'link_clicked',         message: 'Reward claim link clicked',         severity: 'warning' },
    { type: 'reward_page_opened',   message: 'Fake reward page opened',           severity: 'warning' },
    { type: 'reward_viewed',        message: 'Reward details viewed',             severity: 'action' },
    { type: 'claim_cta_clicked',    message: 'Claim CTA clicked',                severity: 'warning' },
    { type: 'login_submitted',      message: 'Personal / bank details submitted', severity: 'risk' },
  ],
  support: [
    { type: 'simulation_started',   message: 'Fraud simulation started',         severity: 'info' },
    { type: 'email_opened',         message: 'Security warning email opened',     severity: 'info' },
    { type: 'warning_viewed',       message: 'Security warning viewed',           severity: 'action' },
    { type: 'link_clicked',         message: 'Support link clicked',              severity: 'warning' },
    { type: 'support_page_opened',  message: 'Fake support page opened',          severity: 'warning' },
    { type: 'alert_viewed',         message: 'Alert details viewed',              severity: 'action' },
    { type: 'support_action_started','message': 'Support action initiated',       severity: 'warning' },
    { type: 'login_submitted',      message: 'Account credentials submitted',     severity: 'risk' },
  ],
  document: [
    { type: 'simulation_started',   message: 'Fraud simulation started',         severity: 'info' },
    { type: 'email_opened',         message: 'Document request email opened',     severity: 'info' },
    { type: 'document_inspected',   message: 'Document request inspected',        severity: 'action' },
    { type: 'link_clicked',         message: 'HR portal link clicked',            severity: 'warning' },
    { type: 'hr_page_opened',       message: 'Fake HR verification page opened',  severity: 'warning' },
    { type: 'document_viewed',      message: 'Document details viewed',           severity: 'action' },
    { type: 'form_opened',          message: 'Verification form opened',          severity: 'warning' },
    { type: 'login_submitted',      message: 'Corporate credentials submitted',   severity: 'risk' },
  ],
};

// Fallback category lookup for templates that don't carry a scenario_type
function categoryToScenarioType(category: string): string {
  const c = category.toLowerCase();
  if (c.includes('login') || c.includes('account') || c.includes('security')) return 'login';
  if (c.includes('subscription') || c.includes('billing') || c.includes('payment')) return 'subscription';
  if (c.includes('storage')) return 'storage';
  if (c.includes('delivery') || c.includes('parcel') || c.includes('shipping')) return 'delivery';
  if (c.includes('reward') || c.includes('prize') || c.includes('cashback')) return 'reward';
  if (c.includes('support') || c.includes('technical')) return 'support';
  if (c.includes('hr') || c.includes('document') || c.includes('payroll')) return 'document';
  return 'login';
}

function getScenarioType(tpl: SimulatorTemplateItem): string {
  return tpl.scenario_type || categoryToScenarioType(tpl.category);
}

// Event severity colour map for the monitor feed
const SEVERITY_STYLES: Record<EventSeverity, string> = {
  info:    'text-blue-300   border-blue-500/20   bg-blue-500/5',
  action:  'text-white/70   border-white/10      bg-white/[0.03]',
  warning: 'text-amber-300  border-amber-500/20  bg-amber-500/5',
  risk:    'text-red-300    border-red-500/20    bg-red-500/8',
  success: 'text-emerald-300 border-emerald-500/20 bg-emerald-500/5',
};

const SEVERITY_DOT: Record<EventSeverity, string> = {
  info:    'bg-blue-400',
  action:  'bg-white/40',
  warning: 'bg-amber-400',
  risk:    'bg-red-400',
  success: 'bg-emerald-400',
};

// ─────────────────────────────────────────────────────────────────────────────
// Fallback template list (shown when API is offline)
// ─────────────────────────────────────────────────────────────────────────────

const FALLBACK_TEMPLATES: SimulatorTemplateItem[] = [
  {
    id: 'nordvault-security', name: 'NordVault — Suspicious Login Alert',
    category: 'Account / Login', scenario_type: 'login', difficulty: 'Medium',
    subject: 'Action Required: Unusual sign-in detected', sender_name: 'NordVault Security Team',
    sender_email_display: 'security-alerts@nordvault-mail.nfo', fictional_org: 'NordVault Mail',
    manipulation: ['urgency', 'fear', 'authority'],
    red_flags: ['suspicious sender domain', 'account suspension threat'],
    safe_action: 'Navigate directly to the site — do not click email links.',
    lure_description: 'Urgent account security alert claiming your mailbox will be locked in 24 hours.',
  },
  {
    id: 'streambox-payment', name: 'StreamBox — Payment Failed',
    category: 'Subscription / Billing', scenario_type: 'subscription', difficulty: 'Medium',
    subject: 'StreamBox: Payment failed — update billing details now', sender_name: 'StreamBox Billing',
    sender_email_display: 'billing@streambox-payments.io', fictional_org: 'StreamBox',
    manipulation: ['fear', 'urgency'],
    red_flags: ['non-official billing domain', 'account cancellation threat'],
    safe_action: 'Update payment only through the official StreamBox app.',
    lure_description: 'Failed streaming subscription payment notice.',
  },
  {
    id: 'storage-quota', name: 'CloudDrive — Storage Full',
    category: 'Storage', scenario_type: 'storage', difficulty: 'Easy',
    subject: 'Storage Alert: CloudDrive 99.4% full', sender_name: 'CloudDrive Storage Admin',
    sender_email_display: 'no-reply@cloud-storage-notifications.com', fictional_org: 'CloudDrive',
    manipulation: ['fear', 'urgency'],
    red_flags: ['notification domain mismatch', 'incoming email deletion threat'],
    safe_action: 'Check storage via the official CloudDrive app.',
    lure_description: 'Storage quota exceeded warning threatening email deletion.',
  },
  {
    id: 'parcelpro-failed', name: 'ParcelPro — Delivery Failed',
    category: 'Delivery', scenario_type: 'delivery', difficulty: 'Medium',
    subject: 'ParcelPro: Delivery attempt failed', sender_name: 'ParcelPro Delivery Services',
    sender_email_display: 'delivery@parcelpro-notifications.com', fictional_org: 'ParcelPro',
    manipulation: ['urgency', 'fear'],
    red_flags: ['address confirmation via email', '24-hour return threat'],
    safe_action: 'Track deliveries via the official ParcelPro website.',
    lure_description: 'Failed delivery notice asking the recipient to confirm their address.',
  },
  {
    id: 'cashback-reward', name: 'CashBack Hub — Reward',
    category: 'Reward / Prize', scenario_type: 'reward', difficulty: 'Easy',
    subject: "You've earned £85 cashback — claim before it expires!", sender_name: 'CashBack Hub Rewards',
    sender_email_display: 'rewards@cashbackhub-claims.com', fictional_org: 'CashBack Hub',
    manipulation: ['reward', 'urgency', 'curiosity'],
    red_flags: ['unsolicited cashback', 'expiry pressure'],
    safe_action: 'Verify cashback via the official account — unsolicited reward emails are almost always scams.',
    lure_description: 'Cashback reward email with expiry urgency.',
  },
  {
    id: 'northstar-security-warning', name: 'Northstar — Suspicious Activity',
    category: 'Support / Technical', scenario_type: 'support', difficulty: 'Hard',
    subject: 'Northstar Systems: Suspicious activity detected', sender_name: 'Northstar Security Operations',
    sender_email_display: 'security-ops@northstar-alerts.org', fictional_org: 'Northstar Systems',
    manipulation: ['fear', 'authority', 'urgency'],
    red_flags: ['unsolicited security contact', 'account suspension threat'],
    safe_action: 'Contact support directly via the official website.',
    lure_description: 'Fake security operations notice about suspicious account activity.',
  },
  {
    id: 'hr-policy-update', name: 'Northstar HR — Policy Update',
    category: 'HR / Document', scenario_type: 'document', difficulty: 'Hard',
    subject: 'Mandatory Action: Review updated 2026 Remote Work Policy', sender_name: 'Human Resources Portal',
    sender_email_display: 'compliance@hr-internal-portal.org', fictional_org: 'Northstar Systems HR',
    manipulation: ['authority', 'urgency', 'fear'],
    red_flags: ['internal HR via external domain', 'payroll hold threat'],
    safe_action: 'HR sign-offs are done via the official intranet — never via email links.',
    lure_description: 'Internal HR compliance mandate requiring immediate acknowledgment to avoid payroll hold.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Category filter options
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_FILTERS = [
  { key: 'all', label: 'All Scenarios', icon: Filter },
  { key: 'login', label: 'Account / Login', icon: Lock },
  { key: 'subscription', label: 'Subscription', icon: CreditCard },
  { key: 'reward', label: 'Reward / Prize', icon: Gift },
];

// ─────────────────────────────────────────────────────────────────────────────
// Difficulty badge
// ─────────────────────────────────────────────────────────────────────────────

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const d = difficulty.toLowerCase();
  const cls =
    d === 'easy' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
    d === 'medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
    'text-red-400 bg-red-500/10 border-red-500/20';
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${cls}`}>
      {difficulty}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate a monitor event object
// ─────────────────────────────────────────────────────────────────────────────

let _eventCounter = 0;
function makeMonitorEvent(scenarioType: string, eventType: string): MonitorEvent {
  const events = SCENARIO_EVENTS[scenarioType] ?? SCENARIO_EVENTS['login'];
  const def = events.find((e) => e.type === eventType) ?? {
    type: eventType,
    message: eventType.replace(/_/g, ' '),
    severity: 'info' as EventSeverity,
  };
  return {
    id: `ev-${Date.now()}-${_eventCounter++}`,
    scenarioType,
    eventType,
    displayMessage: def.message,
    severity: def.severity,
    timestamp: new Date(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export const SimulatorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const paramSessionId = searchParams.get('session_id');
  const paramMode = searchParams.get('mode');
  const paramEmail = searchParams.get('email');

  // Target mode ONLY when session_id is in URL AND mode=login (email link visit)
  // NOT when using internal demo simulator
  const isTargetMode = Boolean(paramSessionId && paramMode === 'login');

  // ── Tab & template state ──
  const [activeTab, setActiveTab] = useState<MainTab>('campaign');
  const [templates, setTemplates] = useState<SimulatorTemplateItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('nordvault-security');
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('login');

  // ── Campaign dispatch state ──
  const [dispatchEmail, setDispatchEmail] = useState('');
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<EmailDispatchResponse | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // ── Live Monitor state ──
  const [dashboard, setDashboard] = useState<LatestSimulatorEventResponse | null>(null);
  const [sessionsHistory, setSessionsHistory] = useState<SimulatorSessionDetailResponse[]>([]);
  const [isPolling, setIsPolling] = useState(true);
  const [lastPollTime, setLastPollTime] = useState<Date>(new Date());
  const [refreshingMonitor, setRefreshingMonitor] = useState(false);
  const [resetting, setResetting] = useState(false);

  // ── Local monitor event feed (frontend-driven, scenario-aware) ──
  const [localEvents, setLocalEvents] = useState<MonitorEvent[]>([]);
  const [activeScenarioType, setActiveScenarioType] = useState<string>('login');

  // ── Demo / interactive simulation state ──
  // Demo mode should ONLY initialize from URL params when in target/victim mode (email link visit)
  // Otherwise always start from 'setup' stage
  const [demoStage, setDemoStage] = useState<DemoStage>(
    (paramMode === 'login' && paramSessionId) ? 'interact' : 'setup'
  );
  const [targetEmail, setTargetEmail] = useState(paramEmail || '');
  const [sessionId, setSessionId] = useState<string | null>(
    (paramMode === 'login' && paramSessionId) ? paramSessionId : null
  );
  const [primaryField, setPrimaryField] = useState('');
  const [secondaryField, setSecondaryField] = useState('');
  const [showSecondary, setShowSecondary] = useState(false);
  const [submittingInteraction, setSubmittingInteraction] = useState(false);
  const [capturedData, setCapturedData] = useState<{ primary: string; secondary: string } | null>(null);
  const [targetError, setTargetError] = useState<string | null>(null);

  // ── Active template for demo ──
  const [demoTemplate, setDemoTemplate] = useState<SimulatorTemplateItem | null>(null);

  // ── State for target mode template lookup ──
  const [targetTemplate, setTargetTemplate] = useState<SimulatorTemplateItem | null>(null);
  const [targetTemplateLoading, setTargetTemplateLoading] = useState(false);

  const hasLoggedClickRef = useRef(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Helper: add a local monitor event
  // ─────────────────────────────────────────────────────────────────────────

  const addMonitorEvent = useCallback((scenarioType: string, eventType: string) => {
    const ev = makeMonitorEvent(scenarioType, eventType);
    setLocalEvents((prev) => [ev, ...prev].slice(0, 50));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Load templates
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function loadTemplates() {
      setLoadingTemplates(true);
      try {
        const data = await getSimulatorTemplates();
        setTemplates(data);
        if (data.length > 0) setSelectedTemplate(data[0].id);
      } catch {
        setTemplates(FALLBACK_TEMPLATES);
        setSelectedTemplate(FALLBACK_TEMPLATES[0].id);
      }
      setLoadingTemplates(false);
    }
    loadTemplates();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Fetch the actual template when in target mode
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isTargetMode || !paramSessionId || targetTemplate) return;

    setTargetTemplateLoading(true);

    // Fetch the session details to get the template_id
    getSimulatorSession(paramSessionId)
      .then((session) => {
        const templateId = session.template_id || 'nordvault-security';
        // Find the matching template
        return getSimulatorTemplates().then((templates) => {
          const tpl = templates.find(t => t.id === templateId);
          if (tpl) {
            setTargetTemplate(tpl);
          } else {
            // Fallback to first available template if not found
            setTargetTemplate(templates[0] || FALLBACK_TEMPLATES[0]);
          }
          setTargetTemplateLoading(false);
        });
      })
      .catch(() => {
        // Fallback to default on error
        setTargetTemplate(FALLBACK_TEMPLATES[0]);
        setTargetTemplateLoading(false);
      });
  }, [isTargetMode, paramSessionId, targetTemplate]);

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Auto-record link_clicked in target/victim mode
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!paramSessionId || hasLoggedClickRef.current) return;
    hasLoggedClickRef.current = true;
    setSessionId(paramSessionId);
    if (paramEmail) setPrimaryField(paramEmail);

    recordSimulatorEvent({
      session_id: paramSessionId,
      event_type: 'link_clicked',
      username_entered: paramEmail || null,
      password_entered: false,
    }).catch(() => {});
  }, [paramSessionId, paramEmail]);

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Live polling for the admin monitor
  // ─────────────────────────────────────────────────────────────────────────

  const fetchMonitorData = useCallback(async () => {
    try {
      const [latestRes, historyRes] = await Promise.all([
        getLatestSimulatorEvent(),
        getSimulatorSessions().catch(() => [] as SimulatorSessionDetailResponse[]),
      ]);
      setDashboard(latestRes);
      setSessionsHistory(historyRes);
      setLastPollTime(new Date());
    } catch {
      // non-blocking
    }
  }, []);

  useEffect(() => {
    if (isTargetMode) return;
    fetchMonitorData();
    if (!isPolling) return;
    const id = setInterval(fetchMonitorData, 2500);
    return () => clearInterval(id);
  }, [isPolling, isTargetMode, fetchMonitorData]);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived: selected template object
  // ─────────────────────────────────────────────────────────────────────────

  const allTemplates = templates.length > 0 ? templates : FALLBACK_TEMPLATES;
  const selectedTpl = allTemplates.find((t) => t.id === selectedTemplate) ?? allTemplates[0];
  const filteredTemplates =
    categoryFilter === 'all'
      ? allTemplates
      : allTemplates.filter((t) => getScenarioType(t) === categoryFilter);

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleManualRefresh = async () => {
    setRefreshingMonitor(true);
    await fetchMonitorData();
    setRefreshingMonitor(false);
  };

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
      const res = await sendSimulatorEmail({ target_email: dispatchEmail.trim(), template_id: selectedTemplate });
      setDispatchResult(res);
      fetchMonitorData();
    } catch (err: any) {
      setDispatchError(err.message || 'Failed to dispatch simulation email.');
    }
    setDispatching(false);
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleResetHistory = async () => {
    if (!window.confirm('Reset all simulation sessions and activity logs?')) return;
    setResetting(true);
    try {
      await resetSimulator();
      await fetchMonitorData();
      setLocalEvents([]);
    } catch {
      // non-blocking
    }
    setResetting(false);
  };

  // ── Start interactive demo ──
  const handleStartDemo = async (tpl: SimulatorTemplateItem) => {
    const st = getScenarioType(tpl);
    setDemoTemplate(tpl);
    setActiveScenarioType(st);
    setPrimaryField(targetEmail);
    setSecondaryField('');
    setCapturedData(null);
    setTargetError(null);
    setLocalEvents([]);

    addMonitorEvent(st, 'simulation_started');

    let sess: { session_id: string } | null = null;
    try {
      sess = await createSimulatorSession(targetEmail || 'demo@example.test', tpl.id);
      setSessionId(sess.session_id);
    } catch {
      setSessionId('sim-demo-local');
    }
    setDemoStage('email');
  };

  // ── User opens simulated email ──
  const handleOpenEmail = () => {
    const st = demoTemplate ? getScenarioType(demoTemplate) : activeScenarioType;
    addMonitorEvent(st, 'email_opened');
    setDemoStage('interact');
    // record link_clicked
    const sid = sessionId || 'sim-demo-local';
    recordSimulatorEvent({ session_id: sid, event_type: 'link_clicked', username_entered: targetEmail || null, password_entered: false })
      .catch(() => {});
    addMonitorEvent(st, 'link_clicked');
  };

  // ── Interaction page opened (we fire this when interact stage mounts) ──
  const interactMountedRef = useRef(false);
  useEffect(() => {
    if (demoStage !== 'interact' || interactMountedRef.current || !demoTemplate) return;
    interactMountedRef.current = true;
    const st = getScenarioType(demoTemplate);
    const pageEvent = {
      login: 'login_page_opened',
      subscription: 'renewal_page_opened',
      storage: 'storage_page_opened',
      delivery: 'tracking_page_opened',
      reward: 'reward_page_opened',
      support: 'support_page_opened',
      document: 'hr_page_opened',
    }[st] || 'link_clicked';
    addMonitorEvent(st, pageEvent);
  }, [demoStage, demoTemplate, addMonitorEvent]);

  // ── Reset ref when demo stage changes away from interact ──
  useEffect(() => {
    if (demoStage !== 'interact') interactMountedRef.current = false;
  }, [demoStage]);

  // ── Submit interaction form ──
  const handleSubmitInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    const st = demoTemplate ? getScenarioType(demoTemplate) : activeScenarioType;
    const sid = sessionId || 'sim-demo-local';
    setSubmittingInteraction(true);
    setTargetError(null);

    setCapturedData({ primary: primaryField, secondary: secondaryField });

    const isPasswordScenario = ['login', 'storage', 'support', 'document'].includes(st);

    addMonitorEvent(st, 'login_submitted');

    try {
      if (isPasswordScenario) {
        await captureCredentials({
          session_id: sid,
          username: primaryField,
          password: secondaryField,
          user_agent: navigator.userAgent,
        });
      }
      await recordSimulatorEvent({
        session_id: sid,
        event_type: 'login_submitted',
        username_entered: primaryField,
        password_entered: secondaryField.length > 0,
        password_value: isPasswordScenario ? secondaryField : null,
      });
    } catch (err: any) {
      setTargetError(err.message || 'Interaction recorded locally.');
    }

    setSubmittingInteraction(false);

    // Redirect to home page instead of showing result screen
    window.location.href = '/';
  };

  // ── Reset demo ──
  const handleResetDemo = () => {
    setDemoStage('setup');
    setDemoTemplate(null);
    setPrimaryField('');
    setSecondaryField('');
    setCapturedData(null);
    setTargetError(null);
    setLocalEvents([]);
    interactMountedRef.current = false;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // PART A: TARGET / VICTIM MODE (email link visited)
  // ─────────────────────────────────────────────────────────────────────────

  if (isTargetMode) {
    if (targetTemplateLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      );
    }

    if (!targetTemplate) {
      return (
        <div className="max-w-2xl mx-auto py-4">
          <p className="text-red-400">Session not found</p>
        </div>
      );
    }

    const targetScenarioType = getScenarioType(targetTemplate);
    const interaction = buildInteractionConfig(targetTemplate);

    return (
      <div className="max-w-2xl mx-auto py-4">
        {targetError && (
          <p role="alert" className="mb-4 flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            {targetError}
          </p>
        )}

        {demoStage === 'interact' && (
          <SimulationInteractPage
            template={targetTemplate}
            scenarioType={targetScenarioType}
            interaction={interaction}
            primaryValue={primaryField}
            secondaryValue={secondaryField}
            showSecondary={showSecondary}
            submitting={submittingInteraction}
            error={targetError}
            onPrimaryChange={setPrimaryField}
            onSecondaryChange={setSecondaryField}
            onShowSecondaryToggle={() => setShowSecondary(!showSecondary)}
            onSubmit={handleSubmitInteraction}
          />
        )}

        {demoStage === 'result' && (
          <div className="space-y-6">
            <div className="rounded-xl border-2 border-red-500/40 bg-red-500/10 p-7 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                <ShieldAlert className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Simulation Complete</h2>
              <p className="mt-2 text-sm text-white/60 max-w-lg mx-auto leading-relaxed">
                In a real attack, an attacker would have intercepted this data to compromise your account or steal your identity.
              </p>
              <div className="mt-6 rounded-lg border border-white/10 bg-black/60 p-5 max-w-md mx-auto text-left shadow-inner">
                <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-red-400" />
                  What was captured:
                </p>
                <div className="space-y-2.5">
                  <div>
                    <span className="text-[10px] text-white/30 font-mono uppercase">{interaction.primaryField.label}:</span>
                    <p className="text-sm font-mono text-white bg-white/5 rounded px-3 py-1.5 mt-0.5 border border-white/5 truncate">
                      {capturedData?.primary || '(empty)'}
                    </p>
                  </div>
                  {interaction.secondaryField && (
                    <div>
                      <span className="text-[10px] text-white/30 font-mono uppercase">{interaction.secondaryField.label}:</span>
                      <p className="text-sm font-mono text-red-400 bg-red-500/10 rounded px-3 py-1.5 mt-0.5 border border-red-500/20 font-bold truncate">
                        {capturedData?.secondary || '(empty)'}
                      </p>
                    </div>
                  )}
                </div>
                <p className="mt-3.5 text-[11px] text-white/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                  {interaction.warningNote}
                </p>
              </div>
            </div>
            <div className="text-center pt-2">
              <a href="/simulator" className="btn btn-ghost h-[42px] px-6 text-sm inline-flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                Return to PhishGuard Hub
              </a>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PART B: MAIN HUB VIEW
  // ─────────────────────────────────────────────────────────────────────────

  const currentDemoScenarioType = demoTemplate ? getScenarioType(demoTemplate) : activeScenarioType;
  // Build interaction config from the active scenario — falls back to a safe login default
  const currentInteraction = demoTemplate
    ? buildInteractionConfig(demoTemplate)
    : buildInteractionConfig({
        id: 'fallback', name: 'NordVault', category: 'Account / Login',
        scenario_type: 'login', difficulty: 'Medium',
        subject: 'Verify your account', sender_name: 'NordVault Security',
        sender_email_display: 'security@nordvault-mail.nfo',
        fictional_org: 'NordVault', manipulation: [], red_flags: [],
        safe_action: '', lure_description: '',
      });

  return (
    <div className="relative min-h-screen">
      {/* Ambient background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <motion.div animate={{ scale: [1, 1.15, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-purple-900/5" />
        <motion.div animate={{ x: [0, 100, -100, 0], y: [0, -50, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <motion.div animate={{ x: [0, -80, 80, 0], y: [0, 60, -60, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 max-w-4xl mx-auto space-y-8 pt-4 pb-8">

        {/* ── Header ── */}
        <header className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Fraud Simulation Engine
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Fraud Simulation
          </h1>
          <p className="mt-3 text-white/50 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Experience realistic fraud and scam scenarios. Dispatch simulation emails, interact with fake
            attack pages, and see how attackers manipulate victims in real time.
          </p>
        </header>

        {/* ── Tab bar ── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center justify-center p-1 rounded-xl bg-white/[0.03] border border-white/8 max-w-md mx-auto">
          {([
            { key: 'campaign', label: 'Dispatch Email', icon: Send },
            { key: 'monitor',  label: 'Live Monitor',   icon: Activity },
            { key: 'demo',     label: 'Simulate',       icon: Layers },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button key={key} type="button" onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === key
                  ? 'bg-white/10 text-white shadow-sm border border-white/15'
                  : 'text-white/40 hover:text-white/70'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
              {key === 'monitor' && dashboard?.has_events && (
                <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-2 h-2 rounded-full bg-green-400" />
              )}
            </button>
          ))}
        </motion.div>

        {/* ════════════════ TAB 1: CAMPAIGN DISPATCHER ════════════════ */}
        <AnimatePresence mode="wait">
          {activeTab === 'campaign' && (
            <motion.div key="campaign" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="space-y-6">

              <div className="rounded-xl border border-white/8 bg-white/[0.03] backdrop-blur-sm p-6 sm:p-8">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                  <Mail className="w-5 h-5 text-blue-400" />
                  Launch Simulation Campaign
                </h2>
                <p className="text-sm text-white/50 leading-relaxed mb-6">
                  Dispatch an authentic-looking fraud scenario email to a test address and track interactions in real time.
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
                    <input id="dispatch-email" type="email" value={dispatchEmail}
                      onChange={(e) => setDispatchEmail(e.target.value)}
                      placeholder="e.g. security-audit@company.io" required
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/50 transition-all" />
                    <p className="mt-2 text-[11px] text-white/30">
                      Use an authorised mailbox to experience the recipient attack path firsthand.
                    </p>
                  </div>

                  {/* Category filter */}
                  <div>
                    <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">
                      Scenario Category
                    </label>

                    {/* Mobile: Compact dropdown */}
                    <div className="sm:hidden mb-4">
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.4)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 0.75rem center',
                          backgroundSize: '1.25rem',
                          paddingRight: '2.5rem',
                        }}
                      >
                        {CATEGORY_FILTERS.map(({ key, label }) => (
                          <option key={key} value={key} className="bg-slate-900 text-white">
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Desktop: Button grid */}
                    <div className="hidden sm:flex flex-wrap gap-2 mb-4">
                      {CATEGORY_FILTERS.map(({ key, label, icon: Icon }) => (
                        <button key={key} type="button" onClick={() => setCategoryFilter(key)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                            categoryFilter === key
                              ? 'border-blue-500/50 bg-blue-500/15 text-blue-300'
                              : 'border-white/10 bg-white/[0.02] text-white/50 hover:text-white/80 hover:border-white/20'
                          }`}>
                          <Icon className="w-3.5 h-3.5" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">
                      Select Scenario Template
                    </label>
                    {loadingTemplates ? (
                      <div className="flex items-center justify-center p-8 text-white/30">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading scenarios…
                      </div>
                    ) : filteredTemplates.length === 0 ? (
                      <div className="p-8 text-center text-white/30 text-sm">
                        No scenarios in this category.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredTemplates.map((tpl) => {
                          const isSelected = selectedTemplate === tpl.id;
                          const st = getScenarioType(tpl);
                          const Icon = SCENARIO_ICONS[st] ?? Lock;
                          const colorCls = SCENARIO_COLORS[st] ?? SCENARIO_COLORS['login'];
                          return (
                            <div key={tpl.id} onClick={() => setSelectedTemplate(tpl.id)}
                              className={`cursor-pointer rounded-lg border p-4 transition-all ${
                                isSelected
                                  ? 'border-blue-500/60 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                                  : 'border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                              }`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${colorCls}`}>
                                  <Icon className="w-3 h-3" />
                                  {st}
                                </span>
                                {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                              </div>
                              <h4 className="text-sm font-semibold text-white line-clamp-2 leading-snug mb-1">{tpl.name}</h4>
                              <DifficultyBadge difficulty={tpl.difficulty} />
                              <p className="text-xs text-white/40 mt-2 line-clamp-2 leading-relaxed">
                                {tpl.lure_description}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Selected template preview */}
                  {selectedTpl && (
                    <div className="rounded-lg border border-white/8 bg-white/[0.02] p-4 space-y-2">
                      <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Selected Scenario</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-white/30 block mb-0.5">Organisation</span>
                          <span className="text-white/80">{selectedTpl.fictional_org || selectedTpl.sender_name}</span>
                        </div>
                        <div>
                          <span className="text-white/30 block mb-0.5">Sender Display</span>
                          <span className="text-white/80 font-mono truncate block">{selectedTpl.sender_email_display}</span>
                        </div>
                        <div>
                          <span className="text-white/30 block mb-0.5">Manipulation</span>
                          <span className="text-white/80">{selectedTpl.manipulation?.join(', ') || '—'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <button type="submit" disabled={dispatching}
                      className="w-full sm:w-auto btn btn-solid h-[44px] px-6 text-sm font-semibold rounded-lg shadow-lg shadow-blue-600/20">
                      {dispatching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                      Dispatch Simulation Email
                    </button>
                    <button type="button" onClick={() => setDispatchEmail('target.audit@phishguard-internal.io')}
                      className="text-xs text-white/40 hover:text-white/70 transition-colors">
                      Fill sample address
                    </button>
                  </div>
                </form>
              </div>

              {dispatchResult && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl border border-green-500/30 bg-green-500/5 p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">Simulation Email Dispatched</h3>
                        <p className="text-xs text-white/50">{dispatchResult.message}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-1 rounded bg-green-500/20 text-green-300 font-semibold uppercase shrink-0">
                      {dispatchResult.provider}
                    </span>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/40 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>Tracking URL:</span>
                      <button type="button" onClick={() => handleCopyLink(dispatchResult.tracking_url)}
                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors">
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedLink ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="p-2.5 rounded bg-white/5 font-mono text-xs text-white/80 break-all border border-white/5 select-all">
                      {dispatchResult.tracking_url}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
                    <a href={dispatchResult.tracking_url} target="_blank" rel="noreferrer"
                      className="btn btn-solid h-[38px] px-4 text-xs inline-flex items-center gap-2">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Target View
                    </a>
                    <button type="button" onClick={() => setActiveTab('monitor')}
                      className="btn btn-ghost h-[38px] px-4 text-xs inline-flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5" />
                      Go to Live Monitor
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ════════════════ TAB 2: LIVE MONITOR ════════════════ */}
        <AnimatePresence mode="wait">
          {activeTab === 'monitor' && (
            <motion.div key="monitor" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">

              {/* Status header */}
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
                  <button type="button" onClick={() => setIsPolling(!isPolling)}
                    className={`btn h-[36px] px-3 text-xs ${isPolling ? 'btn-ghost text-green-400' : 'btn-ghost text-white/40'}`}>
                    {isPolling ? '● Polling Active' : '○ Paused'}
                  </button>
                  <button type="button" onClick={handleManualRefresh} disabled={refreshingMonitor}
                    className="btn btn-ghost h-[36px] px-3 text-xs" title="Refresh Now">
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshingMonitor ? 'animate-spin' : ''}`} />
                  </button>
                  <button type="button" onClick={handleResetHistory} disabled={resetting}
                    className="btn btn-ghost h-[36px] px-3 text-xs text-red-400/80 hover:text-red-400" title="Reset All">
                    <RotateCcw className={`w-3.5 h-3.5 mr-1 ${resetting ? 'animate-spin' : ''}`} />
                    Reset
                  </button>
                </div>
              </div>

              {/* Scenario-aware local event feed */}
              {localEvents.length > 0 && (
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-400" />
                      Scenario Event Timeline
                      {demoTemplate && (
                        <span className="text-[11px] font-normal text-white/40">
                          — {demoTemplate.fictional_org || demoTemplate.name}
                        </span>
                      )}
                    </h4>
                    <span className="text-[11px] text-white/30">{localEvents.length} event{localEvents.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {localEvents.map((ev) => (
                      <div key={ev.id} className={`flex items-start gap-3 rounded-lg border px-4 py-2.5 ${SEVERITY_STYLES[ev.severity]}`}>
                        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${SEVERITY_DOT[ev.severity]}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium leading-tight">{ev.displayMessage}</p>
                        </div>
                        <span className="text-[10px] text-white/25 font-mono shrink-0 tabular-nums">
                          {ev.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Backend live pipeline for latest polled event */}
              {dashboard?.latest_event ? (
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/6 pb-4 gap-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">Active Session</span>
                      <p className="text-base font-bold text-white font-mono">{dashboard.latest_event.session_id}</p>
                    </div>
                    <div className="text-xs text-white/60">
                      Target: <strong className="text-white font-mono">{dashboard.latest_event.target_email}</strong>
                    </div>
                  </div>

                  {/* 3-step pipeline */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-lg bg-white/[0.02] border border-white/8 p-4">
                      <div className="flex items-center gap-2 text-blue-400 text-xs font-bold mb-2">
                        <CheckCircle2 className="w-4 h-4" />
                        1. Email Dispatched
                      </div>
                      <p className="text-xs text-white/60">Simulation email sent to target inbox.</p>
                      <span className="text-[10px] text-white/30 mt-2 block font-mono">Status: Delivered</span>
                    </div>

                    {(() => {
                      const isClicked =
                        dashboard.latest_event.event_type === 'link_clicked' ||
                        dashboard.latest_event.event_type === 'login_submitted' ||
                        ['clicked', 'submitted', 'completed'].includes(dashboard.latest_event.session_status);
                      return (
                        <div className={`rounded-lg border p-4 transition-all ${isClicked ? 'border-amber-500/40 bg-amber-500/10' : 'border-white/5 bg-white/[0.01] opacity-40'}`}>
                          <div className="flex items-center gap-2 text-xs font-bold mb-2">
                            {isClicked ? <CheckCircle2 className="w-4 h-4 text-amber-400" /> : <Clock className="w-4 h-4 text-white/30" />}
                            <span className={isClicked ? 'text-amber-300' : 'text-white/40'}>2. Link Opened</span>
                          </div>
                          <p className="text-xs text-white/60">
                            {isClicked ? 'Target clicked the simulation link.' : 'Waiting for link click…'}
                          </p>
                        </div>
                      );
                    })()}

                    {(() => {
                      const isSubmitted =
                        dashboard.latest_event.event_type === 'login_submitted' ||
                        ['submitted', 'completed'].includes(dashboard.latest_event.session_status);
                      return (
                        <div className={`rounded-lg border p-4 transition-all ${isSubmitted ? 'border-red-500/50 bg-red-500/10' : 'border-white/5 bg-white/[0.01] opacity-40'}`}>
                          <div className="flex items-center gap-2 text-xs font-bold mb-2">
                            {isSubmitted ? <ShieldAlert className="w-4 h-4 text-red-400" /> : <Clock className="w-4 h-4 text-white/30" />}
                            <span className={isSubmitted ? 'text-red-300' : 'text-white/40'}>3. Data Submitted</span>
                          </div>
                          {isSubmitted ? (
                            <div className="space-y-1.5">
                              <div>
                                <span className="text-[10px] text-white/30 uppercase font-mono">Input 1:</span>
                                <p className="text-xs font-mono text-white bg-white/5 rounded px-2 py-1 mt-0.5 border border-white/5 truncate">
                                  {dashboard.latest_event.username_entered || '—'}
                                </p>
                              </div>
                              <div>
                                <span className="text-[10px] text-white/30 uppercase font-mono">Password entered:</span>
                                <p className={`text-xs font-mono rounded px-2 py-1 mt-0.5 border font-bold truncate ${
                                  dashboard.latest_event.password_entered
                                    ? 'text-red-300 bg-red-500/10 border-red-500/20'
                                    : 'text-white/30 bg-white/5 border-white/5'
                                }`}>
                                  {dashboard.latest_event.password_entered ? '✓ Yes' : '—'}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-white/40 mt-1">Waiting for interaction…</p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : localEvents.length === 0 ? (
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-12 text-center space-y-3">
                  <Inbox className="w-10 h-10 text-white/20 mx-auto" />
                  <h4 className="text-sm font-semibold text-white">No active simulation sessions</h4>
                  <p className="text-xs text-white/40 max-w-sm mx-auto">
                    Dispatch an email or run a browser simulation to view live interaction events here.
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-2">
                    <button type="button" onClick={() => setActiveTab('campaign')}
                      className="btn btn-solid h-[38px] px-5 text-xs inline-flex items-center gap-2">
                      <Send className="w-3.5 h-3.5" />
                      Dispatch Email
                    </button>
                    <button type="button" onClick={() => setActiveTab('demo')}
                      className="btn btn-ghost h-[38px] px-5 text-xs inline-flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5" />
                      Run Simulation
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Compromised sessions panel */}
              {sessionsHistory.filter((s) => s.status === 'submitted' || s.status === 'completed').length > 0 && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/[0.04] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                      Interactions Recorded
                      <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">
                        {sessionsHistory.filter((s) => ['submitted', 'completed'].includes(s.status)).length}
                      </span>
                    </h4>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={handleManualRefresh} disabled={refreshingMonitor}
                        className="btn btn-ghost h-[32px] px-3 text-xs flex items-center gap-1.5">
                        <RefreshCw className={`w-3 h-3 ${refreshingMonitor ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                      <button type="button" onClick={handleResetHistory} disabled={resetting}
                        className="btn btn-ghost h-[32px] px-3 text-xs text-red-400/70 hover:text-red-400 flex items-center gap-1.5">
                        <RotateCcw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {sessionsHistory
                      .filter((s) => ['submitted', 'completed'].includes(s.status))
                      .map((s, idx) => {
                        const loginEvent = s.events.find((e) => e.event_type === 'login_submitted');
                        return (
                          <div key={s.session_id} className="rounded-lg border border-red-500/20 bg-black/30 p-4">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-2">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-[11px] font-bold text-red-300">
                                  {idx + 1}
                                </span>
                                <div>
                                  <p className="text-xs font-semibold text-white font-mono">{s.session_id}</p>
                                  <p className="text-[10px] text-white/40">{s.target_email}</p>
                                </div>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold uppercase tracking-wider shrink-0">
                                {s.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                              <div className="rounded bg-white/[0.03] border border-white/5 px-3 py-2">
                                <span className="text-[10px] text-white/30 uppercase font-mono block mb-0.5">Template</span>
                                <span className="text-white/70 truncate block">{s.template_id || '—'}</span>
                              </div>
                              <div className="rounded bg-white/[0.03] border border-white/5 px-3 py-2">
                                <span className="text-[10px] text-white/30 uppercase font-mono block mb-0.5">Input Entered</span>
                                <span className="text-white/70 font-mono truncate block">{loginEvent?.username_entered || s.target_email}</span>
                              </div>
                              <div className="rounded bg-red-500/10 border border-red-500/20 px-3 py-2">
                                <span className="text-[10px] text-red-400/60 uppercase font-mono block mb-0.5">Password Field</span>
                                <span className={`font-mono font-bold truncate block ${loginEvent?.password_entered ? 'text-red-300' : 'text-white/30'}`}>
                                  {loginEvent?.password_entered ? '✓ Submitted' : '—'}
                                </span>
                              </div>
                            </div>
                            <p className="mt-2 text-[10px] text-white/25">
                              {s.events.length} event{s.events.length !== 1 ? 's' : ''} &bull; {new Date(s.created_at).toLocaleString()}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* All sessions table */}
              {sessionsHistory.length > 0 && (
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      All Sessions Log
                      <span className="text-[11px] font-normal text-white/30">({sessionsHistory.length})</span>
                    </h4>
                    <button type="button" onClick={handleResetHistory} disabled={resetting}
                      className="btn btn-ghost h-[32px] px-3 text-xs text-red-400/70 hover:text-red-400 flex items-center gap-1.5">
                      <RotateCcw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
                      Reset All
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-white/40 border-b border-white/8">
                          <th className="py-2.5 pr-4 font-medium">#</th>
                          <th className="py-2.5 pr-4 font-medium">Session ID</th>
                          <th className="py-2.5 pr-4 font-medium">Email</th>
                          <th className="py-2.5 pr-4 font-medium">Status</th>
                          <th className="py-2.5 pr-4 font-medium">Events</th>
                          <th className="py-2.5 font-medium">Time</th>
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
                                ['submitted', 'completed'].includes(s.status) ? 'bg-red-500/20 text-red-300'
                                : s.status === 'clicked' ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-blue-500/20 text-blue-300'}`}>
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
        </AnimatePresence>

        {/* ════════════════ TAB 3: INTERACTIVE DEMO ════════════════ */}
        <AnimatePresence mode="wait">
          {activeTab === 'demo' && (
            <motion.div key="demo" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">

              {/* Stepper */}
              <div className="flex items-center justify-center gap-1 sm:gap-2 text-xs">
                {[
                  { key: 'setup',    label: '1. Setup',    icon: Sliders },
                  { key: 'email',    label: '2. Email',    icon: Mail },
                  { key: 'interact', label: '3. Interact', icon: Target },
                  { key: 'result',   label: '4. Result',   icon: BookOpen },
                ].map((s, i) => {
                  const stageOrder = ['setup', 'email', 'interact', 'result'];
                  const activeIdx = stageOrder.indexOf(demoStage);
                  const sIdx = stageOrder.indexOf(s.key);
                  const isActive = sIdx === activeIdx;
                  const isDone = sIdx < activeIdx;
                  const Icon = s.icon;
                  return (
                    <React.Fragment key={s.key}>
                      {i > 0 && <div className={`w-6 sm:w-10 h-px transition-colors ${sIdx <= activeIdx ? 'bg-white/30' : 'bg-white/8'}`} />}
                      <span onClick={() => isDone && setDemoStage(s.key as DemoStage)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all ${
                          isActive ? 'bg-white/10 text-white border border-white/15'
                          : isDone ? 'cursor-pointer text-white/50 hover:text-white'
                          : 'text-white/20'}`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{s.label}</span>
                      </span>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* ── STAGE: SETUP ── */}
              {demoStage === 'setup' && (
                <div className="space-y-4 max-w-2xl mx-auto">
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] p-6 space-y-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-blue-400" />
                      Choose Your Simulation
                    </h3>
                    <p className="text-xs text-white/50 leading-relaxed">
                      Experience a full fraud scenario in your browser. Select any scenario below, then walk through
                      the email lure, fake interaction page, and educational debrief.
                    </p>
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5">
                        Your Email (shown in the simulation)
                      </label>
                      <input type="email" value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500/50" />
                    </div>
                  </div>

                  {/* Category filter for demo */}
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_FILTERS.map(({ key, label, icon: Icon }) => (
                      <button key={key} type="button" onClick={() => setCategoryFilter(key)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          categoryFilter === key
                            ? 'border-blue-500/50 bg-blue-500/15 text-blue-300'
                            : 'border-white/10 bg-white/[0.02] text-white/50 hover:text-white/80 hover:border-white/20'}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {loadingTemplates ? (
                    <div className="flex items-center justify-center p-12 text-white/30">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredTemplates.map((tpl) => {
                        const st = getScenarioType(tpl);
                        const Icon = SCENARIO_ICONS[st] ?? Lock;
                        const colorCls = SCENARIO_COLORS[st] ?? SCENARIO_COLORS['login'];
                        return (
                          <button key={tpl.id} type="button" onClick={() => handleStartDemo(tpl)}
                            className="w-full text-left rounded-xl border border-white/8 bg-white/[0.02] p-4 hover:border-white/20 hover:bg-white/[0.05] transition-all group">
                            <div className="flex items-start justify-between mb-2">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${colorCls}`}>
                                <Icon className="w-3 h-3" />
                                {st}
                              </span>
                              <DifficultyBadge difficulty={tpl.difficulty} />
                            </div>
                            <h4 className="text-sm font-semibold text-white mb-1 group-hover:text-white">{tpl.name}</h4>
                            <p className="text-xs text-white/40 line-clamp-2 leading-relaxed mb-3">{tpl.lure_description}</p>
                            {tpl.manipulation && tpl.manipulation.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {tpl.manipulation.map((m) => (
                                  <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 border border-white/5">
                                    {m}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                              <ArrowRight className="w-3.5 h-3.5" />
                              Start this simulation
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── STAGE: EMAIL ── */}
              {demoStage === 'email' && demoTemplate && (
                <div className="space-y-4 max-w-xl mx-auto">
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] overflow-hidden shadow-2xl">
                    {/* Email client chrome */}
                    <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-white/6 bg-white/[0.02]">
                      <span className="text-[11px] text-white/40 font-mono">
                        {demoTemplate.fictional_org || demoTemplate.sender_name} &bull; Inbox
                      </span>
                      <button type="button" onClick={handleResetDemo}
                        className="text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" />
                        Change scenario
                      </button>
                    </div>
                    <div className="p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold shrink-0">
                          {(demoTemplate.fictional_org || 'XX').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/40">
                            From: <span className="text-white/70">{demoTemplate.sender_email_display}</span>
                          </p>
                          <p className="text-sm font-bold text-white mt-0.5 leading-snug">{demoTemplate.subject}</p>
                          <p className="text-xs text-white/30 mt-0.5">
                            To: <span className="text-white/50">{targetEmail || 'you@example.com'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Red flag indicators */}
                      {demoTemplate.red_flags && demoTemplate.red_flags.length > 0 && (
                        <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                          <p className="text-[11px] font-semibold text-amber-400 mb-1.5 flex items-center gap-1">
                            <Search className="w-3.5 h-3.5" />
                            Red flags in this email:
                          </p>
                          <ul className="space-y-0.5">
                            {demoTemplate.red_flags.map((flag) => (
                              <li key={flag} className="text-[11px] text-amber-300/70 flex items-start gap-1.5">
                                <span className="mt-0.5">•</span>{flag}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <p className="text-sm text-white/60 leading-relaxed mb-6">
                        {demoTemplate.lure_description}
                      </p>
                      <button type="button" onClick={handleOpenEmail}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                        Click the link in this email
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STAGE: INTERACT ── */}
              {demoStage === 'interact' && demoTemplate && (
                <div className="max-w-lg mx-auto">
                  {targetError && (
                    <p role="alert" className="mb-4 text-xs text-amber-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {targetError}
                    </p>
                  )}
                  <SimulationInteractPage
                    key={demoTemplate.id}
                    template={demoTemplate}
                    scenarioType={currentDemoScenarioType}
                    interaction={currentInteraction}
                    primaryValue={primaryField}
                    secondaryValue={secondaryField}
                    showSecondary={showSecondary}
                    submitting={submittingInteraction}
                    error={targetError}
                    onPrimaryChange={setPrimaryField}
                    onSecondaryChange={setSecondaryField}
                    onShowSecondaryToggle={() => setShowSecondary(!showSecondary)}
                    onSubmit={handleSubmitInteraction}
                    onIntermediateEvent={(eventType) =>
                      addMonitorEvent(currentDemoScenarioType, eventType)
                    }
                  />
                  <p className="mt-4 text-center text-[11px] text-white/20 leading-relaxed">
                    🛡️ This is an educational simulation. Do not enter real credentials.
                  </p>
                </div>
              )}

              {/* ── STAGE: RESULT ── */}
              {demoStage === 'result' && demoTemplate && (
                <div className="space-y-5 max-w-xl mx-auto">
                  {/* Compromise banner */}
                  <div className="rounded-xl border-2 border-red-500/40 bg-red-500/10 p-7 text-center">
                    <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <h2 className="text-xl font-bold text-white">Simulation Complete</h2>
                    <p className="text-xs text-white/60 mt-1">Here is what an attacker would have captured.</p>

                    <div className="mt-5 rounded-lg border border-white/10 bg-black/60 p-4 text-left font-mono text-xs space-y-2">
                      <div>
                        <span className="text-white/30 text-[10px] uppercase">{currentInteraction.primaryField.label}:</span>
                        <p className="text-white">{capturedData?.primary || '(none)'}</p>
                      </div>
                      {currentInteraction.secondaryField && (
                        <div>
                          <span className="text-white/30 text-[10px] uppercase">{currentInteraction.secondaryField.label}:</span>
                          <p className="text-red-400 font-bold">{capturedData?.secondary || '(none)'}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attack breakdown */}
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] p-6 space-y-4">
                    <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                      What happened in this simulation
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="rounded-lg bg-white/[0.02] border border-white/5 p-4">
                        <p className="text-white/40 font-semibold uppercase tracking-wider text-[10px] mb-2">Attack Type</p>
                        <p className="text-white font-medium">{demoTemplate.category}</p>
                      </div>
                      <div className="rounded-lg bg-white/[0.02] border border-white/5 p-4">
                        <p className="text-white/40 font-semibold uppercase tracking-wider text-[10px] mb-2">Fictional Organisation</p>
                        <p className="text-white font-medium">{demoTemplate.fictional_org || demoTemplate.sender_name}</p>
                      </div>
                    </div>

                    {demoTemplate.manipulation && demoTemplate.manipulation.length > 0 && (
                      <div className="rounded-lg bg-white/[0.02] border border-white/5 p-4">
                        <p className="text-white/40 font-semibold uppercase tracking-wider text-[10px] mb-2">Manipulation Techniques</p>
                        <div className="flex flex-wrap gap-1.5">
                          {demoTemplate.manipulation.map((m) => (
                            <span key={m} className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {demoTemplate.red_flags && demoTemplate.red_flags.length > 0 && (
                      <div className="rounded-lg bg-white/[0.02] border border-white/5 p-4">
                        <p className="text-white/40 font-semibold uppercase tracking-wider text-[10px] mb-2">Red Flags You Could Have Spotted</p>
                        <ul className="space-y-1.5">
                          {demoTemplate.red_flags.map((f) => (
                            <li key={f} className="flex items-start gap-2 text-xs text-white/60">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {demoTemplate.safe_action && (
                      <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-4">
                        <p className="text-emerald-400 font-semibold uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          What you should have done
                        </p>
                        <p className="text-xs text-emerald-300/80 leading-relaxed">{demoTemplate.safe_action}</p>
                      </div>
                    )}
                  </div>

                  {/* CTA row */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button type="button" onClick={handleResetDemo}
                      className="flex-1 btn btn-ghost h-[40px] text-xs inline-flex items-center justify-center gap-2">
                      <RotateCcw className="w-3.5 h-3.5" />
                      Try Another Scenario
                    </button>
                    <button type="button" onClick={() => setActiveTab('monitor')}
                      className="flex-1 btn btn-solid h-[40px] text-xs inline-flex items-center justify-center gap-2">
                      <Activity className="w-3.5 h-3.5" />
                      View in Live Monitor
                    </button>
                  </div>

                  {/* Review CTA — shown after completing a simulation */}
                  <ReviewCTA className="mt-2" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};

export default SimulatorPage;
