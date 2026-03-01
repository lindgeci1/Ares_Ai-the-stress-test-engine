import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ZapIcon,
  LockIcon,
  CheckIcon,
  ArrowLeftIcon,
  CreditCardIcon,
  ShieldCheckIcon } from
'lucide-react';
const PLANS: Record<
  string,
  {
    name: string;
    price: string;
    priceNum: string;
    period: string;
    features: string[];
  }> =
{
  pro: {
    name: 'STRATEGIST PRO',
    price: '$49',
    priceNum: '49.00',
    period: '/month',
    features: [
    'Unlimited audits per month',
    '10 battle rounds per audit',
    'Full heatmap + annotations',
    'Rebuttal console access',
    'PDF export reports',
    '90-day audit history']

  },
  enterprise: {
    name: 'ENTERPRISE',
    price: 'CUSTOM',
    priceNum: '—',
    period: '',
    features: [
    'Everything in Strategist Pro',
    'Custom API integrations',
    'White-label audits',
    'Dedicated support',
    'SSO & SAML integration',
    'Temp access key generation']

  }
};
export function Checkout() {
  const { plan } = useParams<{
    plan: string;
  }>();
  const navigate = useNavigate();
  const planData = PLANS[plan ?? 'pro'] ?? PLANS.pro;
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };
  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + ' / ' + digits.slice(2);
    return digits;
  };
  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setDone(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    }, 2200);
  };
  if (done) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-[#3B82F6]/10 border border-[#3B82F6]/30 flex items-center justify-center mx-auto mb-4">
            <CheckIcon className="w-6 h-6 text-[#3B82F6]" />
          </div>
          <h2 className="font-sans text-xl font-bold text-white mb-2">
            PAYMENT CONFIRMED
          </h2>
          <p className="font-mono text-[10px] text-[#404040] tracking-widest">
            REDIRECTING TO COMMAND CENTER...
          </p>
          <div className="scanning-bar scanning-bar-blue mt-6 w-48 mx-auto" />
        </div>
      </div>);

  }
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Top bar */}
      <div className="border-b border-[#262626] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ZapIcon className="w-4 h-4 text-[#EF4444]" />
          <span className="font-mono text-sm font-bold tracking-widest">
            ARES AI
          </span>
          <span className="font-mono text-[10px] text-[#404040] tracking-widest ml-2">
            — SECURE CHECKOUT
          </span>
        </div>
        <div className="flex items-center gap-2">
          <LockIcon className="w-3 h-3 text-[#404040]" />
          <span className="font-mono text-[9px] text-[#404040] tracking-widest">
            256-BIT ENCRYPTED
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-0 border border-[#262626] mt-8">
        {/* LEFT: Order Summary */}
        <div className="bg-[#080808] border-r border-[#262626] p-8 flex flex-col">
          <Link
            to="/billing"
            className="flex items-center gap-2 font-mono text-[10px] text-[#404040] hover:text-[#666] tracking-widest mb-8 transition-colors w-fit">

            <ArrowLeftIcon className="w-3 h-3" />
            BACK TO PLANS
          </Link>

          <div className="mb-2">
            <span className="font-mono text-[9px] text-[#404040] tracking-widest">
              ORDER SUMMARY
            </span>
          </div>

          <div className="border border-[#262626] bg-[#050505] p-5 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="font-mono text-[9px] text-[#3B82F6] tracking-widest mb-1">
                  PLAN
                </div>
                <div className="font-sans text-base font-bold text-white">
                  {planData.name}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-2xl font-bold text-[#3B82F6]">
                  {planData.price}
                </div>
                {planData.period &&
                <div className="font-mono text-[10px] text-[#404040]">
                    {planData.period}
                  </div>
                }
              </div>
            </div>

            <div className="h-px bg-[#262626] mb-4" />

            <ul className="space-y-2">
              {planData.features.map((f, i) =>
              <li key={i} className="flex items-center gap-2">
                  <CheckIcon className="w-3 h-3 text-[#3B82F6] flex-shrink-0" />
                  <span className="font-mono text-[10px] text-[#666]">{f}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Price breakdown */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between">
              <span className="font-mono text-[10px] text-[#404040] tracking-widest">
                SUBTOTAL
              </span>
              <span className="font-mono text-[10px] text-[#666]">
                ${planData.priceNum}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-[10px] text-[#404040] tracking-widest">
                TAX
              </span>
              <span className="font-mono text-[10px] text-[#666]">$0.00</span>
            </div>
            <div className="h-px bg-[#262626]" />
            <div className="flex justify-between">
              <span className="font-mono text-xs font-bold text-white tracking-widest">
                TOTAL DUE TODAY
              </span>
              <span className="font-mono text-xs font-bold text-[#3B82F6]">
                ${planData.priceNum}
              </span>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-[#262626]">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-[#404040]" />
              <span className="font-mono text-[9px] text-[#333] tracking-widest">
                POWERED BY STRIPE
              </span>
            </div>
            <p className="font-mono text-[9px] text-[#262626] leading-relaxed">
              YOUR PAYMENT IS SECURED WITH INDUSTRY-STANDARD TLS ENCRYPTION.
              ARES AI NEVER STORES YOUR CARD DETAILS.
            </p>
          </div>
        </div>

        {/* RIGHT: Payment Form */}
        <div className="bg-[#050505] p-8">
          <div className="mb-6">
            <span className="font-mono text-[9px] text-[#404040] tracking-widest">
              PAYMENT DETAILS
            </span>
          </div>

          <form onSubmit={handlePay} className="space-y-5">
            {/* Cardholder name */}
            <div>
              <label className="block font-mono text-[9px] text-[#666] tracking-widest mb-2">
                CARDHOLDER NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="JOHN DOE"
                required
                className="w-full bg-[#020202] border border-[#262626] px-4 py-3 font-mono text-sm text-white placeholder-[#2a2a2a] focus:border-[#3B82F6] focus:outline-none transition-colors tracking-wider" />

            </div>

            {/* Card number */}
            <div>
              <label className="block font-mono text-[9px] text-[#666] tracking-widest mb-2">
                CARD NUMBER
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) =>
                  setCardNumber(formatCardNumber(e.target.value))
                  }
                  placeholder="0000 0000 0000 0000"
                  required
                  maxLength={19}
                  className="w-full bg-[#020202] border border-[#262626] px-4 py-3 font-mono text-sm text-white placeholder-[#2a2a2a] focus:border-[#3B82F6] focus:outline-none transition-colors tracking-widest pr-12" />

                <CreditCardIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#333]" />
              </div>
            </div>

            {/* Expiry + CVC */}
            <div className="grid grid-cols-2 gap-0">
              <div>
                <label className="block font-mono text-[9px] text-[#666] tracking-widest mb-2">
                  EXPIRY DATE
                </label>
                <input
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  placeholder="MM / YY"
                  required
                  maxLength={7}
                  className="w-full bg-[#020202] border border-[#262626] border-r-0 px-4 py-3 font-mono text-sm text-white placeholder-[#2a2a2a] focus:border-[#3B82F6] focus:outline-none transition-colors tracking-widest" />

              </div>
              <div>
                <label className="block font-mono text-[9px] text-[#666] tracking-widest mb-2">
                  CVC
                </label>
                <input
                  type="text"
                  value={cvc}
                  onChange={(e) =>
                  setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))
                  }
                  placeholder="000"
                  required
                  maxLength={4}
                  className="w-full bg-[#020202] border border-[#262626] px-4 py-3 font-mono text-sm text-white placeholder-[#2a2a2a] focus:border-[#3B82F6] focus:outline-none transition-colors tracking-widest" />

              </div>
            </div>

            {/* Billing zip */}
            <div>
              <label className="block font-mono text-[9px] text-[#666] tracking-widest mb-2">
                BILLING ZIP / POSTAL CODE
              </label>
              <input
                type="text"
                placeholder="10001"
                className="w-full bg-[#020202] border border-[#262626] px-4 py-3 font-mono text-sm text-white placeholder-[#2a2a2a] focus:border-[#3B82F6] focus:outline-none transition-colors tracking-widest" />

            </div>

            {/* Divider */}
            <div className="h-px bg-[#262626]" />

            {/* Order total recap */}
            <div className="flex items-center justify-between bg-[#0a0a0a] border border-[#262626] px-4 py-3">
              <span className="font-mono text-[10px] text-[#666] tracking-widest">
                {planData.name}
              </span>
              <span className="font-mono text-sm font-bold text-white">
                {planData.price}
                {planData.period}
              </span>
            </div>

            {/* Pay button */}
            <button
              type="submit"
              disabled={processing}
              className="w-full py-4 bg-[#3B82F6] text-white font-mono text-sm font-bold tracking-widest hover:bg-[#2563eb] transition-colors disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden">

              {processing ?
              <span className="flex items-center justify-center gap-3">
                  <span className="font-mono text-xs tracking-widest">
                    PROCESSING PAYMENT
                  </span>
                </span> :

              <span className="flex items-center justify-center gap-2">
                  <LockIcon className="w-3.5 h-3.5" />
                  PAY & UNLOCK QUOTA
                </span>
              }
              {processing &&
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1d4ed8] overflow-hidden">
                  <div
                  className="h-full bg-white/40"
                  style={{
                    animation: 'scan-pulse 1.2s linear infinite'
                  }} />

                </div>
              }
            </button>

            <p className="font-mono text-[9px] text-[#262626] text-center tracking-wider">
              BY COMPLETING THIS PURCHASE YOU AGREE TO OUR TERMS OF SERVICE
            </p>
          </form>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-center gap-6">
        <span className="font-mono text-[9px] text-[#1a1a1a]">VISA</span>
        <span className="font-mono text-[9px] text-[#1a1a1a]">MASTERCARD</span>
        <span className="font-mono text-[9px] text-[#1a1a1a]">AMEX</span>
        <span className="font-mono text-[9px] text-[#1a1a1a]">
          STRIPE SECURED
        </span>
      </div>
    </div>);

}