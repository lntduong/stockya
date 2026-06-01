import { NextResponse } from 'next/server';
import { getPortfolio, savePortfolio } from '@/lib/google-sheets';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symbol, quantityChange, price } = body;
    
    if (!symbol || quantityChange === undefined || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let portfolio = await getPortfolio();
    const itemIndex = portfolio.findIndex(i => i.symbol === symbol);
    
    if (itemIndex >= 0) {
      const item = portfolio[itemIndex];
      const oldQuantity = item.quantity;
      const newQuantity = oldQuantity + quantityChange;
      
      if (newQuantity <= 0) {
        // Sold everything or more, remove from portfolio
        portfolio.splice(itemIndex, 1);
      } else {
        if (quantityChange > 0) {
          // Buy: calculate new average price
          const totalCost = (oldQuantity * item.averagePrice) + (quantityChange * price);
          item.averagePrice = totalCost / newQuantity;
        }
        item.quantity = newQuantity;
      }
    } else {
      if (quantityChange > 0) {
        portfolio.push({
          symbol,
          quantity: quantityChange,
          averagePrice: price
        });
      } else {
        return NextResponse.json({ error: 'Cannot sell stock you do not own' }, { status: 400 });
      }
    }

    await savePortfolio(portfolio);
    
    return NextResponse.json({ success: true, data: portfolio });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
