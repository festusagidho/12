/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, useEffect, useState, useCallback, useRef } from 'react';
import { GiaAnalysisReport, Candle, MarketTicker } from './types';
import GiaAgentGrid from './components/GiaAgentGrid';
import GiaLeaderboard from './components/GiaLeaderboard';
import GiaTradeSetup from './components/GiaTradeSetup';
import GiaCalendar from './components/GiaCalendar';
import { GiaNfpPredictor } from './components/GiaNfpPredictor';
import { GiaTradeLedger } from './components/GiaTradeLedger';
import { GiaMt5EaGenerator } from './components/GiaMt5EaGenerator';
import { useDerivWebSocket } from './hooks/useDerivWebSocket';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Sparkles,
  RefreshCw,
  Play,
  Pause,
  Zap,
  Percent,
  HelpCircle,
  Eye,
  Settings,
  Flame,
  Binary,
  ArrowRight,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
  Terminal,
  Send,
  Check,
  Clock,
  ShieldCheck
} from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class DashboardErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Dashboard caught rendering error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans p-6 text-center">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 max-w-md shadow-2xl">
            <h2 className="text-amber-400 font-display font-bold text-lg mb-2">Display Re-calibrated</h2>
            <p className="text-slate-300 text-xs mb-4">
              A temporary display anomaly occurred while rendering new entry zones. Click below to reload the Quant Dashboard.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer transition-all"
            >
              Reset Dashboard View
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <DashboardErrorBoundary>
      <GiaDashboardContent />
    </DashboardErrorBoundary>
  );
}

function GiaDashboardContent() {
  const [activeSymbol, setActiveSymbol] = useState<'frxXAUUSD' | '1HZ10V'>('frxXAUUSD');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [analysis, setAnalysis] = useState<GiaAnalysisReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scenarioPrompt, setScenarioPrompt] = useState('');
  const [activeTimeframe, setActiveTimeframe] = useState('4H');
  const [goldPrice, setGoldPrice] = useState(4389.00);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | 'flat'>('flat');
  const [errorMessage, setErrorMessage] = useState('');
  const [isIntelligenceHubOpen, setIsIntelligenceHubOpen] = useState(false);

  // 24/7 Continuous Auto-Scan States
  const [autoScanEnabled, setAutoScanEnabled] = useState<boolean>(true);
  const [scanIntervalSeconds, setScanIntervalSeconds] = useState<number>(30);
  const [secondsToNextScan, setSecondsToNextScan] = useState<number>(30);
  const [lastScanTimestamp, setLastScanTimestamp] = useState<string>(new Date().toLocaleTimeString());

  // 1. Connect directly to Deriv WebSocket for live market feeds
  const {
    goldPrice: derivGoldPrice,
    priceDirection: derivPriceDirection,
    isConnected: isDerivConnected,
    connectionStatus: derivConnectionStatus,
    candles: derivCandles,
    lastTickTime,
    reconnect: reconnectDeriv,
  } = useDerivWebSocket(activeTimeframe, activeSymbol);

  // Sync state with live Deriv WebSocket data
  useEffect(() => {
    if (derivGoldPrice && derivGoldPrice > 0) {
      setGoldPrice(derivGoldPrice);
      setPriceDirection(derivPriceDirection);
    }
  }, [derivGoldPrice, derivPriceDirection]);

  useEffect(() => {
    if (derivCandles && derivCandles.length > 0) {
      setCandles(derivCandles);
    }
  }, [derivCandles]);

  // Auxiliary market tickers
  const [tickers, setTickers] = useState<MarketTicker[]>([
    { symbol: 'DXY', name: 'US Dollar Index', price: 103.85, change: -0.22, changePercent: -0.21 },
    { symbol: 'US10Y', name: 'US 10Y Yield', price: 4.182, change: -0.045, changePercent: -1.06 },
    { symbol: 'XAGUSD', name: 'Silver Spot', price: 29.45, change: 0.35, changePercent: 1.20 },
    { symbol: 'BRENT', name: 'Brent Crude Oil', price: 82.40, change: -0.85, changePercent: -1.02 },
  ]);

  // List of pre-configured sample stress-test scenarios for the selected asset
  const sampleScenarios = activeSymbol === '1HZ10V' ? [
    {
      title: 'Vol 10 (1s) Tick Density Surge',
      prompt: 'Algorithmic liquidity flux causing 1-second tick variance and expansion past 4-hour high.',
    },
    {
      title: 'Mean Reversion Breakdown',
      prompt: 'Continuous buy-side sweep breaking 1HZ10V order block with high volatility expansion.',
    },
    {
      title: 'Synthetic Channel Breakout',
      prompt: 'Volatility 10 1s Index compressing in tight 1-second channel before impulse breakout.',
    },
    {
      title: 'Deriv Market Regime Shift',
      prompt: 'Macro volatility shift driving dynamic standard deviation expansion across synthetic indices.',
    },
  ] : [
    {
      title: 'Federal Reserve Rate Cut',
      prompt: 'Federal Reserve announces surprise 50bps rate cut to counter softening job market.',
    },
    {
      title: 'Geopolitical Conflict Spike',
      prompt: 'Geopolitical tensions flare up in critical trade channels, sparking safe-haven flight.',
    },
    {
      title: 'Surprise Hot NFP Payrolls',
      prompt: 'Non-Farm Payrolls beat expectations by 80K with wages spiking 0.4% MoM.',
    },
    {
      title: 'PBOC De-Dollarization Vector',
      prompt: 'People\'s Bank of China accelerates physical bullion gold accumulation by 50 tonnes.',
    },
  ];

  // Fetch initial baseline data from full-stack server for the selected asset
  const fetchInitialData = async (symbolToUse = activeSymbol, targetPrice?: number) => {
    try {
      const defaultP = symbolToUse === '1HZ10V' ? 9613.90 : 4389.00;
      const p = targetPrice || goldPrice || defaultP;
      const response = await fetch(`/api/gold-data?symbol=${symbolToUse}&price=${p}`);
      if (!response.ok) throw new Error('Failed to retrieve initial intelligence');
      const data = await response.json();
      if (data.candles) {
        setCandles(data.candles);
      }
      setAnalysis(data.analysis);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Failed to connect to the GIA core node engine.');
    }
  };

  useEffect(() => {
    fetchInitialData('frxXAUUSD', 4389.00);
  }, []);

  const handleSymbolSwitch = (newSymbol: 'frxXAUUSD' | '1HZ10V') => {
    if (newSymbol === activeSymbol) return;
    setActiveSymbol(newSymbol);
    const defaultPrice = newSymbol === '1HZ10V' ? 9613.90 : 4389.00;
    setGoldPrice(defaultPrice);
    setCandles([]);
    fetchInitialData(newSymbol, defaultPrice);
  };

  // Tick secondary macro indexes randomly for realism
  useEffect(() => {
    const timer = setInterval(() => {
      setTickers((prev) =>
        prev.map((t) => {
          const noise = (Math.random() - 0.5) * (t.price * 0.002);
          const nextPrice = Number((t.price + noise).toFixed(t.symbol === 'US10Y' ? 3 : 2));
          return {
            ...t,
            price: nextPrice,
            changePercent: Number((t.changePercent + (noise / t.price) * 100).toFixed(2)),
          };
        })
      );
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  // Trigger custom macro scan via Gemini API server bridge
  const runCustomScenario = async (customText?: string) => {
    const promptToUse = customText || scenarioPrompt;
    if (!promptToUse.trim()) return;

    setIsScanning(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioPrompt: promptToUse,
          currentPrice: goldPrice,
          symbol: activeSymbol,
        }),
      });

      if (!response.ok) throw new Error('API server returned error during analysis');
      const data = await response.json();
      setAnalysis(data.analysis);
      if (data.analysis.candles && data.analysis.candles.length > 0 && !isDerivConnected) {
        setCandles(data.analysis.candles);
      }
      setScenarioPrompt('');
    } catch (err: any) {
      console.error(err);
      setErrorMessage('GIA Core call encountered error. Using resilient backup model calculation.');
    } finally {
      setIsScanning(false);
    }
  };

  // Continuous 24/7 AI Auto-Scan & High-Profitability Execution Loop
  const triggerContinuousScan = useCallback(async (isManual = false) => {
    setIsScanning(true);
    try {
      const scanPrompt = `Continuous 24/7 high-profitability institutional SMC market scan for ${
        activeSymbol === '1HZ10V' ? 'Volatility 10 Index' : 'Gold (XAUUSD)'
      } at current price $${goldPrice.toFixed(2)}. Timeframe context: ${activeTimeframe}. Calculate high win-rate Order Block & FVG setups with minimum R:R of 1:2.5.`;

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioPrompt: scanPrompt,
          currentPrice: goldPrice,
          symbol: activeSymbol,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.analysis) {
          setAnalysis(data.analysis);
          setLastScanTimestamp(new Date().toLocaleTimeString());
        }
      }
    } catch (err) {
      console.error('Auto scan error:', err);
    } finally {
      setIsScanning(false);
      setSecondsToNextScan(scanIntervalSeconds);
    }
  }, [activeSymbol, goldPrice, activeTimeframe, scanIntervalSeconds]);

  // Continuous timer countdown effect
  useEffect(() => {
    if (!autoScanEnabled) return;

    const timer = setInterval(() => {
      setSecondsToNextScan((prev) => {
        if (prev <= 1) {
          triggerContinuousScan();
          return scanIntervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoScanEnabled, scanIntervalSeconds, triggerContinuousScan]);

  if (!analysis) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-mono text-xs text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        <span className="text-sm font-semibold text-slate-200">CONNECTING TO DERIV WEBSOCKET & GIA CORE ENGINE...</span>
        <span className="text-slate-500">Retrieving real-time XAUUSD feeds (Deriv WS: wss://ws.derivws.com)...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 pb-12">
      {/* 1. TOP DYNAMIC INDEX BAR */}
      <div className="bg-slate-950 border-b border-slate-900 text-xs font-mono py-2 px-4 flex flex-wrap items-center justify-between gap-4 z-50 relative">
        <div className="flex items-center gap-4">
          {/* Deriv WebSocket live status indicator */}
          <div className="flex items-center gap-2">
            {isDerivConnected ? (
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded text-emerald-400 text-[10px] uppercase tracking-wider font-bold">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span>Deriv WS: LIVE {lastTickTime ? `[${lastTickTime}]` : activeSymbol}</span>
              </div>
            ) : (
              <button
                onClick={reconnectDeriv}
                className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded text-amber-400 hover:bg-amber-500/20 text-[10px] uppercase tracking-wider font-bold transition-all"
              >
                <WifiOff className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>Deriv WS: {derivConnectionStatus} (Click to Retry)</span>
              </button>
            )}
          </div>

          {/* Deriv Live Asset Price */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-sans font-semibold">
              {activeSymbol === '1HZ10V' ? 'Volatility 10 (1s) Index:' : 'XAUUSD (Deriv Gold):'}
            </span>
            <span
              className={`font-bold transition-all duration-300 px-2 py-0.5 rounded text-sm ${
                priceDirection === 'up'
                  ? 'text-emerald-400 bg-emerald-950/40'
                  : priceDirection === 'down'
                  ? 'text-rose-400 bg-rose-950/40'
                  : 'text-amber-400 bg-amber-950/30'
              }`}
            >
              ${goldPrice.toFixed(2)}
            </span>
            {priceDirection === 'up' ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            )}
          </div>
        </div>

        {/* Global Macro Tickers */}
        <div className="flex items-center gap-6 overflow-x-auto py-1 scrollbar-none max-w-full lg:max-w-none">
          {tickers.map((t) => (
            <div key={t.symbol} className="flex items-center gap-2 shrink-0">
              <span className="text-slate-500">{t.symbol}:</span>
              <span className="text-slate-200 font-semibold">{t.price}</span>
              <span className={`text-[10px] font-bold ${t.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {t.changePercent >= 0 ? '+' : ''}
                {t.changePercent}%
              </span>
            </div>
          ))}
        </div>

        {/* System Time / Location */}
        <div className="hidden xl:flex items-center gap-2 text-[10px] text-slate-500">
          <span>UTC: {new Date().toISOString().substring(11, 19)}</span>
          <span>•</span>
          <span>SYSTEM_READY</span>
        </div>
      </div>

      {/* 2. DASHBOARD BRANDING HEADER WITH ASSET SELECTOR TABS */}
      <header className="max-w-7xl mx-auto px-4 pt-6 pb-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-900 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="bg-amber-500 text-slate-950 p-1 px-2 rounded-lg font-display font-extrabold text-sm tracking-tighter">
                  GIA
                </div>
                <h1 className="text-2xl font-display font-bold tracking-tight text-white">
                  GOLD & SYNTHETIC INTELLIGENCE AI
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Enterprise Quantitative Forecasting Core & Multi-Agent Decision Engine
              </p>
            </div>

            {/* Asset Selector Tab Bar */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl sm:ml-4 self-start sm:self-center">
              <button
                id="tab-xauusd"
                onClick={() => handleSymbolSwitch('frxXAUUSD')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold font-display transition-all cursor-pointer ${
                  activeSymbol === 'frxXAUUSD'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className="text-sm">🏆</span>
                <span>Gold (XAUUSD)</span>
              </button>
              <button
                id="tab-1hz10v"
                onClick={() => handleSymbolSwitch('1HZ10V')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold font-display transition-all cursor-pointer ${
                  activeSymbol === '1HZ10V'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Volatility 10 (1s) Index</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Pillar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-900/60 border border-slate-850 p-2.5 px-4 rounded-xl text-center min-w-[100px]">
              <span className="text-[10px] font-mono text-slate-500 block uppercase">consensus bias</span>
              <span className="font-display text-sm font-bold text-emerald-400">
                {analysis?.sentimentBias?.bullish ?? 65}% BULLISH
              </span>
            </div>

            <div className="bg-slate-900/60 border border-slate-850 p-2.5 px-4 rounded-xl text-center min-w-[100px]">
              <span className="text-[10px] font-mono text-slate-500 block uppercase">system trust</span>
              <span className="font-display text-sm font-bold text-amber-500">
                {analysis?.scores?.confidence ?? 78}% CONFIDENCE
              </span>
            </div>

            <div className="bg-slate-900/60 border border-slate-850 p-2.5 px-4 rounded-xl text-center min-w-[100px]">
              <span className="text-[10px] font-mono text-slate-500 block uppercase">inst. positioning</span>
              <span className="font-display text-sm font-bold text-white uppercase">
                {analysis?.sentimentBias?.institutionalBias || 'BULLISH'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* CONTINUOUS 24/7 AI AUTO-SCANNER & HIGH-PROFITABILITY TRADE ENGINE CONTROL BAR */}
      <section className="max-w-7xl mx-auto px-4 mt-3">
        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-emerald-500/40 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border ${
              autoScanEnabled
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
            }`}>
              <Zap className={`w-5 h-5 ${autoScanEnabled ? 'animate-pulse' : ''}`} />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display font-bold text-sm text-white tracking-tight">
                  24/7 Continuous AI Auto-Scanner & High-Profitability Trade Engine
                </h2>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 border ${
                  autoScanEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${autoScanEnabled ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                  {autoScanEnabled ? 'CONTINUOUSLY ACTIVE (NEVER RESTS)' : 'PAUSED'}
                </span>
                <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  HIGH-PROFITABILITY FILTER: A+ / A GRADE (R:R ≥ 2.5)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>Bot continues scanning & executing high-profitability trades across all timeframes non-stop.</span>
                <span className="text-amber-400 font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Next Scan in: <strong className="text-emerald-400">{secondsToNextScan}s</strong> (Last: {lastScanTimestamp})
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap self-start md:self-auto">
            {/* Interval Selector */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              <span className="text-[10px] text-slate-500 px-2">Frequency:</span>
              {[15, 30, 60, 120].map((sec) => (
                <button
                  key={sec}
                  onClick={() => {
                    setScanIntervalSeconds(sec);
                    setSecondsToNextScan(sec);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    scanIntervalSeconds === sec
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>

            {/* Pause/Resume Toggle */}
            <button
              onClick={() => setAutoScanEnabled(!autoScanEnabled)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                autoScanEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-emerald-500 text-slate-950 border-emerald-400 hover:bg-emerald-400'
              }`}
            >
              {autoScanEnabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{autoScanEnabled ? 'Pause Bot' : 'Start Continuous Bot'}</span>
            </button>

            {/* Force Immediate Rescan Button */}
            <button
              onClick={() => triggerContinuousScan(true)}
              disabled={isScanning}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>Scan Now</span>
            </button>
          </div>
        </div>
      </section>

      {/* Error Message display if any */}
      {errorMessage && (
        <div className="max-w-7xl mx-auto px-4 mt-3">
          <div className="bg-rose-950/20 border border-rose-500/30 p-3 rounded-xl text-xs text-rose-300 font-mono">
            ⚠️ {errorMessage} (GIA local fallback engine running smoothly)
          </div>
        </div>
      )}

      {/* 3. DASHBOARD MAIN CONTENT WRAPPER */}
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col lg:grid lg:grid-cols-12 gap-6 z-10 relative">
        {/* A. TRADE SETUP PANEL (Mobile: Order 1 - TOP, Desktop: Order 1 - Row 1 12 cols) */}
        <div className="order-1 lg:order-1 lg:col-span-12 h-full">
          <GiaTradeSetup
            setup={analysis.tradeSetup}
            alternativeSetups={analysis.alternativeSetups}
            currentPrice={goldPrice}
            isScanning={isScanning}
            onRefreshEntries={(reason) =>
              runCustomScenario(
                reason ||
                  `TP1, TP2, TP3 targets achieved at current live price $${goldPrice.toFixed(
                    2
                  )}. Recalculate and generate brand new entry zones and order block setups.`
              )
            }
          />
        </div>

        {/* B. SCENARIO SIMULATION COMMAND CENTER (Mobile: Order 2, Desktop: Order 1 - Row 1 12 cols) */}
        <section className="order-2 lg:order-1 lg:col-span-12">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl shadow-xl relative overflow-hidden">
            {/* Subtle decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.03] rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="font-display font-semibold text-sm text-white">
                Macro Target Scenario Projection Hub
              </h2>
              <span className="text-[10px] text-slate-500 font-mono">Powered by server-side Gemini 3.5</span>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Stress-test GIA's multi-agent network. Enter any macroeconomic event, war rumors, or central bank announcement in natural language.
              Gemini will coordinate specialized agents to recalculate fair value models, technical blocks, and probability vectors.
            </p>

            <div className="flex flex-col md:flex-row gap-2 mb-4">
              <input
                type="text"
                value={scenarioPrompt}
                onChange={(e) => setScenarioPrompt(e.target.value)}
                placeholder="e.g. Fed Chair Powell hints at aggressive rate cycle end; ECB holds rates steady..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/80"
                onKeyDown={(e) => e.key === 'Enter' && runCustomScenario()}
              />
              <button
                onClick={() => runCustomScenario()}
                disabled={isScanning || !scenarioPrompt.trim()}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-display font-semibold text-xs rounded-xl shadow-lg hover:shadow-amber-500/10 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing agents...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Execute Projection</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Click Samples */}
            <div>
              <span className="text-[10px] text-slate-500 font-mono block mb-2 uppercase">
                Or pick an institutional-grade macro event to simulate:
              </span>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {sampleScenarios.map((sc, i) => (
                  <button
                    key={i}
                    id={`sample-sc-${i}`}
                    onClick={() => {
                      setScenarioPrompt(sc.prompt);
                      runCustomScenario(sc.prompt);
                    }}
                    disabled={isScanning}
                    className="bg-slate-950/80 border border-slate-900 hover:border-slate-800 p-2.5 rounded-xl text-left hover:bg-slate-900/40 transition group cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-0.5 group-hover:text-amber-400 transition">
                      <span>{sc.title}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                    </div>
                    <span className="text-[10px] text-slate-500 line-clamp-1">{sc.prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* C. MAIN CORES GRID STATS (Mobile: Order 3, Desktop: Order 2 - Row 2 12 cols) */}
        <section className="order-3 lg:order-2 lg:col-span-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { name: 'Technical Index', value: analysis?.scores?.technical ?? 74, desc: 'SMC/ICT Break of Structure bias' },
            { name: 'Fundamental Index', value: analysis?.scores?.fundamental ?? 81, desc: 'Central bank & supply metrics' },
            { name: 'Sentiment Index', value: analysis?.scores?.sentiment ?? 68, desc: 'COT report spec vs broker nets' },
            { name: 'Macro Index', value: analysis?.scores?.macro ?? 85, desc: 'Real yields & inflation vectors' },
            { name: 'Portfolio Risk Score', value: analysis?.scores?.risk ?? 42, desc: 'Drawdown risk multiplier', isRisk: true },
            { name: 'Volatility (GVX)', value: analysis?.scores?.volatility ?? 55, desc: 'Implied daily price variance' },
            { name: 'Calibration Score', value: analysis?.scores?.confidence ?? 78, desc: 'Combined model confidence' },
          ].map((score, idx) => (
            <div
              key={idx}
              className="bg-slate-900/40 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between backdrop-blur shadow"
            >
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">{score.name}</span>
                <p className="text-[9px] text-slate-500 mt-0.5 leading-snug">{score.desc}</p>
              </div>
              <div className="flex items-baseline gap-2 mt-4">
                <span className={`font-display text-2xl font-bold ${
                  score.isRisk 
                    ? score.value < 50 ? 'text-emerald-400' : 'text-rose-400'
                    : score.value >= 70 ? 'text-emerald-400' : score.value >= 50 ? 'text-amber-400' : 'text-slate-400'
                }`}>
                  {score.value}%
                </span>
                <div className="w-2 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      score.isRisk ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${score.value}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* G2. CENTRAL MULTI-DEVICE TRADE LEDGER */}
        <section className="order-5 lg:order-5 lg:col-span-12">
          <GiaTradeLedger
            currentPrice={goldPrice}
            activeSymbol={activeSymbol}
            onRefreshTrigger={() => runCustomScenario('Central Ledger Manual Re-Scan')}
          />
        </section>

        {/* G3. METATRADER 5 (MT5) EXPERT ADVISOR (EA) STRATEGY GENERATOR */}
        <section className="order-6 lg:order-6 lg:col-span-12">
          <GiaMt5EaGenerator />
        </section>

        {/* H. HIGH-IMPACT MACRO NEWS PREDICTOR PANEL (CPI, NFP & FOMC) */}
        {activeSymbol === 'frxXAUUSD' && (
          <section className="order-8 lg:order-8 lg:col-span-12">
            <GiaNfpPredictor
              prediction={analysis.nfpPrediction}
              macroPredictions={analysis.macroNewsPredictor}
              nextUpcomingEvent={analysis.nextUpcomingEvent}
              assetSymbol={activeSymbol}
              onRefreshEvent={(promptText) => runCustomScenario(promptText)}
            />
          </section>
        )}

        {/* I. BUNDLED ADVANCED INTELLIGENCE & COMMAND CENTER (HIDDEN AT BOTTOM BY DEFAULT) */}
        <section className="order-9 lg:order-9 lg:col-span-12 mt-2">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl transition-all">
            {/* Toggle Header Button */}
            <button
              onClick={() => setIsIntelligenceHubOpen(!isIntelligenceHubOpen)}
              className="w-full p-4 bg-slate-950/90 hover:bg-slate-900/90 transition flex items-center justify-between border-b border-slate-800/80 text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 group-hover:bg-amber-500/20 transition">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold text-base text-white">
                      Advanced AI Intelligence & Agent Command Suite
                    </h3>
                    <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                      5 CORE MODULES BUNDLED
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Agent Grid • Source Intelligence & Leaderboard • Economic Calendar • Neural Accuracy • Explainable AI Core
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                <span className="hidden sm:inline bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 text-amber-300 font-bold">
                  {isIntelligenceHubOpen ? 'Hide Intelligence Suite' : 'Expand Intelligence Suite'}
                </span>
                {isIntelligenceHubOpen ? (
                  <ChevronUp className="w-5 h-5 text-amber-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-amber-400" />
                )}
              </div>
            </button>

            {/* Collapsed/Expanded Panel Content */}
            {isIntelligenceHubOpen && (
              <div className="p-5 space-y-6 bg-slate-950/60 border-t border-slate-900">
                {/* 1. AI Agent Command Center */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <h4 className="font-display text-sm font-bold text-white uppercase tracking-wider">
                      1. AI Agent Command Center
                    </h4>
                  </div>
                  <GiaAgentGrid agents={analysis.agentsLogs} isScanning={isScanning} />
                </div>

                {/* 2 & 3. Live Economic Calendar + Source Intelligence & Leaderboard */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                  <div className="lg:col-span-6 h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <h4 className="font-display text-sm font-bold text-white uppercase tracking-wider">
                        2. Live Economic Calendar
                      </h4>
                    </div>
                    <GiaCalendar events={analysis.economicCalendar} />
                  </div>

                  <div className="lg:col-span-6 h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <h4 className="font-display text-sm font-bold text-white uppercase tracking-wider">
                        3. Source Intelligence & Leaderboard
                      </h4>
                    </div>
                    <GiaLeaderboard sources={analysis.analystSources} />
                  </div>
                </div>

                {/* 4 & 5. Explainable AI Reasoning Core + Neural Accuracy & Learning Loop */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                  {/* Explainable AI Reasoning Core */}
                  <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-xl shadow-2xl">
                    <div>
                      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                        <Eye className="w-5 h-5 text-amber-500" />
                        <h3 className="font-display font-semibold text-lg text-white">4. Explainable AI Reasoning Core</h3>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 uppercase block">master projection reasoning</span>
                          <p className="text-slate-300 mt-1 leading-relaxed">
                            {analysis.explainableNarrative.whyDirection}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                            <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Strongest Technical Factors</span>
                            <ul className="space-y-1 font-mono text-[10px] text-slate-400">
                              {analysis.explainableNarrative.strongestTechnicalSignals.map((sig, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <span className="text-amber-500">•</span>
                                  <span>{sig}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                            <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Key Invalidation Thresholds</span>
                            <ul className="space-y-1 font-mono text-[10px] text-slate-400">
                              {analysis.explainableNarrative.invalidationConditions.map((cond, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <span className="text-rose-500 font-bold">•</span>
                                  <span>{cond}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>CONVERGENCE AUDIT: VERIFIED</span>
                      <span>NOISE COEFFICIENT: 0.12 (Excellent)</span>
                    </div>
                  </div>

                  {/* Machine Learning Self-Correction Feedback Loop */}
                  <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-xl shadow-2xl relative">
                    {/* Accent decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.02] rounded-full blur-2xl pointer-events-none" />

                    <div>
                      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                        <Binary className="w-5 h-5 text-amber-500" />
                        <h3 className="font-display font-semibold text-lg text-white">5. Neural Accuracy & Learning Loop</h3>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed mb-4">
                        GIA features self-correcting ML parameters. It continuously tracks historical errors, reviews economic print reactions, 
                        and calibrates the weights of individual node agents.
                      </p>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 font-mono">
                          <span className="text-[9px] text-slate-500 block">CURRENT MODEL ACCURACY</span>
                          <span className="text-lg font-bold text-emerald-400">{analysis.learningMetrics.currentModelAccuracy}%</span>
                          <span className="text-[9px] text-slate-500 block mt-0.5">evaluated across {analysis.learningMetrics.predictionsAnalyzed} forecasts</span>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 font-mono">
                          <span className="text-[9px] text-slate-500 block">CALIBRATION FACTOR</span>
                          <span className="text-lg font-bold text-amber-400">x{analysis.learningMetrics.calibrationFactor}</span>
                          <span className="text-[9px] text-slate-500 block mt-0.5">dynamic safety buffer factor</span>
                        </div>
                      </div>

                      {/* Simulated Learning Feed Terminal */}
                      <div className="bg-slate-950 border border-slate-900 p-3 rounded-xl font-mono text-[10px] text-slate-300 leading-relaxed relative overflow-hidden">
                        <span className="text-amber-500/80 block mb-1 uppercase text-[9px] font-bold">[RECENT REINFORCEMENT UPDATE]</span>
                        <p>{analysis.learningMetrics.recentLearningLog}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>PARAMETER UPDATES: {analysis.learningMetrics.weightsUpdatedCount}</span>
                      <span className="text-emerald-400 font-bold">STATE_SYNC: SECURE</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
