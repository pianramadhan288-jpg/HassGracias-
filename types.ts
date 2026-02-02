

export enum AnalysisVerdict {
  ACCUMULATE = 'ACCUMULATE',
  REDUCE = 'REDUCE',
  AVOID = 'AVOID',
  WAIT = 'WAIT & SEE'
}

export type CapitalTier = 'MICRO' | 'RETAIL' | 'HIGH_NET' | 'INSTITUTIONAL';
export type RiskProfile = 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';

export interface AppConfig {
  defaultTier: CapitalTier;
  riskProfile: RiskProfile;
  userName: string;
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface ImageAsset {
  base64: string;
  mimeType: string;
  preview: string;
  id: string;
}

export interface StockAnalysisInput {
  ticker: string;
  price: string;
  capital: string;
  capitalTier: CapitalTier;
  riskProfile: RiskProfile;
  // VISION DATA - Now Array
  images: ImageAsset[];
  // QUANTITATIVE DATA
  rawIntelligenceData: string;
}

export interface TradePlan {
  verdict: string;
  entry: string;
  tp: string;
  sl: string;
  reasoning: string;
  status: 'RECOMMENDED' | 'POSSIBLE' | 'WAIT & SEE' | 'FORBIDDEN';
}

export interface AnalysisResult {
  id: string;
  timestamp: number;
  ticker: string;
  evidenceImages: string[]; // Store array of preview strings
  priceInfo: {
    current: string;
    bandarAvg: string;
    diffPercent: number;
    status: string;
  };
  marketCapAnalysis: {
    category: string;
    behavior: string;
  };
  supplyDemand: {
    bidStrength: number;
    offerStrength: number;
    verdict: string;
  };
  prediction: {
    direction: 'UP' | 'DOWN' | 'CONSOLIDATE' | 'UNKNOWN';
    probability: number;
    reasoning: string;
  };
  stressTest: {
    passed: boolean;
    score: number;
    details: string;
  };
  brokerAnalysis: {
    classification: string;
    insight: string;
  };
  summary: string;
  bearCase: string;
  strategy: {
    bestTimeframe: 'SHORT' | 'MEDIUM' | 'LONG';
    shortTerm: TradePlan;
    mediumTerm: TradePlan;
    longTerm: TradePlan;
  };
  fullAnalysis: string;
  sources: GroundingSource[];
}

export interface ConsistencyResult {
  ticker: string;
  dataPoints: number;
  trendVerdict: 'IMPROVING' | 'STABLE' | 'DEGRADING' | 'VOLATILE';
  consistencyScore: number;
  analysis: string;
  actionItem: string;
}
