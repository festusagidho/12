/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import { Candle } from '../types';
import { TrendingUp, Award, Layers, Compass, BarChart2 } from 'lucide-react';

interface GiaChartProps {
  candles: Candle[];
  activeTimeframe: string;
  onTimeframeChange: (tf: string) => void;
  technicalScore: number;
}

export default function GiaChart({
  candles,
  activeTimeframe,
  onTimeframeChange,
  technicalScore,
}: GiaChartProps) {
  const [showEMA, setShowEMA] = useState(true);
  const [showZones, setShowZones] = useState(true);

  // Format data for Recharts candlestick representation
  const chartData = candles.map((c) => ({
    ...c,
    // Candle body range bar data [open, close]
    body: [c.open, c.close],
    // Low-High range wick
    wick: [c.low, c.high],
    // Simple 50-period EMA simulation
    ema50: Number((c.open * 0.4 + c.close * 0.6 + (Math.random() - 0.5) * 2).toFixed(2)),
  }));

  // Identify min and max for Y-Axis padding
  const prices = candles.flatMap((c) => [c.low, c.high]);
  const minPrice = Math.min(...prices) * 0.998;
  const maxPrice = Math.max(...prices) * 1.002;

  // Custom tooltips to present SMC concepts cleanly
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as Candle;
      return (
        <div className="bg-slate-900/95 border border-slate-700/50 p-3 rounded-lg shadow-xl font-mono text-xs text-slate-200 backdrop-blur-md">
          <p className="text-amber-400 font-semibold mb-1">{data.time}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span>Open:</span> <span className="text-right text-white">${data.open}</span>
            <span>High:</span> <span className="text-right text-emerald-400">${data.high}</span>
            <span>Low:</span> <span className="text-right text-rose-400">${data.low}</span>
            <span>Close:</span> <span className="text-right text-white">${data.close}</span>
            <span>Volume:</span> <span className="text-right text-slate-400">{data.volume}</span>
          </div>
          {data.orderBlock && (
            <div className={`mt-2 p-1 px-2 rounded text-[10px] border ${
              data.orderBlock.type === 'bullish' 
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
            }`}>
              {data.orderBlock.type.toUpperCase()} ORDER BLOCK: ${data.orderBlock.level}
            </div>
          )}
          {data.fvg && (
            <div className={`mt-1 p-1 px-2 rounded text-[10px] border ${
              data.fvg.type === 'bullish' 
                ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300' 
                : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
            }`}>
              FAIR VALUE GAP: ${data.fvg.bottom} - ${data.fvg.top}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col h-full backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Visual Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-slate-800/60 pb-4 z-10">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-500" />
            <h3 className="font-display font-semibold text-lg text-white">Technical Analysis Studio</h3>
            <span className="bg-slate-800 border border-slate-700/60 text-amber-400 font-mono text-[10px] px-2 py-0.5 rounded-full">
              SMC & ICT Engine Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-detecting Liquidity Zones, Order Blocks, and Fair Value Gaps
          </p>
        </div>

        {/* Timeframe Selectors */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-slate-800/60 font-mono text-xs">
          {['1M', 'Weekly', 'Daily', '4H', '1H'].map((tf) => (
            <button
              key={tf}
              id={`tf-btn-${tf}`}
              onClick={() => onTimeframeChange(tf)}
              className={`px-2.5 py-1 rounded transition-all duration-200 cursor-pointer ${
                activeTimeframe === tf
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Control Toggles */}
      <div className="flex items-center gap-4 text-xs font-mono mb-4 text-slate-400 z-10">
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition">
          <input
            type="checkbox"
            checked={showEMA}
            onChange={() => setShowEMA(!showEMA)}
            className="rounded border-slate-700 text-amber-500 focus:ring-0 focus:ring-offset-0 bg-slate-900"
          />
          <span>EMA (50)</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition">
          <input
            type="checkbox"
            checked={showZones}
            onChange={() => setShowZones(!showZones)}
            className="rounded border-slate-700 text-amber-500 focus:ring-0 focus:ring-offset-0 bg-slate-900"
          />
          <span>SMC Blocks & FVGs</span>
        </label>

        <div className="ml-auto flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300">GIA Tech Index:</span>
          <span className={`font-bold ${technicalScore > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {technicalScore}% Bullish Bias
          </span>
        </div>
      </div>

      {/* Main Candlestick Composed Chart */}
      <div className="flex-1 min-h-[300px] w-full z-10">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="time"
              stroke="#475569"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
            />
            <YAxis
              domain={[minPrice, maxPrice]}
              stroke="#475569"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
              orientation="right"
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Reference Areas simulating Order Blocks & FVGs */}
            {showZones &&
              chartData.map((d, index) => {
                if (d.orderBlock && index > 15 && index < 25) {
                  return (
                    <React.Fragment key={`ob-${index}`}>
                      <ReferenceArea
                        {...({
                          y1: d.orderBlock.level - d.orderBlock.size,
                          y2: d.orderBlock.level + d.orderBlock.size,
                          fill: d.orderBlock.type === 'bullish' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                          stroke: d.orderBlock.type === 'bullish' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                          strokeWidth: 1,
                          strokeDasharray: "3 3"
                        } as any)}
                      />
                    </React.Fragment>
                  );
                }
                if (d.fvg && index > 10 && index < 15) {
                  return (
                    <React.Fragment key={`fvg-${index}`}>
                      <ReferenceArea
                        {...({
                          y1: d.fvg.bottom,
                          y2: d.fvg.top,
                          fill: "rgba(6, 182, 212, 0.07)",
                          stroke: "rgba(6, 182, 212, 0.2)",
                          strokeWidth: 1
                        } as any)}
                      />
                    </React.Fragment>
                  );
                }
                return null;
              })}

            {/* Draw Candlestick Wicks (High / Low line) */}
            <Bar
              dataKey="wick"
              fill="#94a3b8"
              opacity={0.4}
              maxBarSize={2}
              radius={[0, 0, 0, 0]}
            />

            {/* Draw Candlestick Bodies (Open vs Close) */}
            <Bar
              dataKey="body"
              radius={1}
              maxBarSize={8}
              shape={(props: any) => {
                const { x, y, width, height, payload } = props;
                const isBullish = payload.close >= payload.open;
                const fill = isBullish ? '#10b981' : '#f43f5e';
                const stroke = isBullish ? '#059669' : '#e11d48';

                // Guard against inverted heights or zero height
                const rectY = height < 0 ? y + height : y;
                const rectHeight = Math.max(Math.abs(height), 1.5);

                return (
                  <rect
                    x={x}
                    y={rectY}
                    width={width}
                    height={rectHeight}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={1}
                  />
                );
              }}
            />

            {/* EMA Trendline */}
            {showEMA && (
              <Line
                type="monotone"
                dataKey="ema50"
                stroke="#f59e0b"
                strokeWidth={1.5}
                dot={false}
                opacity={0.8}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* SMC Annotations Legenda */}
      <div className="flex flex-wrap items-center gap-4 mt-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-1.5 bg-emerald-500 rounded-sm" />
          <span>Bullish Candle</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-1.5 bg-rose-500 rounded-sm" />
          <span>Bearish Candle</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-2 bg-emerald-500/10 border border-emerald-500/30 border-dashed rounded-sm" />
          <span>Bullish Order Block (OB)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-2 bg-cyan-500/10 border border-cyan-500/20 rounded-sm" />
          <span>Fair Value Gap (FVG) Zone</span>
        </div>
      </div>
    </div>
  );
}
