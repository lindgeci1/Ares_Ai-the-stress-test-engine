import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  FileTextIcon,
  ClockIcon,
  ArchiveIcon,
  ActivityIcon,
  UploadIcon,
  RefreshCwIcon } from
'lucide-react';
type AuditStatus = 'ACTIVE' | 'ARCHIVED' | 'PROCESSING';
type AuditCard = {
  id: string;
  name: string;
  status: AuditStatus;
  survivalScore: number;
  rounds: number;
  threats: number;
  date: string;
  size: string;
};
const AUDIT_CARDS: AuditCard[] = [
{
  id: 'audit-001',
  name: 'Terms_of_Service_v4.2.pdf',
  status: 'ACTIVE',
  survivalScore: 58,
  rounds: 3,
  threats: 12,
  date: '2025-01-28',
  size: '2.4 MB'
},
{
  id: 'audit-002',
  name: 'Privacy_Policy_2025.docx',
  status: 'ACTIVE',
  survivalScore: 74,
  rounds: 5,
  threats: 7,
  date: '2025-01-27',
  size: '1.1 MB'
},
{
  id: 'audit-003',
  name: 'Employment_Contract_Template.pdf',
  status: 'PROCESSING',
  survivalScore: 0,
  rounds: 0,
  threats: 0,
  date: '2025-01-28',
  size: '890 KB'
},
{
  id: 'audit-004',
  name: 'NDA_Standard_Form.pdf',
  status: 'ARCHIVED',
  survivalScore: 82,
  rounds: 8,
  threats: 4,
  date: '2025-01-20',
  size: '450 KB'
},
{
  id: 'audit-005',
  name: 'SaaS_Agreement_Enterprise.pdf',
  status: 'ARCHIVED',
  survivalScore: 31,
  rounds: 6,
  threats: 19,
  date: '2025-01-15',
  size: '3.8 MB'
},
{
  id: 'audit-006',
  name: 'Data_Processing_Agreement.pdf',
  status: 'ACTIVE',
  survivalScore: 67,
  rounds: 4,
  threats: 9,
  date: '2025-01-26',
  size: '1.7 MB'
}];

function ScoreBar({ score, status }: {score: number;status: AuditStatus;}) {
  if (status === 'PROCESSING') {
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[9px] text-[#666] tracking-widest">
            SURVIVAL SCORE
          </span>
          <span className="font-mono text-[9px] text-yellow-400">
            COMPUTING...
          </span>
        </div>
        <div className="scanning-bar h-1" />
      </div>);

  }
  const color = score < 40 ? '#EF4444' : score < 70 ? '#EAB308' : '#22C55E';
  const label = score < 40 ? 'CRITICAL' : score < 70 ? 'MODERATE' : 'RESILIENT';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[9px] text-[#666] tracking-widest">
          SURVIVAL SCORE
        </span>
        <span
          className="font-mono text-[9px] font-bold"
          style={{
            color
          }}>

          {score}% — {label}
        </span>
      </div>
      <div className="w-full h-1 bg-[#1a1a1a]">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${score}%`,
            backgroundColor: color
          }} />

      </div>
    </div>);

}
export function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filter, setFilter] = useState<'ALL' | AuditStatus>('ALL');
  const [reloading, setReloading] = useState(false);

  const handleReload = async () => {
    setReloading(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setCurrentTime(new Date());
    setReloading(false);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const filtered =
  filter === 'ALL' ?
  AUDIT_CARDS :
  AUDIT_CARDS.filter((c) => c.status === filter);
  const statusCounts = {
    ACTIVE: AUDIT_CARDS.filter((c) => c.status === 'ACTIVE').length,
    PROCESSING: AUDIT_CARDS.filter((c) => c.status === 'PROCESSING').length,
    ARCHIVED: AUDIT_CARDS.filter((c) => c.status === 'ARCHIVED').length
  };
  return (
    <div className="p-6 min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ActivityIcon className="w-4 h-4 text-[#EF4444]" />
            <h1 className="font-sans text-xl font-bold text-white tracking-wide">
              COMMAND CENTER
            </h1>
            <button
              onClick={handleReload}
              disabled={reloading}
              className="flex items-center gap-2 font-mono text-[9px] text-[#666] tracking-widest border border-[#262626] px-3 py-2 hover:border-[#404040] hover:text-[#999] transition-colors disabled:opacity-50"
            >
              <RefreshCwIcon className={`w-3 h-3 ${reloading ? 'animate-spin' : ''}`} />
              REFRESH
            </button>
          </div>
          <p className="font-mono text-[10px] text-[#404040] tracking-widest">
            {currentTime.toISOString().replace('T', ' ').slice(0, 19)} UTC —
            OPERATOR: JOHN_DOE
          </p>
        </div>
        <Link
          to="/audit/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#EF4444] text-white font-mono text-xs font-bold tracking-widest hover:bg-[#dc2626] transition-colors">

          <UploadIcon className="w-3.5 h-3.5" />
          NEW AUDIT
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-px bg-[#262626] mb-6">
        <div className="bg-[#0a0a0a] px-4 py-3">
          <div className="font-mono text-lg font-bold text-[#3B82F6]">
            {statusCounts.ACTIVE}
          </div>
          <div className="font-mono text-[9px] text-[#404040] tracking-widest">
            ACTIVE AUDITS
          </div>
        </div>
        <div className="bg-[#0a0a0a] px-4 py-3">
          <div className="font-mono text-lg font-bold text-yellow-400">
            {statusCounts.PROCESSING}
          </div>
          <div className="font-mono text-[9px] text-[#404040] tracking-widest">
            PROCESSING
          </div>
        </div>
        <div className="bg-[#0a0a0a] px-4 py-3">
          <div className="font-mono text-lg font-bold text-[#666]">
            {statusCounts.ARCHIVED}
          </div>
          <div className="font-mono text-[9px] text-[#404040] tracking-widest">
            ARCHIVED
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-0 mb-6 border-b border-[#262626]">
        {(['ALL', 'ACTIVE', 'PROCESSING', 'ARCHIVED'] as const).map((f) =>
        <button
          key={f}
          onClick={() => setFilter(f)}
          className={`px-4 py-2 font-mono text-[10px] tracking-widest transition-colors relative ${filter === f ? 'text-white' : 'text-[#404040] hover:text-[#666]'}`}>

            {f}
            {filter === f &&
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#EF4444]" />
          }
          </button>
        )}
      </div>

      {/* Audit Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((audit) =>
        <Link
          key={audit.id}
          to={`/audit/${audit.id}`}
          className="block bg-[#0a0a0a] border border-[#262626] p-4 hover:border-[#404040] transition-colors group">

            {/* Card header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileTextIcon className="w-3.5 h-3.5 text-[#404040] flex-shrink-0" />
                <span className="font-mono text-[10px] text-[#888] truncate group-hover:text-white transition-colors">
                  {audit.name}
                </span>
              </div>
              <span
              className={`ml-2 flex-shrink-0 font-mono text-[9px] font-bold px-1.5 py-0.5 tracking-widest ${audit.status === 'ACTIVE' ? 'text-[#3B82F6] bg-[#3B82F6]/10 border border-[#3B82F6]/20' : audit.status === 'PROCESSING' ? 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20' : 'text-[#404040] bg-[#1a1a1a] border border-[#262626]'}`}>

                {audit.status}
              </span>
            </div>

            {/* Score bar */}
            <div className="mb-3">
              <ScoreBar score={audit.survivalScore} status={audit.status} />
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#1a1a1a]">
              <div>
                <div className="font-mono text-[9px] text-[#404040] tracking-widest">
                  ROUNDS
                </div>
                <div className="font-mono text-xs text-white font-bold">
                  {audit.rounds}
                </div>
              </div>
              <div>
                <div className="font-mono text-[9px] text-[#404040] tracking-widest">
                  THREATS
                </div>
                <div className="font-mono text-xs text-[#EF4444] font-bold">
                  {audit.threats}
                </div>
              </div>
              <div>
                <div className="font-mono text-[9px] text-[#404040] tracking-widest">
                  SIZE
                </div>
                <div className="font-mono text-xs text-white font-bold">
                  {audit.size}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 mt-2">
              <ClockIcon className="w-2.5 h-2.5 text-[#262626]" />
              <span className="font-mono text-[9px] text-[#262626]">
                {audit.date}
              </span>
            </div>
          </Link>
        )}

        {/* Upload new */}
        <Link
          to="/audit/new"
          className="bg-[#050505] border border-dashed border-[#262626] p-4 flex flex-col items-center justify-center gap-3 hover:border-[#404040] transition-colors min-h-[160px]">

          <PlusIcon className="w-6 h-6 text-[#262626]" />
          <span className="font-mono text-[10px] text-[#404040] tracking-widest">
            UPLOAD DOCUMENT
          </span>
        </Link>
      </div>
    </div>);

}