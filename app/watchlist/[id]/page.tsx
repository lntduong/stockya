"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Plus, Search } from "lucide-react";
import StockRow from "@/components/stock-row";
import StockDetailDrawer from "@/components/stock-detail-drawer";

export default function WatchlistDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [watchlist, setWatchlist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newSymbol, setNewSymbol] = useState("");
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const fetchWatchlist = async () => {
    const res = await fetch('/api/sheets');
    const json = await res.json();
    const wl = (json.data || []).find((w: any) => w.id === id);
    setWatchlist(wl);
    setLoading(false);
  };

  useEffect(() => {
    fetchWatchlist();
  }, [id]);

  const handleAddSymbol = async () => {
    const sym = newSymbol.trim().toUpperCase();
    if (!sym || !watchlist) return;
    
    let currentSymbols = watchlist.symbols ? watchlist.symbols.split(',') : [];
    if (currentSymbols.includes(sym)) {
      setNewSymbol("");
      return;
    }
    
    currentSymbols.push(sym);
    const updatedSymbols = currentSymbols.join(',');
    
    setWatchlist({ ...watchlist, symbols: updatedSymbols });
    setNewSymbol("");

    await fetch('/api/sheets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, symbols: updatedSymbols })
    });
  };

  const handleRemoveSymbol = async (sym: string) => {
    if (!watchlist) return;
    
    let currentSymbols = watchlist.symbols.split(',').filter((s: string) => s !== sym);
    const updatedSymbols = currentSymbols.join(',');
    
    setWatchlist({ ...watchlist, symbols: updatedSymbols });

    await fetch('/api/sheets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, symbols: updatedSymbols })
    });
  };

  const openStockDetail = (sym: string) => {
    setSelectedSymbol(sym);
    setIsOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-content3/40 animate-pulse" />
          <div className="h-8 w-1/2 rounded-lg bg-content3/40 animate-pulse" />
        </div>
        <div className="h-14 w-full rounded-2xl bg-content3/40 animate-pulse" />
        <div className="flex flex-col gap-3 mt-2">
          <div className="h-24 w-full rounded-2xl bg-content3/40 animate-pulse" />
          <div className="h-24 w-full rounded-2xl bg-content3/40 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!watchlist) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
        <h2 className="text-xl font-bold">Không tìm thấy danh mục</h2>
        <button 
          className="px-6 py-2 bg-content2 hover:bg-content3 rounded-full font-medium transition-colors"
          onClick={() => router.push('/')}
        >
          Trở về Trang chủ
        </button>
      </div>
    );
  }

  const symbolsList = watchlist.symbols ? watchlist.symbols.split(',') : [];

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 fade-in duration-300">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => router.push('/')}
          className="p-2 bg-content2 hover:bg-content3 rounded-full transition-colors"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-2xl font-extrabold tracking-tight truncate">{watchlist.name}</h1>
      </div>

      <div className="flex gap-2 bg-content2/30 p-1.5 rounded-2xl border border-white/5">
        <div className="flex-1 flex items-center px-2">
          <Search size={20} className="text-default-400 ml-1" />
          <input 
            placeholder="Mã cổ phiếu (VD: VHM, FPT)"
            className="w-full bg-transparent outline-none px-3 text-lg font-medium placeholder:font-normal"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSymbol()}
          />
        </div>
        <button 
          className="bg-primary text-white p-3 rounded-xl shadow-lg shadow-primary/30 disabled:opacity-50 transition-opacity hover:opacity-90"
          onClick={handleAddSymbol}
          disabled={!newSymbol.trim()}
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {symbolsList.length === 0 ? (
          <div className="py-16 text-center text-default-500 bg-content2/20 rounded-3xl border border-white/5 border-dashed flex flex-col items-center gap-2">
            <Search size={40} className="opacity-20 mb-2" />
            <p className="font-medium text-default-600">Danh mục đang trống.</p>
            <p className="text-sm">Hãy tìm kiếm và thêm cổ phiếu vào đây.</p>
          </div>
        ) : (
          symbolsList.map((sym: string) => (
            <StockRow 
              key={sym} 
              symbol={sym} 
              onRemove={handleRemoveSymbol} 
              onPress={openStockDetail}
            />
          ))
        )}
      </div>

      <StockDetailDrawer 
        isOpen={isOpen} 
        onOpenChange={setIsOpen} 
        symbol={selectedSymbol} 
      />
    </div>
  );
}
