import React from 'react';
import { Link } from 'react-router-dom';
import { useScrollReveal } from '../hooks/useScrollReveal';
import {
  Globe,
  DollarSign,
  Search,
  AlertTriangle,
  Link2,
  KeyRound,
  Braces,
  Hash,
  Shield,
  ArrowRight,
} from 'lucide-react';

const urlsToShow = [
  {
    label: 'Normal URL',
    parts: [
      { text: 'https://', kind: 'scheme' },
      { text: 'www.', kind: 'subdomain' },
      { text: 'example', kind: 'domain' },
      { text: '.com', kind: 'tld' },
      { text: '/products', kind: 'path' },
    ],
  },
  {
    label: 'Suspicious URL',
    parts: [
      { text: 'http://', kind: 'scheme' },
      { text: 'secure-login.account.', kind: 'subdomain' },
      { text: 'verify', kind: 'domain' },
      { text: '.xyz', kind: 'tld' },
      { text: '/paypal.com/login.php?user=1', kind: 'path' },
    ],
  },
];

const kinds: Record<string, { label: string; className: string }> = {
  scheme:     { label: 'Protocol',      className: 'bg-white/5 text-white/40 border border-white/8' },
  subdomain:  { label: 'Subdomain(s)',  className: 'bg-blue-500/10 text-blue-400 border border-blue-500/15' },
  domain:     { label: 'Domain',        className: 'bg-green-500/10 text-green-400 border border-green-500/15' },
  tld:        { label: 'TLD',           className: 'bg-amber-500/10 text-amber-400 border border-amber-500/15' },
  path:       { label: 'Path / query',  className: 'bg-red-500/10 text-red-400 border border-red-500/15' },
};

const patterns = [
  { icon: Globe, title: 'Excessive subdomains', example: 'paypal.com.account-verify.xyz', text: 'Attackers stack subdomains so the visible string contains a trusted brand, while the real registered domain is elsewhere. Check the last two labels of the hostname.' },
  { icon: DollarSign, title: 'Obfuscating a brand in the path', example: 'example.xyz/paypal.com/login', text: 'A domain name in the URL path does not mean you are on that domain. The actual website is determined by the hostname.' },
  { icon: Search, title: 'IP address as host', example: 'http://192.168.1.42/paypal/', text: 'Legitimate services use domain names. An IP address as the host is a strong warning sign.' },
  { icon: Hash, title: 'URL encoding & special characters', example: 'https://example.com/%70%61%79%70%61%6c', text: 'Percent-encoded characters can hide the real destination. The decoded string may reveal a different brand or domain.' },
  { icon: AlertTriangle, title: 'Dangerous TLDs', example: 'verify-account.xyz', text: 'Cheap or unusual TLDs (.xyz, .top, .buzz) are disproportionately used in phishing — but are not proof on their own.' },
  { icon: Braces, title: 'Long query strings & random tokens', example: 'example.com/login?r=8a2fB9x&ref=paypal', text: 'Random-looking query parameters can be used to disguise the true destination or track victims.' },
  { icon: Link2, title: 'Misleading subdomains', example: 'paypal.secure-login.example.com', text: 'Adding a trusted brand as a subdomain does not make the site legitimate. The registered domain is still example.com.' },
  { icon: KeyRound, title: 'Keywords + urgency in URLs', example: 'verify-your-account-now.com', text: 'Phishing URLs often contain words like "verify", "secure", "login", "account" to appear trustworthy.' },
];

export const PatternPage: React.FC = () => {
  const ref = useScrollReveal();

  return (
    <div ref={ref} className="max-w-4xl mx-auto space-y-16">
      {/* Header */}
      <header className="text-center scroll-reveal">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">Pattern learning</h1>
        <p className="mt-3 text-white/50 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          Learn to recognise recurring structural characteristics of phishing URLs — and why
          no single signal proves a website is malicious.
        </p>
      </header>

      {/* URL Anatomy */}
      <section className="scroll-reveal" data-delay="0">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">URL anatomy</h2>
        <div className="space-y-4">
          {urlsToShow.map((u) => (
            <div key={u.label} className="glass p-4 sm:p-5">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">{u.label}</p>
              <div className="font-mono text-xs sm:text-sm flex flex-wrap gap-1">
                {u.parts.map((p) => (
                  <span key={p.text + p.kind} className={`px-2 py-1 rounded ${kinds[p.kind].className}`}>
                    {p.text}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-3">
                {u.parts.map((p) => (
                  <span key={p.kind + p.text} className="text-[10px] text-white/25 flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-sm ${kinds[p.kind].className.split(' ')[0]}`} />
                    {kinds[p.kind].label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Phishing characteristics */}
      <section className="scroll-reveal" data-delay="0">
        <h2 className="text-2xl font-bold text-white mb-2">Recurring phishing URL characteristics</h2>
        <p className="text-sm text-white/40 mb-6">
          These are patterns — not proof. A legitimate URL can occasionally share one of these traits,
          but the more you see together, the more suspicious you should be.
        </p>
        <div className="space-y-3">
          {patterns.map((p, i) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="scroll-reveal glass p-5"
                data-delay={i * 60}
              >
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-white/50" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white text-sm">{p.title}</h3>
                    <p className="text-xs font-mono text-red-400/70 mt-1 bg-red-500/5 rounded px-2 py-1 inline-block border border-red-500/10">
                      {p.example}
                    </p>
                    <p className="mt-2 text-sm text-white/40 leading-relaxed">{p.text}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Honest note */}
      <section className="scroll-reveal glass p-6 border border-amber-500/20" data-delay="0">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-500/70 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-white text-sm">Honest security note</h3>
            <p className="mt-2 text-sm text-white/40 leading-relaxed">
              No tool can guarantee 100% detection. PhishGuard combines several independent signals
              and clearly shows the evidence behind each result — including when a source is
              unavailable, so you are never misled into thinking a website is safe.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="scroll-reveal text-center pb-8" data-delay="0">
        <Link to="/check" className="btn btn-solid h-[42px] px-6 text-sm">
          <Search className="w-4 h-4 mr-2" /> Check a URL
          <ArrowRight className="w-4 h-4 ml-2 opacity-60" />
        </Link>
      </section>
    </div>
  );
};

export default PatternPage;
