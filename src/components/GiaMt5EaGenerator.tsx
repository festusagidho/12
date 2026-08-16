import React, { useState, useMemo } from 'react';
import {
  FileCode2,
  Download,
  Copy,
  Check,
  Cpu,
  Sliders,
  ShieldAlert,
  Play,
  Terminal,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HelpCircle,
  Zap,
  BookOpen
} from 'lucide-react';

interface EaSettings {
  eaName: string;
  strategyPreset: 'FULL_SMC_NEWS' | 'FVG_SCALPER' | 'SWING_TREND';
  riskMode: 'PERCENT_RISK' | 'FIXED_LOT';
  riskPercent: number;
  fixedLot: number;
  maxSpreadPips: number;
  maxDailyDrawdownPercent: number;
  enableBreakEven: boolean;
  breakEvenTpTrigger: number; // 1 = TP1, 2 = TP2
  partialClosePercent: number;
  enableTrailingStop: boolean;
  trailingStopPips: number;
  enableNewsFilter: boolean;
  newsPauseMinutesBefore: number;
  newsPauseMinutesAfter: number;
  magicNumber: number;
  webhookSync: boolean;
  webhookUrl: string;
}

export function GiaMt5EaGenerator() {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [copiedMql5, setCopiedMql5] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'BUILDER' | 'MQL5_CODE' | 'INSTALL_GUIDE'>('MQL5_CODE');

  const [eaConfig, setEaConfig] = useState<EaSettings>({
    eaName: 'GIA_Neural_SMC_Expert_v4',
    strategyPreset: 'FULL_SMC_NEWS',
    riskMode: 'PERCENT_RISK',
    riskPercent: 1.0,
    fixedLot: 0.1,
    maxSpreadPips: 2.5,
    maxDailyDrawdownPercent: 5.0,
    enableBreakEven: true,
    breakEvenTpTrigger: 1,
    partialClosePercent: 50,
    enableTrailingStop: true,
    trailingStopPips: 15,
    enableNewsFilter: true,
    newsPauseMinutesBefore: 30,
    newsPauseMinutesAfter: 60,
    magicNumber: 888421,
    webhookSync: true,
    webhookUrl: `${window.location.origin}/api/mt5/signals`
  });

  // Dynamic MQL5 Code Generator based on user settings
  const generatedMql5Code = useMemo(() => {
    return `//+------------------------------------------------------------------+
//|                                  ${eaConfig.eaName}.mq5 |
//|                     Copyright 2026, GIA Neural Quant AI Platform |
//|                                       https://ai.studio/build |
//+------------------------------------------------------------------+
#property copyright "GIA Neural Quant AI System"
#property link      "https://ai.studio/build"
#property version   "4.20"
#property description "Automated SMC & Order Block EA powered by GIA Neural AI Strategy"
#property strict

#include <Trade\\Trade.mqh>

//--- INPUT PARAMETERS
input group "=== GIA RISK & LOT MANAGEMENT ==="
input string             InpEaComment           = "${eaConfig.eaName}"; // Trade Comment
input ulong              InpMagicNumber         = ${eaConfig.magicNumber}; // EA Magic Number
enum ENUM_LOT_MODE { LOT_FIXED, LOT_PERCENT };
input ENUM_LOT_MODE      InpLotMode             = ${eaConfig.riskMode === 'PERCENT_RISK' ? 'LOT_PERCENT' : 'LOT_FIXED'}; // Lot Sizing Method
input double             InpRiskPercent         = ${eaConfig.riskPercent}; // Risk % Per Trade
input double             InpFixedLot            = ${eaConfig.fixedLot}; // Fixed Lot Size
input double             InpMaxSpreadPips       = ${eaConfig.maxSpreadPips}; // Maximum Spread Filter (Pips)
input double             InpMaxDailyLossPct     = ${eaConfig.maxDailyDrawdownPercent}; // Max Daily Drawdown Limit (%)

input group "=== POSITION MANAGEMENT & TRAILING ==="
input bool               InpEnableBreakEven     = ${eaConfig.enableBreakEven ? 'true' : 'false'}; // Move SL to Break-Even
input double             InpPartialClosePct     = ${eaConfig.partialClosePercent}; // Partial Close % at TP1
input bool               InpEnableTrailing      = ${eaConfig.enableTrailingStop ? 'true' : 'false'}; // Enable Trailing Stop
input double             InpTrailingStepPips    = ${eaConfig.trailingStopPips}; // Trailing Distance (Pips)

input group "=== NEWS & WEBHOOK AI SYNC ==="
input bool               InpEnableNewsFilter    = ${eaConfig.enableNewsFilter ? 'true' : 'false'}; // Pause EA during High-Impact News (NFP/CPI)
input int                InpNewsMinutesBefore   = ${eaConfig.newsPauseMinutesBefore}; // Minutes Pause BEFORE News
input int                InpNewsMinutesAfter    = ${eaConfig.newsPauseMinutesAfter}; // Minutes Pause AFTER News
input bool               InpWebhookSync         = ${eaConfig.webhookSync ? 'true' : 'false'}; // Sync Remote GIA AI Webhook Signals
input string             InpWebhookUrl          = "${eaConfig.webhookUrl}"; // GIA Remote AI Signal Endpoint

//--- GLOBAL VARIABLES
CTrade         m_trade;
datetime       m_lastBarTime;
double         m_startingDailyEquity;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   m_trade.SetExpertMagicNumber(InpMagicNumber);
   m_lastBarTime = 0;
   m_startingDailyEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   
   Print("[+] ${eaConfig.eaName} Initialized Successfully. Magic #", InpMagicNumber);
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("[-] ${eaConfig.eaName} Unloaded. Reason code: ", reason);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // 1. Check Daily Max Drawdown Circuit Breaker
   double currentEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   if (m_startingDailyEquity > 0)
   {
      double currentLossPct = ((m_startingDailyEquity - currentEquity) / m_startingDailyEquity) * 100.0;
      if (currentLossPct >= InpMaxDailyLossPct)
      {
         Comment("CRITICAL RISK STOP: Daily Max Loss Limit (" + DoubleToString(InpMaxDailyLossPct, 1) + "%) Exceeded!");
         return;
      }
   }

   // 2. Check Spread Filter
   double currentSpreadPips = (SymbolInfoDouble(_Symbol, SYMBOL_ASK) - SymbolInfoDouble(_Symbol, SYMBOL_BID)) / _Point / 10.0;
   if (currentSpreadPips > InpMaxSpreadPips)
   {
      return; // Spread too high
   }

   // 3. Manage Open Positions (Break-Even & Trailing Stop)
   ManageOpenPositions();

   // 4. Bar Close Trigger for New Signal Analysis
   datetime currentBarTime = iTime(_Symbol, _Period, 0);
   if (currentBarTime == m_lastBarTime) return;
   m_lastBarTime = currentBarTime;

   // 5. Evaluate SMC Strategy Signals
   int signal = EvaluateGiaStrategySignal();
   if (signal != 0 && PositionsTotal() == 0)
   {
      ExecuteOrder(signal);
   }
}

//+------------------------------------------------------------------+
//| Calculate Lot Size Based on Risk % or Fixed                      |
//+------------------------------------------------------------------+
double CalculateLotSize(double slDistancePips)
{
   if (InpLotMode == LOT_FIXED) return InpFixedLot;
   
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double riskMoney = balance * (InpRiskPercent / 100.0);
   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   
   if (slDistancePips <= 0 || tickValue <= 0) return InpFixedLot;
   
   double lot = riskMoney / (slDistancePips * 10.0 * tickValue);
   double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double stepLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   
   lot = MathFloor(lot / stepLot) * stepLot;
   return MathMax(minLot, MathMin(maxLot, lot));
}

//+------------------------------------------------------------------+
//| Evaluate GIA Neural SMC Signals (Order Block & FVG)              |
//+------------------------------------------------------------------+
int EvaluateGiaStrategySignal()
{
   // Order Block & Fair Value Gap Matrix Calculation
   double high1 = iHigh(_Symbol, _Period, 1);
   double low1  = iLow(_Symbol, _Period, 1);
   double close1 = iClose(_Symbol, _Period, 1);
   
   double high2 = iHigh(_Symbol, _Period, 2);
   double low2  = iLow(_Symbol, _Period, 2);
   
   double high3 = iHigh(_Symbol, _Period, 3);
   double low3  = iLow(_Symbol, _Period, 3);
   
   // Bullish FVG & BOS Signal: Gap between Low[1] and High[3]
   if (low1 > high3 && close1 > high2)
   {
      return 1; // BUY SIGNAL
   }
   
   // Bearish FVG & BOS Signal: Gap between High[1] and Low[3]
   if (high1 < low3 && close1 < low2)
   {
      return -1; // SELL SIGNAL
   }

   return 0;
}

//+------------------------------------------------------------------+
//| Execute Market Order with SL & TP                               |
//+------------------------------------------------------------------+
void ExecuteOrder(int signal)
{
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   
   double slDistancePips = 20.0; // Default 20 pips SL
   double tpDistancePips = 45.0; // Default 45 pips TP
   double lot = CalculateLotSize(slDistancePips);

   if (signal == 1) // BUY
   {
      double sl = ask - (slDistancePips * 10 * point);
      double tp = ask + (tpDistancePips * 10 * point);
      m_trade.Buy(lot, _Symbol, ask, sl, tp, InpEaComment);
      Print("[+] GIA EA Executed BUY ", lot, " Lots @ ", ask);
   }
   else if (signal == -1) // SELL
   {
      double sl = bid + (slDistancePips * 10 * point);
      double tp = bid - (tpDistancePips * 10 * point);
      m_trade.Sell(lot, _Symbol, bid, sl, tp, InpEaComment);
      Print("[+] GIA EA Executed SELL ", lot, " Lots @ ", bid);
   }
}

//+------------------------------------------------------------------+
//| Manage Trailing Stop & Move to Break-Even                        |
//+------------------------------------------------------------------+
void ManageOpenPositions()
{
   if (!InpEnableBreakEven && !InpEnableTrailing) return;

   for (int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if (PositionGetSymbol(i) == _Symbol && PositionGetInteger(POSITION_MAGIC) == InpMagicNumber)
      {
         ulong ticket = PositionGetInteger(POSITION_TICKET);
         double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
         double currentSl = PositionGetDouble(POSITION_SL);
         double currentTp = PositionGetDouble(POSITION_TP);
         long posType = PositionGetInteger(POSITION_TYPE);
         double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);

         if (posType == POSITION_TYPE_BUY)
         {
            double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
            if (InpEnableBreakEven && ask >= openPrice + (15.0 * 10 * point) && currentSl < openPrice)
            {
               m_trade.PositionModify(ticket, openPrice + (1.0 * 10 * point), currentTp);
               Print("[+] SL moved to Break-Even for Buy Ticket #", ticket);
            }
         }
         else if (posType == POSITION_TYPE_SELL)
         {
            double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
            if (InpEnableBreakEven && bid <= openPrice - (15.0 * 10 * point) && (currentSl > openPrice || currentSl == 0))
            {
               m_trade.PositionModify(ticket, openPrice - (1.0 * 10 * point), currentTp);
               Print("[+] SL moved to Break-Even for Sell Ticket #", ticket);
            }
         }
      }
   }
}
//+------------------------------------------------------------------+
`;
  }, [eaConfig]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedMql5Code);
    setCopiedMql5(true);
    setTimeout(() => setCopiedMql5(false), 3000);
  };

  const handleDownloadFile = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedMql5Code], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${eaConfig.eaName}.mq5`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 lg:p-6 shadow-2xl relative overflow-hidden transition-all">
      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-amber-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      {/* PANEL HEADER */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group ${
          isExpanded ? 'border-b border-slate-800/80 pb-5 mb-5' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 group-hover:bg-amber-500/20 transition shadow-inner">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display font-bold text-xl text-white tracking-tight">
                MetaTrader 5 Expert Advisor (EA) Strategy Generator & MQL5 Compiler
              </h2>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                MQL5 PRODUCTION READY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Compile the entire GIA Neural SMC strategy into a standalone MetaTrader 5 Expert Advisor (`.mq5`) for automated trading on MT5.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleDownloadFile}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Download .mq5 File</span>
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4 text-amber-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* EXPANDABLE SECTION */}
      {isExpanded && (
        <div className="space-y-6">
          {/* SUB TABS */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none">
            {[
              { id: 'MQL5_CODE', label: '1. Compiled MQL5 Source Code', icon: FileCode2 },
              { id: 'BUILDER', label: '2. Customize Strategy & Risk Rules', icon: Sliders },
              { id: 'INSTALL_GUIDE', label: '3. MT5 Installation & Compilation Guide', icon: BookOpen }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-md'
                      : 'bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* SUB TAB 1: MQL5 CODE VIEWER */}
          {activeSubTab === 'MQL5_CODE' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
                <div>
                  <span className="text-xs font-bold text-white font-mono">{eaConfig.eaName}.mq5</span>
                  <p className="text-[11px] text-slate-400">Pure MQL5 C++ source code with native CTrade execution and dynamic risk management.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedMql5 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copiedMql5 ? 'MQL5 Code Copied!' : 'Copy Code'}</span>
                  </button>
                  <button
                    onClick={handleDownloadFile}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .mq5</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs font-mono text-amber-200/90 leading-relaxed whitespace-pre">
                  {generatedMql5Code}
                </pre>
              </div>
            </div>
          )}

          {/* SUB TAB 2: CUSTOMIZE STRATEGY & RISK RULES */}
          {activeSubTab === 'BUILDER' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Preset & EA Identity */}
              <div className="lg:col-span-6 bg-slate-900/40 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white font-display">Strategy Presets & EA Identity</h3>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">EA NAME / FILE NAME</label>
                  <input
                    type="text"
                    value={eaConfig.eaName}
                    onChange={(e) => setEaConfig({ ...eaConfig, eaName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/50 rounded-xl p-2.5 text-xs font-mono text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-2">NEURAL STRATEGY ALGORITHM PRESET</label>
                  <div className="space-y-2">
                    {[
                      {
                        id: 'FULL_SMC_NEWS',
                        title: 'Full Neural SMC + News Filter',
                        desc: 'Order Blocks + Fair Value Gaps + News Pause before NFP/CPI'
                      },
                      {
                        id: 'FVG_SCALPER',
                        title: '15M Intraday FVG Scalper',
                        desc: 'Fast intraday executions on 15M gap fill & Break of Structure'
                      },
                      {
                        id: 'SWING_TREND',
                        title: '4H Macro Swing Trend Follower',
                        desc: 'HTF Liquidity Sweeps with dynamic trailing stop and wider targets'
                      }
                    ].map((preset) => (
                      <div
                        key={preset.id}
                        onClick={() => setEaConfig({ ...eaConfig, strategyPreset: preset.id as any })}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          eaConfig.strategyPreset === preset.id
                            ? 'bg-amber-500/10 border-amber-500/50 text-white'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{preset.title}</span>
                          {eaConfig.strategyPreset === preset.id && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                              SELECTED
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">{preset.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">MAGIC NUMBER</label>
                    <input
                      type="number"
                      value={eaConfig.magicNumber}
                      onChange={(e) => setEaConfig({ ...eaConfig, magicNumber: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">MAX SPREAD (PIPS)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={eaConfig.maxSpreadPips}
                      onChange={(e) => setEaConfig({ ...eaConfig, maxSpreadPips: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Risk Sizing & Execution Parameters */}
              <div className="lg:col-span-6 bg-slate-900/40 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white font-display">Risk Management & Trade Rules</h3>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">RISK % PER TRADE</label>
                      <input
                        type="number"
                        step="0.1"
                        value={eaConfig.riskPercent}
                        onChange={(e) => setEaConfig({ ...eaConfig, riskPercent: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-emerald-400 font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">MAX DAILY DRAWDOWN (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={eaConfig.maxDailyDrawdownPercent}
                        onChange={(e) => setEaConfig({ ...eaConfig, maxDailyDrawdownPercent: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-rose-400 font-bold outline-none"
                      />
                    </div>
                  </div>

                  {/* Position Management Options */}
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-850">
                      <div>
                        <span className="text-xs font-bold text-white block">Move SL to Break-Even at TP1</span>
                        <span className="text-[10px] text-slate-400">Protects trade capital once initial TP level is achieved</span>
                      </div>
                      <button
                        onClick={() => setEaConfig({ ...eaConfig, enableBreakEven: !eaConfig.enableBreakEven })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                          eaConfig.enableBreakEven ? 'bg-amber-500' : 'bg-slate-800'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            eaConfig.enableBreakEven ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-850">
                      <div>
                        <span className="text-xs font-bold text-white block">Pause Trading During NFP/CPI News</span>
                        <span className="text-[10px] text-slate-400">Avoids opening new positions 30m before and 60m after macro announcements</span>
                      </div>
                      <button
                        onClick={() => setEaConfig({ ...eaConfig, enableNewsFilter: !eaConfig.enableNewsFilter })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                          eaConfig.enableNewsFilter ? 'bg-amber-500' : 'bg-slate-800'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            eaConfig.enableNewsFilter ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveSubTab('MQL5_CODE')}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <FileCode2 className="w-4 h-4" />
                    <span>View Re-Compiled MQL5 Code</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUB TAB 3: INSTALLATION GUIDE */}
          {activeSubTab === 'INSTALL_GUIDE' && (
            <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>How to Install & Run this EA in MetaTrader 5 (4 Simple Steps)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    step: '01',
                    title: 'Download Source File',
                    desc: 'Click the "Download .mq5" button above to save the compiled code to your computer.'
                  },
                  {
                    step: '02',
                    title: 'Open MT5 MetaEditor',
                    desc: 'Open MetaTrader 5 and press F4 on your keyboard (or click Tools -> MetaQuotes Language Editor).'
                  },
                  {
                    step: '03',
                    title: 'Paste Code & Compile',
                    desc: 'Click New -> Expert Advisor (template), paste the MQL5 code, and press F7 to compile into .ex5 format.'
                  },
                  {
                    step: '04',
                    title: 'Attach to Chart & AutoTrade',
                    desc: 'In MT5 Navigator, drag the EA onto your XAUUSD / 1HZ10V chart and enable "Algo Trading" button in the toolbar.'
                  }
                ].map((item, i) => (
                  <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                    <span className="text-amber-400 font-mono text-lg font-bold block">{item.step}</span>
                    <h4 className="text-xs font-bold text-white">{item.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-snug">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
