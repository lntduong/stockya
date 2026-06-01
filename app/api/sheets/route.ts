import { NextResponse } from 'next/server';
import { getWatchlists, saveWatchlists, Watchlist } from '@/lib/google-sheets';

// Helper: Tạo ID ngẫu nhiên cho watchlist mới
const generateId = () => 'wl-' + Math.random().toString(36).substr(2, 9);

export async function GET() {
  try {
    const watchlists = await getWatchlists();
    return NextResponse.json({ data: watchlists });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch watchlists' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;
    
    if (!name) {
      return NextResponse.json({ error: 'Watchlist name is required' }, { status: 400 });
    }

    const currentLists = await getWatchlists();
    const newList: Watchlist = {
      id: generateId(),
      name,
      symbols: '', // Mới tạo chưa có mã nào
    };
    
    const updatedLists = [...currentLists, newList];
    await saveWatchlists(updatedLists);
    
    return NextResponse.json({ data: newList }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create watchlist' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, symbols } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Watchlist ID is required' }, { status: 400 });
    }

    const currentLists = await getWatchlists();
    const index = currentLists.findIndex(w => w.id === id);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Watchlist not found' }, { status: 404 });
    }

    // Cập nhật trường name hoặc symbols nếu có truyền vào
    if (name !== undefined) currentLists[index].name = name;
    if (symbols !== undefined) currentLists[index].symbols = symbols;
    
    await saveWatchlists(currentLists);
    
    return NextResponse.json({ data: currentLists[index] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update watchlist' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Watchlist ID is required' }, { status: 400 });
    }

    const currentLists = await getWatchlists();
    const updatedLists = currentLists.filter(w => w.id !== id);
    
    if (currentLists.length === updatedLists.length) {
      return NextResponse.json({ error: 'Watchlist not found' }, { status: 404 });
    }
    
    await saveWatchlists(updatedLists);
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete watchlist' }, { status: 500 });
  }
}
