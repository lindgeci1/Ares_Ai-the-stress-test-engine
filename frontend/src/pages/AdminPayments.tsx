import { useEffect, useState } from 'react';
import { CreditCardIcon, RefreshCwIcon } from 'lucide-react';
import { authService, Payment } from '../services/authService';

export function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await authService.getAllPayments();
      setPayments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalRevenue = payments
    .filter((p) => p.status === 'succeeded')
    .reduce((sum, p) => sum + p.amount_paid, 0);

  return (
    <div className="p-6 min-h-full">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CreditCardIcon className="w-4 h-4 text-[#EF4444]" />
            <h1 className="font-sans text-xl font-bold text-white tracking-wide">
              PAYMENTS
            </h1>
          </div>
          <p className="font-mono text-[10px] text-[#404040] tracking-wider">
            ALL STRIPE TRANSACTIONS
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 font-mono text-[9px] text-[#666] tracking-widest border border-[#262626] px-3 py-2 hover:border-[#404040] hover:text-[#999] transition-colors disabled:opacity-50"
        >
          <RefreshCwIcon className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          REFRESH
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-px bg-[#262626] mb-8">
        <div className="bg-[#0a0a0a] p-4">
          <p className="font-mono text-[9px] text-[#404040] tracking-widest mb-1">TOTAL TRANSACTIONS</p>
          <p className="font-sans text-2xl font-bold text-white">{payments.length}</p>
        </div>
        <div className="bg-[#0a0a0a] p-4">
          <p className="font-mono text-[9px] text-[#404040] tracking-widest mb-1">SUCCEEDED</p>
          <p className="font-sans text-2xl font-bold text-green-400">
            {payments.filter((p) => p.status === 'succeeded').length}
          </p>
        </div>
        <div className="bg-[#0a0a0a] p-4">
          <p className="font-mono text-[9px] text-[#404040] tracking-widest mb-1">TOTAL REVENUE</p>
          <p className="font-sans text-2xl font-bold text-[#EF4444]">
            ${totalRevenue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="border border-[#262626]">
        <div className="px-4 py-3 border-b border-[#262626]">
          <span className="font-mono text-[10px] text-[#666] tracking-widest">
            TRANSACTION LOG
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-8 h-8 border border-[#EF4444] border-t-transparent animate-spin mx-auto mb-3" />
              <p className="font-mono text-[9px] text-[#404040] tracking-widest">
                LOADING TRANSACTIONS...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="font-mono text-[10px] text-[#EF4444]">{error}</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-6 text-center">
            <p className="font-mono text-[10px] text-[#333]">NO TRANSACTIONS YET</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1a1a1a]">
                  <th className="text-left font-mono text-[9px] text-[#404040] tracking-widest px-4 py-3">
                    ID
                  </th>
                  <th className="text-left font-mono text-[9px] text-[#404040] tracking-widest px-4 py-3">
                    USER
                  </th>
                  <th className="text-left font-mono text-[9px] text-[#404040] tracking-widest px-4 py-3">
                    PLAN
                  </th>
                  <th className="text-right font-mono text-[9px] text-[#404040] tracking-widest px-4 py-3">
                    AMOUNT
                  </th>
                  <th className="text-center font-mono text-[9px] text-[#404040] tracking-widest px-4 py-3">
                    STATUS
                  </th>
                  <th className="text-right font-mono text-[9px] text-[#404040] tracking-widest px-4 py-3">
                    DATE
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-[#111] last:border-0 hover:bg-[#0f0f0f] transition-colors">
                    <td className="font-mono text-[10px] text-[#404040] px-4 py-3">
                      #{p.id}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] text-[#999]">
                        {p.user?.email ?? `USER #${p.user_id}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] text-white">
                        {p.offer?.name ?? '—'}
                      </span>
                    </td>
                    <td className="font-mono text-[10px] text-white px-4 py-3 text-right">
                      ${p.amount_paid.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-mono text-[9px] font-bold tracking-widest px-2 py-0.5 ${
                          p.status === 'succeeded'
                            ? 'text-green-400 bg-green-400/10'
                            : p.status === 'pending'
                            ? 'text-yellow-400 bg-yellow-400/10'
                            : 'text-[#EF4444] bg-[#EF4444]/10'
                        }`}
                      >
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="font-mono text-[10px] text-[#666] px-4 py-3 text-right">
                      {new Date(p.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
