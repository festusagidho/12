/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  orderBlock?: {
    type: 'bullish' | 'bearish';
    level: number;
    size: number;
  };
  fvg?: {
    type: 'bullish' | 'bearish';
    top: number;
    bottom: number;
  };
}

export type AgentId =
  | 'web_intel'
  | 'news_intel'
  | 'tech_analysis'
  | 'fundamental_analysis'
  | 'macro_agent'
  | 'sentiment_analysis'
  | 'institutional_research'
  | 'risk_management'
  | 'trade_generation'
  | 'forecast_validation'
  | 'learning_agent'
  | 'source_ranking'
  | 'confidence_calibration'
  | 'master_decision';

export interface AgentLog {
  id: AgentId;
  name: string;
  role: string;
  status: 'idle' | 'running' | 'completed';
  thought: string;
  timestamp: string;
  influence: number; // Percentage contribution to Master Decision
}

export interface AnalystSource {
  id: string;
  name: string;
  type: 'Analyst' | 'Institution' | 'Media';
  accuracyScore: number; // 0 - 100 dynamic
  reputation: 'High' | 'Medium' | 'Low';
  predictionCount: number;
  successfulPredictions: number;
  bias: 'Bullish' | 'Bearish' | 'Neutral';
  latestOpinion: string;
  freshness: string;
}

export interface EconomicEvent {
  id: string;
  time: string;
  currency: string;
  event: string;
  importance: 'High' | 'Medium' | 'Low';
  actual: string;
  forecast: string;
  previous: string;
  impact: 'Bullish' | 'Bearish' | 'Neutral';
}

export interface MarketTicker {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface TradeSetup {
  setupType?: 'Primary Scalp' | 'Macro Swing' | 'Breakout Sweep';
  title?: string;
  direction: 'BUY' | 'SELL';
  entryZone: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskRewardRatio: number;
  probability: number; // 0 - 100
  confidence: number;  // 0 - 100
  reasoning: string[];
  technicalConfirmation: string[];
  fundamentalConfirmation: string[];
  sentimentConfirmation: string[];
  macroConfirmation: string[];
  institutionalConfirmation: string[];
  riskFactors: string[];
  tradeGrade: 'A+' | 'A' | 'B+' | 'B';
}

export interface TimeframeForecast {
  timeframe: string;
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  bullishProb: number;
  bearishProb: number;
  confidenceScore: number;
  expectedHigh: number;
  expectedLow: number;
  expectedClose: number;
  volatilityEstimate: 'Low' | 'Medium' | 'High';
  riskRating: 'Low' | 'Moderate' | 'High' | 'Extreme';
  bestSession: 'LDN' | 'NY' | 'ASIA' | 'LDN+NY';
  expectedMomentum: 'Strong' | 'Moderate' | 'Weak';
  keySupport: number;
  keyResistance: number;
  invalidationLevel: number;
}

export type MacroEventType = 'CPI' | 'NFP' | 'FOMC';

export interface MacroNewsEventPrediction {
  eventType: MacroEventType;
  eventName: string;
  releaseDate: string;
  releaseDateIso?: string;
  daysRemainingText: string;
  isNextUp: boolean;
  previousPrint: string;
  consensusForecast: string;
  aiPredictedPrint: string;
  predictedDirection: 'BUY' | 'SELL';
  targetPriceShift: string;
  probabilityScore: number;
  directionSummary: string;
  impactOnGoldReasoning: string;
  secondaryMetric1: { label: string; value: string };
  secondaryMetric2: { label: string; value: string };
  agentConsensus: {
    agent: string;
    bias: 'Bullish Gold (BUY)' | 'Bearish Gold (SELL)' | 'Neutral / Swing';
    reason: string;
  }[];
  scenarioMatrix: {
    scenario: string;
    dataRange: string;
    goldReaction: string;
    probability: number;
    direction: 'BUY' | 'SELL' | 'NEUTRAL';
  }[];
}

export interface NfpPrediction {
  releaseDate: string;
  releaseDateIso?: string;
  previousPrint: string;
  consensusForecast: string;
  aiPredictedPrint: string;
  predictedDirection: 'BEARISH_DOLLAR_BULLISH_ASSET' | 'BULLISH_DOLLAR_BEARISH_ASSET' | 'NEUTRAL_MIXED';
  unemploymentRateForecast: string;
  hourlyEarningsForecast: string;
  probabilityScore: number; // 0 - 100
  assetImpactTarget: string;
  directionSummary: string;
  agentConsensus: {
    agent: string;
    bias: 'Beat' | 'Miss' | 'In-Line';
    reason: string;
  }[];
  scenarioMatrix: {
    scenario: string;
    payrollRange: string;
    assetReaction: string;
    probability: number;
    bias: 'Bullish' | 'Bearish' | 'Neutral';
  }[];
}

export interface GiaAnalysisReport {
  timestamp: string;
  goldPrice: number;
  liveTrend: 'Strong Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Strong Bearish';
  scores: {
    technical: number; // 0 - 100
    fundamental: number;
    sentiment: number;
    macro: number;
    risk: number;
    volatility: number;
    confidence: number;
  };
  sentimentBias: {
    bullish: number; // e.g. 62%
    bearish: number;
    neutral: number;
    institutionalBias: 'Bullish' | 'Bearish' | 'Neutral' | 'Strong Bullish' | 'Strong Bearish';
    retailBias: 'Bullish' | 'Bearish' | 'Neutral';
  };
  newsInsights: {
    title: string;
    source: string;
    time: string;
    summary: string;
    impact: 'High' | 'Medium' | 'Low';
    bias: 'Bullish' | 'Bearish' | 'Neutral';
    unique: boolean;
  }[];
  agentsLogs: AgentLog[];
  analystSources: AnalystSource[];
  economicCalendar: EconomicEvent[];
  forecasts: TimeframeForecast[];
  tradeSetup: TradeSetup;
  alternativeSetups?: TradeSetup[];
  nfpPrediction?: NfpPrediction;
  macroNewsPredictor?: MacroNewsEventPrediction[];
  nextUpcomingEvent?: MacroEventType;
  explainableNarrative: {
    whyDirection: string;
    contributingSources: string[];
    disagreeingSources: string[];
    confidenceExplanation: string;
    strongestTechnicalSignals: string[];
    strongestMacroFactors: string[];
    invalidationConditions: string[];
  };
  learningMetrics: {
    predictionsAnalyzed: number;
    accuracyTrend: number[]; // Accuracy percentages over last 10 releases
    currentModelAccuracy: number; // Current average score
    calibrationFactor: number; // Adjusts confidence calculations
    weightsUpdatedCount: number;
    recentLearningLog: string;
  };
}

export interface RecordedTrade {
  id: string;
  timestamp: string;
  symbol: string;
  title: string;
  setupType: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  entryZone: string;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskRewardRatio: number;
  tradeGrade: string;
  status: 'ACTIVE' | 'TP1_HIT' | 'TP2_HIT' | 'TP3_HIT' | 'SL_HIT' | 'CLOSED';
  outcomeTime?: string;
  closePrice?: number;
  pnlPoints?: number;
}

export interface TradeHistorySummary {
  totalTrades: number;
  activeCount: number;
  tpHitCount: number;
  slHitCount: number;
  winRate: number;
  totalPnlPoints: number;
}

