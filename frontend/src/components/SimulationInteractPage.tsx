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
  Shield, Cloud, Truck, Trophy, Phone, FileSignature, Mail,
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

// Removed BrowserChrome - clean UI without fake browser chrome

function FieldInput({
  id, field, value, show, onToggle, onChange, autoFocus = false, light = false,
}: {
  id: string;
  field: { label: string; placeholder: string; type: string };
  value: string; show?: boolean; onToggle?: () => void;
  onChange: (v: string) => void; autoFocus?: boolean;
  light?: boolean;
}) {
  const isPassword = field.type === 'password';
  return (
    <div>
      <label htmlFor={id} className={`block text-xs font-semibold mb-1.5 uppercase tracking-wider ${light ? 'text-slate-500' : 'text-white/60'}`}>
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
          className={`w-full rounded-lg border px-3.5 py-2.5 text-sm transition-all pr-10 ${
            light
              ? 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
              : 'border-white/12 bg-white/6 text-white placeholder:text-white/25 focus:border-white/30 focus:bg-white/8'
          }`}
        />
        {isPassword && onToggle && (
          <button type="button" onClick={onToggle}
            className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${light ? 'text-slate-400 hover:text-slate-600' : 'text-white/30 hover:text-white/60'}`}>
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

// ─── Shared card-payment helpers ───────────────────────────────────────────────

type CardNetwork = 'visa' | 'mastercard' | 'amex' | 'discover' | 'rupay' | null;

/** Detect card network from leading digits */
function detectCardNetwork(digits: string): CardNetwork {
  if (!digits) return null;
  if (/^4/.test(digits)) return 'visa';
  if (/^5[1-5]/.test(digits) || /^2(?:2[2-9]\d|2[3-9]\d|[3-6]\d{2}|7[01]\d|720)/.test(digits)) return 'mastercard';
  if (/^3[47]/.test(digits)) return 'amex';
  if (/^6(?:011|5)/.test(digits)) return 'discover';
  if (/^(60|65|81|82|508)/.test(digits)) return 'rupay';
  return null;
}

const CARD_LABELS: Record<CardNetwork & string, string> = {
  visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex', discover: 'Discover', rupay: 'RuPay',
};

/** Expected digit count per network */
function expectedLength(net: CardNetwork): number { return net === 'amex' ? 15 : 16; }

/** Luhn check */
function luhn(digits: string): boolean {
  let sum = 0, even = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i]);
    if (even) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    even = !even;
  }
  return sum % 10 === 0;
}

/** Full card validation — returns error string or '' */
function validateCard(formatted: string): string {
  const digits = formatted.replace(/\s/g, '');
  if (!digits) return '';
  if (!/^\d+$/.test(digits)) return 'Digits only';
  const net = detectCardNetwork(digits);
  if (!net) return 'Unsupported card';
  const need = expectedLength(net);
  if (digits.length < need) return '';          // still typing
  if (digits.length > need) return `${CARD_LABELS[net]} cards are ${need} digits`;
  if (!luhn(digits)) return 'Invalid card number';
  return '';
}

/** Format card number with spaces (4-4-4-4, or 4-6-5 for Amex) */
function formatCard(value: string): string {
  const d = value.replace(/\D/g, '');
  if (detectCardNetwork(d) === 'amex') {
    return [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)].filter(Boolean).join(' ');
  }
  const g = d.match(/.{1,4}/g);
  return g ? g.join(' ') : d;
}

/** Is the card fully valid (right length + Luhn + known network)? */
function isCardComplete(formatted: string): boolean {
  const digits = formatted.replace(/\s/g, '');
  const net = detectCardNetwork(digits);
  return !!net && digits.length === expectedLength(net) && luhn(digits);
}

/** Validate MM/YY expiry — returns error string or '' */
function validateExpiry(expiry: string): string {
  if (!expiry) return '';
  if (expiry.length < 5) return '';             // still typing
  const m = expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return 'Use MM/YY';
  const month = parseInt(m[1]), year = parseInt(m[2]) + 2000;
  if (month < 1 || month > 12) return 'Invalid month';
  const now = new Date();
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) return 'Card expired';
  return '';
}

/** Auto-format expiry input */
function formatExpiry(raw: string): string {
  let d = raw.replace(/\D/g, '').slice(0, 4);
  if (d.length >= 2) d = d.slice(0, 2) + '/' + d.slice(2);
  return d;
}

// ─── 1. LOGIN ─────────────────────────────────────────────────────────────────
// Professional futuristic dark login with cyberpunk circuit board aesthetics

function LoginSimulation(props: SimulationInteractPageProps) {
  const { primaryValue, secondaryValue, showSecondary,
    submitting, onPrimaryChange, onSecondaryChange, onShowSecondaryToggle, onSubmit } = props;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, #0A0A1A 0%, #000000 100%)',
      }}>

      {/* Background grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Cyberpunk circuit decorations - top left */}
      <svg className="absolute top-0 left-0 w-48 h-48 opacity-40" viewBox="0 0 200 200">
        <path d="M20,20 L60,20 L60,60 M60,40 L100,40" stroke="#2A2A3A" strokeWidth="1" fill="none"/>
        <circle cx="20" cy="20" r="3" fill="#2A2A3A"/>
        <circle cx="60" cy="20" r="3" fill="#2A2A3A"/>
        <circle cx="60" cy="60" r="3" fill="#2A2A3A"/>
        <circle cx="100" cy="40" r="3" fill="#2A2A3A"/>
        <rect x="18" y="18" width="4" height="4" fill="#2563EB" opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite"/>
        </rect>
      </svg>

      {/* Cyberpunk circuit decorations - top right */}
      <svg className="absolute top-0 right-0 w-48 h-48 opacity-40" viewBox="0 0 200 200">
        <path d="M180,20 L140,20 L140,60 M140,40 L100,40" stroke="#2A2A3A" strokeWidth="1" fill="none"/>
        <circle cx="180" cy="20" r="3" fill="#2A2A3A"/>
        <circle cx="140" cy="20" r="3" fill="#2A2A3A"/>
        <circle cx="140" cy="60" r="3" fill="#2A2A3A"/>
        <circle cx="100" cy="40" r="3" fill="#2A2A3A"/>
      </svg>

      {/* Cyberpunk circuit decorations - bottom left */}
      <svg className="absolute bottom-0 left-0 w-48 h-48 opacity-40" viewBox="0 0 200 200">
        <path d="M20,180 L60,180 L60,140 M60,160 L100,160" stroke="#2A2A3A" strokeWidth="1" fill="none"/>
        <circle cx="20" cy="180" r="3" fill="#2A2A3A"/>
        <circle cx="60" cy="180" r="3" fill="#2A2A3A"/>
        <circle cx="60" cy="140" r="3" fill="#2A2A3A"/>
        <circle cx="100" cy="160" r="3" fill="#2A2A3A"/>
      </svg>

      {/* Cyberpunk circuit decorations - bottom right */}
      <svg className="absolute bottom-0 right-0 w-48 h-48 opacity-40" viewBox="0 0 200 200">
        <path d="M180,180 L140,180 L140,140 M140,160 L100,160" stroke="#2A2A3A" strokeWidth="1" fill="none"/>
        <circle cx="180" cy="180" r="3" fill="#2A2A3A"/>
        <circle cx="140" cy="180" r="3" fill="#2A2A3A"/>
        <circle cx="140" cy="140" r="3" fill="#2A2A3A"/>
        <circle cx="100" cy="160" r="3" fill="#2A2A3A"/>
        <rect x="178" y="178" width="4" height="4" fill="#2563EB" opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="4s" repeatCount="indefinite"/>
        </rect>
      </svg>

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-500 rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `-10px`,
              animation: `float-${i} ${10 + Math.random() * 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        ${[...Array(15)].map((_, i) => `
          @keyframes float-${i} {
            0% { transform: translateY(0) translateX(0); opacity: 0; }
            10% { opacity: 0.2; }
            90% { opacity: 0.2; }
            100% { transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px); opacity: 0; }
          }
        `).join('')}
      `}</style>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10">

        <div
          className="rounded-2xl p-8 transition-all duration-300"
          style={{
            background: 'transparent',
            border: 'none',
          }}>

          {/* Logo with glow */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 blur-xl bg-blue-500/20 rounded-full" />
              <Shield className="w-12 h-12 text-blue-500 relative z-10" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-white text-center mb-8" style={{ letterSpacing: '0.5px' }}>
            Welcome Back
          </h1>

          <form onSubmit={onSubmit} className="space-y-5">
            {/* Email field */}
            <div className="relative group/input">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-blue-400 transition-colors z-10">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                value={primaryValue}
                onChange={(e) => onPrimaryChange(e.target.value)}
                placeholder="Email address"
                required
                autoFocus
                className="w-full pl-12 pr-4 py-3.5 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none transition-all border-b-2 border-transparent focus:border-blue-500"
                style={{
                  background: '#0F0F1A',
                }}
              />
            </div>

            {/* Password field */}
            <div className="relative group/input">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-blue-400 transition-colors z-10">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showSecondary ? 'text' : 'password'}
                value={secondaryValue}
                onChange={(e) => onSecondaryChange(e.target.value)}
                placeholder="Password"
                required
                className="w-full pl-12 pr-12 py-3.5 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none transition-all border-b-2 border-transparent focus:border-blue-500"
                style={{
                  background: '#0F0F1A',
                }}
              />
              <button
                type="button"
                onClick={onShowSecondaryToggle}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors z-10"
              >
                {showSecondary ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(90deg, #2563EB 0%, #3B82F6 100%)',
              }}>
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-gray-500">
            🔒 Secured with end-to-end encryption
          </p>

          {/* Educational warning */}
          <p className="mt-4 text-center text-[11px] text-gray-600 leading-relaxed border-t border-white/5 pt-4">
            🛡️ This is a simulated interaction for security awareness. Do not enter real credentials.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── 2. SUBSCRIPTION / PAYMENT ────────────────────────────────────────────────
// Realistic subscription checkout with product summary and payment form

function SubscriptionSimulation(props: SimulationInteractPageProps) {
  const { template, interaction, primaryValue, secondaryValue,
    submitting, onPrimaryChange, onSecondaryChange, onSubmit, onIntermediateEvent } = props;
  const org = template.fictional_org || template.sender_name;
  const [step, setStep] = useState<'plan' | 'payment'>('plan');

  // Checkout state
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardError, setCardError] = useState('');
  const [expiryError, setExpiryError] = useState('');

  const cardNetwork = detectCardNetwork(cardNumber.replace(/\s/g, ''));
  const maxCardLen = cardNetwork === 'amex' ? 17 : 19; // with spaces

  function handleCardNumberChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, cardNetwork === 'amex' ? 15 : 16);
    const formatted = formatCard(digits);
    setCardNumber(formatted);
    setCardError(validateCard(formatted));
  }

  function handleExpiryChange(value: string) {
    const formatted = formatExpiry(value);
    setExpiryDate(formatted);
    setExpiryError(validateExpiry(formatted));
  }

  function handleCvvChange(value: string) {
    setCvv(value.replace(/\D/g, '').slice(0, cardNetwork === 'amex' ? 4 : 3));
  }

  function handleRenew() {
    onIntermediateEvent?.('payment_form_opened');
    setStep('payment');
  }

  function handleCheckoutSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cErr = validateCard(cardNumber);
    const eErr = validateExpiry(expiryDate);
    if (cErr || !isCardComplete(cardNumber)) {
      setCardError(cErr || 'Incomplete card number');
      return;
    }
    if (eErr || expiryDate.length < 5) {
      setExpiryError(eErr || 'Incomplete expiry');
      return;
    }
    const reqCvv = cardNetwork === 'amex' ? 4 : 3;
    if (cvv.length < reqCvv) return;

    onPrimaryChange(cardNumber);
    onSecondaryChange(`${expiryDate} / ${cvv}`);
    onSubmit(e);
  }

  return (
    <motion.div {...pageEntrance}
      className="rounded-xl overflow-hidden shadow-2xl shadow-black/50"
      style={{ background: '#0e1622' }}>
      
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
            {/* Subscription product card */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Subscription</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 uppercase">Premium</span>
              </div>
              <p className="text-xl font-bold text-white">{org} Premium Plan</p>
              <p className="text-sm text-white/50 mt-1">Monthly subscription renewal</p>
              <div className="mt-4 pt-4 border-t border-amber-500/10 flex items-center justify-between">
                <span className="text-white/50 text-sm">Amount due</span>
                <span className="text-2xl font-bold text-white">$12.99<span className="text-sm text-white/50">/mo</span></span>
              </div>
            </div>
            {/* Warning */}
            <div className="flex gap-3 rounded-lg border border-red-500/20 bg-red-500/8 p-4">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-white/70 leading-relaxed">
                Your payment method could not be charged. Update your billing details to continue your subscription.
              </p>
            </div>
            <button type="button" onClick={handleRenew}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 4px 14px rgba(245,158,11,0.3)' }}>
              <CreditCard className="w-4 h-4" />
              Update Payment Method
            </button>
          </motion.div>
        )}

        {step === 'payment' && (
          <motion.div key="payment" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            {/* Product summary */}
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">{org} Premium</span>
                <span className="text-white font-semibold">$12.99/mo</span>
              </div>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              {/* Cardholder Name */}
              <div>
                <label htmlFor="cardholder-name" className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                  Cardholder Name
                </label>
                <input
                  id="cardholder-name"
                  type="text"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="John Smith"
                  required
                  autoFocus
                  className="w-full rounded-lg border border-white/12 bg-white/6 px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-all"
                />
              </div>

              {/* Card Number */}
              <div>
                <label htmlFor="card-number" className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                  Card Number
                </label>
                <input
                  id="card-number"
                  type="text"
                  value={cardNumber}
                  onChange={(e) => handleCardNumberChange(e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  required
                  maxLength={maxCardLen}
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:bg-white/8 transition-all font-mono ${
                    cardError ? 'border-red-500/60 bg-red-500/10' : 'border-white/12 bg-white/6 focus:border-white/30'
                  }`}
                />
                {cardError && <p className="text-xs text-red-400 mt-1">{cardError}</p>}
              </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="expiry" className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                    Expiry Date
                  </label>
                  <input
                    id="expiry"
                    type="text"
                    value={expiryDate}
                    onChange={(e) => handleExpiryChange(e.target.value)}
                    placeholder="MM/YY"
                    required
                    maxLength={5}
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:bg-white/8 transition-all font-mono ${
                      expiryError ? 'border-red-500/60 bg-red-500/10' : 'border-white/12 bg-white/6 focus:border-white/30'
                    }`}
                  />
                  {expiryError && <p className="text-xs text-red-400 mt-1">{expiryError}</p>}
                </div>
                <div>
                  <label htmlFor="cvv" className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                    CVV
                  </label>
                  <input
                    id="cvv"
                    type="text"
                    value={cvv}
                    onChange={(e) => handleCvvChange(e.target.value)}
                    placeholder="123"
                    required
                    maxLength={4}
                    className="w-full rounded-lg border border-white/12 bg-white/6 px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-all font-mono"
                  />
                </div>
              </div>

              <p className="text-[11px] text-white/30 flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> Payments secured by {org} Protect
              </p>

              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: submitting ? 'rgba(245,158,11,0.4)' : 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: submitting ? 'none' : '0 4px 14px rgba(245,158,11,0.3)' }}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                {submitting ? 'Processing...' : `Pay $12.99`}
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
// Spin the Wheel → Prize Won → Claim Reward → Transaction Fees Payment

function RewardSimulation(props: SimulationInteractPageProps) {
  const { template, interaction, primaryValue, secondaryValue,
    submitting, onPrimaryChange, onSecondaryChange, onSubmit, onIntermediateEvent } = props;
  const org = template.fictional_org || template.sender_name;
  const [step, setStep] = useState<'wheel' | 'won' | 'payment'>('wheel');
  const [spinning, setSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState<{ name: string; image: string } | null>(null);
  const [rotation, setRotation] = useState(0);

  // Checkout state with validation
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardError, setCardError] = useState('');
  const [expiryError, setExpiryError] = useState('');

  // Prize options with high-quality images
  const prizes = [
    { name: '$100 Cash', image: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=400&h=400&fit=crop&q=90', color: '#10b981' },
    { name: 'iPhone 15 Pro', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop&q=90', color: '#3b82f6' },
    { name: 'Smart Watch', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop&q=90', color: '#8b5cf6' },
    { name: '65" 4K TV', image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&h=400&fit=crop&q=90', color: '#f59e0b' },
    { name: '$200 Gift Card', image: 'https://images.unsplash.com/photo-1606741965326-cb990ae01bb2?w=400&h=400&fit=crop&q=90', color: '#ec4899' },
    { name: 'AirPods Pro', image: 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=400&h=400&fit=crop&q=90', color: '#06b6d4' },
    { name: 'iPad Pro', image: 'https://images.unsplash.com/photo-1585790050230-5dd28404f28c?w=400&h=400&fit=crop&q=90', color: '#6366f1' },
    { name: '$500 Cash', image: 'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=400&h=400&fit=crop&q=90', color: '#14b8a6' },
  ];

  const cardNetwork = detectCardNetwork(cardNumber.replace(/\s/g, ''));
  const maxCardLen = cardNetwork === 'amex' ? 17 : 19;

  function handleCardNumberChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, cardNetwork === 'amex' ? 15 : 16);
    const formatted = formatCard(digits);
    setCardNumber(formatted);
    setCardError(validateCard(formatted));
  }

  function handleExpiryChange(value: string) {
    const formatted = formatExpiry(value);
    setExpiryDate(formatted);
    setExpiryError(validateExpiry(formatted));
  }

  function handleCvvChange(value: string) {
    setCvv(value.replace(/\D/g, '').slice(0, cardNetwork === 'amex' ? 4 : 3));
  }

  function handleSpin() {
    if (spinning) return;
    setSpinning(true);
    onIntermediateEvent?.('reward_viewed');

    // 1. Pick prize first, then rig the wheel to land on it
    const selectedIndex = Math.floor(Math.random() * prizes.length);
    const prize = prizes[selectedIndex];

    // 2. Calculate rotation so the pointer (top / 12 o'clock) lands on
    //    the center of segment `selectedIndex`.
    //    Segments are drawn starting at -90° (top), each 45° wide CW.
    //    Segment i's midpoint sits at i*45° clockwise from the top.
    //    Rotating the wheel CW by (360 - i*45) brings that midpoint
    //    back under the pointer. Add 5 full spins for visual effect
    //    and a small random jitter so it doesn't always hit dead-center.
    const seg = 360 / prizes.length;                       // 45°
    const jitter = (Math.random() - 0.5) * (seg * 0.6);   // ±~13°
    const targetRotation = 360 * 5 + (360 - selectedIndex * seg) + jitter;

    setRotation(targetRotation);

    setTimeout(() => {
      // 3. Set wonPrize using the EXACT prize object selected above
      setWonPrize(prize);
      setSpinning(false);
      setStep('won');
    }, 4000);
  }

  function handleClaimReward() {
    onIntermediateEvent?.('claim_cta_clicked');
    setStep('payment');
  }

  function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cErr = validateCard(cardNumber);
    const eErr = validateExpiry(expiryDate);
    if (cErr || !isCardComplete(cardNumber)) {
      setCardError(cErr || 'Incomplete card number');
      return;
    }
    if (eErr || expiryDate.length < 5) {
      setExpiryError(eErr || 'Incomplete expiry');
      return;
    }
    const reqCvv = cardNetwork === 'amex' ? 4 : 3;
    if (cvv.length < reqCvv) return;

    onPrimaryChange(cardNumber);
    onSecondaryChange(`${expiryDate} / ${cvv}`);
    onSubmit(e);
  }

  return (
    <motion.div {...pageEntrance}
      className="rounded-xl overflow-hidden shadow-2xl shadow-black/50"
      style={{ background: '#0d1225' }}>
      
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

        {/* Step 1: Spin the Wheel */}
        {step === 'wheel' && (
          <motion.div key="wheel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-xs text-purple-300/60 uppercase tracking-wider">Congratulations!</p>
              <p className="text-2xl font-bold text-white">You've Won a Prize!</p>
              <p className="text-sm text-white/50">Spin the wheel to reveal your reward</p>
            </div>

            {/* Circular Wheel Container */}
            <div className="relative flex items-center justify-center py-8">
              {/* Pointer/Arrow at top */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-red-500"
                  style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }} />
              </div>

              {/* Spinning Wheel - Clean SVG Circle */}
              <svg
                width="320"
                height="320"
                viewBox="0 0 320 320"
                className="drop-shadow-2xl"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? 'transform 4000ms cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                }}>

                {/* Outer border */}
                <circle cx="160" cy="160" r="156" fill="none" stroke="rgba(139,92,246,0.6)" strokeWidth="4" />

                {/* Prize segments - smooth circular arcs */}
                {prizes.map((prize, i) => {
                  const degreesPerSegment = 360 / prizes.length;
                  const startAngle = (i * degreesPerSegment - 90) * Math.PI / 180;
                  const endAngle = ((i + 1) * degreesPerSegment - 90) * Math.PI / 180;
                  const midAngle = (startAngle + endAngle) / 2;

                  const x1 = 160 + 150 * Math.cos(startAngle);
                  const y1 = 160 + 150 * Math.sin(startAngle);
                  const x2 = 160 + 150 * Math.cos(endAngle);
                  const y2 = 160 + 150 * Math.sin(endAngle);

                  return (
                    <g key={i}>
                      {/* Segment - proper circular arc path */}
                      <path
                        d={`M 160 160 L ${x1} ${y1} A 150 150 0 0 1 ${x2} ${y2} Z`}
                        fill={prize.color}
                        opacity="0.95"
                      />

                      {/* Divider line */}
                      <line
                        x1="160"
                        y1="160"
                        x2={x1}
                        y2={y1}
                        stroke="rgba(255,255,255,0.25)"
                        strokeWidth="2"
                      />

                      {/* Prize image with proper clipping */}
                      <defs>
                        <clipPath id={`prize-clip-${i}`}>
                          <circle cx="20" cy="20" r="18" />
                        </clipPath>
                      </defs>
                      <image
                        href={prize.image}
                        x={160 + 75 * Math.cos(midAngle) - 20}
                        y={160 + 75 * Math.sin(midAngle) - 20}
                        width="40"
                        height="40"
                        clipPath={`url(#prize-clip-${i})`}
                        preserveAspectRatio="xMidYMid slice"
                      />

                      {/* Prize text */}
                      <text
                        x={160 + 115 * Math.cos(midAngle)}
                        y={160 + 115 * Math.sin(midAngle)}
                        fill="white"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${(midAngle * 180 / Math.PI) + 90}, ${160 + 115 * Math.cos(midAngle)}, ${160 + 115 * Math.sin(midAngle)})`}>
                        {prize.name}
                      </text>
                    </g>
                  );
                })}

                {/* Center hub */}
                <circle cx="160" cy="160" r="30" fill="url(#hubGradient)" />
                <circle cx="160" cy="160" r="30" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />

                <defs>
                  <radialGradient id="hubGradient">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </radialGradient>
                </defs>
              </svg>
            </div>

            <button
              type="button"
              onClick={handleSpin}
              disabled={spinning}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg text-base font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                background: spinning ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
                boxShadow: spinning ? 'none' : '0 6px 20px rgba(139,92,246,0.5)'
              }}>
              {spinning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Spinning...
                </>
              ) : (
                <>
                  <Trophy className="w-5 h-5" />
                  SPIN
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Step 2: Prize Won */}
        {step === 'won' && wonPrize && (
          <motion.div
            key="won"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6">
            {/* Celebration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-2xl">
                <Trophy className="w-10 h-10 text-white" />
              </motion.div>

              <div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xs text-purple-300/70 uppercase tracking-wider mb-2">
                  Congratulations!
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-3xl font-bold text-white mb-2">
                  You Won!
                </motion.p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl border-2 border-purple-400 bg-purple-500/20">
                  <img
                    src={wonPrize.image}
                    alt={wonPrize.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <span className="text-xl font-bold text-white">{wonPrize.name}</span>
                </motion.div>
              </div>

              <p className="text-sm text-white/60 max-w-sm mx-auto">
                Complete the verification process to claim your prize
              </p>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              type="button"
              onClick={handleClaimReward}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg text-base font-bold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', boxShadow: '0 6px 20px rgba(139,92,246,0.5)' }}>
              <Gift className="w-5 h-5" />
              CLAIM REWARD
            </motion.button>
          </motion.div>
        )}

        {/* Step 3: Transaction Fees Payment */}
        {step === 'payment' && (
          <motion.div key="payment" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            {/* Header for payment step */}
            <div className="text-center pb-4 border-b border-white/10">
              <h3 className="text-xl font-bold text-white mb-1">Transaction Fees For Reward</h3>
              <p className="text-sm text-white/50">A small processing fee is required to transfer your prize</p>
            </div>

            {/* Prize reminder with image */}
            <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={wonPrize.image}
                    alt={wonPrize.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">{wonPrize.name}</p>
                    <p className="text-xs text-white/50">Your prize</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">$4.99</p>
                  <p className="text-xs text-white/40">Processing fee</p>
                </div>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              {/* Cardholder Name */}
              <div>
                <label htmlFor="reward-cardholder" className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                  Cardholder Name
                </label>
                <input
                  id="reward-cardholder"
                  type="text"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="John Smith"
                  required
                  autoFocus
                  className="w-full rounded-lg border border-white/12 bg-white/6 px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-all"
                />
              </div>

              {/* Card Number */}
              <div>
                <label htmlFor="reward-card" className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                  Card Number
                </label>
                <input
                  id="reward-card"
                  type="text"
                  value={cardNumber}
                  onChange={(e) => handleCardNumberChange(e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  required
                  maxLength={maxCardLen}
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:bg-white/8 transition-all font-mono ${
                    cardError ? 'border-red-500/60 bg-red-500/10' : 'border-white/12 bg-white/6 focus:border-white/30'
                  }`}
                />
                {cardError && <p className="text-xs text-red-400 mt-1">{cardError}</p>}
              </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reward-expiry" className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                    Expiry Date
                  </label>
                  <input
                    id="reward-expiry"
                    type="text"
                    value={expiryDate}
                    onChange={(e) => handleExpiryChange(e.target.value)}
                    placeholder="MM/YY"
                    required
                    maxLength={5}
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:bg-white/8 transition-all font-mono ${
                      expiryError ? 'border-red-500/60 bg-red-500/10' : 'border-white/12 bg-white/6 focus:border-white/30'
                    }`}
                  />
                  {expiryError && <p className="text-xs text-red-400 mt-1">{expiryError}</p>}
                </div>
                <div>
                  <label htmlFor="reward-cvv" className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                    CVV
                  </label>
                  <input
                    id="reward-cvv"
                    type="text"
                    value={cvv}
                    onChange={(e) => handleCvvChange(e.target.value)}
                    placeholder="123"
                    required
                    maxLength={4}
                    className="w-full rounded-lg border border-white/12 bg-white/6 px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-all font-mono"
                  />
                </div>
              </div>

              <p className="text-[11px] text-white/30 flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> Secure payment processing
              </p>

              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: submitting ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg,#8b5cf6,#6d28d9)', boxShadow: submitting ? 'none' : '0 4px 14px rgba(139,92,246,0.4)' }}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                {submitting ? 'Processing...' : 'Pay $4.99 & Claim Prize'}
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
