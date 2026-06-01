import { NextResponse } from 'next/server';
import { getAlert, saveAlert } from '@/lib/google-sheets';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  
  if (!symbol) return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  
  try {
    const alert = await getAlert(symbol);
    return NextResponse.json({ data: alert });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.symbol) return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    
    await saveAlert({
      symbol: body.symbol,
      minPrice: body.minPrice || 0,
      maxPrice: body.maxPrice || 0,
      isActive: body.isActive ?? false,
      telegramChatId: body.telegramChatId || '',
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
