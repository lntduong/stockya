import { NextResponse } from 'next/server';
import { getPortfolio } from '@/lib/google-sheets';

export async function GET(request: Request) {
  try {
    const portfolio = await getPortfolio();
    return NextResponse.json({ data: portfolio });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
