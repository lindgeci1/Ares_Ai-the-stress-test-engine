import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import {
  PlayIcon,
  PauseIcon,
  SendIcon,
  AlertTriangleIcon,
  ShieldIcon,
  SwordIcon,
  TerminalIcon,
  ZapIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FileWarningIcon,
  BrainIcon,
  WrenchIcon } from
'lucide-react';
type HeatLevel = 'red' | 'yellow' | 'green' | 'neutral';
type TextSegment = {
  text: string;
  heat: HeatLevel;
  note?: string;
};
type BattleEntry = {
  role: 'AUDITOR' | 'OPTIMIST' | 'SYSTEM' | 'USER';
  text: string;
  time: string;
  round: number;
};
type DiagnosticTab = 'vulnerabilities' | 'fallacies' | 'fortification';
const DOCUMENT_SEGMENTS: TextSegment[] = [
{
  text: 'TERMS OF SERVICE — EFFECTIVE DATE: JANUARY 1, 2025\n\n',
  heat: 'neutral'
},
{
  text: '1. ACCEPTANCE OF TERMS\n\n',
  heat: 'neutral'
},
{
  text: 'By accessing or using our services, you agree to be bound by these Terms of Service and all applicable laws and regulations.',
  heat: 'green',
  note: 'Standard acceptance clause — well-defined'
},
{
  text: ' Your continued use of the service constitutes acceptance of any modifications.',
  heat: 'yellow',
  note: 'Unilateral modification without notice — moderate risk'
},
{
  text: '\n\n2. DATA COLLECTION AND USE\n\n',
  heat: 'neutral'
},
{
  text: 'We collect information you provide directly to us, including name, email address, and payment information.',
  heat: 'green',
  note: 'Explicit data collection — compliant'
},
{
  text: ' We may also collect data from third-party sources and combine it with information we have about you.',
  heat: 'red',
  note: 'CRITICAL: Undefined third-party data sources — GDPR violation risk'
},
{
  text: '\n\n3. INTELLECTUAL PROPERTY\n\n',
  heat: 'neutral'
},
{
  text: 'All content, features, and functionality are owned by the Company and are protected by international copyright laws.',
  heat: 'green',
  note: 'Standard IP clause'
},
{
  text: '\n\n4. LIMITATION OF LIABILITY\n\n',
  heat: 'neutral'
},
{
  text: 'To the maximum extent permitted by law, the Company shall not be liable for any indirect, incidental, special, or consequential damages.',
  heat: 'yellow',
  note: 'Broad liability waiver — may not be enforceable in all jurisdictions'
},
{
  text: ' This includes loss of profits, data, or business opportunities arising from your use of the service.',
  heat: 'red',
  note: 'CRITICAL: Data loss liability waiver — high user impact'
},
{
  text: '\n\n5. ARBITRATION\n\n',
  heat: 'neutral'
},
{
  text: 'Any dispute arising from these terms shall be resolved through binding arbitration.',
  heat: 'red',
  note: 'CRITICAL: Mandatory arbitration eliminates class action rights'
},
{
  text: ' The arbitration shall be conducted in Delaware under AAA Commercial Arbitration Rules.',
  heat: 'yellow',
  note: 'Venue may be inconvenient for non-US users'
}];

const BATTLE_LOG: BattleEntry[] = [
{
  role: 'SYSTEM',
  text: 'AUDIT INITIATED — DOCUMENT: Terms_of_Service_v4.2.pdf — 3 ROUNDS SCHEDULED',
  time: '00:00:00',
  round: 0
},
{
  role: 'AUDITOR',
  text: 'THREAT IDENTIFIED [SEVERITY: HIGH]: Section 2 permits data collection from undefined "third-party sources" — no consent mechanism specified. GDPR Article 13 violation.',
  time: '00:00:45',
  round: 1
},
{
  role: 'OPTIMIST',
  text: 'DEFENSE: Industry standard practice. Third-party sources are implicitly defined by context. Privacy Policy Exhibit B provides supplementary definitions.',
  time: '00:01:12',
  round: 1
},
{
  role: 'AUDITOR',
  text: 'ESCALATION: Exhibit B is not incorporated by reference in this clause. Standalone reading creates ambiguity. Courts have ruled against similar language in FTC v. DataBroker (2023).',
  time: '00:01:38',
  round: 1
},
{
  role: 'OPTIMIST',
  text: 'COUNTER: FTC ruling applies to consumer data brokers, not SaaS platforms. Recital 47 of GDPR permits legitimate interest processing for service improvement.',
  time: '00:02:05',
  round: 1
},
{
  role: 'SYSTEM',
  text: 'ROUND 1 COMPLETE — AUDITOR WINS — SCORE IMPACT: -8 POINTS — SURVIVAL: 58%',
  time: '00:02:30',
  round: 1
},
{
  role: 'AUDITOR',
  text: 'CRITICAL THREAT [SEVERITY: CRITICAL]: Section 5 mandatory arbitration clause eliminates class action rights without clear disclosure. CFPB guidelines require prominent notice.',
  time: '00:03:00',
  round: 2
},
{
  role: 'OPTIMIST',
  text: 'DEFENSE: Arbitration clause is in bold text per Section 5 header. User must scroll past it to complete registration — constructive notice established.',
  time: '00:03:28',
  round: 2
},
{
  role: 'SYSTEM',
  text: 'ROUND 2 IN PROGRESS — CURRENT SURVIVAL: 58% — NEXT ROUND IN 00:30',
  time: '00:03:45',
  round: 2
}];

const VULNERABILITIES = [
{
  id: 'VLN-001',
  severity: 'CRITICAL',
  section: 'Section 2 — Data Collection',
  title: 'Undefined Third-Party Data Sources',
  detail:
  'The clause "We may also collect data from third-party sources" lacks specificity. Under GDPR Article 13(1)(e) and CCPA §1798.100, data subjects must be informed of the specific categories of third parties from whom data is collected. This clause is unenforceable in EU jurisdictions and exposes the company to regulatory fines up to 4% of global annual turnover.',
  precedent:
  'FTC v. DataBroker LLC (2023) — Clause struck down for identical vagueness.'
},
{
  id: 'VLN-002',
  severity: 'CRITICAL',
  section: 'Section 5 — Arbitration',
  title: 'Mandatory Arbitration Without Prominent Disclosure',
  detail:
  'The arbitration clause eliminates the user\'s right to class action litigation without meeting the "clear and conspicuous" disclosure standard required by CFPB guidelines and the Dodd-Frank Act. Placement within a dense ToS document does not satisfy the notice requirement. California courts have consistently invalidated similar clauses under McGill v. Citibank (2017).',
  precedent:
  'McGill v. Citibank N.A. (2017) — Arbitration clause voided for insufficient disclosure.'
},
{
  id: 'VLN-003',
  severity: 'HIGH',
  section: 'Section 4 — Limitation of Liability',
  title: 'Overbroad Data Loss Liability Waiver',
  detail:
  'Waiving liability for "loss of data" without carve-outs for gross negligence or willful misconduct violates consumer protection statutes in 14 US states and is categorically unenforceable under EU Directive 93/13/EEC on unfair contract terms. Courts in Germany, France, and the UK have awarded damages against companies relying on identical language.',
  precedent:
  'Unfair Terms in Consumer Contracts Regulations 1999 (UK) — Blanket data loss waivers void.'
},
{
  id: 'VLN-004',
  severity: 'MODERATE',
  section: 'Section 1 — Acceptance',
  title: 'Unilateral Modification Without Notice',
  detail:
  '"Continued use constitutes acceptance" of modifications fails the mutual assent requirement for contract formation under Restatement (Second) of Contracts §69. Users cannot be bound by terms they have no reasonable opportunity to review. This clause is particularly vulnerable to challenge when material terms (pricing, data use) are modified.',
  precedent:
  'Nguyen v. Barnes & Noble Inc. (9th Cir. 2014) — Browsewrap agreement invalidated.'
}];

const FALLACIES = [
{
  id: 'LF-001',
  type: 'INTERNAL CONTRADICTION',
  sections: 'Section 2 vs. Section 3',
  title: 'Data Ownership vs. Data Collection Scope',
  detail:
  'Section 3 asserts "all content... is owned by the Company" while Section 2 claims the right to collect and combine user-provided data with third-party data. If user-provided data is company property, the legal basis for third-party data combination shifts from consent to ownership — a legally incoherent position that undermines both clauses simultaneously.'
},
{
  id: 'LF-002',
  type: 'CIRCULAR REASONING',
  sections: 'Section 1 vs. Section 5',
  title: 'Consent Mechanism Undermines Arbitration Validity',
  detail:
  'Section 1 establishes acceptance via "continued use" (passive consent). Section 5 requires arbitration for "any dispute arising from these terms." However, if the acceptance mechanism itself is disputed (as in VLN-004), the arbitration clause cannot be invoked to resolve that dispute — the clause is self-defeating in the exact scenario where it is most needed.'
},
{
  id: 'LF-003',
  type: 'SCOPE CREEP',
  sections: 'Section 4',
  title: 'Liability Waiver Exceeds Jurisdictional Authority',
  detail:
  'The phrase "to the maximum extent permitted by law" implicitly acknowledges that the waiver may be partially invalid, yet the document provides no fallback position for jurisdictions where the full waiver is unenforceable. This creates a legal vacuum: in those jurisdictions, the entire liability framework is undefined, exposing the company to uncapped liability.'
}];

const FORTIFICATION = [
{
  step: '01',
  priority: 'CRITICAL',
  title: 'Rewrite Section 2 — Enumerate Third-Party Data Sources',
  fixes: ['VLN-001', 'LF-001'],
  action:
  'Replace the vague "third-party sources" language with an explicit, enumerated list. Create a linked "Data Sources Annex" that catalogs each category (e.g., "analytics providers," "payment processors," "identity verification services"). Incorporate the Annex by reference in Section 2 with the exact clause: "as further described in the Data Sources Annex, incorporated herein by reference." This simultaneously resolves the GDPR Article 13 violation (VLN-001) and eliminates the data ownership contradiction with Section 3 (LF-001), because once data collection scope is precisely bounded, the IP ownership claim in Section 3 no longer conflicts with it.',
  effort: 'HIGH',
  impact: 'ELIMINATES VLN-001 · RESOLVES LF-001'
},
{
  step: '02',
  priority: 'CRITICAL',
  title: 'Add Standalone Arbitration Disclosure + Fix Consent Loop',
  fixes: ['VLN-002', 'LF-002'],
  action:
  'Create a separate, single-purpose disclosure page that users must affirmatively acknowledge before account creation. The page must contain only the arbitration notice in 14pt+ font, a plain-language summary ("By agreeing, you waive your right to sue in court or participate in class actions"), and a checkbox: "I understand and agree to resolve disputes through individual arbitration." Log this acknowledgment with a timestamp. This also directly resolves the circular reasoning in LF-002: because the acceptance mechanism (Section 1) will now be active/explicit rather than passive, the arbitration clause can no longer be self-defeating — a user who disputes the acceptance mechanism will have a logged, affirmative consent record that pre-empts the challenge.',
  effort: 'MEDIUM',
  impact: 'ELIMINATES VLN-002 · RESOLVES LF-002'
},
{
  step: '03',
  priority: 'HIGH',
  title: 'Carve Out Gross Negligence + Add Jurisdiction Fallback',
  fixes: ['VLN-003', 'LF-003'],
  action:
  'Amend Section 4 to add: "Notwithstanding the foregoing, nothing in this Agreement shall limit the Company\'s liability for: (i) death or personal injury caused by negligence; (ii) fraud or fraudulent misrepresentation; (iii) gross negligence or willful misconduct; or (iv) any liability that cannot be excluded or limited under applicable law." Additionally, add a jurisdiction-specific fallback clause: "In jurisdictions where any part of this limitation is unenforceable, liability shall be limited to the maximum extent permitted by applicable law, and the remaining provisions shall continue in full force." This directly resolves LF-003 (scope creep) by providing an explicit fallback position, eliminating the legal vacuum that currently exposes the company to uncapped liability in non-compliant jurisdictions.',
  effort: 'LOW',
  impact: 'ELIMINATES VLN-003 · RESOLVES LF-003'
},
{
  step: '04',
  priority: 'MODERATE',
  title: 'Implement Active Notice for Material Modifications',
  fixes: ['VLN-004'],
  action:
  'Replace "continued use constitutes acceptance" with a 30-day advance email notification requirement for material changes. Define "material changes" explicitly (pricing, data use, dispute resolution, liability). Add a 30-day opt-out window with account termination and pro-rated refund rights. Include the clause: "For the avoidance of doubt, continued use of the Service following the opt-out period shall constitute acceptance of the modified terms only with respect to non-material changes." This converts passive acceptance to active consent and satisfies mutual assent requirements across all common law jurisdictions, eliminating the browsewrap vulnerability identified in VLN-004.',
  effort: 'MEDIUM',
  impact: 'ELIMINATES VLN-004'
}];

const SCAN_MESSAGES = [
'INITIALIZING ARES PROTOCOL...',
'EXTRACTING DOCUMENT RAW TEXT...',
'SCANNING FOR EXTERNAL VULNERABILITIES...',
'MAPPING INTERNAL LOGICAL FALLACIES...',
'GENERATING RED/BLUE TEAM AUDIO DEBATE...',
'FINALIZING SURVIVAL SCORE...'];

function WaveformBar({ color, delay }: {color: string;delay: number;}) {
  return (
    <div
      className="w-1 flex-shrink-0"
      style={{
        backgroundColor: color,
        height: `${8 + Math.random() * 32}px`,
        animation: `${color === '#EF4444' ? 'wave-red' : 'wave-blue'} ${0.5 + Math.random() * 0.8}s ease-in-out infinite`,
        animationDelay: `${delay}ms`,
        opacity: 0.7 + Math.random() * 0.3
      }} />);


}
export function AuditLab() {
  const { id } = useParams();
  const location = useLocation();
  // ── SCANNING STATE ──
  const [isScanning, setIsScanning] = useState(
    location.state?.isNewAudit || false
  );
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMsgIndex, setScanMsgIndex] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);
  useEffect(() => {
    if (!isScanning) return;
    // Blinking cursor — 500ms toggle
    const cursorInterval = setInterval(() => setCursorVisible((v) => !v), 500);
    // Message cycling — 800ms per message
    const msgInterval = setInterval(() => {
      setScanMsgIndex((i) => {
        if (i < SCAN_MESSAGES.length - 1) return i + 1;
        clearInterval(msgInterval);
        return i;
      });
    }, 800);
    // Progress bar — fills over total duration
    const totalDuration = SCAN_MESSAGES.length * 800 + 400;
    const tickMs = 50;
    const progressInterval = setInterval(() => {
      setScanProgress((p) => {
        const next = p + 100 / (totalDuration / tickMs);
        return next >= 100 ? 100 : next;
      });
    }, tickMs);
    // Finish
    const finishTimer = setTimeout(() => {
      setScanProgress(100);
      clearInterval(progressInterval);
      clearInterval(msgInterval);
      clearInterval(cursorInterval);
      setTimeout(() => setIsScanning(false), 300);
    }, totalDuration);
    return () => {
      clearInterval(cursorInterval);
      clearInterval(msgInterval);
      clearInterval(progressInterval);
      clearTimeout(finishTimer);
    };
  }, []);
  // ── AUDIT LAB STATE ──
  const [isPlaying, setIsPlaying] = useState(false);
  const [rebuttal, setRebuttal] = useState('');
  const [activeHeat, setActiveHeat] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DiagnosticTab>('vulnerabilities');
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(
    new Set(['VLN-001'])
  );
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const battleLogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isScanning && battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight;
    }
  }, [isScanning]);
  const toggleAccordion = (accordionId: string) => {
    setOpenAccordions((prev) => {
      const next = new Set(prev);
      if (next.has(accordionId)) next.delete(accordionId);else
      next.add(accordionId);
      return next;
    });
  };
  const survivalScore = 58;
  const scoreColor =
  survivalScore < 40 ? '#EF4444' : survivalScore < 70 ? '#EAB308' : '#22C55E';
  const TABS: {
    id: DiagnosticTab;
    label: string;
    icon: typeof FileWarningIcon;
    count: number;
  }[] = [
  {
    id: 'vulnerabilities',
    label: 'VULNERABILITIES',
    icon: FileWarningIcon,
    count: VULNERABILITIES.length
  },
  {
    id: 'fallacies',
    label: 'LOGICAL FALLACIES',
    icon: BrainIcon,
    count: FALLACIES.length
  },
  {
    id: 'fortification',
    label: 'FORTIFICATION PLAN',
    icon: WrenchIcon,
    count: FORTIFICATION.length
  }];

  // ── SCANNING SCREEN ──
  if (isScanning) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-[#050505] px-8">
        {/* Header */}
        <div className="w-full max-w-xl mb-10">
          <div className="flex items-center gap-3 mb-1">
            <ZapIcon className="w-4 h-4 text-[#EF4444]" />
            <span className="font-mono text-xs font-bold text-white tracking-widest">
              ARES AI — AUDIT INITIALIZATION
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] text-[#404040] tracking-widest">
              TARGET:
            </span>
            <span className="font-mono text-[9px] text-[#555]">{id}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xl mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[9px] text-[#404040] tracking-widest">
              SCAN PROGRESS
            </span>
            <span className="font-mono text-[9px] text-[#EF4444] font-bold tabular-nums">
              {Math.round(scanProgress)}%
            </span>
          </div>
          {/* 1px sharp bar — no border radius */}
          <div
            className="w-full bg-[#1a1a1a]"
            style={{
              height: '1px'
            }}>

            <div
              className="h-full bg-[#EF4444]"
              style={{
                width: `${scanProgress}%`,
                transition: 'none'
              }} />

          </div>
        </div>

        {/* Terminal output */}
        <div className="w-full max-w-xl">
          <div className="border border-[#262626] bg-[#080808]">
            <div className="px-5 py-2 border-b border-[#1a1a1a]">
              <span className="font-mono text-[9px] text-[#333] tracking-widest">
                {'// SYSTEM OUTPUT'}
              </span>
            </div>
            <div className="px-5 py-4 space-y-2">
              {SCAN_MESSAGES.slice(0, scanMsgIndex + 1).map((msg, i) => {
                const isCurrent = i === scanMsgIndex;
                const isDone = i < scanMsgIndex;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span
                      className={`font-mono text-[9px] flex-shrink-0 ${isCurrent ? 'text-[#EF4444]' : 'text-[#2a2a2a]'}`}>

                      {'>'}
                    </span>
                    <span
                      className={`font-mono text-xs tracking-wide flex-1 ${isCurrent ? 'text-white' : 'text-[#2a2a2a]'}`}>

                      {msg}
                      {isCurrent &&
                      <span
                        className="ml-1 text-[#EF4444]"
                        style={{
                          opacity: cursorVisible ? 1 : 0,
                          transition: 'none'
                        }}>

                          █
                        </span>
                      }
                    </span>
                    {isDone &&
                    <span className="font-mono text-[9px] text-[#22C55E] flex-shrink-0 ml-auto">
                        OK
                      </span>
                    }
                  </div>);

              })}
            </div>
          </div>
        </div>

        {/* Footer status */}
        <div className="w-full max-w-xl mt-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#EF4444] animate-pulse" />
            <span className="font-mono text-[9px] text-[#404040] tracking-widest">
              ARES PROTOCOL ACTIVE
            </span>
          </div>
          <span className="font-mono text-[9px] text-[#1a1a1a] tracking-widest">
            DO NOT CLOSE THIS WINDOW
          </span>
        </div>
      </div>);

  }
  // ── MAIN AUDIT LAB UI ──
  return (
    <div className="flex flex-col h-full bg-[#050505]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626] flex-shrink-0">
        <div className="flex items-center gap-3">
          <ZapIcon className="w-3.5 h-3.5 text-[#EF4444]" />
          <span className="font-mono text-xs text-white tracking-wider font-bold">
            AUDIT LAB
          </span>
          <span className="font-mono text-[10px] text-[#404040]">—</span>
          <span className="font-mono text-[10px] text-[#666]">{id}</span>
          <span className="font-mono text-[9px] text-[#3B82F6] bg-[#3B82F6]/10 border border-[#3B82F6]/20 px-1.5 py-0.5">
            ACTIVE
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] text-[#666] tracking-widest">
              SURVIVAL
            </span>
            <span
              className="font-mono text-sm font-bold"
              style={{
                color: scoreColor
              }}>

              {survivalScore}%
            </span>
          </div>
          <div className="w-24 h-1 bg-[#1a1a1a]">
            <div
              className="h-full"
              style={{
                width: `${survivalScore}%`,
                backgroundColor: scoreColor
              }} />

          </div>
          <span className="font-mono text-[9px] text-[#404040]">ROUND 2/3</span>
          <button
            onClick={() => setShowDiagnostic(!showDiagnostic)}
            className={`flex items-center gap-2 px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest border transition-colors ${showDiagnostic ? 'bg-[#EF4444] border-[#EF4444] text-white' : 'border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/10'}`}>

            DIAGNOSTIC REPORT
          </button>
        </div>
      </div>

      {/* Diagnostic Report Panel */}
      {showDiagnostic &&
      <div className="border-b border-[#262626] bg-[#080808] flex-shrink-0">
          <div className="px-6 py-4 border-b border-[#262626] flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-2 h-2 bg-[#EF4444]" />
                <span className="font-mono text-[9px] text-[#EF4444] tracking-widest font-bold">
                  CLASSIFICATION: RESTRICTED — OPERATOR EYES ONLY
                </span>
              </div>
              <h2 className="font-sans text-base font-bold text-white tracking-wide">
                DETAILED DIAGNOSTIC REPORT
              </h2>
              <p className="font-mono text-[9px] text-[#404040] mt-1 tracking-wider">
                DOC: Terms_of_Service_v4.2.pdf · AUDIT ID: {id} · GENERATED:
                2025-01-28 14:32:07 UTC
              </p>
            </div>
            <div className="text-right">
              <div className="font-mono text-[9px] text-[#404040] tracking-widest mb-1">
                OVERALL RESILIENCE
              </div>
              <div
              className="font-mono text-3xl font-bold"
              style={{
                color: scoreColor
              }}>

                {survivalScore}%
              </div>
              <div className="font-mono text-[9px] text-[#EAB308] tracking-widest">
                MODERATE RISK
              </div>
            </div>
          </div>

          <div className="flex border-b border-[#262626]">
            {TABS.map(({ id: tabId, label, icon: Icon, count }) =>
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId)}
            className={`flex items-center gap-2 px-5 py-3 font-mono text-[10px] tracking-widest transition-colors relative flex-shrink-0 ${activeTab === tabId ? 'text-white' : 'text-[#404040] hover:text-[#666]'}`}>

                <Icon className="w-3 h-3" />
                {label}
                <span
              className={`font-mono text-[9px] px-1.5 py-0.5 font-bold ${activeTab === tabId ? tabId === 'vulnerabilities' ? 'text-[#EF4444] bg-[#EF4444]/10' : tabId === 'fallacies' ? 'text-[#EAB308] bg-[#EAB308]/10' : 'text-[#22C55E] bg-[#22C55E]/10' : 'text-[#333] bg-[#1a1a1a]'}`}>

                  {count}
                </span>
                {activeTab === tabId &&
            <div
              className={`absolute bottom-0 left-0 right-0 h-0.5 ${tabId === 'vulnerabilities' ? 'bg-[#EF4444]' : tabId === 'fallacies' ? 'bg-[#EAB308]' : 'bg-[#22C55E]'}`} />

            }
              </button>
          )}
          </div>

          <div className="max-h-[420px] overflow-y-auto battle-log">
            {activeTab === 'vulnerabilities' &&
          <div className="divide-y divide-[#1a1a1a]">
                {VULNERABILITIES.map((v) =>
            <div key={v.id} className="bg-[#050505]">
                    <button
                onClick={() => toggleAccordion(v.id)}
                className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-[#0a0a0a] transition-colors">

                      <span
                  className={`font-mono text-[9px] font-bold px-2 py-0.5 tracking-widest flex-shrink-0 ${v.severity === 'CRITICAL' ? 'text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20' : v.severity === 'HIGH' ? 'text-[#EAB308] bg-[#EAB308]/10 border border-[#EAB308]/20' : 'text-[#3B82F6] bg-[#3B82F6]/10 border border-[#3B82F6]/20'}`}>

                        {v.severity}
                      </span>
                      <span className="font-mono text-[9px] text-[#333] flex-shrink-0">
                        {v.id}
                      </span>
                      <span className="font-mono text-[10px] text-[#666] flex-shrink-0">
                        {v.section}
                      </span>
                      <span className="font-sans text-xs text-white font-medium flex-1">
                        {v.title}
                      </span>
                      {openAccordions.has(v.id) ?
                <ChevronDownIcon className="w-3.5 h-3.5 text-[#404040] flex-shrink-0" /> :

                <ChevronRightIcon className="w-3.5 h-3.5 text-[#404040] flex-shrink-0" />
                }
                    </button>
                    {openAccordions.has(v.id) &&
              <div className="px-6 pb-5 bg-[#080808] border-t border-[#1a1a1a]">
                        <div className="pt-4 space-y-3">
                          <div>
                            <div className="font-mono text-[9px] text-[#EF4444] tracking-widest mb-2">
                              {'// ANALYSIS'}
                            </div>
                            <p className="font-mono text-[10px] text-[#888] leading-relaxed">
                              {v.detail}
                            </p>
                          </div>
                          <div className="border-l-2 border-[#262626] pl-4">
                            <div className="font-mono text-[9px] text-[#404040] tracking-widest mb-1">
                              LEGAL PRECEDENT
                            </div>
                            <p className="font-mono text-[10px] text-[#555] italic">
                              {v.precedent}
                            </p>
                          </div>
                        </div>
                      </div>
              }
                  </div>
            )}
              </div>
          }

            {activeTab === 'fallacies' &&
          <div className="divide-y divide-[#1a1a1a]">
                {FALLACIES.map((f) =>
            <div key={f.id} className="bg-[#050505]">
                    <button
                onClick={() => toggleAccordion(f.id)}
                className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-[#0a0a0a] transition-colors">

                      <span className="font-mono text-[9px] font-bold px-2 py-0.5 tracking-widest flex-shrink-0 text-[#EAB308] bg-[#EAB308]/10 border border-[#EAB308]/20">
                        {f.type}
                      </span>
                      <span className="font-mono text-[9px] text-[#333] flex-shrink-0">
                        {f.id}
                      </span>
                      <span className="font-mono text-[10px] text-[#666] flex-shrink-0">
                        {f.sections}
                      </span>
                      <span className="font-sans text-xs text-white font-medium flex-1">
                        {f.title}
                      </span>
                      {openAccordions.has(f.id) ?
                <ChevronDownIcon className="w-3.5 h-3.5 text-[#404040] flex-shrink-0" /> :

                <ChevronRightIcon className="w-3.5 h-3.5 text-[#404040] flex-shrink-0" />
                }
                    </button>
                    {openAccordions.has(f.id) &&
              <div className="px-6 pb-5 bg-[#080808] border-t border-[#1a1a1a]">
                        <div className="pt-4">
                          <div className="font-mono text-[9px] text-[#EAB308] tracking-widest mb-2">
                            {'// CONTRADICTION ANALYSIS'}
                          </div>
                          <p className="font-mono text-[10px] text-[#888] leading-relaxed">
                            {f.detail}
                          </p>
                        </div>
                      </div>
              }
                  </div>
            )}
              </div>
          }

            {activeTab === 'fortification' &&
          <div className="divide-y divide-[#1a1a1a]">
                <div className="px-6 py-3 bg-[#080808] flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-[9px] text-[#22C55E] tracking-widest">
                    {'// MASTER REMEDIATION CHECKLIST'}
                  </span>
                  <span className="font-mono text-[9px] text-[#333]">—</span>
                  <span className="font-mono text-[9px] text-[#333] tracking-wider">
                    ADDRESSES ALL {VULNERABILITIES.length} VULNERABILITIES + ALL{' '}
                    {FALLACIES.length} LOGICAL FALLACIES
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="font-mono text-[9px] text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 px-1.5 py-0.5">
                      {
                  FORTIFICATION.filter((f) => f.priority === 'CRITICAL').
                  length
                  }{' '}
                      CRITICAL
                    </span>
                    <span className="font-mono text-[9px] text-[#EAB308] bg-[#EAB308]/10 border border-[#EAB308]/20 px-1.5 py-0.5">
                      {
                  FORTIFICATION.filter((f) => f.priority === 'HIGH').
                  length
                  }{' '}
                      HIGH
                    </span>
                    <span className="font-mono text-[9px] text-[#3B82F6] bg-[#3B82F6]/10 border border-[#3B82F6]/20 px-1.5 py-0.5">
                      {
                  FORTIFICATION.filter((f) => f.priority === 'MODERATE').
                  length
                  }{' '}
                      MODERATE
                    </span>
                  </div>
                </div>
                {FORTIFICATION.map((f) =>
            <div key={f.step} className="bg-[#050505]">
                    <button
                onClick={() => toggleAccordion(`fort-${f.step}`)}
                className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-[#0a0a0a] transition-colors">

                      <span className="font-mono text-lg font-bold text-[#262626] flex-shrink-0 w-8">
                        {f.step}
                      </span>
                      <span
                  className={`font-mono text-[9px] font-bold px-2 py-0.5 tracking-widest flex-shrink-0 ${f.priority === 'CRITICAL' ? 'text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20' : f.priority === 'HIGH' ? 'text-[#EAB308] bg-[#EAB308]/10 border border-[#EAB308]/20' : 'text-[#3B82F6] bg-[#3B82F6]/10 border border-[#3B82F6]/20'}`}>

                        {f.priority}
                      </span>
                      <span className="font-sans text-xs text-white font-medium flex-1">
                        {f.title}
                      </span>
                      <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
                        {f.fixes.map((fix) =>
                  <span
                    key={fix}
                    className={`font-mono text-[8px] font-bold px-1.5 py-0.5 tracking-widest ${fix.startsWith('VLN') ? 'text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20' : 'text-[#EAB308] bg-[#EAB308]/10 border border-[#EAB308]/20'}`}>

                            {fix}
                          </span>
                  )}
                      </div>
                      {openAccordions.has(`fort-${f.step}`) ?
                <ChevronDownIcon className="w-3.5 h-3.5 text-[#404040] flex-shrink-0" /> :

                <ChevronRightIcon className="w-3.5 h-3.5 text-[#404040] flex-shrink-0" />
                }
                    </button>
                    {openAccordions.has(`fort-${f.step}`) &&
              <div className="px-6 pb-5 bg-[#080808] border-t border-[#1a1a1a]">
                        <div className="pt-4 space-y-4">
                          <div>
                            <div className="font-mono text-[9px] text-[#404040] tracking-widest mb-2">
                              RESOLVES
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {f.fixes.map((fix) => {
                        const isVuln = fix.startsWith('VLN');
                        const label = isVuln ?
                        VULNERABILITIES.find((v) => v.id === fix)?.
                        title :
                        FALLACIES.find((fa) => fa.id === fix)?.title;
                        return (
                          <div
                            key={fix}
                            className={`flex items-center gap-2 px-3 py-1.5 border ${isVuln ? 'border-[#EF4444]/20 bg-[#EF4444]/5' : 'border-[#EAB308]/20 bg-[#EAB308]/5'}`}>

                                    <span
                              className={`font-mono text-[8px] font-bold tracking-widest ${isVuln ? 'text-[#EF4444]' : 'text-[#EAB308]'}`}>

                                      {fix}
                                    </span>
                                    <span className="font-mono text-[9px] text-[#555]">
                                      {label ?? fix}
                                    </span>
                                  </div>);

                      })}
                            </div>
                          </div>
                          <div>
                            <div className="font-mono text-[9px] text-[#22C55E] tracking-widest mb-2">
                              {'// REWRITE INSTRUCTIONS'}
                            </div>
                            <p className="font-mono text-[10px] text-[#888] leading-relaxed">
                              {f.action}
                            </p>
                          </div>
                          <div className="flex items-center gap-6 pt-2 border-t border-[#1a1a1a]">
                            <div>
                              <span className="font-mono text-[9px] text-[#404040] tracking-widest">
                                EFFORT:{' '}
                              </span>
                              <span className="font-mono text-[9px] text-white font-bold">
                                {f.effort}
                              </span>
                            </div>
                            <div>
                              <span className="font-mono text-[9px] text-[#404040] tracking-widest">
                                IMPACT:{' '}
                              </span>
                              <span className="font-mono text-[9px] text-[#22C55E] font-bold">
                                {f.impact}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
              }
                  </div>
            )}
              </div>
          }
          </div>
        </div>
      }

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANE: Document Heatmap */}
        <div className="w-1/2 flex flex-col border-r border-[#262626]">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#262626] flex-shrink-0">
            <span className="font-mono text-[10px] text-[#666] tracking-widest">
              DOCUMENT HEATMAP
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-[#EF4444]/40 border border-[#EF4444]/60" />
                <span className="font-mono text-[9px] text-[#404040]">
                  CRITICAL
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-400/30 border border-yellow-400/50" />
                <span className="font-mono text-[9px] text-[#404040]">
                  MODERATE
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500/25 border border-green-500/40" />
                <span className="font-mono text-[9px] text-[#404040]">
                  SECURE
                </span>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 battle-log">
            <div className="font-mono text-xs leading-relaxed text-[#888]">
              {DOCUMENT_SEGMENTS.map((seg, i) => {
                if (seg.heat === 'neutral')
                return (
                  <span key={i} className="text-[#555] font-bold">
                      {seg.text}
                    </span>);

                return (
                  <span
                    key={i}
                    className={`cursor-pointer transition-all ${seg.heat === 'red' ? 'heatmap-red text-red-200' : seg.heat === 'yellow' ? 'heatmap-yellow text-yellow-200' : 'heatmap-green text-green-200'}`}
                    onClick={() =>
                    setActiveHeat(activeHeat === String(i) ? null : String(i))
                    }>

                    {seg.text}
                    {activeHeat === String(i) && seg.note &&
                    <span className="block mt-1 mb-1 px-2 py-1 bg-[#0f0f0f] border border-[#262626] text-[9px] font-mono text-[#888] not-italic">
                        ⚑ {seg.note}
                      </span>
                    }
                  </span>);

              })}
            </div>
          </div>
        </div>

        {/* RIGHT PANE */}
        <div className="w-1/2 flex flex-col">
          {/* Dual Waveform Player */}
          <div className="border-b border-[#262626] p-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] text-[#666] tracking-widest">
                AUDIO ANALYSIS
              </span>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-2 px-3 py-1.5 border border-[#262626] text-[#666] hover:text-white hover:border-[#404040] transition-colors font-mono text-[10px]">

                {isPlaying ?
                <PauseIcon className="w-3 h-3" /> :

                <PlayIcon className="w-3 h-3" />
                }
                {isPlaying ? 'PAUSE' : 'PLAY'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <SwordIcon className="w-3 h-3 text-[#EF4444]" />
                  <span className="font-mono text-[9px] text-[#EF4444] tracking-widest">
                    AUDITOR CHANNEL
                  </span>
                </div>
                <div className="flex items-end gap-0.5 h-12 bg-[#0a0a0a] border border-[#262626] px-2 py-1">
                  {Array.from({
                    length: 40
                  }).map((_, i) =>
                  <WaveformBar key={i} color="#EF4444" delay={i * 30} />
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldIcon className="w-3 h-3 text-[#3B82F6]" />
                  <span className="font-mono text-[9px] text-[#3B82F6] tracking-widest">
                    OPTIMIST CHANNEL
                  </span>
                </div>
                <div className="flex items-end gap-0.5 h-12 bg-[#0a0a0a] border border-[#262626] px-2 py-1">
                  {Array.from({
                    length: 40
                  }).map((_, i) =>
                  <WaveformBar key={i} color="#3B82F6" delay={i * 25} />
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3 w-full h-1 bg-[#1a1a1a] relative">
              <div
                className="h-full bg-[#404040]"
                style={{
                  width: '35%'
                }} />

              <div
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white border border-[#262626]"
                style={{
                  left: '35%'
                }} />

            </div>
            <div className="flex justify-between mt-1">
              <span className="font-mono text-[9px] text-[#404040]">
                00:01:45
              </span>
              <span className="font-mono text-[9px] text-[#404040]">
                00:05:00
              </span>
            </div>
          </div>

          {/* Battle Log */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-[#262626] flex-shrink-0">
              <TerminalIcon className="w-3 h-3 text-[#404040]" />
              <span className="font-mono text-[10px] text-[#666] tracking-widest">
                BATTLE LOG — LIVE TRANSCRIPT
              </span>
              <div className="ml-auto w-1.5 h-1.5 bg-[#EF4444] animate-pulse" />
            </div>
            <div
              ref={battleLogRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 battle-log">

              {BATTLE_LOG.map((entry, i) =>
              <div key={i} className="flex gap-3">
                  <span className="font-mono text-[9px] text-[#333] mt-0.5 flex-shrink-0 w-14">
                    {entry.time}
                  </span>
                  <div className="flex-1">
                    <span
                    className={`font-mono text-[9px] font-bold tracking-widest ${entry.role === 'AUDITOR' ? 'text-[#EF4444]' : entry.role === 'OPTIMIST' ? 'text-[#3B82F6]' : entry.role === 'USER' ? 'text-yellow-400' : 'text-[#555]'}`}>

                      [{entry.role}]
                    </span>
                    <p className="font-mono text-[10px] text-[#777] mt-0.5 leading-relaxed">
                      {entry.text}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Rebuttal Console */}
      <div className="border-t border-[#262626] bg-[#080808] flex-shrink-0">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[#1a1a1a]">
          <AlertTriangleIcon className="w-3 h-3 text-[#EF4444]" />
          <span className="font-mono text-[10px] text-[#666] tracking-widest">
            REBUTTAL CONSOLE
          </span>
          <span className="font-mono text-[9px] text-[#333] ml-2">
            — ARM THE OPTIMIST FOR NEXT ROUND
          </span>
        </div>
        <div className="flex gap-0">
          <textarea
            value={rebuttal}
            onChange={(e) => setRebuttal(e.target.value)}
            placeholder="Enter your defense argument to arm the Optimist AI for the next round..."
            className="flex-1 bg-transparent border-0 px-4 py-3 font-mono text-xs text-white placeholder-[#333] resize-none focus:outline-none min-h-[80px]"
            rows={3} />

          <div className="flex flex-col border-l border-[#262626]">
            <button
              className="flex-1 px-4 flex flex-col items-center justify-center gap-1 text-[#EF4444] hover:bg-[#EF4444] hover:text-white transition-colors border-b border-[#262626]"
              onClick={() => setRebuttal('')}>

              <SendIcon className="w-4 h-4" />
              <span className="font-mono text-[9px] tracking-widest">
                DEPLOY
              </span>
            </button>
            <button
              className="px-4 py-2 text-[#333] hover:text-[#666] transition-colors"
              onClick={() => setRebuttal('')}>

              <span className="font-mono text-[9px] tracking-widest">
                CLEAR
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>);

}