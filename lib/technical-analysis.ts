export function calculateSMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const slice = prices.slice(prices.length - period);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return sum / period;
}

export function calculateRSI(prices: number[], period: number = 14): number | null {
  if (prices.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  // Tính mức thay đổi ban đầu (period đầu tiên)
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

  // Áp dụng công thức RSI chuẩn (Làm mượt - Smoothed Moving Average)
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

export interface AnalysisResult {
  symbol: string;
  currentPrice: number;
  sma20: number | null;
  sma50: number | null;
  rsi: number | null;
  trend: 'UP_STRONG' | 'UP' | 'DOWN' | 'DOWN_STRONG' | 'SIDEWAY';
  trendText: string;
  trendDesc: string;
  rsiState: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL';
  rsiText: string;
  rsiDesc: string;
  action: 'BUY_STRONG' | 'BUY' | 'HOLD' | 'SELL' | 'SELL_STRONG';
}

export function analyzeTrend(symbol: string, prices: number[], currentPrice: number): AnalysisResult {
  // Thêm giá hiện tại vào mảng nếu nó mới nhất
  const allPrices = [...prices, currentPrice];
  
  const sma20 = calculateSMA(allPrices, 20);
  const sma50 = calculateSMA(allPrices, 50);
  const rsi = calculateRSI(allPrices, 14);

  let trend: AnalysisResult['trend'] = 'SIDEWAY';
  let trendText = 'Đi ngang';
  let trendDesc = 'Giá chưa xác định rõ xu hướng.';

  if (sma20 && sma50) {
    if (currentPrice > sma20 && sma20 > sma50) {
      trend = 'UP_STRONG';
      trendText = 'Tăng mạnh';
      trendDesc = 'Giá nằm trên SMA20 và SMA20 vượt SMA50. Xu hướng tăng rất vững chắc.';
    } else if (currentPrice > sma20) {
      trend = 'UP';
      trendText = 'Tăng nhẹ';
      trendDesc = 'Giá vượt qua đường trung bình 20 ngày, tín hiệu phục hồi ngắn hạn.';
    } else if (currentPrice < sma20 && sma20 < sma50) {
      trend = 'DOWN_STRONG';
      trendText = 'Giảm sâu';
      trendDesc = 'Giá thủng SMA20 và SMA20 nằm dưới SMA50. Rủi ro rơi tự do.';
    } else if (currentPrice < sma20) {
      trend = 'DOWN';
      trendText = 'Suy yếu';
      trendDesc = 'Giá rơi xuống dưới đường trung bình 20 ngày, tín hiệu yếu đi.';
    }
  }

  let rsiState: AnalysisResult['rsiState'] = 'NEUTRAL';
  let rsiText = 'Trung lập';
  let rsiDesc = 'Lực mua và lực bán khá cân bằng.';

  if (rsi) {
    if (rsi >= 70) {
      rsiState = 'OVERBOUGHT';
      rsiText = 'Quá mua';
      rsiDesc = 'Cổ phiếu đã tăng nóng kéo dài. Cẩn thận rủi ro đảo chiều giảm giá.';
    } else if (rsi <= 30) {
      rsiState = 'OVERSOLD';
      rsiText = 'Quá bán';
      rsiDesc = 'Cổ phiếu bị bán tháo quá mức. Có thể sắp xuất hiện nhịp hồi phục bắt đáy.';
    }
  }

  let action: AnalysisResult['action'] = 'HOLD';
  
  if (trend === 'UP_STRONG' && rsiState !== 'OVERBOUGHT') action = 'BUY_STRONG';
  else if (trend === 'UP' && rsiState === 'OVERSOLD') action = 'BUY';
  else if (trend === 'DOWN_STRONG' || rsiState === 'OVERBOUGHT') action = 'SELL_STRONG';
  else if (trend === 'DOWN') action = 'SELL';
  else action = 'HOLD';

  return {
    symbol,
    currentPrice,
    sma20,
    sma50,
    rsi,
    trend,
    trendText,
    trendDesc,
    rsiState,
    rsiText,
    rsiDesc,
    action
  };
}
