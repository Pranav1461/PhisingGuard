import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  BookOpen,
  Cpu,
  PlayCircle,
  AlertTriangle,
  Eye,
  MousePointerClick,
  Globe,
  KeyRound,
  UserX,
  ChevronRight,
  Zap,
  Users,
} from 'lucide-react';

/* ── Entrance animation helper ── */
function useAppear() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = el.querySelectorAll<HTMLElement>('.appear');
    const photo = el.querySelector<HTMLElement>('.hero-photo');

    const mark = (node: HTMLElement) => {
      node.classList.add('is-in');
    };

    items.forEach((item) => {
      item.addEventListener('animationend', () => mark(item), { once: true });
    });
    if (photo) {
      photo.addEventListener('animationend', () => mark(photo), { once: true });
    }

    // JS fallback: force .is-in after 2 rAFs if animations never ran
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        items.forEach((item) => {
          if (!item.classList.contains('is-in')) {
            const anims = item.getAnimations();
            if (anims.length === 0 || anims.every((a) => a.playState === 'finished')) {
              mark(item);
            }
          }
        });
        if (photo && !photo.classList.contains('is-in')) {
          mark(photo);
        }
      });
    });
  }, []);
  return ref;
}

/* ── Attack flow stages ── */
function MailPointer(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 6 9 7 9-7" />
      <path d="m16 18 2 2 4-4" />
    </svg>
  );
}

const attackFlow = [
  { icon: UserX, title: 'Attacker', text: 'Someone crafts a message designed to look legitimate and trustworthy.' },
  { icon: MailPointer, title: 'Phishing Message', text: 'Sent by email, SMS, or messaging apps, often with urgency or fear.' },
  { icon: Eye, title: 'Victim', text: 'A person reads the message and believes it comes from a real company.' },
  { icon: MousePointerClick, title: 'Suspicious Link', text: 'A disguised link points to a fake site that mimics the real brand.' },
  { icon: Globe, title: 'Fake Website', text: 'The login page looks almost identical to the genuine one.' },
  { icon: KeyRound, title: 'Credential Submission', text: 'The victim enters their username and password.' },
  { icon: AlertTriangle, title: 'Potential Theft', text: 'Attackers capture the credentials and misuse the account.' },
];

const features = [
  { to: '/check', icon: Search, title: 'Check Website', text: 'Analyze a URL against threat-intelligence providers and a local machine-learning model. Get an explainable risk result.' },
  { to: '/patterns', icon: Cpu, title: 'Pattern Learning', text: 'Learn the recurring characteristics of phishing URLs — the signals, and why they are not proof on their own.' },
  { to: '/learn', icon: BookOpen, title: 'Phishing Education', text: 'Understand why phishing works, common techniques, warning signs, consequences, and how to protect yourself.' },
  { to: '/simulator', icon: PlayCircle, title: 'Phishing Simulator', text: 'A controlled, educational demonstration of how a fake login page works — with a monitoring dashboard and safe reveal.' },
];

export const HomePage: React.FC = () => {
  const pageRef = useAppear();

  return (
    <div ref={pageRef} className="space-y-20 md:space-y-28 relative">
      {/* Background gradient accent */}
      <div className="hero-gradient" aria-hidden="true" />

      {/* ── HERO ── */}
      <section className="relative z-[1] pt-10 md:pt-16">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="badge-pill appear appear--pop mb-5" style={{ '--d': '0.22s' } as React.CSSProperties}>
            <svg className="w-[18px] h-[20px] text-white" style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.45))' }} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.6c.55 0 .88.55 1.08 2.1.62 4.7 1.52 5.6 6.22 6.22 1.55.2 2.1.53 2.1 1.08s-.55.88-2.1 1.08c-4.7.62-5.6 1.52-6.22 6.22-.2 1.55-.53 2.1-1.08 2.1s-.88-.55-1.08-2.1c-.62-4.7-1.52-5.6-6.22-6.22C3.15 12.88 2.6 12.55 2.6 12s.55-.88 2.1-1.08c4.7-.62 5.6-1.52 6.22-6.22C11.12 3.15 11.45 2.6 12 2.6Z" />
            </svg>
            Cybersecurity Awareness
          </div>

          {/* H1 */}
          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] xl:text-[60px] font-medium tracking-[-0.045em] leading-[1.12] text-white"
          >
            <span className="block overflow-hidden py-[0.06em] px-[0.15em] pb-[0.14em] appear appear--mask" style={{ '--d': '0.42s' } as React.CSSProperties}>
              Understand phishing.
            </span>
            <span className="block overflow-hidden py-[0.06em] px-[0.15em] pb-[0.14em] appear appear--mask" style={{ '--d': '0.62s' } as React.CSSProperties}>
              Detect <em className="font-['Instrument_Serif',_Times_New_Roman,serif] italic text-[1.08em] tracking-[-0.03em] text-[#9a9a9a] not-italic">suspicious websites.</em>
            </span>
          </h1>

          {/* Lede */}
          <p className="mt-5 text-[15.5px] text-[#9a9a9a] leading-[1.55] tracking-[-0.015em] max-w-[470px] appear appear--soft" style={{ '--d': '0.82s', animationDuration: '1.25s' } as React.CSSProperties}>
            PhishGuard combines threat intelligence, machine learning, and clear explainability to
            help you understand how phishing works — and check whether a website looks suspicious.
          </p>

          {/* Actions */}
          <div className="mt-7 flex flex-col sm:flex-row gap-2.5 sm:gap-3 appear appear--btn" style={{ '--d': '0.96s' } as React.CSSProperties}>
            <Link to="/check" className="btn btn-solid btn-hero-solid h-[42px] sm:h-[44px] md:h-[46px] px-[18px] sm:px-[20px] md:px-[24px] text-[13.5px] sm:text-[14px] w-full sm:w-auto">
              <Search className="w-4 h-4 mr-2" />
              Check a Website
            </Link>
            <Link to="/learn" className="btn btn-ghost h-[42px] sm:h-[44px] md:h-[46px] px-[18px] sm:px-[20px] md:px-[24px] text-[13.5px] sm:text-[14px] w-full sm:w-auto appear appear--side" style={{ '--d': '1.10s' } as React.CSSProperties}>
              <BookOpen className="w-4 h-4 mr-2 opacity-60" />
              Learn How Phishing Works
            </Link>
          </div>
        </div>
      </section>

      {/* ── SCROLL HINT ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1] appear appear--soft" style={{ '--d': '1.8s' } as React.CSSProperties}>
        <div className="scroll-hint" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* ── STATS FOOTER ── */}
      <div className="relative z-[1] stat-row appear appear--stat" style={{ '--d': '1.12s' } as React.CSSProperties}>
        <div className="stat-item">
          <svg className="w-5 h-5 text-[#e8e8e8]" viewBox="0 0 24 24" fill="none">
            <rect x="3.4" y="2.6" width="7.2" height="18.8" rx="3.6" fill="url(#sg1)" />
            <rect x="13.4" y="2.6" width="7.2" height="18.8" rx="3.6" fill="url(#sg2)" />
            <rect x="9.2" y="10.9" width="5.6" height="2.2" rx="1.1" fill="#4a4a4a" />
            <defs>
              <linearGradient id="sg1" x1="3" y1="2" x2="14" y2="22"><stop stopColor="#fff" stopOpacity="0.38" /><stop offset="1" stopColor="#3a3a3a" stopOpacity="0.62" /></linearGradient>
              <linearGradient id="sg2" x1="14" y1="2" x2="25" y2="22"><stop stopColor="#3a3a3a" stopOpacity="0.38" /><stop offset="1" stopColor="#fff" stopOpacity="0.62" /></linearGradient>
            </defs>
          </svg>
          <span>3 providers integrated</span>
        </div>
        <div className="stat-item">
          <Zap className="w-5 h-5 text-[#e8e8e8]" />
          <span>ML model trained locally</span>
        </div>
        <div className="stat-item">
          <Users className="w-5 h-5 text-[#e8e8e8]" />
          <span>100% free & open source</span>
        </div>
      </div>

      <div className="section-divider" aria-hidden="true" />

      {/* ── WHAT IS PHISHING ── */}
      <section className="relative z-[1]" aria-labelledby="what-is-phishing">
        <div className="max-w-3xl">
          <h2 id="what-is-phishing" className="text-2xl md:text-3xl font-bold tracking-tight text-white">What is phishing?</h2>
          <div className="mt-5 space-y-4 text-white/50 leading-relaxed">
            <p>
              Phishing is a type of social-engineering attack where someone impersonates a trusted
              organization — a bank, a delivery company, your workplace — to trick you into revealing
              sensitive information. It usually arrives as a message containing a link to a fake
              website designed to look real.
            </p>
            <p>
              The most common goal is to steal <strong className="text-white font-semibold">credentials</strong>{' '}
              (usernames and passwords). Attackers then use those credentials to take over accounts,
              commit fraud, or spread further attacks.
            </p>
            <p>
              Phishing works because it targets <strong className="text-white font-semibold">people, not systems</strong>.
              That is why understanding the warning signs matters.
            </p>
          </div>
        </div>
      </section>

      <div className="section-divider" aria-hidden="true" />

      {/* ── HOW PHISHING WORKS ── */}
      <section className="relative z-[1]" aria-labelledby="how-phishing-works">
        <h2 id="how-phishing-works" className="text-2xl md:text-3xl font-bold tracking-tight text-white">How phishing works</h2>
        <p className="mt-3 text-white/50">Follow each stage of a typical phishing attack.</p>

        <ol className="mt-8 grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {attackFlow.map((stage, i) => {
            const Icon = stage.icon;
            return (
              <li key={stage.title} className="relative flex gap-4 glass p-5">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/5 text-white/70" aria-hidden="true">
                  <Icon className="w-5 h-5" />
                </span>
                <div>
                  <p className="font-semibold text-white flex items-center gap-2">
                    <span className="font-mono text-xs text-white/30">0{i + 1}</span>
                    {stage.title}
                  </p>
                  <p className="mt-1 text-sm text-white/40 leading-relaxed">{stage.text}</p>
                </div>
                {i < attackFlow.length - 1 && (
                  <ChevronRight className="absolute -right-2 top-1/2 -translate-y-1/2 hidden lg:block text-white/10" aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <div className="section-divider" aria-hidden="true" />

      {/* ── CORE FEATURES ── */}
      <section className="relative z-[1]" aria-labelledby="core-features">
        <h2 id="core-features" className="text-2xl md:text-3xl font-bold tracking-tight text-white">Explore the platform</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((f) => (
            <Link
              key={f.to}
              to={f.to}
              className="group glass p-6 transition-all hover:border-white/20 hover:shadow-[0_0_40px_rgba(100,120,200,0.08)]"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-white/5 text-white/60 transition-colors group-hover:bg-white/10 group-hover:text-white" aria-hidden="true">
                <f.icon className="w-5 h-5" />
              </span>
              <h3 className="mt-4 font-semibold text-white flex items-center gap-1">
                {f.title}
                <ChevronRight className="w-4 h-4 text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-white/40" aria-hidden="true" />
              </h3>
              <p className="mt-2 text-sm text-white/40 leading-relaxed">{f.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="section-divider" aria-hidden="true" />

      {/* ── HONEST NOTE ── */}
      <section className="relative z-[1] glass p-6" aria-labelledby="honest-note">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <h2 id="honest-note" className="font-semibold text-white">Honest security, no false guarantees</h2>
            <p className="mt-2 text-sm text-white/40 leading-relaxed">
              No tool can guarantee 100% protection or perfectly detect every phishing attempt. PhishGuard
              combines several independent signals and clearly shows the evidence behind each result — including
              when a source is unavailable, so you are never misled into thinking a website is safe just because
              a provider could not be reached.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
