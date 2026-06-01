import { NextResponse } from 'next/server';
import { getStockOverview, getStockHistory } from '@/lib/stock-api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const type = searchParams.get('type'); // 'overview' or 'history'
  
  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    if (type === 'overview') {
      const data = await getStockOverview(symbol);
      return NextResponse.json({ data });
    } 
    else if (type === 'history') {
      const start = searchParams.get('start');
      const end = searchParams.get('end');
      
      if (!start || !end) {
        return NextResponse.json({ error: 'Start and End dates are required for history' }, { status: 400 });
      }
      
      const data = await getStockHistory(symbol, start, end);
      return NextResponse.json({ data });
    }
    
    return NextResponse.json({ error: 'Invalid type parameter. Use "overview" or "history".' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
