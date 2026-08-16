/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnalystSource } from '../types';
import { Award, ShieldAlert, Sparkles, User, Landmark, HelpCircle, ArrowUpRight } from 'lucide-react';

interface GiaLeaderboardProps {
  sources: AnalystSource[];
}

export default function GiaLeaderboard({ sources }: GiaLeaderboardProps) {
  const [filterType, setFilterType] = useState<'All' | 'Institution' | 'Analyst'>('All');

  const filteredSources = sources.filter(
    (s) => filterType === 'All' || s.type === filterType
  );

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col h-full backdrop-blur-xl shadow-2xl relative">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/60 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500 animate-pulse" />
            <h3 className="font-display font-semibold text-lg text-white">Source Intelligence & Leaderboard</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamic weighting tracks analyst reliability & penalizes AI duplicate wire syndicates
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 font-mono text-xs">
          {['All', 'Institution', 'Analyst'].map((type) => (
            <button
              key={type}
              id={`filter-btn-${type}`}
              onClick={() => setFilterType(type as any)}
              className={`px-3 py-1 rounded transition-all cursor-pointer ${
                filterType === type
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {type}s
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Sources */}
      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {filteredSources.map((source, index) => {
          const successPercent = source.predictionCount > 0
            ? Math.round((source.successfulPredictions / source.predictionCount) * 100)
            : 0;

          return (
            <div
              key={source.id}
              className="bg-slate-950/60 border border-slate-850 p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700/60 transition-all duration-200"
            >
              {/* Profile & Name */}
              <div className="flex items-start gap-3 md:max-w-[45%]">
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 shrink-0 text-amber-500">
                  {source.type === 'Institution' ? (
                    <Landmark className="w-5 h-5 text-amber-500" />
                  ) : (
                    <User className="w-5 h-5 text-cyan-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold text-sm text-white">
                      {source.name}
                    </span>
                    <span className={`text-[9px] font-mono p-0.5 px-1.5 rounded-full border ${
                      source.bias === 'Bullish'
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                        : source.bias === 'Bearish'
                        ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}>
                      {source.bias} Bias
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 italic mt-1 leading-relaxed line-clamp-2">
                    &ldquo;{source.latestOpinion}&rdquo;
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-2">
                    <span>Freshness: {source.freshness}</span>
                    <span>•</span>
                    <span>Track: {source.predictionCount} predictions</span>
                  </div>
                </div>
              </div>

              {/* Accuracy & Weight metrics */}
              <div className="flex items-center gap-6 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-2.5 md:pt-0 border-slate-900">
                {/* Accuracy Gauge */}
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-mono uppercase block mb-0.5">accuracy rate</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full"
                        style={{ width: `${source.accuracyScore}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs text-amber-400 font-semibold">
                      {source.accuracyScore}%
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                    {source.successfulPredictions} / {source.predictionCount} successful
                  </span>
                </div>

                {/* Reputation Badge */}
                <div className="text-center font-mono">
                  <span className="text-[10px] text-slate-500 uppercase block mb-0.5">reputation</span>
                  <span className={`text-[10px] font-bold p-1 px-2.5 rounded-md ${
                    source.reputation === 'High'
                      ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                      : 'bg-slate-900 border border-slate-800 text-slate-400'
                  }`}>
                    {source.reputation}
                  </span>
                </div>

                {/* Dynamic Influence modifier */}
                <div className="text-right font-mono">
                  <span className="text-[10px] text-slate-500 uppercase block mb-0.5">GIA Weight</span>
                  <span className={`text-xs font-bold font-mono ${
                    source.accuracyScore >= 85 ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    x{(source.accuracyScore / 100).toFixed(2)}
                  </span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">multiplier</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
