/**
 * SimulationInteractPage
 *
 * Scenario-aware interaction templates for the Fraud Simulation Engine.
 * Each scenario type renders a visually distinct "fake website" page
 * that feels contextually appropriate for that category of scam.
 *
 * Props flow from SimulatorPage — no new state, no new APIs, no new events.
 * All interaction data flows back up through the existing onSubmit/onChange handlers.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Lock, Eye, EyeOff, Loader2, KeyRound, CreditCard, HardDrive,
  Gift, Headphones, FileText, ShieldCheck, AlertTriangle,
  MapPin, Clock, CheckCircle, Star,
  Shield, Cloud, Truck, Trophy, Phone, FileSignature,
} from 'lucide-react';
import type { SimulatorTemplateItem } from '../services/api/types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface InteractionConfig {
  pageTitle: string;
  pageSubtitle: string;
  urlBar: string;
  submitLabel: string;
  warningNote: string;
  primaryField: { label: string; placeholder: string; type: string };
  secondaryField?: { label: string; placeholder: string; type: string };
}

interface SimulationInteractPageProps {
  template: SimulatorTemplateItem;
  scenarioType: string;
  interaction: InteractionConfig;
  primaryValue: string;
  secondaryValue: string;
  showSecondary: boolean;
  submitting: boolean;
  error: string | null;
  onPrimaryChange: (v: string) => void;
  onSecondaryChange: (v: string) => void;
  onShowSecondaryToggle: () => void;
  onSubmit: (e: React.FormEvent) => void;
  /** Called by page-specific CTAs before showing the form (e.g. "Renew Plan" → payment form) */
  onIntermediateEvent?: (eventType: string) => void;
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function BrowserChrome({ url }: { url: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-black/30 border-b border-white/8">
      <div className="flex gap-1.5 shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
      </div>
      <div className="flex-1 flex items-center gap-1.5 min-w-0 bg-white/6 rounded px-2.5 py-1">
        <Lock className="w-3 h-3 text-green-400 shrink-0" />
        <span className="text-[11px] text-white/45 font-mono truncate">{url}</span>
      </div>
    </div>
  );
}

function FieldInput({
  id, field, value, show, onToggle, onChange, autoFocus = false,
}: {
  id: string;
  field: { label: string; placeholder: string; type: string };
  value: string; show?: boolean; onToggle?: () => void;
  onChange: (v: string) => void; autoFocus?: boolean;
}) {
  const isPassword = field.type === 'password';
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
        {field.label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && show ? 'text' : field.type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          autoComplete="off"
          required
          autoFocus={autoFocus}
          className="w-full rounded-lg border border-white/12 bg-white/6 px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-all pr-10"
        />
        {isPassword && onToggle && (
          <button type="button" onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
            {show ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

const pageEntrance = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' as const },
};

// ─── 1. LOGIN ─────────────────────────────────────────────────────────────────
// Visual language: clean security-service, shield motif, navy/slate palette.

function LoginSimulation(props: SimulationInteractPageProps) {
  const { template, interaction, primaryValue, secondaryValue, showSecondary,
    submitting, onPrimaryChange, onSecondaryChange, onShowSecondaryToggle, onSubmit } = props;
  const org = template.fictional_org || template.sender_name;

  return (
    <motion.div {...pageEntrance}
      className="min-h-[420px] flex flex-col rounded-xl overflow-hidden shadow-2xl shadow-black/60"
      style={{ background: 'linear-gradient(160deg,#0d1523 0%,#0f2040 50%,#0a1628 100%)' }}>
      <BrowserChrome url={interaction.urlBar} />
      <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-10">
        {/* Logo treatment */}
        <div className="mb-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#1d6fe8,#0f4fa0)', boxShadow: '0 0 30px rgba(29,111,232,0.4)' }}>
            <Shield className="w-7 h-7 text-white" />
          </div>
          <p className="text-xs font-bold tracking-[0.2em] text-blue-300/70 uppercase mb-1">{org}</p>
          <h2 className="text-2xl font-bold text-white tracking-tight">{interaction.pageTitle}</h2>
          <p className="text-sm text-white/40 mt-1">{interaction.pageSubtitle}</p>
        </div>
        {/* Form */}
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
          <FieldInput id="login-primary" label={interaction.primaryField.label}
            field={interaction.primaryField} value={primaryValue} onChange={onPrimaryChange} autoFocus />
          {interaction.secondaryField && (
            <FieldInput id="login-secondary" label={interaction.secondaryField.label}
              field={interaction.secondaryField} value={secondaryValue}
              show={showSecondary} onToggle={onShowSecondaryToggle}
              onChange={onSecondaryChange} />
          )}
          <div className="flex items-center justify-between text-xs text-white/35 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-white/20 bg-white/5 accent-blue-500" />
              Remember this device
            </label>
            <button type="button" className="text-blue-400 hover:text-blue-300 transition-colors">
              Forgot password?
            </button>
          </div>
          <button type="submit" disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-white transition-all"
            style={{ background: submitting ? 'rgba(29,111,232,0.5)' : 'linear-gradient(135deg,#1d6fe8,#1558cc)', boxShadow: submitting ? 'none' : '0 4px 14px rgba(29,111,232,0.4)' }}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            {interaction.submitLabel}
          </button>
        </form>
        <p className="mt-5 text-[11px] text-white/20 text-center max-w-xs leading-relaxed">
          Protected by {org} Security · By signing in you agree to our Terms
        </p>
      </div>
    </motion.div>
  );
}

// ─── 2. SUBSCRIPTION / PAYMENT ────────────────────────────────────────────────
// Visual language: SaaS billing flow, plan summary card, warm whites.

function SubscriptionSimulation(props: SimulationInteractPageProps) {
  const { template, interaction, primaryValue, secondaryValue,
    submitting, onPrimaryChange, onSecondaryChange, onSubmit, onIntermediateEvent } = props;
  const org = template.fictional_org || template.sender_name;
  const [step, setStep] = useState<'plan' | 'payment'>('plan');

  function handleRenew() {
    onIntermediateEvent?.('payment_form_opened');
    setStep('payment');
  }

  return (
    <motion.div {...pageEntrance}
      className="rounded-xl overflow-hidden shadow-2xl shadow-black/50"
      style={{ background: '#0e1622' }}>
      <BrowserChrome url={interaction.urlBar} />
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-amber-400/70 font-semibold tracking-wider uppercase">{org} Billing</p>
            <h2 className="text-lg font-bold text-white leading-tight">{interaction.pageTitle}</h2>
          </div>
        </div>

        {step === 'plan' && (
          <motion.div key="plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Current plan card */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Current Plan</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 uppercase">Active</span>
              </div>
              <p className="text-xl font-bold text-white">{org} Premium</p>
              <p className="text-sm text-white/50 mt-1">Your subscription requires attention</p>
              <div className="mt-4 pt-4 border-t border-amber-500/10 flex items-center justify-between text-sm">
                <span className="text-white/50">Billing issue detected</span>
                <span className="text-amber-400 font-semibold">Action required</span>
              </div>
            </div>
            {/* Warning */}
            <div className="flex gap-3 rounded-lg border border-red-500/20 bg-red-500/8 p-4">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-white/70 leading-relaxed">
                Your payment method could not be charged. Update your details to continue your subscription.
              </p>
            </div>
            <button type="button" onClick={handleRenew}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 4px 14px rgba(245,158,11,0.3)' }}>
              <CreditCard className="w-4 h-4" />
              Update Payment Details
            </button>
          </motion.div>
        )}

        {step === 'payment' && (
          <motion.div key="payment" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="text-sm text-white/50 mb-2">{interaction.pageSubtitle}</div>
            <form onSubmit={onSubmit} className="space-y-4">
              <FieldInput id="sub-primary" label={interaction.primaryField.label}
                field={interaction.primaryField} value={primaryValue} onChange={onPrimaryChange} autoFocus />
              {interaction.secondaryField && (
                <FieldInput id="sub-secondary" label={interaction.secondaryField.label}
                  field={interaction.secondaryField} value={secondaryValue}
                  onChange={onSecondaryChange} />
              )}
              <p className="text-[11px] text-white/30 flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> Payments secured by {org} Protect
              </p>
              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-white transition-all"
                style={{ background: submitting ? 'rgba(245,158,11,0.4)' : 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: submitting ? 'none' : '0 4px 14px rgba(245,158,11,0.3)' }}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                {interaction.submitLabel}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ─── 3. STORAGE ───────────────────────────────────────────────────────────────
// Visual language: cloud dashboard, animated fill bar, slate-cool tones.

function StorageSimulation(props: SimulationInteractPageProps) {
  const { template, interaction, primaryValue, secondaryValue, showSecondary,
    submitting, onPrimaryChange, onSecondaryChange, onShowSecondaryToggle, onSubmit,
    onIntermediateEvent } = props;
  const org = template.fictional_org || template.sender_name;
  const [step, setStep] = useState<'dashboard' | 'upgrade'>('dashboard');
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(92), 300);
    return () => clearTimeout(t);
  }, []);

  function handleUpgrade() {
    onIntermediateEvent?.('upgrade_cta_clicked');
    setStep('upgrade');
  }

  return (
    <motion.div {...pageEntrance}
      className="rounded-xl overflow-hidden shadow-2xl shadow-black/50"
      style={{ background: '#0c1520' }}>
      <BrowserChrome url={interaction.urlBar} />
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
            <Cloud className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-orange-400/70 font-semibold tracking-wider uppercase">{org}</p>
            <h2 className="text-lg font-bold text-white">{interaction.pageTitle}</h2>
          </div>
        </div>

        {step === 'dashboard' && (
          <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {/* Storage meter */}
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-white">Storage Usage</span>
                <span className="text-sm font-bold text-orange-400">92.4 GB / 100 GB</span>
              </div>
              <div className="h-3 rounded-full bg-white/8 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-[1200ms] ease-out"
                  style={{ width: `${barWidth}%`, background: 'linear-gradient(90deg,#f97316,#ef4444)' }} />
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-white/40">
                <span>{barWidth}% used</span>
                <span className="text-red-400 font-semibold">Almost full</span>
              </div>
            </div>
            {/* Warning */}
            <div className="rounded-lg border border-red-500/20 bg-red-500/6 p-4 flex gap-3">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-white/70 leading-relaxed">
                Incoming messages are being held. <strong className="text-white">7.6 GB remaining</strong> — upgrade to prevent data loss.
              </p>
            </div>
            <button type="button" onClick={handleUpgrade}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', boxShadow: '0 4px 14px rgba(249,115,22,0.35)' }}>
              <HardDrive className="w-4 h-4" />
              Upgrade Storage Plan
            </button>
          </motion.div>
        )}

        {step === 'upgrade' && (
          <motion.div key="upgrade" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <p className="text-sm text-white/50">{interaction.pageSubtitle}</p>
            <form onSubmit={onSubmit} className="space-y-4">
              <FieldInput id="sto-primary" label={interaction.primaryField.label}
                field={interaction.primaryField} value={primaryValue} onChange={onPrimaryChange} autoFocus />
              {interaction.secondaryField && (
                <FieldInput id="sto-secondary" label={interaction.secondaryField.label}
                  field={interaction.secondaryField} value={secondaryValue}
                  show={showSecondary} onToggle={onShowSecondaryToggle}
                  onChange={onSecondaryChange} />
              )}
              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-white transition-all"
                style={{ background: submitting ? 'rgba(249,115,22,0.4)' : 'linear-gradient(135deg,#f97316,#ea580c)', boxShadow: submitting ? 'none' : '0 4px 14px rgba(249,115,22,0.35)' }}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
                {interaction.submitLabel}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ─── 4. DELIVERY ──────────────────────────────────────────────────────────────
// Visual language: courier tracking, progress rail, neutral/warm ground.

function DeliverySimulation(props: SimulationInteractPageProps) {
  const { template, interaction, primaryValue, secondaryValue,
    submitting, onPrimaryChange, onSecondaryChange, onSubmit, onIntermediateEvent } = props;
  const org = template.fictional_org || template.sender_name;
  const domain = template.sender_email_display?.replace(/.*@/, '') || 'delivery.example';
  const trackingNo = `${domain.slice(0, 3).toUpperCase()}-${Math.floor(10000000 + Math.random() * 90000000)}`;
  const [step, setStep] = useState<'tracking' | 'address'>('tracking');

  function handleConfirm() {
    onIntermediateEvent?.('address_form_opened');
    setStep('address');
  }

  const steps = [
    { label: 'Collected', done: true },
    { label: 'In Transit', done: true },
    { label: 'Delivery Attempted', done: true, active: true },
    { label: 'Delivered', done: false },
  ];

  return (
    <motion.div {...pageEntrance}
      className="rounded-xl overflow-hidden shadow-2xl shadow-black/50"
      style={{ background: '#0c1520' }}>
      <BrowserChrome url={interaction.urlBar} />
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-emerald-400/70 font-semibold tracking-wider uppercase">{org}</p>
            <h2 className="text-lg font-bold text-white">{interaction.pageTitle}</h2>
          </div>
        </div>

        {step === 'tracking' && (
          <motion.div key="track" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {/* Tracking card */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/40 uppercase tracking-wider">Tracking Number</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300">Delivery Failed</span>
              </div>
              <p className="text-lg font-mono font-bold text-white mb-4">{trackingNo}</p>
              {/* Progress rail */}
              <div className="relative">
                <div className="absolute top-3 left-3 right-3 h-0.5 bg-white/10" />
                <div className="absolute top-3 left-3 h-0.5 bg-emerald-400 transition-all" style={{ width: '66%' }} />
                <div className="relative flex justify-between">
                  {steps.map((s, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 text-center" style={{ width: '25%' }}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 text-[10px] font-bold
                        ${s.active ? 'bg-red-400 text-white ring-2 ring-red-400/30' : s.done ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/30'}`}>
                        {s.done && !s.active ? '✓' : i + 1}
                      </div>
                      <span className={`text-[10px] leading-tight ${s.active ? 'text-red-300 font-semibold' : s.done ? 'text-white/60' : 'text-white/25'}`}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/6 p-4 flex gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-white/70">
                Delivery was unsuccessful. Confirm your address to schedule a redelivery.
              </p>
            </div>
            <button type="button" onClick={handleConfirm}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>
              <MapPin className="w-4 h-4" />
              Confirm Delivery Address
            </button>
          </motion.div>
        )}

        {step === 'address' && (
          <motion.div key="addr" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <p className="text-sm text-white/50">{interaction.pageSubtitle}</p>
            <form onSubmit={onSubmit} className="space-y-4">
              <FieldInput id="del-primary" label={interaction.primaryField.label}
                field={interaction.primaryField} value={primaryValue} onChange={onPrimaryChange} autoFocus />
              {interaction.secondaryField && (
                <FieldInput id="del-secondary" label={interaction.secondaryField.label}
                  field={interaction.secondaryField} value={secondaryValue}
                  onChange={onSecondaryChange} />
              )}
              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-white transition-all"
                style={{ background: submitting ? 'rgba(16,185,129,0.4)' : 'linear-gradient(135deg,#10b981,#059669)', boxShadow: submitting ? 'none' : '0 4px 14px rgba(16,185,129,0.35)' }}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {interaction.submitLabel}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ─── 5. REWARD / PRIZE ───────────────────────────────────────────────────────
// Visual language: prize card, restrained gold accent, claim countdown.

function RewardSimulation(props: SimulationInteractPageProps) {
  const { template, interaction, primaryValue, secondaryValue,
    submitting, onPrimaryChange, onSecondaryChange, onSubmit, onIntermediateEvent } = props;
  const org = template.fictional_org || template.sender_name;
  const [step, setStep] = useState<'prize' | 'claim'>('prize');

  function handleClaim() {
    onIntermediateEvent?.('claim_cta_clicked');
    setStep('claim');
  }

  return (
    <motion.div {...pageEntrance}
      className="rounded-xl overflow-hidden shadow-2xl shadow-black/50"
      style={{ background: '#0d1225' }}>
      <BrowserChrome url={interaction.urlBar} />
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-purple-400/70 font-semibold tracking-wider uppercase">{org}</p>
            <h2 className="text-lg font-bold text-white">{interaction.pageTitle}</h2>
          </div>
        </div>

        {step === 'prize' && (
          <motion.div key="prize" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {/* Prize card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-xl p-6 text-center relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(109,40,217,0.15))', border: '1px solid rgba(139,92,246,0.3)' }}>
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-xs text-purple-300/60 uppercase tracking-wider mb-2">You've been selected</p>
              <p className="text-3xl font-bold text-white mb-1">{template.lure_description?.split(' ').slice(0, 4).join(' ') || 'Special Reward'}</p>
              <p className="text-sm text-white/50 mt-2">{interaction.pageSubtitle}</p>
              <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 text-red-300 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5" />
                Expires in 48 hours
              </div>
            </motion.div>
            <button type="button" onClick={handleClaim}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', boxShadow: '0 4px 14px rgba(139,92,246,0.4)' }}>
              <Gift className="w-4 h-4" />
              Claim Your Reward
            </button>
          </motion.div>
        )}

        {step === 'claim' && (
          <motion.div key="claim" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <p className="text-sm text-white/50">Verify your identity to process the transfer.</p>
            <form onSubmit={onSubmit} className="space-y-4">
              <FieldInput id="rew-primary" label={interaction.primaryField.label}
                field={interaction.primaryField} value={primaryValue} onChange={onPrimaryChange} autoFocus />
              {interaction.secondaryField && (
                <FieldInput id="rew-secondary" label={interaction.secondaryField.label}
                  field={interaction.secondaryField} value={secondaryValue}
                  onChange={onSecondaryChange} />
              )}
              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-white transition-all"
                style={{ background: submitting ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg,#8b5cf6,#6d28d9)', boxShadow: submitting ? 'none' : '0 4px 14px rgba(139,92,246,0.4)' }}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                {interaction.submitLabel}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ─── 6. SUPPORT / TECHNICAL ───────────────────────────────────────────────────
// Visual language: IT security ops, alert-first, red severity banner.

function SupportSimulation(props: SimulationInteractPageProps) {
  const { template, interaction, primaryValue, secondaryValue, showSecondary,
    submitting, onPrimaryChange, onSecondaryChange, onShowSecondaryToggle, onSubmit,
    onIntermediateEvent } = props;
  const org = template.fictional_org || template.sender_name;
  const caseNo = `CASE-${Math.floor(100000 + Math.random() * 900000)}`;
  const [step, setStep] = useState<'alert' | 'verify'>('alert');

  function handleProceed() {
    onIntermediateEvent?.('support_action_started');
    setStep('verify');
  }

  return (
    <motion.div {...pageEntrance}
      className="rounded-xl overflow-hidden shadow-2xl shadow-black/50"
      style={{ background: '#0c1018' }}>
      <BrowserChrome url={interaction.urlBar} />
      {/* Alert bar */}
      <div className="flex items-center gap-3 px-5 py-3 bg-red-950/80 border-b border-red-500/20">
        <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-red-300">Security Alert — Case {caseNo}</p>
          <p className="text-[11px] text-red-400/60 truncate">Suspicious activity detected on your account</p>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 uppercase shrink-0">High</span>
      </div>
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
            <Headphones className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-red-400/70 font-semibold tracking-wider uppercase">{org} Security</p>
            <h2 className="text-lg font-bold text-white">{interaction.pageTitle}</h2>
          </div>
        </div>

        {step === 'alert' && (
          <motion.div key="alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 space-y-3">
              <p className="text-sm font-semibold text-white">What we detected</p>
              {[
                'Sign-in from unrecognized device',
                'Multiple failed authentication attempts',
                'Unusual account access pattern',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-white/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <p className="text-sm text-white/50">{interaction.pageSubtitle}</p>
            <button type="button" onClick={handleProceed}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 4px 14px rgba(239,68,68,0.35)' }}>
              <Phone className="w-4 h-4" />
              Start Secure Verification
            </button>
          </motion.div>
        )}

        {step === 'verify' && (
          <motion.div key="verify" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <p className="text-sm text-white/50">Confirm your identity to restore full account access.</p>
            <form onSubmit={onSubmit} className="space-y-4">
              <FieldInput id="sup-primary" label={interaction.primaryField.label}
                field={interaction.primaryField} value={primaryValue} onChange={onPrimaryChange} autoFocus />
              {interaction.secondaryField && (
                <FieldInput id="sup-secondary" label={interaction.secondaryField.label}
                  field={interaction.secondaryField} value={secondaryValue}
                  show={showSecondary} onToggle={onShowSecondaryToggle}
                  onChange={onSecondaryChange} />
              )}
              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-white transition-all"
                style={{ background: submitting ? 'rgba(239,68,68,0.4)' : 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: submitting ? 'none' : '0 4px 14px rgba(239,68,68,0.35)' }}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {interaction.submitLabel}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ─── 7. DOCUMENT / HR ─────────────────────────────────────────────────────────
// Visual language: corporate HR portal, formal, document preview card, teal accent.

function DocumentSimulation(props: SimulationInteractPageProps) {
  const { template, interaction, primaryValue, secondaryValue, showSecondary,
    submitting, onPrimaryChange, onSecondaryChange, onShowSecondaryToggle, onSubmit,
    onIntermediateEvent } = props;
  const org = template.fictional_org || template.sender_name;
  const docRef = `DOC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const [step, setStep] = useState<'preview' | 'sign'>('preview');

  function handleProceed() {
    onIntermediateEvent?.('form_opened');
    setStep('sign');
  }

  return (
    <motion.div {...pageEntrance}
      className="rounded-xl overflow-hidden shadow-2xl shadow-black/50"
      style={{ background: '#0c1420' }}>
      <BrowserChrome url={interaction.urlBar} />
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#14b8a6,#0d9488)' }}>
            <FileSignature className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-teal-400/70 font-semibold tracking-wider uppercase">{org} · HR Portal</p>
            <h2 className="text-lg font-bold text-white">{interaction.pageTitle}</h2>
          </div>
        </div>

        {step === 'preview' && (
          <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Document card */}
            <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-12 rounded bg-white/8 border border-white/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-teal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{template.lure_description?.slice(0, 45) || 'Policy Document'}</p>
                  <p className="text-xs text-white/40 mt-1">Ref: {docRef} · {org}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 uppercase">Signature Required</span>
                    <span className="text-[10px] text-red-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Deadline: End of week
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/6 p-4 flex gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-white/70 leading-relaxed">
                {interaction.pageSubtitle}. Failure to complete may result in payroll delays.
              </p>
            </div>
            <button type="button" onClick={handleProceed}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#14b8a6,#0d9488)', boxShadow: '0 4px 14px rgba(20,184,166,0.35)' }}>
              <FileSignature className="w-4 h-4" />
              Review & Sign Document
            </button>
          </motion.div>
        )}

        {step === 'sign' && (
          <motion.div key="sign" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <p className="text-sm text-white/50">Confirm your identity to submit your electronic signature.</p>
            <form onSubmit={onSubmit} className="space-y-4">
              <FieldInput id="doc-primary" label={interaction.primaryField.label}
                field={interaction.primaryField} value={primaryValue} onChange={onPrimaryChange} autoFocus />
              {interaction.secondaryField && (
                <FieldInput id="doc-secondary" label={interaction.secondaryField.label}
                  field={interaction.secondaryField} value={secondaryValue}
                  show={showSecondary} onToggle={onShowSecondaryToggle}
                  onChange={onSecondaryChange} />
              )}
              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-white transition-all"
                style={{ background: submitting ? 'rgba(20,184,166,0.4)' : 'linear-gradient(135deg,#14b8a6,#0d9488)', boxShadow: submitting ? 'none' : '0 4px 14px rgba(20,184,166,0.35)' }}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {interaction.submitLabel}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ─── DISPATCHER ───────────────────────────────────────────────────────────────

export const SimulationInteractPage: React.FC<SimulationInteractPageProps> = (props) => {
  const { scenarioType } = props;

  switch (scenarioType) {
    case 'subscription': return <SubscriptionSimulation {...props} />;
    case 'storage':      return <StorageSimulation {...props} />;
    case 'delivery':     return <DeliverySimulation {...props} />;
    case 'reward':       return <RewardSimulation {...props} />;
    case 'support':      return <SupportSimulation {...props} />;
    case 'document':     return <DocumentSimulation {...props} />;
    case 'login':
    default:             return <LoginSimulation {...props} />;
  }
};

export default SimulationInteractPage;
