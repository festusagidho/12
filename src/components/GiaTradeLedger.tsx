import React, { useEffect, useState, useMemo } from 'react';
import {
  Database,
  CheckCircle2,
  XCircle,
  Target,
  RefreshCw,
  Clock,
  TrendingUp,
  TrendingDown,
  Globe,
  Server,
  Zap,
  Filter,
  Trash2,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { RecordedTrade, TradeHistorySummary } from '../types';

interface GiaTradeLedgerProps {
  currentPrice: number;
  activeSymbol: string;
  onRefreshTrigger?: () => void;
}

export function GiaTradeLedger({ currentPrice, activeSymbol, onRefreshTrigger }: GiaTradeLedgerProps) {
  const [trades, setTrades] = useState<RecordedTrade[]>([]);
  const [summary, setSummary] = useState<TradeHistorySummary>({
    totalTrades: 0,
    activeCount: 0,
    tpHitCount: 0,
    slHitCount: 0,
    winRate: 100,
    totalPnlPoints: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<string>('');
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'TP_HITS' | 'SL_HITS'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTrade, setSelectedTrade] = useState<RecordedTrade | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Fetch central history from server
  const fetchLedger = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/trade-history?price=${currentPrice}&symbol=${activeSymbol}`);
      if (!res.ok) {
        console.warn(`Trade history endpoint returned status ${res.status}`);
        return;
      }
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Trade history endpoint did not return JSON format');
        return;
      }
      const data = await res.json();
      setTrades(data.trades || []);
      setSummary(
        data.summary || {
          totalTrades: 0,
          activeCount: 0,
          tpHitCount: 0,
          slHitCount: 0,
          winRate: 100,
          totalPnlPoints: 0
        }
      );
      setLastSynced(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error fetching trade ledger:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [currentPrice, activeSymbol]);

  // Simulate price move or force TP/SL status update on backend
  const updateTradeOutcome = async (tradeId: string, status: RecordedTrade['status'], closePrice: number) => {
    try {
      setIsLoading(true);
      const trade = trades.find((t) => t.id === tradeId);
      if (!trade) return;

      const isBuy = trade.direction === 'BUY';
      let pnl = 0;
      if (status.startsWith('TP')) {
        pnl = isBuy ? closePrice - trade.entryPrice : trade.entryPrice - closePrice;
      } else if (status === 'SL_HIT') {
        pnl = isBuy ? closePrice - trade.entryPrice : trade.entryPrice - closePrice;
      }

      await fetch('/api/trade-history/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeId,
          status,
          closePrice,
          pnlPoints: Number(pnl.toFixed(2))
        })
      });
      await fetchLedger();
    } catch (err) {
      console.error('Error updating trade status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset database history
  const handleResetHistory = async () => {
    if (!window.confirm('Reset central trade ledger to baseline history? This updates all devices connected to the server.')) {
      return;
    }
    try {
      setIsLoading(true);
      await fetch('/api/trade-history/clear', { method: 'POST' });
      await fetchLedger();
    } catch (err) {
      console.error('Error resetting history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered trade list
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      // Status filter
      if (filter === 'ACTIVE' && t.status !== 'ACTIVE') return false;
      if (filter === 'TP_HITS' && !t.status.startsWith('TP')) return false;
      if (filter === 'SL_HITS' && t.status !== 'SL_HIT') return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.symbol.toLowerCase().includes(q) ||
          t.direction.toLowerCase().includes(q) ||
          t.status.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [trades, filter, searchQuery]);

  // Breakdown counts
  const tp1Count = useMemo(() => trades.filter((t) => t.status === 'TP1_HIT').length, [trades]);
  const tp2Count = useMemo(() => trades.filter((t) => t.status === 'TP2_HIT').length, [trades]);
  const tp3Count = useMemo(() => trades.filter((t) => t.status === 'TP3_HIT').length, [trades]);

  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 lg:p-6 shadow-2xl relative overflow-hidden transition-all">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      {/* HEADER BAR */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group ${
          isExpanded ? 'border-b border-slate-800/80 pb-5 mb-6' : ''
        }`}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 group-hover:bg-amber-500/20 transition">
              <Database className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display font-bold text-xl text-white tracking-tight">
                  Central Multi-Device Trade Ledger
                </h2>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  PERSISTENT BACKEND SYNCED
                </span>
                {!isExpanded && (
                  <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold">
                    {summary.totalTrades} Recorded ({summary.activeCount} Active | {summary.winRate}% Win Rate)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized express backend storing all generated trade setups, TP hits, and SL hits across all devices.
              </p>
            </div>
          </div>
        </div>

        {/* Sync Controls & Expand Toggle */}
        <div className="flex items-center gap-3 self-start md:self-auto" onClick={(e) => e.stopPropagation()}>
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-500 font-mono block">Last Server Sync</span>
            <span className="text-xs text-slate-300 font-mono font-bold">{lastSynced || 'Syncing...'}</span>
          </div>

          <button
            onClick={fetchLedger}
            disabled={isLoading}
            className="p-2 bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-amber-400 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
            title="Refresh Server History"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {isExpanded && (
            <button
              onClick={handleResetHistory}
              disabled={isLoading}
              className="p-2 bg-rose-950/20 border border-rose-500/20 hover:border-rose-500/50 text-rose-400 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              title="Reset History"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-amber-300 rounded-xl text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 shadow"
          >
            <span className="hidden sm:inline">{isExpanded ? 'Collapse Ledger' : 'Expand Ledger'}</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-amber-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-amber-400 group-hover:translate-y-0.5 transition-transform" />
            )}
          </button>
        </div>
      </div>

      {/* EXPANDABLE BODY CONTENT */}
      {isExpanded && (
        <>
          {/* KPI SUMMARY METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-6">
        {/* Card 1: Total Recorded */}
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Total Recorded</span>
            <Server className="w-4 h-4 text-slate-500" />
          </div>
          <div className="font-display text-2xl font-bold text-white">{summary.totalTrades}</div>
          <span className="text-[10px] font-mono text-slate-500 mt-1">
            {summary.activeCount} Active | {summary.totalTrades - summary.activeCount} Closed
          </span>
        </div>

        {/* Card 2: Take Profit Hits */}
        <div className="bg-emerald-950/20 border border-emerald-500/20 p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Total TP Hits</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-display text-2xl font-bold text-emerald-400">{summary.tpHitCount}</div>
          <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-300/80 mt-1">
            <span>TP1: {tp1Count}</span>
            <span>•</span>
            <span>TP2: {tp2Count}</span>
            <span>•</span>
            <span>TP3: {tp3Count}</span>
          </div>
        </div>

        {/* Card 3: Stop Loss Hits */}
        <div className="bg-rose-950/20 border border-rose-500/20 p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-400 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Total SL Hits</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="font-display text-2xl font-bold text-rose-400">{summary.slHitCount}</div>
          <span className="text-[10px] font-mono text-rose-400/70 mt-1">
            Strict risk cutoff enforced
          </span>
        </div>

        {/* Card 4: Model Win Rate */}
        <div className="bg-amber-950/20 border border-amber-500/20 p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Quant Win Rate</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-display text-2xl font-bold text-amber-300">{summary.winRate}%</div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-amber-400 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, summary.winRate))}%` }}
            />
          </div>
        </div>

        {/* Card 5: Total PnL Points */}
        <div className="col-span-2 md:col-span-1 bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Realized Points PnL</span>
            {summary.totalPnlPoints >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div
            className={`font-display text-2xl font-bold ${
              summary.totalPnlPoints >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {summary.totalPnlPoints >= 0 ? '+' : ''}
            {summary.totalPnlPoints}
          </div>
          <span className="text-[10px] font-mono text-slate-500 mt-1">
            Cumulative net gain across setups
          </span>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 bg-slate-900/80 p-2 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none p-1">
          {[
            { id: 'ALL', label: `All Trades (${trades.length})` },
            { id: 'ACTIVE', label: `Active (${summary.activeCount})` },
            { id: 'TP_HITS', label: `TP Hits (${summary.tpHitCount})` },
            { id: 'SL_HITS', label: `SL Hits (${summary.slHitCount})` }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                filter === item.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search setup, symbol, status..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/80"
          />
        </div>
      </div>

      {/* TRADE HISTORY TABLE / CARDS */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/60">
        {filteredTrades.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-mono text-xs">
            No trade history records match the selected filter.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/40 text-[10px] font-mono uppercase text-slate-400">
                <th className="p-3 pl-4">Timestamp</th>
                <th className="p-3">Asset</th>
                <th className="p-3">Setup Strategy</th>
                <th className="p-3">Direction</th>
                <th className="p-3">Entry Zone / Price</th>
                <th className="p-3">Stop Loss</th>
                <th className="p-3">TP Levels (1/2/3)</th>
                <th className="p-3">Status Outcome</th>
                <th className="p-3 pr-4 text-right">PnL Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-xs">
              {filteredTrades.map((t) => {
                const isBuy = t.direction === 'BUY';
                const isTp = t.status.startsWith('TP');
                const isSl = t.status === 'SL_HIT';
                const isActive = t.status === 'ACTIVE';

                return (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTrade(t)}
                    className="hover:bg-slate-900/50 transition cursor-pointer group"
                  >
                    <td className="p-3 pl-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(t.timestamp).toLocaleDateString()}{' '}
                      <span className="text-slate-500">{new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>

                    <td className="p-3 font-semibold text-white whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <span className="text-amber-400">{t.symbol.includes('Volatility') ? '⚡' : '🏆'}</span>
                        <span>{t.symbol}</span>
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">
                          {t.tradeGrade}
                        </span>
                        <span className="font-semibold text-slate-200">{t.title}</span>
                      </div>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          isBuy
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {t.direction}
                      </span>
                    </td>

                    <td className="p-3 font-mono">
                      <div className="text-white font-bold">${t.entryPrice}</div>
                      <div className="text-[10px] text-slate-500">{t.entryZone}</div>
                    </td>

                    <td className="p-3 font-mono text-rose-400">${t.stopLoss}</td>

                    <td className="p-3 font-mono text-[11px]">
                      <div className="flex items-center gap-1">
                        <span className="text-emerald-400 font-semibold">${t.takeProfit1}</span>
                        <span className="text-slate-600">/</span>
                        <span className="text-emerald-300 font-semibold">${t.takeProfit2}</span>
                        <span className="text-slate-600">/</span>
                        <span className="text-emerald-200 font-semibold">${t.takeProfit3}</span>
                      </div>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {isActive && (
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          ACTIVE
                        </span>
                      )}
                      {isTp && (
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          {t.status.replace('_', ' ')}
                        </span>
                      )}
                      {isSl && (
                        <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 w-fit">
                          <XCircle className="w-3 h-3" />
                          SL HIT
                        </span>
                      )}
                    </td>

                    <td className="p-3 pr-4 text-right font-mono font-bold text-sm whitespace-nowrap">
                      {isActive ? (
                        <span className="text-slate-500 font-normal text-[11px]">Pending</span>
                      ) : (
                        <span className={isTp ? 'text-emerald-400' : 'text-rose-400'}>
                          {(t.pnlPoints || 0) >= 0 ? '+' : ''}
                          {t.pnlPoints} pts
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* TRADE DETAILS MODAL */}
      {selectedTrade && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedTrade(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-950/50 hover:bg-slate-800 transition cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs px-2.5 py-0.5 rounded font-mono font-bold">
                GRADE {selectedTrade.tradeGrade}
              </span>
              <span className="text-xs font-mono text-slate-400">{selectedTrade.symbol}</span>
            </div>

            <h3 className="font-display font-bold text-xl text-white mb-1">{selectedTrade.title}</h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">
              Ticket ID: {selectedTrade.id} • Created: {new Date(selectedTrade.timestamp).toLocaleString()}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-5 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Direction</span>
                <span className="font-display font-bold text-sm text-emerald-400">{selectedTrade.direction} LIMIT</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Risk / Reward</span>
                <span className="font-display font-bold text-sm text-amber-400">1:{selectedTrade.riskRewardRatio}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Entry Price</span>
                <span className="font-display font-bold text-sm text-white">${selectedTrade.entryPrice}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Stop Loss</span>
                <span className="font-display font-bold text-sm text-rose-400">${selectedTrade.stopLoss}</span>
              </div>
            </div>

            <div className="space-y-2 mb-5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Take Profit 1:</span>
                <span className="text-emerald-400 font-bold">${selectedTrade.takeProfit1}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Take Profit 2:</span>
                <span className="text-emerald-400 font-bold">${selectedTrade.takeProfit2}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Take Profit 3:</span>
                <span className="text-emerald-400 font-bold">${selectedTrade.takeProfit3}</span>
              </div>
            </div>

            {/* Quick Trigger Buttons if trade is active */}
            {selectedTrade.status === 'ACTIVE' && (
              <div className="border-t border-slate-800 pt-4 mb-4">
                <span className="text-[10px] text-slate-400 font-mono uppercase block mb-2">
                  Simulate Live Price Hit on Backend:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      updateTradeOutcome(selectedTrade.id, 'TP1_HIT', selectedTrade.takeProfit1);
                      setSelectedTrade(null);
                    }}
                    className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Trigger TP1 Hit (${selectedTrade.takeProfit1})
                  </button>
                  <button
                    onClick={() => {
                      updateTradeOutcome(selectedTrade.id, 'SL_HIT', selectedTrade.stopLoss);
                      setSelectedTrade(null);
                    }}
                    className="p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Trigger SL Hit (${selectedTrade.stopLoss})
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedTrade(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
