import React from 'react';
import { Link } from 'react-router-dom';
import { useScrollReveal } from '../hooks/useScrollReveal';
import {
  AlertTriangle,
  CreditCard,
  TrendingUp,
  UserCheck,
  ShoppingCart,
  Package,
  Headphones,
  Lock,
  Gift,
  Eye,
  Clock,
  Sparkles,
  Link2,
  DollarSign,
  KeyRound,
  Heart,
  StopCircle,
  Search,
  CheckCircle,
  Shield,
  Flag,
  ArrowRight,
  Target,
  Users,
  Banknote,
  CircleAlert,
} from 'lucide-react';

/* ─────────────────────────── DATA ─────────────────────────── */

const howItWorksSteps = [
  {
    icon: Target,
    label: 'Target selected',
    text: 'The fraudster identifies a potential victim — often through data breaches, social media, or random mass contact.',
  },
  {
    icon: Users,
    label: 'Trust built',
    text: 'They establish credibility by impersonating a known person, company, or authority — or by slowly building a relationship.',
  },
  {
    icon: Eye,
    label: 'Deception applied',
    text: 'False information, fake urgency, or fabricated scenarios are introduced to manipulate the target\'s judgment.',
  },
  {
    icon: Clock,
    label: 'Pressure applied',
    text: 'The victim is pushed to act quickly — "offer expires", "account at risk", "limited slots" — to prevent careful thinking.',
  },
  {
    icon: Banknote,
    label: 'Action taken',
    text: 'The victim pays, shares credentials, approves access, or hands over personal information.',
  },
  {
    icon: AlertTriangle,
    label: 'Harm done',
    text: 'Money is moved, accounts accessed, identity misused — often before the victim realises anything went wrong.',
  },
];

const fraudTypes = [
  {
    icon: CreditCard,
    title: 'Payment fraud',
    text: 'Unauthorized or deceptive payment requests — fake invoices, intercepted transactions, or requests to change payment details.',
  },
  {
    icon: TrendingUp,
    title: 'Investment fraud',
    text: 'Fake schemes offering unrealistic returns, pressure to invest quickly, or "guaranteed" profits. Common with crypto.',
  },
  {
    icon: UserCheck,
    title: 'Impersonation fraud',
    text: 'Someone pretends to be your bank, employer, government office, or even a friend or family member.',
  },
  {
    icon: ShoppingCart,
    title: 'Shopping fraud',
    text: 'Fake stores, counterfeit goods, non-delivery of paid items, or payment scams on second-hand platforms.',
  },
  {
    icon: Package,
    title: 'Delivery scams',
    text: 'Fake delivery failure notices asking for address confirmation or a small "customs fee" payment.',
  },
  {
    icon: Headphones,
    title: 'Support scams',
    text: 'Fake technical support or customer service contacts attempting to get remote access or payment.',
  },
  {
    icon: Lock,
    title: 'Account takeover',
    text: 'Attackers obtain credentials through phishing or data breaches, then lock you out of your own account.',
  },
  {
    icon: Gift,
    title: 'Reward & prize scams',
    text: 'Notifications that you\'ve won a prize, cashback, or voucher — typically requiring personal details or a fee to "release" it.',
  },
];

const warningSigns = [
  {
    icon: Clock,
    label: 'Urgency',
    text: '"Act now or your account closes." Manufactured pressure to stop you thinking clearly.',
  },
  {
    icon: CircleAlert,
    label: 'Unexpected contact',
    text: 'You receive a payment request, login alert, or prize notification you were not expecting.',
  },
  {
    icon: Sparkles,
    label: 'Too good to be true',
    text: 'Unrealistic returns, free offers, or guaranteed profits. If it sounds perfect, it usually isn\'t.',
  },
  {
    icon: UserCheck,
    label: 'Impersonation',
    text: 'Someone claims to be your bank, employer, delivery company, or a government body.',
  },
  {
    icon: Link2,
    label: 'Suspicious links',
    text: 'The URL or sender address doesn\'t match the organisation being claimed.',
  },
  {
    icon: DollarSign,
    label: 'Unusual payment method',
    text: 'Asked to pay by gift card, wire transfer, or cryptocurrency — methods that can\'t be reversed.',
  },
  {
    icon: KeyRound,
    label: 'Requests for secrets',
    text: 'Anyone asking for your password, OTP, PIN, or recovery code is a red flag — legitimate organisations never ask.',
  },
  {
    icon: Heart,
    label: 'Emotional manipulation',
    text: 'Fear, excitement, sympathy, or panic being deliberately triggered to override your judgement.',
  },
];

const detectSteps = [
  {
    word: 'STOP',
    icon: StopCircle,
    color: 'text-red-400',
    borderColor: 'border-red-500/20',
    text: 'Do not immediately respond, click, pay, or share. Give yourself time to think.',
  },
  {
    word: 'VERIFY',
    icon: Search,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/20',
    text: 'Contact the organisation directly using a number or address you find yourself — not one supplied in the message.',
  },
  {
    word: 'CHECK',
    icon: Eye,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/20',
    text: 'Inspect the sender, domain, phone number, and payment details. Look for small inconsistencies.',
  },
  {
    word: 'QUESTION',
    icon: CircleAlert,
    color: 'text-blue-400',
    borderColor: 'border-blue-500/20',
    text: 'Was I expecting this? Why is there urgency? Does this request make sense for this organisation?',
  },
  {
    word: 'CONFIRM',
    icon: CheckCircle,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
    text: 'Use the official website or app — not a link provided in the suspicious message — to check your account.',
  },
];

const preventionTips = [
  'Use strong, unique passwords for every account',
  'Enable multi-factor authentication (MFA) everywhere you can',
  'Keep your devices and apps updated',
  'Never click unexpected links — navigate directly to the official site',
  'Verify requests independently before acting on them',
  'Never share OTPs, PINs, or passwords with anyone',
  'Monitor your financial transactions regularly',
  'Use official apps and websites, not links from messages',
  'Be sceptical of any unexpected urgent request',
  'Avoid sending sensitive information through unexpected channels',
];

const responseSteps = [
  'Stop — do not send more money or information',
  'Secure affected accounts immediately — change passwords',
  'Contact your bank or card provider if money was moved',
  'Contact the legitimate organisation the fraudster impersonated',
  'Review your recent account activity for unusual transactions',
  'Report the incident to the appropriate official channel',
  'Monitor for further suspicious contact or activity',
];

const takeaway = [
  { word: 'STOP', desc: 'Don\'t react immediately' },
  { word: 'VERIFY', desc: 'Use trusted channels' },
  { word: 'CHECK', desc: 'Inspect every detail' },
  { word: 'THINK', desc: 'Question the request' },
  { word: 'PROTECT', desc: 'Secure your accounts' },
  { word: 'REPORT', desc: 'Tell the right people' },
];

/* ─────────────────────────── COMPONENT ─────────────────────────── */

export const FraudDetectionPage: React.FC = () => {
  const ref = useScrollReveal();

  return (
    <div ref={ref} className="max-w-4xl mx-auto space-y-20">

      {/* ── Hero ── */}
      <header className="text-center scroll-reveal pt-4">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5">
          <Shield className="w-3.5 h-3.5 text-amber-400/70" />
          <span className="text-xs font-medium text-amber-400/70 tracking-wider uppercase">Fraud Awareness</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white text-balance">
          Fraud Detection
        </h1>
        <p className="mt-4 text-white/50 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          Fraud isn't always obvious. Criminals manipulate trust, create urgency, and convince people
          to make unsafe decisions — often without any technical trickery at all.
        </p>
        <p className="mt-3 text-white/30 max-w-md mx-auto text-sm leading-relaxed">
          This page covers what fraud is, how it works, how to recognise it, and what to do if you
          suspect you're being targeted.
        </p>
      </header>

      {/* ── What is fraud ── */}
      <section className="scroll-reveal" data-delay="0">
        <h2 className="text-2xl font-bold text-white mb-6">What is fraud?</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              heading: 'Deliberate deception',
              body: 'Fraud is intentional — the perpetrator knowingly misleads the victim. It is not an accident or misunderstanding.',
            },
            {
              heading: 'Manipulation of trust',
              body: 'Fraudsters exploit the trust people naturally extend to banks, employers, delivery companies, and other authorities.',
            },
            {
              heading: 'Financial or personal gain',
              body: 'The goal is almost always money, personal data, account access, or a combination of these.',
            },
            {
              heading: 'Why careful people get fooled',
              body: 'Fraud works through psychology, not just technology. Even attentive people can be deceived when the scenario is convincing and pressure is high.',
            },
          ].map((item, i) => (
            <div
              key={item.heading}
              className="scroll-reveal glass p-5"
              data-delay={i * 70}
            >
              <h3 className="font-semibold text-white text-sm mb-2">{item.heading}</h3>
              <p className="text-sm text-white/45 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How fraud works ── */}
      <section className="scroll-reveal" data-delay="0">
        <h2 className="text-2xl font-bold text-white mb-2">How fraud works</h2>
        <p className="text-sm text-white/40 mb-7 leading-relaxed">
          Most fraud follows a recognisable pattern. The technical details vary — the underlying manipulation rarely does.
        </p>
        <div className="relative">
          <div className="absolute left-[18px] top-0 bottom-0 w-px bg-white/8" aria-hidden="true" />
          <ol className="space-y-4">
            {howItWorksSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.label}
                  className="scroll-reveal relative flex items-start gap-4 pl-1"
                  data-delay={i * 80}
                >
                  <span className="relative z-10 w-9 h-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-amber-400/60" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white/80">{step.label}</p>
                    <p className="text-sm text-white/40 mt-0.5 leading-relaxed">{step.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        <p className="mt-5 text-sm text-white/30 italic">
          Notice that steps 2–4 are purely psychological. No malware required — just a convincing story and a time limit.
        </p>
      </section>

      {/* ── Common types ── */}
      <section className="scroll-reveal" data-delay="0">
        <h2 className="text-2xl font-bold text-white mb-2">Common types of fraud</h2>
        <p className="text-sm text-white/40 mb-6">
          These categories overlap — a single attack can combine several.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fraudTypes.map((t, i) => {
            const Icon = t.icon;
            return (
              <div
                key={t.title}
                className="scroll-reveal glass p-5"
                data-delay={i * 60}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <Icon className="w-4 h-4 text-white/35" />
                  <h3 className="font-semibold text-white text-sm">{t.title}</h3>
                </div>
                <p className="text-sm text-white/40 leading-relaxed">{t.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Warning signs ── */}
      <section className="scroll-reveal" data-delay="0">
        <h2 className="text-2xl font-bold text-white mb-2">Warning signs</h2>
        <p className="text-sm text-white/40 mb-6">
          These are signals, not proof. A legitimate message can occasionally trigger one — but the more you notice, the higher the risk.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {warningSigns.map((sign, i) => {
            const Icon = sign.icon;
            return (
              <div
                key={sign.label}
                className="scroll-reveal glass p-4 border border-white/6 hover:border-amber-500/20 transition-colors duration-300"
                data-delay={i * 55}
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-4 h-4 text-amber-500/60 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white/80">{sign.label}</p>
                    <p className="text-sm text-white/40 mt-0.5 leading-relaxed">{sign.text}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── How to detect ── */}
      <section className="scroll-reveal" data-delay="0">
        <h2 className="text-2xl font-bold text-white mb-2">How to detect fraud</h2>
        <p className="text-sm text-white/40 mb-7 leading-relaxed">
          A practical process to apply when something feels off — or when you want to be sure before acting.
        </p>
        <div className="space-y-3">
          {detectSteps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.word}
                className={`scroll-reveal glass p-5 border ${step.borderColor}`}
                data-delay={i * 80}
              >
                <div className="flex items-start gap-4">
                  <span className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className={`w-4 h-4 ${step.color}`} />
                  </span>
                  <div>
                    <p className={`text-xs font-mono font-bold tracking-widest ${step.color} mb-1`}>{step.word}</p>
                    <p className="text-sm text-white/50 leading-relaxed">{step.text}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 glass p-4 border border-white/6">
          <p className="text-sm text-white/35 italic">
            <span className="font-semibold text-white/50 not-italic">Key principle:</span>{' '}
            Never let urgency make a financial decision for you. Pressure is a tool — recognising it is the defence.
          </p>
        </div>
      </section>

      {/* ── How to prevent ── */}
      <section className="scroll-reveal" data-delay="0">
        <h2 className="text-2xl font-bold text-white mb-6">How to prevent fraud</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {preventionTips.map((tip, i) => (
            <div
              key={tip}
              className="scroll-reveal flex items-start gap-3 glass p-4"
              data-delay={i * 45}
            >
              <Lock className="w-4 h-4 text-emerald-400/60 shrink-0 mt-0.5" />
              <span className="text-sm text-white/55 leading-relaxed">{tip}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── What to do ── */}
      <section className="scroll-reveal" data-delay="0">
        <h2 className="text-2xl font-bold text-white mb-2">What to do if you suspect fraud</h2>
        <p className="text-sm text-white/40 mb-7">
          If you think you've been targeted — or already affected — act in order.
        </p>
        <div className="relative">
          <div className="absolute left-[18px] top-0 bottom-0 w-px bg-white/8" aria-hidden="true" />
          <ol className="space-y-3">
            {responseSteps.map((step, i) => (
              <li
                key={step}
                className="scroll-reveal relative flex items-center gap-4 pl-1"
                data-delay={i * 70}
              >
                <span className="relative z-10 w-9 h-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0 text-xs font-mono font-bold text-white/40">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-sm text-white/55 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
        {/* Reporting note */}
        <div className="mt-5 glass p-4 border border-amber-500/15">
          <div className="flex items-start gap-3">
            <Flag className="w-4 h-4 text-amber-500/60 mt-0.5 shrink-0" />
            <p className="text-sm text-white/40 leading-relaxed">
              Reporting channels vary by country. In India, report to the{' '}
              <span className="text-white/60">National Cyber Crime Reporting Portal (cybercrime.gov.in)</span>{' '}
              or call the helpline at{' '}
              <span className="text-white/60 font-mono">1930</span>.
              For financial fraud, contact your bank's fraud team immediately.
            </p>
          </div>
        </div>
      </section>

      {/* ── Quick Takeaway ── */}
      <section className="scroll-reveal" data-delay="0">
        <h2 className="text-2xl font-bold text-white mb-2">Quick takeaway</h2>
        <p className="text-sm text-white/40 mb-6">Six words. Apply them whenever something feels wrong.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {takeaway.map((item, i) => (
            <div
              key={item.word}
              className="scroll-reveal glass p-5 text-center border border-white/6 hover:border-amber-500/25 transition-colors duration-300"
              data-delay={i * 70}
            >
              <p className="text-lg sm:text-xl font-bold tracking-widest text-white font-mono">{item.word}</p>
              <p className="mt-1.5 text-xs text-white/35">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Note on this page ── */}
      <section className="scroll-reveal glass p-5 border border-white/6" data-delay="0">
        <div className="flex items-start gap-3">
          <Shield className="w-4 h-4 text-white/30 mt-0.5 shrink-0" />
          <p className="text-sm text-white/35 leading-relaxed">
            This page is educational. It does not detect fraud on your behalf. For active threat checking,
            use the <Link to="/check" className="text-white/55 underline underline-offset-2 hover:text-white transition-colors">URL checker</Link> or
            the <Link to="/simulator" className="text-white/55 underline underline-offset-2 hover:text-white transition-colors">phishing simulator</Link>.
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="scroll-reveal text-center pb-8" data-delay="0">
        <p className="text-sm text-white/40 mb-5">
          Ready to put this into practice? Try the phishing education or check a suspicious URL.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/learn" className="btn btn-solid h-[42px] px-5 text-sm">
            <Shield className="w-4 h-4 mr-2" />
            Phishing Education
          </Link>
          <Link to="/check" className="btn btn-ghost h-[42px] px-5 text-sm">
            <Search className="w-4 h-4 mr-2 opacity-60" />
            Check a URL
            <ArrowRight className="w-4 h-4 ml-2 opacity-40" />
          </Link>
        </div>
      </section>

    </div>
  );
};

export default FraudDetectionPage;
