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

// Test trade entry
export interface TestTrade {
    id: string;
    modelKey: string; // "factorId1+factorId2"
    factorIds: string[];
    timestamp: number;
    tradeDate: string;  // Format: YYYY-MM-DD
    tradeTime?: string; // New: HH:mm
    market?: string;    // New: mgc, mNQ...
    session?: string;   // New: Asia, London, NY
    bias?: 'long' | 'short'; // New
    
    // Measurement (Legacy & New)
    measurementValue?: number; // Legacy
    pnl?: number;              // New
    rr?: number;               // New
    rrValue?: number;          // New

    result: 'win' | 'lose';
    
    // Trading Psychology & Plan (New)
    followPlan?: 'yes' | 'no';
    emotion?: string;
    mistake?: string;

    notes?: string;
    images?: string[];
    content?: ContentBlock[];
}

// Live trade entry
export interface LiveTrade {
    id: string;
    timestamp: number;
    tradeDate: string;  // Format: YYYY-MM-DD
    tradeTime?: string; // New: HH:mm
    market?: string;    // New: mgc, mNQ...
    session?: string;   // New: Asia, London, NY
    bias?: 'long' | 'short'; // New
    modelId: string;
    modelName: string;
    
    // Measurement (Legacy & New)
    measurementValue?: number; // Legacy
    profitRatio?: number;      // Legacy
    pnl?: number;              // New
    rr?: number;               // New
    rrValue?: number;          // New

    result: 'win' | 'lose';
    
    // Trading Psychology & Plan (New)
    followPlan?: 'yes' | 'no';
    emotion?: string;
    mistake?: string;

    notes?: string;  // Legacy - keep for backward compatibility
    images?: string[];  // Legacy - keep for backward compatibility
    content?: ContentBlock[];  // New: Notion-like content blocks
}

// Content block for Notion-like editor
export interface ContentBlock {
    id: string;
    type: 'text' | 'image';
    value: string;  // text content or base64 image data
}


// Live trading session
export interface LiveSession {
    id: string;
    name?: string;
    startTime: number;
    endTime?: number;
    initialBalance: number;  // Số dư ban đầu
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
