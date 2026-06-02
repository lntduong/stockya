import { NextResponse } from 'next/server';
import { getStockHistory, getStockOverview } from '@/lib/stock-api';
import { analyzeTrend } from '@/lib/technical-analysis';
import { TOP_50_LIQUID_SYMBOLS } from '@/lib/stock-names';

// Cache the radar results for 5 minutes (300s) to avoid heavy API load
export const revalidate = 300; 

export async function GET() {
  try {
    const symbols = TOP_50_LIQUID_SYMBOLS;
    const results = [];
    
    // Process in batches of 10 to avoid overwhelming the DNSE API
    const BATCH_SIZE = 10;
    
    for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
      const batch = symbols.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (symbol) => {
        try {
          const endDate = new Date().toISOString().split('T')[0];
          const startDate = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          
          const [overviewRes, historyRes] = await Promise.all([
            getStockOverview(symbol),
            getStockHistory(symbol, startDate, endDate)
          ]);
          
          const prices = historyRes.map(h => h.close);
          const volumes = historyRes.map(h => h.volume);
          const currentPrice = overviewRes.price; 
          const currentVolume = overviewRes.volume;
          
          const result = analyzeTrend(symbol, prices, volumes, currentPrice, currentVolume);
          
          return {
            ...result,
            currentPrice: currentPrice / 1000,
            sma20: result.sma20 ? result.sma20 / 1000 : null,
            sma50: result.sma50 ? result.sma50 / 1000 : null,
          };
        } catch (err) {
          console.error(`Error scanning ${symbol}`, err);
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(r => r !== null));
    }
    
    // Sort and filter signals
    const sorted = results.sort((a, b) => (b.score || 0) - (a.score || 0));
    
    // BUY signals: Score >= 4
    const buySignals = sorted.filter(r => (r.score || 0) >= 4);
    
    // SELL signals: Score <= -4 (Reversed so lowest score is first)
    const sellSignals = sorted.filter(r => (r.score || 0) <= -4).reverse();
    
    return NextResponse.json({ 
      data: {
        buy: buySignals,
        sell: sellSignals,
        scannedCount: results.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Radar Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
