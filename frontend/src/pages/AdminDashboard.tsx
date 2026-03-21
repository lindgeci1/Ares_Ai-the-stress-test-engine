import { useEffect, useState } from 'react';
import {
  ActivityIcon,
  DollarSignIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  PackageIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  RefreshCwIcon } from
'lucide-react';
import { authService, Offer } from '../services/authService';
import { dataCache } from '../utils/dataCache';

const OFFERS_CACHE_KEY = 'admin:offers';
type MetricCard = {
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down' | 'neutral';
  color: string;
};
const METRICS: MetricCard[] = [
{
  label: 'TOTAL DOCUMENTS',
  value: '45,891',
  delta: '+234 today',
  trend: 'up',
  color: '#3B82F6'
},
{
  label: 'ACTIVE USERS',
  value: '12,847',
  delta: '+89 today',
  trend: 'up',
  color: '#22C55E'
},
{
  label: 'COMPUTE COST (MTD)',
  value: '$8,432.19',
  delta: '+$312 today',
  trend: 'up',
  color: '#EF4444'
},
{
  label: 'USER CHURN RATE',
  value: '2.4%',
  delta: '-0.3% vs last month',
  trend: 'down',
  color: '#EAB308'
},
{
  label: 'API CALLS (24H)',
  value: '2.1M',
  delta: '+180K vs yesterday',
  trend: 'up',
  color: '#3B82F6'
},
{
  label: 'AVG AUDIT DURATION',
  value: '4m 32s',
  delta: '-12s vs last week',
  trend: 'down',
  color: '#22C55E'
}];

const SYSTEM_ALERTS = [
{
  level: 'WARN',
  message: 'API rate limit approaching for OpenAI GPT-4 endpoint',
  time: '14:23:01'
},
{
  level: 'INFO',
  message: 'Scheduled maintenance window: Feb 29, 02:00-04:00 UTC',
  time: '09:00:00'
},
{
  level: 'CRIT',
  message:
  'User churn spike detected in EU region — 3 enterprise accounts at risk',
  time: '11:45:33'
},
{
  level: 'INFO',
  message: 'New batch processing queue deployed — 40% throughput improvement',
  time: '08:12:00'
}];

const CHURN_DATA = [
{
  month: 'AUG',
  rate: 3.8
},
{
  month: 'SEP',
  rate: 3.2
},
{
  month: 'OCT',
  rate: 2.9
},
{
  month: 'NOV',
  rate: 3.1
},
{
  month: 'DEC',
  rate: 2.7
},
{
  month: 'JAN',
  rate: 2.4
}];

export function AdminDashboard() {
  const cachedOffers = dataCache.get<Offer[]>(OFFERS_CACHE_KEY);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [offers, setOffers] = useState<Offer[]>(cachedOffers ?? []);
  const [offersLoading, setOffersLoading] = useState(!cachedOffers);
  const [reloading, setReloading] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadOffers = async (
    options: { forceRefresh?: boolean; isReload?: boolean } = {}
  ) => {
    const { forceRefresh = false, isReload = false } = options;

    if (!forceRefresh) {
      const cached = dataCache.get<Offer[]>(OFFERS_CACHE_KEY);
      if (cached) {
        setOffers(cached);
        setOffersLoading(false);
        return;
      }
    }

    if (isReload) {
      setReloading(true);
    } else {
      setOffersLoading(true);
    }

    try {
      const data = await authService.getAllOffersAdmin();
      setOffers(data);
      dataCache.set(OFFERS_CACHE_KEY, data);
    } catch (error) {
      console.error('Failed to load admin offers:', error);
    } finally {
      if (isReload) {
        setReloading(false);
      } else {
        setOffersLoading(false);
      }
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const handleReload = async () => {
    dataCache.invalidate(OFFERS_CACHE_KEY);
    await loadOffers({ forceRefresh: true, isReload: true });
  };

  const handleToggle = async (id: number) => {
    setToggling(id);
    try {
      const updated = await authService.toggleOffer(id);
      setOffers((prev) => {
        const next = prev.map((o) => (o.id === updated.id ? updated : o));
        dataCache.set(OFFERS_CACHE_KEY, next);
        return next;
      });
    } catch {
      // silently ignore
    } finally {
      setToggling(null);
    }
  };
  return (
    <div className="p-6 min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ActivityIcon className="w-4 h-4 text-[#EF4444]" />
            <h1 className="font-sans text-xl font-bold text-white tracking-wide">
              GLOBAL OPS DASHBOARD
            </h1>
            <button
              onClick={handleReload}
              disabled={offersLoading || reloading}
              className="flex items-center gap-2 font-mono text-[9px] text-[#666] tracking-widest border border-[#262626] px-3 py-2 hover:border-[#404040] hover:text-[#999] transition-colors disabled:opacity-50"
            >
              <RefreshCwIcon className={`w-3 h-3 ${reloading ? 'animate-spin' : ''}`} />
              REFRESH
            </button>
          </div>
          <p className="font-mono text-[10px] text-[#404040] tracking-widest">
            {currentTime.toISOString().replace('T', ' ').slice(0, 19)} UTC —
            OVERSEER: ADMIN_ROOT
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#EF4444]/10 border border-[#EF4444]/30">
          <div className="w-1.5 h-1.5 bg-[#EF4444] animate-pulse" />
          <span className="font-mono text-[9px] text-[#EF4444] tracking-widest">
            ALL SYSTEMS NOMINAL
          </span>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-[#262626] mb-6">
        {METRICS.map((m, i) =>
        <div key={i} className="bg-[#0a0a0a] p-4">
            <div className="font-mono text-[9px] text-[#404040] tracking-widest mb-2">
              {m.label}
            </div>
            <div
            className="font-mono text-2xl font-bold mb-1"
            style={{
              color: m.color
            }}>

              {m.value}
            </div>
            <div className="flex items-center gap-1">
              {m.trend === 'up' ?
            <TrendingUpIcon className="w-3 h-3 text-[#22C55E]" /> :

            <TrendingDownIcon className="w-3 h-3 text-[#EF4444]" />
            }
              <span className="font-mono text-[9px] text-[#404040]">
                {m.delta}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Churn Chart */}
        <div className="border border-[#262626] bg-[#0a0a0a]">
          <div className="px-4 py-3 border-b border-[#262626] flex items-center gap-2">
            <TrendingDownIcon className="w-3.5 h-3.5 text-[#EAB308]" />
            <span className="font-mono text-[10px] text-[#666] tracking-widest">
              USER CHURN RATE — 6 MONTH TREND
            </span>
          </div>
          <div className="p-4">
            <div className="flex items-end gap-2 h-32">
              {CHURN_DATA.map((d, i) =>
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1">

                  <div
                  className="w-full bg-[#EAB308]/30 border-t border-[#EAB308]"
                  style={{
                    height: `${d.rate / 5 * 100}%`
                  }} />

                  <span className="font-mono text-[8px] text-[#404040]">
                    {d.month}
                  </span>
                  <span className="font-mono text-[8px] text-[#EAB308]">
                    {d.rate}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Compute Cost Breakdown */}
        <div className="border border-[#262626] bg-[#0a0a0a]">
          <div className="px-4 py-3 border-b border-[#262626] flex items-center gap-2">
            <DollarSignIcon className="w-3.5 h-3.5 text-[#EF4444]" />
            <span className="font-mono text-[10px] text-[#666] tracking-widest">
              COMPUTE COST BREAKDOWN (MTD)
            </span>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-mono text-[10px] text-[#666]">
                  GPT-4 INFERENCE
                </span>
                <span className="font-mono text-[10px] text-[#EF4444]">
                  $5,891.20
                </span>
              </div>
              <div className="w-full h-1 bg-[#1a1a1a]">
                <div
                  className="h-full bg-[#EF4444]"
                  style={{
                    width: '70%'
                  }} />

              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-mono text-[10px] text-[#666]">
                  EMBEDDING MODELS
                </span>
                <span className="font-mono text-[10px] text-[#3B82F6]">
                  $1,234.50
                </span>
              </div>
              <div className="w-full h-1 bg-[#1a1a1a]">
                <div
                  className="h-full bg-[#3B82F6]"
                  style={{
                    width: '15%'
                  }} />

              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-mono text-[10px] text-[#666]">
                  STORAGE & BANDWIDTH
                </span>
                <span className="font-mono text-[10px] text-[#22C55E]">
                  $892.10
                </span>
              </div>
              <div className="w-full h-1 bg-[#1a1a1a]">
                <div
                  className="h-full bg-[#22C55E]"
                  style={{
                    width: '11%'
                  }} />

              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-mono text-[10px] text-[#666]">
                  MISC SERVICES
                </span>
                <span className="font-mono text-[10px] text-[#404040]">
                  $414.39
                </span>
              </div>
              <div className="w-full h-1 bg-[#1a1a1a]">
                <div
                  className="h-full bg-[#404040]"
                  style={{
                    width: '5%'
                  }} />

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Alerts */}
      <div className="border border-[#262626]">
        <div className="px-4 py-3 border-b border-[#262626] flex items-center gap-2">
          <AlertTriangleIcon className="w-3.5 h-3.5 text-[#EAB308]" />
          <span className="font-mono text-[10px] text-[#666] tracking-widest">
            SYSTEM ALERTS
          </span>
        </div>
        <div className="divide-y divide-[#1a1a1a]">
          {SYSTEM_ALERTS.map((alert, i) =>
          <div key={i} className="flex items-start gap-4 px-4 py-3">
              <span className="font-mono text-[9px] text-[#404040] flex-shrink-0 mt-0.5">
                {alert.time}
              </span>
              <span
              className={`font-mono text-[9px] font-bold tracking-widest flex-shrink-0 ${alert.level === 'CRIT' ? 'text-[#EF4444]' : alert.level === 'WARN' ? 'text-[#EAB308]' : 'text-[#3B82F6]'}`}>

                [{alert.level}]
              </span>
              <span className="font-mono text-[10px] text-[#666]">
                {alert.message}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── SUBSCRIPTION PACKAGES ── */}
      <div className="border border-[#262626] mt-6">
        <div className="px-4 py-3 border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageIcon className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span className="font-mono text-[10px] text-[#666] tracking-widest">
              SUBSCRIPTION PACKAGES
            </span>
          </div>
          <span className="font-mono text-[9px] text-[#404040] tracking-widest">
            TOGGLE TO SHOW / HIDE FROM USERS
          </span>
        </div>

        {offersLoading ? (
          <div className="p-6 text-center">
            <div className="w-6 h-6 border border-[#EF4444] border-t-transparent animate-spin mx-auto mb-2" />
            <p className="font-mono text-[9px] text-[#404040] tracking-widest">LOADING PACKAGES...</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1a1a1a]">
            {offers.map(offer => (
              <div key={offer.id} className="flex items-center gap-4 px-4 py-4">
                {/* Color dot + name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-2 h-2 flex-shrink-0"
                    style={{ backgroundColor: offer.color }} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[9px] text-[#404040] tracking-widest">
                        {offer.tier_label}
                      </span>
                      {offer.is_recommended && (
                        <span className="font-mono text-[8px] font-bold text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/30 px-1.5 py-0.5 tracking-widest">
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-sm font-bold text-white tracking-wide">
                      {offer.name}
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0 w-24">
                  <span
                    className="font-mono text-base font-bold"
                    style={{ color: offer.color }}>
                    {offer.price_label}
                  </span>
                  {offer.price_suffix && (
                    <span className="font-mono text-[9px] text-[#404040] ml-1">
                      {offer.price_suffix}
                    </span>
                  )}
                </div>

                {/* Features count */}
                <div className="flex-shrink-0 w-28 text-right">
                  <span className="font-mono text-[9px] text-[#404040] tracking-widest">
                    {offer.features.length} FEATURES
                  </span>
                </div>

                {/* Status + Toggle */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`font-mono text-[9px] font-bold tracking-widest ${offer.is_active ? 'text-[#22C55E]' : 'text-[#404040]'}`}>
                    {offer.is_active ? 'ACTIVE' : 'DISABLED'}
                  </span>
                  <button
                    onClick={() => handleToggle(offer.id)}
                    disabled={toggling === offer.id}
                    title={offer.is_active ? 'Disable this offer' : 'Enable this offer'}
                    className={`flex items-center transition-colors disabled:opacity-50 ${offer.is_active ? 'text-[#22C55E] hover:text-[#EF4444]' : 'text-[#404040] hover:text-[#22C55E]'}`}>
                    {toggling === offer.id ? (
                      <div className="w-5 h-5 border border-current border-t-transparent animate-spin" />
                    ) : offer.is_active ? (
                      <ToggleRightIcon className="w-6 h-6" />
                    ) : (
                      <ToggleLeftIcon className="w-6 h-6" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>);

}