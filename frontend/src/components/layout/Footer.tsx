import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Info, Lock, Globe, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer
      className="mt-auto text-sm text-white/50"
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">

          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5 text-white font-semibold text-base">
              <ShieldCheck className="w-5 h-5 text-white/80" />
              <span>PhishGuard</span>
            </div>
            <p className="text-xs leading-relaxed text-white/40 max-w-md">
              A cybersecurity platform demonstrating URL threat intelligence orchestration, feature
              extraction, explainable risk scoring, and controlled phishing simulation.
            </p>
            <div className="inline-flex items-center gap-2 text-xs bg-white/5 px-2.5 py-1 rounded border border-white/8">
              <Info className="w-3.5 h-3.5 text-white/50" />
              <span className="text-white/40">100% Free & Open Source Threat Intelligence</span>
            </div>
          </div>

          {/* Core Platform */}
          <div>
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-white/40" />
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs">
              {[
                { label: 'URL Checker', to: '/check' },
                { label: 'Pattern Learning', to: '/patterns' },
                { label: 'Phishing Simulator', to: '/simulator' },
                { label: 'Security Awareness', to: '/learn' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-white/40 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Threat Intel */}
          <div>
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-white/40" />
              Intelligence
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li><a href="https://www.virustotal.com" target="_blank" rel="noreferrer" className="text-white/40 hover:text-white transition-colors">VirusTotal API</a></li>
              <li><a href="https://urlscan.io" target="_blank" rel="noreferrer" className="text-white/40 hover:text-white transition-colors">urlscan.io</a></li>
              <li><a href="https://urlhaus.abuse.ch" target="_blank" rel="noreferrer" className="text-white/40 hover:text-white transition-colors">URLhaus Feed</a></li>
              <li><span className="text-white/25 flex items-center gap-1.5"><Lock className="w-3 h-3" /> Local ML Model</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/6 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs gap-4">
          <p className="text-white/30">© 2026 PhishGuard Project.</p>
          <div className="flex items-center gap-4 text-white/20 font-mono text-[11px]">
            <span>FastAPI</span>
            <span className="text-white/10">·</span>
            <span>React</span>
            <span className="text-white/10">·</span>
            <span>Supabase</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
