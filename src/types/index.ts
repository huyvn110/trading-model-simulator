// Factor interface - represents a single factor in the simulation
export interface Factor {
    id: string;
    name: string;
    selected: boolean;
    order: number;
}

// Single simulation result from one iteration
export interface SimulationIteration {
    selectedFactorIds: string[];
    modelKey: string; // sorted factor names joined, e.g., "A+B+C"
}

// Complete simulation session
export interface SimulationSession {
    id: string;
    timestamp: number;
    factorsSnapshot: Factor[];
    iterations: SimulationIteration[];
    totalIterations: number;
    modelStats: ModelStats[];
}

// Model statistics
export interface ModelStats {
    modelKey: string;
    factorNames: string[];
    count: number;
    percentage: number;
}

// Simulation settings
export interface SimulationSettings {
    iterationCount: number;
    speed: number; // delay in ms between iterations
    minFactorsPerIteration: number;
    maxFactorsPerIteration: number;
}

// Simulation state
export type SimulationState = 'idle' | 'running' | 'paused' | 'completed';

// ===============================
// LIVE TRADING TYPES
// ===============================

// Trading Model with predefined factors
export interface TradingModel {
    id: string;
    name: string;
    factors: string[];
    checkedFactors: string[]; // factors that are checked/confirmed before trading
    order: number;
}

// Measurement mode for trades
export type MeasurementMode = 'RR' | '$' | '%';

// Live trade entry
export interface LiveTrade {
    id: string;
    timestamp: number;
    modelId: string;
    modelName: string;
    measurementValue: number;
    profitRatio?: number;  // For win trades: multiplier (RR) or percentage ($/%)
    result: 'win' | 'lose';
    notes?: string;
    images?: string[];  // base64 data URLs
}

// Live trading session
export interface LiveSession {
    id: string;
    startTime: number;
    endTime?: number;
    measurementMode: MeasurementMode;
    trades: LiveTrade[];
}

// Model statistics for live trading
export interface LiveModelStats {
    modelId: string;
    modelName: string;
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: number;
    totalProfit: number;
    totalLoss: number;
}
