export function calculateSMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const slice = prices.slice(prices.length - period);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return sum / period;
}

export function calculateEMA(prices: number[], period: number): (number | null)[] {
  if (prices.length < period) return new Array(prices.length).fill(null);
  const k = 2 / (period + 1);
  const emaArray: (number | null)[] = new Array(period - 1).fill(null);
  
  const initialSlice = prices.slice(0, period);
  let ema = initialSlice.reduce((a, b) => a + b, 0) / period;
  emaArray.push(ema);
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * k + ema;
    emaArray.push(ema);
  }
  
  return emaArray;
}

export function calculateMACD(prices: number[]): { macd: number | null, signal: number | null, hist: number | null } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  if (ema26.length === 0 || ema26[ema26.length - 1] === null) return { macd: null, signal: null, hist: null };
  
  const macdLine: (number | null)[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (ema12[i] !== null && ema26[i] !== null) {
      macdLine.push((ema12[i] as number) - (ema26[i] as number));
    } else {
      macdLine.push(null);
    }
  }
  
  const validMacd = macdLine.filter(m => m !== null) as number[];
  const signalEma = calculateEMA(validMacd, 9);
  
  if (validMacd.length === 0 || signalEma.length === 0) return { macd: null, signal: null, hist: null };
  
  const currentMacd = validMacd[validMacd.length - 1];
  const currentSignal = signalEma[signalEma.length - 1];
  
  if (currentMacd === null || currentSignal === null) return { macd: null, signal: null, hist: null };
  
  return {
    macd: currentMacd,
    signal: currentSignal,
    hist: currentMacd - currentSignal
  };
}

export function calculateBollingerBands(prices: number[], period = 20, multiplier = 2) {
  if (prices.length < period) return { upper: null, lower: null, middle: null };
  const slice = prices.slice(prices.length - period);
  const middle = slice.reduce((a, b) => a + b, 0) / period;
  
  const variance = slice.reduce((a, b) => a + Math.pow(b - middle, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  
  return {
    upper: middle + stdDev * multiplier,
    lower: middle - stdDev * multiplier,
    middle
  };
}

export function calculateRSI(prices: number[], period: number = 14): number | null {
  if (prices.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - change) / period;
    }
  }

  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

export function analyzeVSA(prices: number[], volumes: number[]) {
  if (prices.length < 20 || volumes.length < 20) return { state: 'NEUTRAL' as const, text: 'Thanh khoản TB' };
  
  const currentVol = volumes[volumes.length - 1];
  const currentPrice = prices[prices.length - 1];
  const prevPrice = prices[prices.length - 2];
  
  const volSlice = volumes.slice(volumes.length - 20, volumes.length);
  const avgVol = volSlice.reduce((a, b) => a + b, 0) / 20;
  
  if (currentVol > avgVol * 1.5) {
    if (currentPrice > prevPrice) return { state: 'ACCUMULATION' as const, text: 'Dòng tiền vào' };
    else return { state: 'DISTRIBUTION' as const, text: 'Bị bán tháo' };
  }
  
  if (currentVol < avgVol * 0.5) return { state: 'NEUTRAL' as const, text: 'Cạn cung' };
  
  return { state: 'NEUTRAL' as const, text: 'Thanh khoản ổn định' };
}

// === NEW INDICATORS ===

export function detectCandlestickPatterns(opens: number[], highs: number[], lows: number[], closes: number[]) {
  if (opens.length < 3) return { state: 'NEUTRAL' as const, text: 'Không rõ', name: 'Không rõ' };
  
  const i = opens.length - 1;
  const O = opens[i], H = highs[i], L = lows[i], C = closes[i];
  const pO = opens[i-1], pC = closes[i-1];
  
  const body = Math.abs(C - O);
  const upperShadow = H - Math.max(O, C);
  const lowerShadow = Math.min(O, C) - L;
  
  // Hammer / Pin Bar Bullish
  if (lowerShadow > body * 2 && upperShadow < body * 0.5 && C > O) {
    return { state: 'BULLISH' as const, text: 'Rút chân mạnh', name: 'Nến Búa (Hammer)' };
  }
  
  // Shooting Star / Pin Bar Bearish
  if (upperShadow > body * 2 && lowerShadow < body * 0.5 && C < O) {
    return { state: 'BEARISH' as const, text: 'Bị bán ngược', name: 'Sao băng (Shooting Star)' };
  }
  
  // Bullish Engulfing
  if (pC < pO && C > O && C > pO && O < pC) {
    return { state: 'BULLISH' as const, text: 'Nhấn chìm tăng', name: 'Bullish Engulfing' };
  }
  
  // Bearish Engulfing
  if (pC > pO && C < O && C < pO && O > pC) {
    return { state: 'BEARISH' as const, text: 'Nhấn chìm giảm', name: 'Bearish Engulfing' };
  }
  
  // Doji
  if (body <= (H - L) * 0.1) {
    return { state: 'NEUTRAL' as const, text: 'Lưỡng lự', name: 'Nến Doji' };
  }
  
  // Marubozu Bullish
  if (body > (H - L) * 0.9 && C > O) {
    return { state: 'BULLISH' as const, text: 'Lực mua áp đảo', name: 'Marubozu Xanh' };
  }
  
  // Marubozu Bearish
  if (body > (H - L) * 0.9 && C < O) {
    return { state: 'BEARISH' as const, text: 'Lực bán áp đảo', name: 'Marubozu Đỏ' };
  }

  return { state: 'NEUTRAL' as const, text: 'Bình thường', name: 'Nến Tiêu Chuẩn' };
}

export function calculateIchimoku(highs: number[], lows: number[], closes: number[]) {
  if (highs.length < 52) return { state: 'NEUTRAL' as const, text: 'Đang tích lũy' };
  
  const maxHigh = (period: number) => Math.max(...highs.slice(highs.length - period));
  const minLow = (period: number) => Math.min(...lows.slice(lows.length - period));
  
  const tenkan = (maxHigh(9) + minLow(9)) / 2;
  const kijun = (maxHigh(26) + minLow(26)) / 2;
  
  const currentClose = closes[closes.length - 1];
  
  // Very simplified Ichimoku Cloud analysis
  if (currentClose > tenkan && tenkan > kijun) {
    return { state: 'BULLISH' as const, text: 'Cắt lên (Tích cực)' };
  } else if (currentClose < tenkan && tenkan < kijun) {
    return { state: 'BEARISH' as const, text: 'Cắt xuống (Tiêu cực)' };
  }
  
  return { state: 'NEUTRAL' as const, text: 'Trong mây Kumo' };
}

export function calculateStochastic(highs: number[], lows: number[], closes: number[], period = 14) {
  if (closes.length < period) return { k: null, state: 'NEUTRAL' as const, text: 'Không rõ' };
  
  const currentClose = closes[closes.length - 1];
  const recentHighs = highs.slice(highs.length - period);
  const recentLows = lows.slice(lows.length - period);
  
  const highestHigh = Math.max(...recentHighs);
  const lowestLow = Math.min(...recentLows);
  
  if (highestHigh === lowestLow) return { k: 50, state: 'NEUTRAL' as const, text: 'Đi ngang' };
  
  const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
  
  let state: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL' = 'NEUTRAL';
  let text = 'Ổn định';
  
  if (k >= 80) {
    state = 'OVERBOUGHT'; text = 'Quá mua (Rủi ro)';
  } else if (k <= 20) {
    state = 'OVERSOLD'; text = 'Quá bán (Bắt đáy)';
  }
  
  return { k, state, text };
}

export function calculateATR(highs: number[], lows: number[], closes: number[], period = 14) {
  if (closes.length < period + 1) return null;
  
  const tr = [];
  for (let i = 1; i < closes.length; i++) {
    const hl = highs[i] - lows[i];
    const hc = Math.abs(highs[i] - closes[i - 1]);
    const lc = Math.abs(lows[i] - closes[i - 1]);
    tr.push(Math.max(hl, hc, lc));
  }
  
  const recentTR = tr.slice(tr.length - period);
  const atr = recentTR.reduce((a, b) => a + b, 0) / period;
  return atr;
}

export function calculateOBV(closes: number[], volumes: number[]) {
  if (closes.length < 2) return { state: 'NEUTRAL' as const, text: 'Không rõ' };
  
  let obv = 0;
  const obvValues = [0];
  
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i - 1]) obv += volumes[i];
    else if (closes[i] < closes[i - 1]) obv -= volumes[i];
    obvValues.push(obv);
  }
  
  // Trend of OBV in last 5 days
  const recentOBV = obvValues.slice(obvValues.length - 5);
  const start = recentOBV[0];
  const end = recentOBV[recentOBV.length - 1];
  
  if (end > start * 1.05) return { state: 'BULLISH' as const, text: 'Tiền vào mạnh' };
  if (end < start * 0.95) return { state: 'BEARISH' as const, text: 'Tiền rút ra' };
  return { state: 'NEUTRAL' as const, text: 'Tích luỹ' };
}


export interface AnalysisResult {
  symbol: string;
  currentPrice: number;
  score: number;
  sma20: number | null;
  sma50: number | null;
  rsi: number | null;
  trend: 'UP_STRONG' | 'UP' | 'DOWN' | 'DOWN_STRONG' | 'SIDEWAY';
  trendText: string;
  trendDesc: string;
  rsiState: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL';
  rsiText: string;
  rsiDesc: string;
  macdState: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  macdText: string;
  bbState: 'UPPER_BAND' | 'LOWER_BAND' | 'MID_BAND';
  bbText: string;
  vsaState: 'ACCUMULATION' | 'DISTRIBUTION' | 'NEUTRAL';
  vsaText: string;
  
  // New indicators
  candleState: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  candleText: string;
  candleName: string;
  
  ichimokuState: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  ichimokuText: string;
  
  stochState: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL';
  stochText: string;
  stochK: number | null;
  
  obvState: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  obvText: string;
  
  atr: number | null;
  stopLossPrice: number | null;
  takeProfitPrice: number | null;
  
  action: 'BUY_STRONG' | 'BUY' | 'HOLD' | 'SELL' | 'SELL_STRONG';
}

export function analyzeTrend(
  symbol: string, 
  opens: number[], 
  highs: number[], 
  lows: number[], 
  closes: number[], 
  volumes: number[], 
  currentPrice: number, 
  currentVolume: number
): AnalysisResult {
  const allOpens = [...opens, currentPrice]; // Approx open as current if missing
  const allHighs = [...highs, currentPrice];
  const allLows = [...lows, currentPrice];
  const allCloses = [...closes, currentPrice];
  const allVolumes = [...volumes, currentVolume];
  
  let rawScore = 0; // Raw score can go from approx -20 to +20
  
  // 1. SMA Trend Analysis (±4)
  const sma20 = calculateSMA(allCloses, 20);
  const sma50 = calculateSMA(allCloses, 50);
  
  let trend: AnalysisResult['trend'] = 'SIDEWAY';
  let trendText = 'Đi ngang';
  let trendDesc = 'Giá chưa xác định rõ xu hướng.';

  if (sma20 && sma50) {
    if (currentPrice > sma20 && sma20 > sma50) {
      trend = 'UP_STRONG'; trendText = 'Tăng mạnh'; trendDesc = 'Nằm trên SMA20 và SMA50.';
      rawScore += 4;
    } else if (currentPrice > sma20) {
      trend = 'UP'; trendText = 'Tăng nhẹ'; trendDesc = 'Vượt SMA20.';
      rawScore += 1;
    } else if (currentPrice < sma20 && sma20 < sma50) {
      trend = 'DOWN_STRONG'; trendText = 'Giảm sâu'; trendDesc = 'Thủng SMA20 và SMA50.';
      rawScore -= 4;
    } else if (currentPrice < sma20) {
      trend = 'DOWN'; trendText = 'Suy yếu'; trendDesc = 'Thủng SMA20.';
      rawScore -= 1;
    }
  }

  // 2. MACD Analysis (±3)
  const macdResult = calculateMACD(allCloses);
  let macdState: AnalysisResult['macdState'] = 'NEUTRAL';
  let macdText = 'Đi ngang';
  if (macdResult.hist !== null) {
    if (macdResult.hist > 0) {
      macdState = 'BULLISH'; macdText = 'Cắt lên (Tích cực)';
      rawScore += 3;
    } else if (macdResult.hist < 0) {
      macdState = 'BEARISH'; macdText = 'Cắt xuống (Tiêu cực)';
      rawScore -= 3;
    }
  }

  // 3. RSI Analysis (±3)
  const rsi = calculateRSI(allCloses, 14);
  let rsiState: AnalysisResult['rsiState'] = 'NEUTRAL';
  let rsiText = 'Trung lập';
  let rsiDesc = 'Lực mua bán cân bằng.';

  if (rsi) {
    if (rsi >= 70) {
      rsiState = 'OVERBOUGHT'; rsiText = 'Quá mua'; rsiDesc = 'Nguy cơ đảo chiều.';
      rawScore -= 3; // Risk
    } else if (rsi <= 30) {
      rsiState = 'OVERSOLD'; rsiText = 'Quá bán'; rsiDesc = 'Cơ hội bắt đáy.';
      rawScore += 3; // Opportunity
    }
  }

  // 4. Bollinger Bands (±2)
  const bb = calculateBollingerBands(allCloses, 20, 2);
  let bbState: AnalysisResult['bbState'] = 'MID_BAND';
  let bbText = 'Trong dải BB';
  if (bb.upper && bb.lower) {
    if (currentPrice >= bb.upper) {
      bbState = 'UPPER_BAND'; bbText = 'Chạm dải trên';
      rawScore -= 2;
    } else if (currentPrice <= bb.lower) {
      bbState = 'LOWER_BAND'; bbText = 'Chạm dải dưới';
      rawScore += 2;
    }
  }

  // 5. Volume Spread Analysis (±2)
  const vsa = analyzeVSA(allCloses, allVolumes);
  if (vsa.state === 'ACCUMULATION') rawScore += 2;
  else if (vsa.state === 'DISTRIBUTION') rawScore -= 2;

  // 6. Candlestick Patterns (±2)
  const candle = detectCandlestickPatterns(allOpens, allHighs, allLows, allCloses);
  if (candle.state === 'BULLISH') rawScore += 2;
  else if (candle.state === 'BEARISH') rawScore -= 2;

  // 7. Ichimoku Cloud (±2)
  const ichimoku = calculateIchimoku(allHighs, allLows, allCloses);
  if (ichimoku.state === 'BULLISH') rawScore += 2;
  else if (ichimoku.state === 'BEARISH') rawScore -= 2;

  // 8. Stochastic Oscillator (±2)
  const stoch = calculateStochastic(allHighs, allLows, allCloses);
  if (stoch.state === 'OVERSOLD') rawScore += 2;
  else if (stoch.state === 'OVERBOUGHT') rawScore -= 2;

  // 9. On-Balance Volume OBV (±2)
  const obv = calculateOBV(allCloses, allVolumes);
  if (obv.state === 'BULLISH') rawScore += 2;
  else if (obv.state === 'BEARISH') rawScore -= 2;

  // 10. ATR (Volatility)
  const atr = calculateATR(allHighs, allLows, allCloses);
  const stopLossPrice = atr ? currentPrice - (atr * 1.5) : null;
  const takeProfitPrice = atr ? currentPrice + (atr * 2.0) : null;

  // Normalize rawScore (-22 to +22 max possible) to a 10-point scale (-10 to +10)
  // Max realistic score is around 18. We'll divide by 1.8 and round.
  let score = Math.round(rawScore / 1.8);
  if (score > 10) score = 10;
  if (score < -10) score = -10;

  // Determine Final Action Based on Normalized Score
  let action: AnalysisResult['action'] = 'HOLD';
  if (score >= 6) action = 'BUY_STRONG';
  else if (score >= 2) action = 'BUY';
  else if (score >= -1) action = 'HOLD';
  else if (score >= -5) action = 'SELL';
  else action = 'SELL_STRONG';

  return {
    symbol,
    currentPrice,
    score,
    sma20,
    sma50,
    rsi,
    trend,
    trendText,
    trendDesc,
    rsiState,
    rsiText,
    rsiDesc,
    macdState,
    macdText,
    bbState,
    bbText,
    vsaState: vsa.state,
    vsaText: vsa.text,
    candleState: candle.state,
    candleText: candle.text,
    candleName: candle.name,
    ichimokuState: ichimoku.state,
    ichimokuText: ichimoku.text,
    stochState: stoch.state,
    stochText: stoch.text,
    stochK: stoch.k,
    obvState: obv.state,
    obvText: obv.text,
    atr,
    stopLossPrice,
    takeProfitPrice,
    action
  };
}
