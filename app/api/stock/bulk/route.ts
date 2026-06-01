import { NextResponse } from 'next/server';
import { getStockOverview } from '@/lib/stock-api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');
  
  if (!symbolsParam) {
    return NextResponse.json({ error: 'Symbols are required' }, { status: 400 });
  }

  const symbols = symbolsParam.split(',').filter(s => s.trim());
  
  try {
    const promises = symbols.map(async (symbol) => {
      try {
        const data = await getStockOverview(symbol);
        return { symbol, data };
      } catch (err) {
        return { symbol, data: null };
      }
    });

    const results = await Promise.all(promises);
    
    // Convert to a dictionary: { "FPT": { ... }, "HPG": null, ... }
    const dataDict: Record<string, any> = {};
    results.forEach(res => {
      dataDict[res.symbol] = res.data;
    });

    return NextResponse.json({ data: dataDict });
  } catch (error) {
    console.error("Bulk fetch error", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
