/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EconomicEvent } from '../types';
import { Calendar, Globe, Star, ArrowUpRight } from 'lucide-react';

interface GiaCalendarProps {
  events: EconomicEvent[];
}

export default function GiaCalendar({ events }: GiaCalendarProps) {
  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col h-full backdrop-blur-xl shadow-2xl relative">
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-500 animate-pulse" />
          <h3 className="font-display font-semibold text-lg text-white">Live Economic Calendar</h3>
        </div>
        <span className="text-[10px] bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 font-mono text-slate-400">
          XAUUSD Impact Tracker
        </span>
      </div>

      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 flex-1">
        {events.map((event) => (
          <div
            key={event.id}
            className="bg-slate-950/40 border border-slate-900/80 p-3 rounded-xl flex items-center justify-between gap-3 hover:border-slate-800 transition"
          >
            {/* Left Info */}
            <div className="flex items-start gap-2.5 truncate">
              <div className="p-1.5 bg-slate-900 rounded border border-slate-800 text-[10px] font-mono text-amber-500 font-bold shrink-0">
                {event.currency}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-semibold text-xs text-slate-200 truncate">
                    {event.event}
                  </span>
                  {event.importance === 'High' && (
                    <span className="text-[8px] bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded px-1 font-mono uppercase font-bold">
                      HIGH
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                  <span>Time: {event.time}</span>
                  <span>•</span>
                  <span>Impact: 
                    <span className={`ml-1 font-semibold ${
                      event.impact === 'Bullish'
                        ? 'text-emerald-400'
                        : event.impact === 'Bearish'
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}>
                      {event.impact}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Metrics */}
            <div className="flex items-center gap-3 font-mono text-right shrink-0">
              <div className="text-[10px]">
                <span className="text-slate-500 text-[9px] uppercase block">forecast</span>
                <span className="text-slate-300 font-semibold">{event.forecast}</span>
              </div>
              <div className="text-[10px]">
                <span className="text-slate-500 text-[9px] uppercase block">actual</span>
                <span className={`font-semibold ${
                  event.impact === 'Bullish'
                    ? 'text-emerald-400'
                    : event.impact === 'Bearish'
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }`}>
                  {event.actual}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
