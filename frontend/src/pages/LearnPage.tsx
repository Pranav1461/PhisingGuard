import React from 'react';
import { Link } from 'react-router-dom';
import { useScrollReveal } from '../hooks/useScrollReveal';
import {
  UserX,
  Mail,
  Eye,
  MousePointerClick,
  Globe,
  KeyRound,
  AlertTriangle,
  Search,
  Lock,
  Shield,
  Ban,
} from 'lucide-react';

const flow = [
  { icon: UserX, label: 'Attacker' },
  { icon: Mail, label: 'Phishing Message' },
  { icon: Eye, label: 'Victim' },
  { icon: MousePointerClick, label: 'Suspicious Link' },
  { icon: Globe, label: 'Fake Website' },
  { icon: KeyRound, label: 'Credential Submission' },
  { icon: AlertTriangle, label: 'Potential Theft' },
];

const techniques = [
  { icon: AlertTriangle, title: 'Urgency & fear', text: '"Your account will be suspended in 24 hours." Panic makes people act before they think.' },
  { icon: Shield, title: 'Pretending to be trusted', text: 'Messages impersonate banks, delivery services, employers, or government bodies.' },
  { icon: Globe, title: 'Look-alike domains', text: 'Fake addresses that closely resemble real ones (for example, a misspelled brand).' },
  { icon: MousePointerClick, title: 'Disguised links', text: 'Visible text says one thing, but the underlying link goes somewhere else.' },
  { icon: Ban, title: 'Too-good-to-be-true offers', text: 'Winning prizes, refunds, or free items used as bait to collect information.' },
  { icon: KeyRound, title: 'Credential farming', text: 'Fake login pages designed to capture the exact username and password you type.' },
];

const warningSigns = [
  'Unexpected urgency',
  'Requests for sensitive data',
  'Suspicious sender',
  'Odd link addresses',
  'Poor spelling & grammar',
  'Unusual attachments',
];

const protections = [
  'Type the address yourself',
  'Check for HTTPS — but do not rely on it alone',
  'Verify with an independent channel',
  'Use multi-factor authentication',
  'Use unique passwords',
  'Report suspicious messages',
];

export const LearnPage: React.FC = () => {
  const ref = useScrollReveal();

  return (
    <div ref={ref} className="max-w-4xl mx-auto space-y-20">
      {/* Header */}
      <header className="text-center scroll-reveal">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">Phishing education</h1>
        <p className="mt-3 text-white/50 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          Phishing is one of the most common ways accounts get compromised. Understanding how it
          works is the first line of defense.
        </p>
      </header>

      {/* What is phishing */}
      <section className="scroll-reveal" data-delay="0">
        <h2 className="text-2xl font-bold text-white mb-4">What is phishing?</h2>
        <p className="text-white/50 leading-relaxed">
          Phishing is a social-engineering attack. Rather than breaking into a system, the attacker
          tricks a person into giving up access. The technique has scaled massively: a single
          convincing campaign can be sent to millions of inboxes at almost no cost, which is why
          attackers keep using it.
        </p>
      </section>

      {/* Why attackers use it */}
      <section className="scroll-reveal" data-delay="100">
        <h2 className="text-2xl font-bold text-white mb-4">Why do attackers use phishing?</h2>
        <ul className="space-y-3 text-white/50">
          {[
            'It is cheap to run at massive scale.',
            'Stolen credentials are immediately valuable and resold.',
            'People are the hardest layer to fully patch.',
            'One success can become a foothold for a larger attack on an organization.',
          ].map((text) => (
            <li key={text} className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60 mt-2 shrink-0" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* How attack unfolds */}
      <section className="scroll-reveal" data-delay="0">
        <h2 className="text-2xl font-bold text-white mb-6">How a phishing attack unfolds</h2>
        <div className="relative">
          <div className="absolute left-[18px] top-0 bottom-0 w-px bg-white/8" aria-hidden="true" />
          <ol className="space-y-4">
            {flow.map((step) => {
              const Icon = step.icon;
              return (
                <li key={step.label} className="relative flex items-center gap-4 pl-1">
                  <span className="relative z-10 w-9 h-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-white/60" />
                  </span>
                  <span className="text-sm text-white/60 font-medium">{step.label}</span>
                </li>
              );
            })}
          </ol>
        </div>
        <p className="mt-4 text-sm text-white/35 italic">
          At every step there is a chance to pause and verify. Attackers succeed when they remove
          those pauses with urgency, impersonation, and convincing detail.
        </p>
      </section>

      {/* Techniques */}
      <section className="scroll-reveal" data-delay="0">
        <h2 className="text-2xl font-bold text-white mb-6">Common techniques</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {techniques.map((t, i) => {
            const Icon = t.icon;
            return (
              <div
                key={t.title}
                className="scroll-reveal glass p-5"
                data-delay={i * 80}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <Icon className="w-4 h-4 text-white/40" />
                  <h3 className="font-semibold text-white text-sm">{t.title}</h3>
                </div>
                <p className="text-sm text-white/40 leading-relaxed">{t.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Warning signs */}
      <section className="scroll-reveal" data-delay="0">
        <h2 className="text-2xl font-bold text-white mb-6">Warning signs to look for</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {warningSigns.map((sign, i) => (
            <div
              key={sign}
              className="scroll-reveal flex items-center gap-3 glass p-4"
              data-delay={i * 60}
            >
              <AlertTriangle className="w-4 h-4 text-amber-500/60 shrink-0" />
              <span className="text-sm text-white/60">{sign}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-white/30 italic">
          These are signals, not proof. A legitimate message can occasionally contain a warning
          sign — but the more signs you notice, the more caution is warranted.
        </p>
      </section>

      {/* Consequences */}
      <section className="scroll-reveal" data-delay="0">
        <h2 className="text-2xl font-bold text-white mb-4">Consequences of a successful attack</h2>
        <ul className="space-y-3 text-white/50">
          {[
            'Account takeover and loss of access to your own information.',
            'Financial fraud using stolen banking or payment details.',
            'Spread of further attacks to your contacts and colleagues.',
            'Identity theft and misuse of personal data.',
          ].map((text) => (
            <li key={text} className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400/60 mt-2 shrink-0" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* How to protect */}
      <section className="scroll-reveal" data-delay="0">
        <h2 className="text-2xl font-bold text-white mb-6">How to protect yourself</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {protections.map((tip, i) => (
            <div
              key={tip}
              className="scroll-reveal flex items-center gap-3 glass p-4"
              data-delay={i * 60}
            >
              <Lock className="w-4 h-4 text-green-400/60 shrink-0" />
              <span className="text-sm text-white/60">{tip}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="scroll-reveal text-center" data-delay="0">
        <h2 className="text-xl font-bold text-white mb-3">Put it into practice</h2>
        <p className="text-sm text-white/40 mb-5">
          Try analyzing a URL or exploring the pattern-learning section.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/check" className="btn btn-solid h-[42px] px-5 text-sm">
            <Search className="w-4 h-4 mr-2" /> Check a URL
          </Link>
          <Link to="/patterns" className="btn btn-ghost h-[42px] px-5 text-sm">
            <Globe className="w-4 h-4 mr-2 opacity-60" /> Pattern Learning
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LearnPage;
