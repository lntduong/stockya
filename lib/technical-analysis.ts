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
  if (prices.length < 20 || volumes.length < 20) return { state: 'NEUTRAL' as const, text: 'Thanh khoản trung bình' };
  
  const currentVol = volumes[volumes.length - 1];
  const currentPrice = prices[prices.length - 1];
  const prevPrice = prices[prices.length - 2];
  
  const volSlice = volumes.slice(volumes.length - 20, volumes.length);
  const avgVol = volSlice.reduce((a, b) => a + b, 0) / 20;
  
  if (currentVol > avgVol * 1.5) {
    if (currentPrice > prevPrice) return { state: 'ACCUMULATION' as const, text: 'Dòng tiền vào mạnh' };
    else return { state: 'DISTRIBUTION' as const, text: 'Bị bán tháo' };
  }
  
  if (currentVol < avgVol * 0.5) return { state: 'NEUTRAL' as const, text: 'Cạn cung' };
  
  return { state: 'NEUTRAL' as const, text: 'Thanh khoản ổn định' };
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
  action: 'BUY_STRONG' | 'BUY' | 'HOLD' | 'SELL' | 'SELL_STRONG';
}

export function analyzeTrend(symbol: string, prices: number[], volumes: number[], currentPrice: number, currentVolume: number): AnalysisResult {
  const allPrices = [...prices, currentPrice];
  const allVolumes = [...volumes, currentVolume];
  
  let score = 0; // -10 to +10
  
  // 1. SMA Trend Analysis (±3)
  const sma20 = calculateSMA(allPrices, 20);
  const sma50 = calculateSMA(allPrices, 50);
  
  let trend: AnalysisResult['trend'] = 'SIDEWAY';
  let trendText = 'Đi ngang';
  let trendDesc = 'Giá chưa xác định rõ xu hướng.';

  if (sma20 && sma50) {
    if (currentPrice > sma20 && sma20 > sma50) {
      trend = 'UP_STRONG'; trendText = 'Tăng mạnh'; trendDesc = 'Nằm trên SMA20 và SMA50.';
      score += 3;
    } else if (currentPrice > sma20) {
      trend = 'UP'; trendText = 'Tăng nhẹ'; trendDesc = 'Vượt SMA20.';
      score += 1;
    } else if (currentPrice < sma20 && sma20 < sma50) {
      trend = 'DOWN_STRONG'; trendText = 'Giảm sâu'; trendDesc = 'Thủng SMA20 và SMA50.';
      score -= 3;
    } else if (currentPrice < sma20) {
      trend = 'DOWN'; trendText = 'Suy yếu'; trendDesc = 'Thủng SMA20.';
      score -= 1;
    }
  }

  // 2. MACD Analysis (±3)
  const macdResult = calculateMACD(allPrices);
  let macdState: AnalysisResult['macdState'] = 'NEUTRAL';
  let macdText = 'Đi ngang';
  if (macdResult.hist !== null) {
    if (macdResult.hist > 0) {
      macdState = 'BULLISH'; macdText = 'Cắt lên (Tích cực)';
      score += 3;
    } else if (macdResult.hist < 0) {
      macdState = 'BEARISH'; macdText = 'Cắt xuống (Tiêu cực)';
      score -= 3;
    }
  }

  // 3. RSI Analysis (±2)
  const rsi = calculateRSI(allPrices, 14);
  let rsiState: AnalysisResult['rsiState'] = 'NEUTRAL';
  let rsiText = 'Trung lập';
  let rsiDesc = 'Lực mua bán cân bằng.';

  if (rsi) {
    if (rsi >= 70) {
      rsiState = 'OVERBOUGHT'; rsiText = 'Quá mua'; rsiDesc = 'Nguy cơ đảo chiều.';
      score -= 2;
    } else if (rsi <= 30) {
      rsiState = 'OVERSOLD'; rsiText = 'Quá bán'; rsiDesc = 'Cơ hội bắt đáy.';
      score += 2; // Oversold is good for buying
    }
  }

  // 4. Bollinger Bands (±1)
  const bb = calculateBollingerBands(allPrices, 20, 2);
  let bbState: AnalysisResult['bbState'] = 'MID_BAND';
  let bbText = 'Trong dải BB';
  if (bb.upper && bb.lower) {
    if (currentPrice >= bb.upper) {
      bbState = 'UPPER_BAND'; bbText = 'Chạm dải trên';
      score -= 1;
    } else if (currentPrice <= bb.lower) {
      bbState = 'LOWER_BAND'; bbText = 'Chạm dải dưới';
      score += 1;
    }
  }

  // 5. Volume Spread Analysis (±1)
  const vsa = analyzeVSA(allPrices, allVolumes);
  if (vsa.state === 'ACCUMULATION') score += 1;
  else if (vsa.state === 'DISTRIBUTION') score -= 1;

  // Determine Final Action Based on Total Score
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
    action
  };
}
