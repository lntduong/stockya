export interface StockOverview {
  ticker: string;
  price: number;
  percentChange: number;
  volume: number;
  referencePrice: number;
  ceilingPrice: number;
  floorPrice: number;
  pe?: number;
  eps?: number;
  name?: string;
  exchange?: string;
}

export interface StockHistoryData {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
}

export async function getStockOverview(symbol: string): Promise<StockOverview> {
  const code = symbol.toUpperCase();
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${code}.VN?interval=1d&range=1d`, {
      next: { revalidate: 10 }
    });
    
    if (res.ok) {
      const json = await res.json();
      if (json.chart.result && json.chart.result.length > 0) {
        const data = json.chart.result[0].meta;
        const price = data.regularMarketPrice;
        const prevClose = data.chartPreviousClose || data.previousClose || data.regularMarketPreviousClose || price;
        const change = price - prevClose;
        const percentChange = prevClose > 0 ? (change / prevClose) * 100 : 0;
        
        return {
          ticker: code,
          price: price,
          percentChange: parseFloat(percentChange.toFixed(2)),
          volume: data.regularMarketVolume || 0,
          referencePrice: prevClose,
          ceilingPrice: Math.round(prevClose * 1.07), // Tham chiếu biên độ 7% HOSE
          floorPrice: Math.round(prevClose * 0.93),
          pe: 0,
          eps: 0,
          name: data.shortName || code,
          exchange: data.fullExchangeName || data.exchangeName || 'HOSE',
        };
      }
    }
  } catch (error) {
    console.error(`[API] Failed to fetch Yahoo Finance for ${code}`, error);
  }

  throw new Error(`Failed to fetch stock overview for ${code}`);
}

export async function getStockHistory(symbol: string, startDate: string, endDate: string): Promise<StockHistoryData[]> {
  const code = symbol.toUpperCase();
  try {
    const p1 = Math.floor(new Date(startDate).getTime() / 1000);
    const p2 = Math.floor(new Date(endDate).getTime() / 1000);
    
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${code}.VN?interval=1d&period1=${p1}&period2=${p2}`, {
      next: { revalidate: 3600 }
    });
    
    if (res.ok) {
      const json = await res.json();
      if (json.chart.result && json.chart.result.length > 0) {
        const result = json.chart.result[0];
        const timestamps = result.timestamp || [];
        const quote = result.indicators.quote[0];
        
        const history: StockHistoryData[] = [];
        for (let i = 0; i < timestamps.length; i++) {
          if (quote.open[i] !== null && quote.open[i] !== undefined) {
            const date = new Date(timestamps[i] * 1000);
            history.push({
              time: date.toISOString().split('T')[0],
              open: quote.open[i],
              high: quote.high[i],
              low: quote.low[i],
              close: quote.close[i],
            });
          }
        }
        return history;
      }
    }
  } catch (error) {
    console.error(`[API] Failed to fetch Yahoo Finance history for ${code}`, error);
  }
  
  throw new Error(`Failed to fetch stock history for ${code}`);
}
