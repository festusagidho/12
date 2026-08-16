import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  Sparkles,
  Briefcase,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Target,
  Zap,
  Clock,
  Radio,
  Flame,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Globe
} from 'lucide-react';
import { NfpPrediction, MacroNewsEventPrediction, MacroEventType } from '../types';
import { useWorldClock } from '../hooks/useWorldClock';

interface GiaNfpPredictorProps {
  prediction?: NfpPrediction;
  macroPredictions?: MacroNewsEventPrediction[];
  nextUpcomingEvent?: MacroEventType;
  assetSymbol: 'frxXAUUSD' | '1HZ10V';
  onRefreshEvent?: (eventPrompt: string) => void;
}

export const GiaNfpPredictor: React.FC<GiaNfpPredictorProps> = ({
  prediction,
  macroPredictions,
  nextUpcomingEvent = 'CPI',
  assetSymbol,
  onRefreshEvent,
}) => {
  // Determine initial selected event tab
  const defaultTab: MacroEventType =
    nextUpcomingEvent ||
    macroPredictions?.find((m) => m.isNextUp)?.eventType ||
    'CPI';

  const [selectedEventType, setSelectedEventType] = useState<MacroEventType>(defaultTab);
  const [showMatrixDetails, setShowMatrixDetails] = useState(true);

  // Internet-synchronized World Clock Hook
  const worldClock = useWorldClock();

  // Anchored release target ISO timestamps (scheduled macro release windows in UTC)
  const defaultReleaseIso: Record<MacroEventType, string> = {
    CPI: '2026-08-12T12:30:00Z',
    NFP: '2026-09-04T12:30:00Z',
    FOMC: '2026-09-16T18:00:00Z',
  };

  const getEventTargetIso = (evt: MacroEventType): string => {
    const evtObj = macroPredictions?.find((m) => m.eventType === evt);
    return evtObj?.releaseDateIso || defaultReleaseIso[evt];
  };

  const getCountdown = (evt: MacroEventType) => {
    const targetIso = getEventTargetIso(evt);
    return worldClock.getCountdown(targetIso);
  };

  // Sync selected event if nextUpcomingEvent prop changes
  useEffect(() => {
    if (nextUpcomingEvent && macroPredictions?.some((m) => m.eventType === nextUpcomingEvent)) {
      setSelectedEventType(nextUpcomingEvent);
    }
  }, [nextUpcomingEvent, macroPredictions]);

  const assetName = assetSymbol === '1HZ10V' ? 'Volatility 10 (1s) Index' : 'Gold (XAUUSD)';

  // Find active macro prediction if available
  const activeMacro = macroPredictions?.find((m) => m.eventType === selectedEventType);

  // Next up event object
  const nextUpObj = macroPredictions?.find((m) => m.isNextUp) || macroPredictions?.[0];

  // If no predictions at all, return null
  if (!activeMacro && !prediction) {
    return null;
  }

  // Fallback to legacy NFP prediction if macroPredictions is not populated
  const currentDirection: 'BUY' | 'SELL' = activeMacro
    ? activeMacro.predictedDirection
    : prediction?.predictedDirection === 'BEARISH_DOLLAR_BULLISH_ASSET'
    ? 'BUY'
    : 'SELL';

  const isBuySignal = currentDirection === 'BUY';

  const eventTitle = activeMacro
    ? activeMacro.eventName
    : 'Non-Farm Payrolls & Unemployment Rate (NFP)';

  const releaseDate = activeMacro ? activeMacro.releaseDate : prediction?.releaseDate;
  const confidenceScore = activeMacro ? activeMacro.probabilityScore : prediction?.probabilityScore || 78;
  const targetShift = activeMacro ? activeMacro.targetPriceShift : prediction?.assetImpactTarget || '+$38.50 Target Shift';
  const summaryText = activeMacro ? activeMacro.directionSummary : prediction?.directionSummary;

  const activeCountdown = getCountdown(selectedEventType);
  const nextUpCountdown = getCountdown(nextUpObj?.eventType || 'CPI');

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col justify-between h-full">
      {/* Background Glow Effect */}
      <div
        className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
          isBuySignal ? 'bg-emerald-500/[0.07]' : 'bg-rose-500/[0.07]'
        }`}
      />

      <div>
        {/* TOP ALERT BANNER: DYNAMIC NEXT UPCOMING EVENT DETECTOR & LIVE COUNTDOWN */}
        <div className="mb-4 bg-slate-950/90 border border-amber-500/40 p-3.5 rounded-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 shrink-0">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400 animate-bounce" />
                  AUTOMATIC EVENT RADAR
                </span>
                <span className="text-xs font-bold text-white font-display">
                  NEXT HIGH-IMPACT NEWS: <span className="text-amber-300 font-extrabold">{nextUpObj?.eventName || 'US CPI Inflation Data'}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-2 font-mono">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>{nextUpObj?.releaseDate || 'Next Release Window'}</span>
              </p>
            </div>
          </div>

          {/* Banner Live Countdown Pill & Action */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 self-stretch lg:self-auto justify-end">
            <div className="flex items-center gap-1.5 font-mono bg-slate-900 border border-amber-500/30 px-3 py-1.5 rounded-lg text-amber-300 shadow">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-[10px] text-slate-400 font-semibold uppercase mr-1">COUNTDOWN:</span>
              <span className="font-bold text-xs text-amber-300 bg-slate-950 px-1.5 py-0.5 rounded border border-amber-500/30">
                {nextUpCountdown.days}d
              </span>
              <span>:</span>
              <span className="font-bold text-xs text-amber-300 bg-slate-950 px-1.5 py-0.5 rounded border border-amber-500/30">
                {nextUpCountdown.hours}h
              </span>
              <span>:</span>
              <span className="font-bold text-xs text-amber-300 bg-slate-950 px-1.5 py-0.5 rounded border border-amber-500/30">
                {nextUpCountdown.minutes}m
              </span>
              <span>:</span>
              <span className="font-bold text-xs text-emerald-400 bg-slate-950 px-1.5 py-0.5 rounded border border-emerald-500/30 animate-pulse">
                {nextUpCountdown.seconds}s
              </span>
            </div>

            <button
              onClick={() =>
                onRefreshEvent &&
                onRefreshEvent(
                  `Perform an immediate multi-agent macro neural scan on upcoming ${selectedEventType} news impact on Gold (XAUUSD). Recalculate inflation/labor/rate probabilities, BUY/SELL direction, and target price shifts.`
                )
              }
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-display rounded-lg transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              title="Rescan macro predictions"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Rescan Impact</span>
            </button>
          </div>
        </div>

        {/* HEADER & TABS FOR CPI, NFP, AND FOMC */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-sm text-white">
                  High-Impact Macro Event Predictor
                </h3>
                <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Activity className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                  LIVE NEURAL MATRIX
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Predicting Gold (XAUUSD) BUY vs SELL direction for upcoming major economic releases
              </p>
            </div>
          </div>

          {/* CPI / NFP / FOMC Event Selector Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0 self-start lg:self-auto">
            {(['CPI', 'NFP', 'FOMC'] as MacroEventType[]).map((evt) => {
              const isSelected = selectedEventType === evt;
              const evtData = macroPredictions?.find((m) => m.eventType === evt);
              const isNext = evtData?.isNextUp;
              const evtDir = evtData?.predictedDirection || 'BUY';

              return (
                <button
                  key={evt}
                  onClick={() => setSelectedEventType(evt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? evtDir === 'BUY'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-extrabold'
                        : 'bg-rose-500 text-white shadow-md shadow-rose-500/20 font-extrabold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <span>{evt}</span>
                  {isNext && (
                    <span
                      className={`text-[8px] px-1 rounded font-mono ${
                        isSelected ? 'bg-slate-950 text-amber-300' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      NEXT
                    </span>
                  )}
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                      isSelected
                        ? 'bg-slate-950/30 text-current font-extrabold'
                        : evtDir === 'BUY'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {evtDir}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FEATURED EVENT COUNTDOWN TIMER BAR */}
        <div className="mb-4 bg-slate-950/90 border border-slate-800/90 p-3.5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 font-mono shadow-inner">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 shrink-0">
              <Clock className="w-5 h-5 animate-pulse text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white font-display uppercase tracking-wide">
                  {selectedEventType} RELEASE COUNTDOWN TIMER
                </span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded font-bold flex items-center gap-1 border ${
                    worldClock.isSynced
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  }`}
                >
                  <Globe className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                  <span>{worldClock.isSynced ? 'WORLD CLOCK SYNCED (UTC)' : 'LOCAL FALLBACK'}</span>
                </span>
                <button
                  onClick={() => worldClock.resync()}
                  className="text-[9px] bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 px-2 py-0.5 rounded border border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer"
                  title={`Clock source: ${worldClock.syncSource}. Click to re-sync with World Clock.`}
                >
                  <RefreshCw className="w-2.5 h-2.5 text-amber-400" />
                  <span>Sync Clock</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>Exact time remaining until official release (Internet UTC Time)</span>
                <span className="text-emerald-400 font-mono text-[10px] bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800 font-bold">
                  LIVE UTC: {new Date(worldClock.currentTimeMs).toISOString().slice(11, 19)}
                </span>
              </p>
            </div>
          </div>

          {/* Large Segment Digital Timer Display */}
          <div className="flex items-center gap-2 font-mono shrink-0">
            <div className="flex flex-col items-center bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg min-w-[54px]">
              <span className="text-lg font-extrabold text-amber-300 tracking-wider">
                {activeCountdown.days}
              </span>
              <span className="text-[8px] text-slate-500 uppercase font-semibold">DAYS</span>
            </div>
            <span className="text-amber-500 font-extrabold text-base animate-pulse">:</span>
            <div className="flex flex-col items-center bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg min-w-[54px]">
              <span className="text-lg font-extrabold text-amber-300 tracking-wider">
                {activeCountdown.hours}
              </span>
              <span className="text-[8px] text-slate-500 uppercase font-semibold">HOURS</span>
            </div>
            <span className="text-amber-500 font-extrabold text-base animate-pulse">:</span>
            <div className="flex flex-col items-center bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg min-w-[54px]">
              <span className="text-lg font-extrabold text-amber-300 tracking-wider">
                {activeCountdown.minutes}
              </span>
              <span className="text-[8px] text-slate-500 uppercase font-semibold">MINS</span>
            </div>
            <span className="text-amber-500 font-extrabold text-base animate-pulse">:</span>
            <div className="flex flex-col items-center bg-emerald-950/80 border border-emerald-500/40 px-3 py-1.5 rounded-lg min-w-[54px]">
              <span className="text-lg font-extrabold text-emerald-400 tracking-wider animate-pulse">
                {activeCountdown.seconds}
              </span>
              <span className="text-[8px] text-emerald-500 uppercase font-bold">SECS</span>
            </div>
          </div>
        </div>

        {/* HERO DIRECTION BANNER: GOLD BUY VS SELL SIGNAL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
          {/* Main Gold Direction Signal Card */}
          <div
            className={`lg:col-span-7 p-4 rounded-xl border flex flex-col justify-between relative shadow-lg ${
              isBuySignal
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-100'
                : 'bg-rose-950/20 border-rose-500/40 text-rose-100'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  {eventTitle}
                </span>
                <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {confidenceScore}% Model Confidence
                </span>
              </div>

              <div className="flex items-start gap-3 mb-2">
                {isBuySignal ? (
                  <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 shrink-0">
                    <TrendingUp className="w-8 h-8 animate-bounce" />
                  </div>
                ) : (
                  <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-400 shrink-0">
                    <TrendingDown className="w-8 h-8 animate-bounce" />
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded-md font-extrabold tracking-wide uppercase ${
                        isBuySignal
                          ? 'bg-emerald-500 text-slate-950 shadow'
                          : 'bg-rose-500 text-white shadow'
                      }`}
                    >
                      {isBuySignal ? 'GOLD BUY SIGNAL' : 'GOLD SELL SIGNAL'}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-300">
                      [{selectedEventType} RELEASE IMPACT]
                    </span>
                  </div>

                  <h4
                    className={`font-display font-extrabold text-base tracking-tight ${
                      isBuySignal ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {isBuySignal
                      ? `BULLISH SURGE ON ${assetName.toUpperCase()}`
                      : `BEARISH DROP ON ${assetName.toUpperCase()}`}
                  </h4>

                  <p className="text-[11px] text-slate-300 leading-snug mt-1">
                    {summaryText}
                  </p>
                </div>
              </div>
            </div>

            {/* Target Price Shift Footer */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between font-mono text-[11px]">
              <span className="text-slate-400 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-amber-500" />
                Target Price Shift:
              </span>
              <span
                className={`font-bold text-xs flex items-center gap-1 ${
                  isBuySignal ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isBuySignal ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {targetShift}
              </span>
            </div>
          </div>

          {/* KEY DATA METRICS & ESTIMATES BOX */}
          <div className="lg:col-span-5 bg-slate-950/90 border border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-between font-mono">
            <div>
              <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-2">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  {selectedEventType} Benchmark vs GIA Forecast
                </span>
                <span className="text-[9px] text-amber-400 font-bold">{releaseDate}</span>
              </div>

              {/* Metric 1: Previous Print */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-lg border border-slate-850">
                  <span className="text-slate-400 text-[10px]">Previous Release:</span>
                  <span className="text-slate-200 font-bold">
                    {activeMacro ? activeMacro.previousPrint : prediction?.previousPrint}
                  </span>
                </div>

                {/* Metric 2: Consensus */}
                <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-lg border border-slate-850">
                  <span className="text-slate-400 text-[10px]">Wall St Consensus:</span>
                  <span className="text-amber-400 font-bold">
                    {activeMacro ? activeMacro.consensusForecast : prediction?.consensusForecast}
                  </span>
                </div>

                {/* Metric 3: AI Predicted Print */}
                <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 p-2 rounded-lg text-amber-300">
                  <span className="text-[10px] font-bold text-amber-400">GIA AI Forecast:</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {activeMacro ? activeMacro.aiPredictedPrint : prediction?.aiPredictedPrint}
                  </span>
                </div>
              </div>
            </div>

            {/* Secondary metrics (Core CPI / Unemployment / Earnings / Dot Plot) */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-900 text-[10px] text-slate-400">
              <div>
                <span className="text-[9px] text-slate-500 block">
                  {activeMacro ? activeMacro.secondaryMetric1.label : 'Unemployment:'}
                </span>
                <span className="text-slate-200 font-bold">
                  {activeMacro ? activeMacro.secondaryMetric1.value : prediction?.unemploymentRateForecast}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block">
                  {activeMacro ? activeMacro.secondaryMetric2.label : 'Avg Earnings:'}
                </span>
                <span className="text-slate-200 font-bold">
                  {activeMacro ? activeMacro.secondaryMetric2.value : prediction?.hourlyEarningsForecast}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* MULTI-AGENT CONSENSUS NODE BREAKDOWN FOR ACTIVE EVENT */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              Multi-Agent Consensus Matrix for {selectedEventType} Release
            </span>
            <span className="text-[10px] font-mono text-slate-500">4 Core Nodes Evaluated</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {activeMacro ? (
              activeMacro.agentConsensus.map((agent, i) => (
                <div
                  key={i}
                  className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl flex items-start justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-display font-semibold text-slate-200">{agent.agent}</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          agent.bias.includes('BUY')
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : agent.bias.includes('SELL')
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {agent.bias}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">{agent.reason}</p>
                  </div>
                </div>
              ))
            ) : (
              prediction?.agentConsensus.map((agent, i) => (
                <div
                  key={i}
                  className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl flex items-start justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-display font-semibold text-slate-200">{agent.agent}</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          agent.bias === 'Miss'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : agent.bias === 'Beat'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {agent.bias === 'Miss' ? 'Dovish Miss Call' : agent.bias === 'Beat' ? 'Hawkish Beat Call' : 'In-Line Call'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">{agent.reason}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SCENARIO REACTION MATRIX */}
        <div>
          <button
            onClick={() => setShowMatrixDetails(!showMatrixDetails)}
            className="w-full flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono hover:bg-slate-900 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-white">
                {selectedEventType} Outcome Scenario Reaction Matrix
              </span>
            </div>
            {showMatrixDetails ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showMatrixDetails && (
            <div className="mt-2 space-y-2">
              {activeMacro ? (
                activeMacro.scenarioMatrix.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950/50 border border-slate-850 p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-200">{item.scenario}</span>
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {item.dataRange}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                            item.direction === 'BUY'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : item.direction === 'SELL'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {item.direction === 'BUY' ? 'BUY GOLD' : item.direction === 'SELL' ? 'SELL GOLD' : 'NEUTRAL'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{item.goldReaction}</p>
                    </div>

                    <div className="flex items-center gap-3 font-mono shrink-0">
                      <div className="w-24 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full ${
                            item.direction === 'BUY' ? 'bg-emerald-500' : item.direction === 'SELL' ? 'bg-rose-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${item.probability}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-200 w-10 text-right">
                        {item.probability}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                prediction?.scenarioMatrix.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950/50 border border-slate-850 p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-200">{item.scenario}</span>
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {item.payrollRange}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{item.assetReaction}</p>
                    </div>

                    <div className="flex items-center gap-3 font-mono shrink-0">
                      <div className="w-24 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full ${
                            item.bias === 'Bullish' ? 'bg-emerald-500' : item.bias === 'Bearish' ? 'bg-rose-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${item.probability}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-200 w-10 text-right">
                        {item.probability}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span>GIA MACRO RADAR ENGINE: ACTIVE</span>
        <span className="text-emerald-400 font-bold">LIVE COUNTDOWN SYNCED</span>
      </div>
    </div>
  );
};
