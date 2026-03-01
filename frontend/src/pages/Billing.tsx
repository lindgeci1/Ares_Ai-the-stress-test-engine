import React from 'react';
import { CheckIcon, ZapIcon, BuildingIcon, ArrowRightIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
export function Billing() {
  return (
    <div className="p-6 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <ZapIcon className="w-4 h-4 text-[#EF4444]" />
          <h1 className="font-sans text-xl font-bold text-white tracking-wide">
            BILLING & PLANS
          </h1>
        </div>
        <p className="font-mono text-[10px] text-[#404040] tracking-wider">
          CURRENT PLAN: FREE TIER — 4/10 AUDITS USED
        </p>
      </div>

      {/* Current usage */}
      <div className="bg-[#0a0a0a] border border-[#262626] p-4 mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] text-[#666] tracking-widest">
            MONTHLY QUOTA USAGE
          </span>
          <span className="font-mono text-xs text-[#EF4444] font-bold">
            4 / 10 AUDITS
          </span>
        </div>
        <div className="w-full h-2 bg-[#1a1a1a] mb-2">
          <div
            className="h-full bg-[#EF4444]"
            style={{
              width: '40%'
            }} />

        </div>
        <p className="font-mono text-[9px] text-[#404040]">
          6 AUDITS REMAINING THIS CYCLE — RESETS FEB 28, 2025
        </p>
      </div>

      {/* Pricing tiers — now 4 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-px bg-[#262626] mb-8">
        {/* Free */}
        <div className="bg-[#0a0a0a] p-6 flex flex-col">
          <div className="mb-4">
            <span className="font-mono text-[9px] text-[#404040] tracking-widest">
              TIER 01
            </span>
            <h2 className="font-sans text-lg font-bold text-white mt-1">
              OPERATOR
            </h2>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="font-mono text-3xl font-bold text-white">
                $0
              </span>
              <span className="font-mono text-xs text-[#404040]">/month</span>
            </div>
          </div>
          <ul className="space-y-2 mb-6 flex-1">
            {[
            '10 audits / month',
            '3 rounds per audit',
            'Basic heatmap analysis',
            '7-day audit history'].
            map((f) =>
            <li key={f} className="flex items-center gap-2">
                <CheckIcon className="w-3 h-3 text-[#404040] flex-shrink-0" />
                <span className="font-mono text-[10px] text-[#666]">{f}</span>
              </li>
            )}
          </ul>
          <button className="w-full py-2.5 border border-[#262626] text-[#404040] font-mono text-xs tracking-widest cursor-default">
            CURRENT PLAN
          </button>
        </div>

        {/* Pro */}
        <div className="bg-[#0a0a0a] p-6 border-t-2 border-t-[#EF4444] relative flex flex-col">
          <div className="absolute top-0 right-4 -translate-y-1/2">
            <span className="font-mono text-[9px] font-bold text-white bg-[#EF4444] px-2 py-0.5 tracking-widest">
              RECOMMENDED
            </span>
          </div>
          <div className="mb-4">
            <span className="font-mono text-[9px] text-[#EF4444] tracking-widest">
              TIER 02
            </span>
            <h2 className="font-sans text-lg font-bold text-white mt-1">
              STRATEGIST
            </h2>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="font-mono text-3xl font-bold text-[#EF4444]">
                $49
              </span>
              <span className="font-mono text-xs text-[#404040]">/month</span>
            </div>
          </div>
          <ul className="space-y-2 mb-6 flex-1">
            {[
            'Unlimited audits',
            '10 rounds per audit',
            'Full heatmap + annotations',
            'Rebuttal console access',
            'PDF export reports',
            '90-day audit history'].
            map((f) =>
            <li key={f} className="flex items-center gap-2">
                <CheckIcon className="w-3 h-3 text-[#EF4444] flex-shrink-0" />
                <span className="font-mono text-[10px] text-[#888]">{f}</span>
              </li>
            )}
          </ul>
          <Link
            to="/checkout/pro"
            className="w-full py-2.5 bg-[#EF4444] text-white font-mono text-xs font-bold tracking-widest hover:bg-[#dc2626] transition-colors text-center block">

            UPGRADE TO PRO
          </Link>
        </div>

        {/* Enterprise */}
        <div className="bg-[#0a0a0a] p-6 border-t-2 border-t-[#3B82F6] relative flex flex-col">
          <div className="mb-4">
            <span className="font-mono text-[9px] text-[#3B82F6] tracking-widest">
              TIER 03
            </span>
            <h2 className="font-sans text-lg font-bold text-white mt-1">
              ENTERPRISE
            </h2>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="font-mono text-3xl font-bold text-[#3B82F6]">
                CUSTOM
              </span>
            </div>
          </div>
          <ul className="space-y-2 mb-6 flex-1">
            {[
            'Custom API integrations',
            'White-label audits',
            'Dedicated support'].
            map((f) =>
            <li key={f} className="flex items-center gap-2">
                <CheckIcon className="w-3 h-3 text-[#3B82F6] flex-shrink-0" />
                <span className="font-mono text-[10px] text-[#888]">{f}</span>
              </li>
            )}
          </ul>
          <a
            href="mailto:sales@aresai.com"
            className="w-full py-2.5 border border-[#3B82F6] text-[#3B82F6] font-mono text-xs font-bold tracking-widest hover:bg-[#3B82F6] hover:text-white transition-colors flex items-center justify-center gap-2">

            CONTACT SALES
            <ArrowRightIcon className="w-3 h-3" />
          </a>
        </div>

        {/* Custom / Enterprise (new) */}
        <div className="bg-[#080808] p-6 border-t-2 border-t-[#404040] relative flex flex-col">
          <div className="mb-4">
            <span className="font-mono text-[9px] text-[#404040] tracking-widest">
              TIER 04
            </span>
            <h2 className="font-sans text-lg font-bold text-white mt-1">
              CUSTOM
            </h2>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="font-mono text-xl font-bold text-[#666]">
                BESPOKE
              </span>
            </div>
            <p className="font-mono text-[9px] text-[#333] mt-1 tracking-wider">
              FULLY TAILORED DEPLOYMENT
            </p>
          </div>
          <ul className="space-y-2 mb-6 flex-1">
            {[
            'Custom API integrations',
            'White-label audits',
            'Dedicated support'].
            map((f) =>
            <li key={f} className="flex items-center gap-2">
                <CheckIcon className="w-3 h-3 text-[#404040] flex-shrink-0" />
                <span className="font-mono text-[10px] text-[#555]">{f}</span>
              </li>
            )}
          </ul>
          <a
            href="mailto:sales@aresai.com"
            className="w-full py-2.5 border border-[#404040] text-[#666] font-mono text-xs font-bold tracking-widest hover:border-[#666] hover:text-white transition-colors flex items-center justify-center gap-2">

            CONTACT SALES
            <ArrowRightIcon className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Billing history */}
      <div className="border border-[#262626]">
        <div className="px-4 py-3 border-b border-[#262626]">
          <span className="font-mono text-[10px] text-[#666] tracking-widest">
            BILLING HISTORY
          </span>
        </div>
        <div className="p-4">
          <p className="font-mono text-[10px] text-[#333] text-center py-4">
            NO BILLING HISTORY — FREE TIER
          </p>
        </div>
      </div>
    </div>);

}