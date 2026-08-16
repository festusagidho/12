/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TradeSetup } from '../types';
import { ShieldCheck, Target, TrendingUp, AlertTriangle, ArrowRight, Star, Copy, Check, RefreshCw, Zap } from 'lucide-react';

interface GiaTradeSetupProps {
  setup: TradeSetup;
  alternativeSetups?: TradeSetup[];
  currentPrice?: number;
  onRefreshEntries?: (reason?: string) => void;
  isScanning?: boolean;
}

export default function GiaTradeSetup({
  setup,
  alternativeSetups = [],
  currentPrice,
  onRefreshEntries,
  isScanning = false,
}: GiaTradeSetupProps) {
  const [copied, setCopied] = React.useState(false);
  const [activeSetupIndex, setActiveSetupIndex] = React.useState(0);
  const [directionFilter, setDirectionFilter] = React.useState<'ALL' | 'BUY' | 'SELL'>('ALL');

  const allSetups = React.useMemo(() => {
    const list = [];
    if (setup && typeof setup === 'object') list.push(setup);
    if (Array.isArray(alternativeSetups)) {
      list.push(...alternativeSetups.filter((s) => s && typeof s === 'object'));
    }
    return list;
  }, [setup, alternativeSetups]);

  // Current live market price reference
  const livePriceNum = currentPrice || setup?.entryPrice || 4389.0;

  // Filter out old positions where TP1 has already been achieved
  const activeSetups = React.useMemo(() => {
    return allSetups.filter((s) => {
      if (!s || typeof s.takeProfit1 !== 'number') return true;
      const isBuy = s.direction === 'BUY';
      const tp1Achieved = isBuy ? livePriceNum >= s.takeProfit1 : livePriceNum <= s.takeProfit1;
      return !tp1Achieved; // Keep only active setups where TP1 is NOT yet reached
    });
  }, [allSetups, livePriceNum]);

  // Filter by user direction preference if selected
  const filteredSetups = React.useMemo(() => {
    if (directionFilter === 'ALL') return activeSetups;
    return activeSetups.filter((s) => (s.direction || 'BUY') === directionFilter);
  }, [activeSetups, directionFilter]);

  const removedCount = allSetups.length - activeSetups.length;

  // Keep active index in bounds
  const currentSetup = filteredSetups[activeSetupIndex] || filteredSetups[0] || activeSetups[0] || setup || {};

  const isBuy = (currentSetup.direction || 'BUY') === 'BUY';
  const entryPrice = currentSetup.entryPrice ?? livePriceNum;
  const stopLoss = currentSetup.stopLoss ?? Number((entryPrice * (isBuy ? 0.995 : 1.005)).toFixed(2));
  const takeProfit1 = currentSetup.takeProfit1 ?? Number((entryPrice * (isBuy ? 1.005 : 0.995)).toFixed(2));
  const takeProfit2 = currentSetup.takeProfit2 ?? Number((entryPrice * (isBuy ? 1.01 : 0.990)).toFixed(2));
  const takeProfit3 = currentSetup.takeProfit3 ?? Number((entryPrice * (isBuy ? 1.015 : 0.985)).toFixed(2));
  const riskReward = currentSetup.riskRewardRatio ?? 2.85;
  const tradeGrade = currentSetup.tradeGrade || 'A+';
  const entryZone = currentSetup.entryZone || `${entryPrice} - ${entryPrice}`;

  const copyTicket = () => {
    const text = `
GIA QUANT TICKET: [${currentSetup.title || currentSetup.setupType || 'Trade Setup'} - ${currentSetup.direction || 'BUY'} - GRADE ${tradeGrade}]
----------------------------------------
Direction:     ${currentSetup.direction || 'BUY'}
Entry Zone:    ${entryZone}
Entry Price:   $${entryPrice}
Stop Loss:     $${stopLoss}
Take Profit 1: $${takeProfit1}
Take Profit 2: $${takeProfit2}
Take Profit 3: $${takeProfit3}
Risk Reward:   1:${riskReward}
Confidence:    ${currentSetup.confidence || 80}%
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If ALL previous setups hit TP1 and have been removed
  if (activeSetups.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border border-amber-500/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-full shadow-2xl relative overflow-hidden">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3">
          <Zap className="w-6 h-6 text-amber-400 animate-bounce" />
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2 py-0.5 rounded font-mono font-bold">
            TP1 Achieved
          </span>
          <h3 className="font-display font-bold text-lg text-white">Old Positions Completed</h3>
        </div>
        <p className="text-xs text-slate-300 max-w-sm mb-4 leading-relaxed font-mono">
          Live market price (${livePriceNum.toFixed(2)}) reached TP1 profit targets across previous setups. Old completed positions have been automatically removed.
        </p>
        <button
          onClick={() =>
            onRefreshEntries &&
            onRefreshEntries(
              `All previous TP1 targets achieved at current live price $${livePriceNum.toFixed(
                2
              )}. Calculate brand new entry zones, order blocks, stop loss, and TP levels.`
            )
          }
          disabled={isScanning}
          className="px-5 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 font-display font-bold text-xs rounded-xl transition-all shadow-lg hover:shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
        >
          {isScanning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Calculating Fresh Order Blocks...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>Generate New Active Entries</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border border-amber-500/30 rounded-2xl p-5 flex flex-col h-full shadow-2xl relative overflow-hidden">
      {/* Premium Badge Glow */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/60 pb-3.5 mb-3 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-500 animate-pulse" />
            <h3 className="font-display font-semibold text-lg text-white">
              High-Grade Trade Setups ({activeSetups.length} Active)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Automated quant-grade trading tickets tailored to live price action</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Trade Grade Badge */}
          <div className="bg-amber-500 text-slate-950 font-display font-bold text-sm px-3 py-1 rounded-lg shadow flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-slate-950" />
            <span>GRADE {tradeGrade}</span>
          </div>

          <button
            onClick={copyTicket}
            className="p-2 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            title="Copy Trade Ticket"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* RE-ANALYZE / FRESH ENTRIES PROMPT BANNER & QUICK ACTIONS */}
      <div className="mb-4 bg-amber-950/30 border border-amber-500/40 p-3 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-inner">
        <div className="flex items-start gap-2.5">
          <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-300 font-display">
                {removedCount > 0 ? `${removedCount} Old Position(s) Removed (TP1 Hit)` : 'Request Specific Market Setups?'}
              </span>
              {removedCount > 0 && (
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
                  TP1 Cleared
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Scan order blocks or request dedicated institutional short/sell opportunities centered at ${livePriceNum.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-stretch md:self-auto justify-end">
          <button
            onClick={() =>
              onRefreshEntries &&
              onRefreshEntries(
                `Generate high-probability institutional SELL / SHORT order block setups, premium supply zone rejections, and resistance sweep short targets centered at current live price $${livePriceNum.toFixed(
                  2
                )}.`
              )
            }
            disabled={isScanning}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 text-white text-xs font-bold font-display rounded-lg transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            title="Scan specifically for Sell / Short setups"
          >
            {isScanning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <TrendingUp className="w-3.5 h-3.5 rotate-180 text-rose-200" />
            )}
            <span>Generate SELL Setups</span>
          </button>

          <button
            onClick={() =>
              onRefreshEntries &&
              onRefreshEntries(
                `Generate fresh entry zones, new order blocks, stop loss, and TP levels centered at current market price $${livePriceNum.toFixed(
                  2
                )}.`
              )
            }
            disabled={isScanning}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 text-xs font-bold font-display rounded-lg transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            {isScanning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Refresh All Entries</span>
          </button>
        </div>
      </div>

      {/* Direction Filter Bar & Multiple Strategy Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
        {/* Strategy Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {filteredSetups.map((s, idx) => {
            const isSelected = idx === activeSetupIndex;
            const label = s.title || s.setupType || (idx === 0 ? 'Primary Scalp' : idx === 1 ? 'Macro Swing' : 'Breakout Sweep');
            const setupDir = s.direction || 'BUY';
            const isSellDir = setupDir === 'SELL';
            return (
              <button
                key={idx}
                onClick={() => setActiveSetupIndex(idx)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  isSelected
                    ? isSellDir
                      ? 'bg-rose-500 text-white font-bold shadow-md'
                      : 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${isSellDir ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                <span>{label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    isSelected
                      ? 'bg-slate-950/30 text-current'
                      : isSellDir
                      ? 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {setupDir}
                </span>
              </button>
            );
          })}
        </div>

        {/* Direction Filter Toggle (ALL / BUY / SELL) */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => { setDirectionFilter('ALL'); setActiveSetupIndex(0); }}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition cursor-pointer ${
              directionFilter === 'ALL'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ALL ({activeSetups.length})
          </button>
          <button
            onClick={() => { setDirectionFilter('BUY'); setActiveSetupIndex(0); }}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition cursor-pointer flex items-center gap-1 ${
              directionFilter === 'BUY'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-emerald-400 hover:bg-emerald-950/40'
            }`}
          >
            <span>BUY</span>
            <span className="text-[9px] opacity-80">
              ({activeSetups.filter((s) => s.direction === 'BUY').length})
            </span>
          </button>
          <button
            onClick={() => { setDirectionFilter('SELL'); setActiveSetupIndex(0); }}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition cursor-pointer flex items-center gap-1 ${
              directionFilter === 'SELL'
                ? 'bg-rose-500 text-white'
                : 'text-rose-400 hover:bg-rose-950/40'
            }`}
          >
            <span>SELL</span>
            <span className="text-[9px] opacity-80">
              ({activeSetups.filter((s) => s.direction === 'SELL').length})
            </span>
          </button>
        </div>
      </div>

      {/* Direction & Main Prices */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div className={`p-3 rounded-xl border ${
          isBuy
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
        }`}>
          <span className="text-[10px] font-mono uppercase block text-slate-400">Order Action</span>
          <span className="font-display text-xl font-bold block mt-0.5">{currentSetup.direction || 'BUY'} LIMIT</span>
          <span className="text-[10px] font-mono text-slate-300">Target price hit optimal fill</span>
        </div>

        <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-xl">
          <span className="text-[10px] font-mono uppercase block text-slate-400">Entry Trigger Zone</span>
          <span className="font-display text-base font-bold text-white block mt-0.5">{entryZone}</span>
          <span className="text-[10px] font-mono text-amber-500">Optimal: ${entryPrice}</span>
        </div>

        <div className="bg-slate-950/60 border border-rose-500/20 p-3 rounded-xl">
          <span className="text-[10px] font-mono uppercase block text-rose-300">Invalidation Stop Loss</span>
          <span className="font-display text-base font-bold text-rose-400 block mt-0.5">${stopLoss}</span>
          <span className="text-[10px] font-mono text-slate-500">
            Risk amount: ${Math.abs(Number((entryPrice - stopLoss).toFixed(2)))}
          </span>
        </div>

        <div className="bg-slate-950/60 border border-emerald-500/20 p-3 rounded-xl">
          <span className="text-[10px] font-mono uppercase block text-emerald-300">Take Profit Target 3</span>
          <span className="font-display text-base font-bold text-emerald-400 block mt-0.5">${takeProfit3}</span>
          <span className="text-[10px] font-mono text-slate-500">R:R Ratio: 1:{riskReward}</span>
        </div>
      </div>

      {/* Targets and RR Progress */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-5 flex-1">
        {/* Tiered Targets */}
        <div className="md:col-span-5 bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl flex flex-col justify-between">
          <span className="text-xs font-mono text-slate-400 uppercase block border-b border-slate-900 pb-1.5 mb-2.5">
            Tiered Take Profits (TP)
          </span>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">TP 1 (Scalp Takeout):</span>
              <span className="text-emerald-400 font-bold">${takeProfit1}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">TP 2 (Runner Security):</span>
              <span className="text-emerald-400 font-bold">${takeProfit2}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono border-t border-slate-900/60 pt-2">
              <span className="text-slate-400 font-semibold">TP 3 (Swing Max Outflow):</span>
              <span className="text-emerald-300 font-bold">${takeProfit3}</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-850 rounded-lg p-2 mt-3 text-[10px] text-slate-400 leading-relaxed font-mono">
            💡 GIA Rule: Close 50% at TP1 and slide Stop Loss to entry price to secure risk-free exposure.
          </div>
        </div>

        {/* Multi-agent Confirmations Matrix */}
        <div className="md:col-span-7 space-y-2 max-h-[160px] overflow-y-auto pr-1">
          <span className="text-xs font-mono text-slate-400 uppercase block">Convergence Confirmations</span>
          <div className="grid grid-cols-1 gap-1.5 text-xs font-mono">
            {currentSetup.technicalConfirmation && currentSetup.technicalConfirmation.map((t, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-slate-300">
                <span className="text-emerald-400 mt-0.5">✔</span>
                <span><strong className="text-slate-400 text-[10px]">TECH:</strong> {t}</span>
              </div>
            ))}
            {currentSetup.fundamentalConfirmation && currentSetup.fundamentalConfirmation.map((f, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-slate-300">
                <span className="text-emerald-400 mt-0.5">✔</span>
                <span><strong className="text-slate-400 text-[10px]">FUND:</strong> {f}</span>
              </div>
            ))}
            {currentSetup.macroConfirmation && currentSetup.macroConfirmation.map((m, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-slate-300">
                <span className="text-emerald-400 mt-0.5">✔</span>
                <span><strong className="text-slate-400 text-[10px]">MACRO:</strong> {m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risks & Footnote Warning */}
      <div className="bg-rose-950/15 border border-rose-500/10 p-3 rounded-xl flex items-start gap-2 text-xs text-rose-300/90 leading-relaxed font-mono">
        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-rose-400">CRITICAL RISK FACTOR WARNING:</span>{' '}
          {currentSetup.riskFactors ? currentSetup.riskFactors.join('. ') : 'Maintain strict risk management on all entries.'}
          <div className="text-[10px] text-slate-500 mt-1 italic">
            Disclaimer: All signals are probability forecasts derived from mathematical models. Keep exposure below 1% of equity.
          </div>
        </div>
      </div>
    </div>
  );
}

