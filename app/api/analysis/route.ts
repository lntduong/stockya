import { NextResponse } from 'next/server';
import { getStockHistory, getStockOverview } from '@/lib/stock-api';
import { analyzeTrend } from '@/lib/technical-analysis';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');
  
  if (!symbolsParam) {
    return NextResponse.json({ data: [] });
  }

  const symbols = symbolsParam.split(',').filter(s => s.trim());
  
  try {
    const analysisPromises = symbols.map(async (symbol) => {
      try {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const [overviewRes, historyRes] = await Promise.all([
          getStockOverview(symbol),
          getStockHistory(symbol, startDate, endDate)
        ]);
        
        // Let's use history directly. history prices need to be scaled if overview is scaled.
        // Actually, getStockHistory returns raw prices.
        const prices = historyRes.map(h => h.close);
        const volumes = historyRes.map(h => h.volume);
        const currentPriceRaw = overviewRes.price / 1000;
        
        // Ensure historical prices are on the same scale (Yahoo VN stocks are usually in thousands, so 25000)
        // Wait, getStockHistory returns 25000. currentPriceRaw is 25.75 (if divided by 1000).
        // Let's NOT divide overview.price by 1000 for analysis to match history!
        const currentPrice = overviewRes.price; 
        const currentVolume = overviewRes.volume;
        
        const result = analyzeTrend(symbol, prices, volumes, currentPrice, currentVolume);
        
        // Format prices back to UI friendly format (divided by 1000)
        return {
          ...result,
          currentPrice: currentPrice / 1000,
          sma20: result.sma20 ? result.sma20 / 1000 : null,
          sma50: result.sma50 ? result.sma50 / 1000 : null,
        };
      } catch (err) {
        console.error(`Error analyzing ${symbol}`, err);
        return null;
      }
    });

    const results = (await Promise.all(analysisPromises)).filter(r => r !== null);
    return NextResponse.json({ data: results });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
