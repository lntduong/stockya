"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Plus, Search, ArrowUpDown } from "lucide-react";
import StockDetailDrawer from "@/components/stock-detail-drawer";
import StockSearchInput from "@/components/stock-search-input";
import { TreemapHeatmap } from "@/components/treemap-heatmap";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableStockRow } from "@/components/sortable-stock-row";
import PullToRefresh from "@/components/pull-to-refresh";
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function WatchlistDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [watchlist, setWatchlist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  const handleAddSymbol = async (symbol: string) => {
    const sym = symbol.trim().toUpperCase();
    if (!sym || !watchlist) return;
    
    let currentSymbols = watchlist.symbols ? watchlist.symbols.split(',') : [];
    if (currentSymbols.includes(sym)) {
      return;
    }
    
    currentSymbols.push(sym);
    const updatedSymbols = currentSymbols.join(',');
    
    setWatchlist({ ...watchlist, symbols: updatedSymbols });

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

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over?.id && watchlist && over) {
      const symbolsList = watchlist.symbols ? watchlist.symbols.split(',') : [];
      const oldIndex = symbolsList.indexOf(active.id);
      const newIndex = symbolsList.indexOf(over.id);
      
      const newSymbolsArray = arrayMove(symbolsList, oldIndex, newIndex);
      const newSymbols = newSymbolsArray.join(',');
      
      setWatchlist({ ...watchlist, symbols: newSymbols });
      
      await fetch('/api/sheets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, symbols: newSymbols })
      });
    }
  };

  const symbolsList = watchlist?.symbols ? watchlist.symbols.split(',') : [];
  const symbolsQuery = symbolsList.join(',');

  const { data: stockDataResponse, isLoading: isStocksLoading } = useSWR(
    symbolsQuery ? `/api/stock/bulk?symbols=${symbolsQuery}` : null,
    fetcher,
    { refreshInterval: 10000 } // Tự động cập nhật 10s/lần
  );

  const { data: analysisResponse } = useSWR(
    symbolsQuery ? `/api/analysis?symbols=${symbolsQuery}` : null,
    fetcher,
    { refreshInterval: 60000 }
  );

  const { data: portfolioResponse } = useSWR('/api/portfolio', fetcher);

  const stockDataDict = stockDataResponse?.data || {};
  
  const analysisDict: Record<string, any> = {};
  if (analysisResponse?.data) {
    analysisResponse.data.forEach((item: any) => {
      analysisDict[item.symbol] = item;
    });
  }

  const portfolioDict: Record<string, any> = {};
  if (portfolioResponse?.data) {
    portfolioResponse.data.forEach((item: any) => {
      portfolioDict[item.symbol] = item;
    });
  }

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

  const handleRefresh = async () => {
    await mutate(symbolsQuery ? `/api/stock/bulk?symbols=${symbolsQuery}` : null);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 fade-in duration-300 pb-20">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => router.push('/')}
          className="p-2 bg-content2 hover:bg-content3 rounded-full transition-colors"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-2xl font-extrabold tracking-tight truncate">{watchlist.name}</h1>
      </div>

      <div className="z-20">
        <StockSearchInput 
          onSelect={handleAddSymbol} 
          placeholder="Mã cổ phiếu (VD: HPG, FPT)"
          buttonText="Thêm mã"
        />
      </div>

      {symbolsList.length > 0 && !isStocksLoading && (
        <div className="mb-2 mt-2">
          <TreemapHeatmap 
            data={symbolsList.map((sym: string) => {
              const stock = stockDataDict[sym];
              return {
                symbol: sym,
                weight: stock ? (stock.volume * stock.price / 1000) : 0,
                change: stock ? stock.percentChange : 0
              };
            }).filter((d: any) => d.weight > 0)}
            title="Bản đồ Nhiệt Danh mục (Theo Thanh khoản)"
          />
        </div>
      )}

      <div className="flex flex-col gap-3">
        {symbolsList.length === 0 ? (
          <div className="py-16 text-center text-default-500 bg-content2/20 rounded-3xl border border-white/5 border-dashed flex flex-col items-center gap-2">
            <Search size={40} className="opacity-20 mb-2" />
            <p className="font-medium text-default-600">Danh mục đang trống.</p>
            <p className="text-sm">Hãy tìm kiếm và thêm cổ phiếu vào đây.</p>
          </div>
        ) : (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={symbolsList}
              strategy={verticalListSortingStrategy}
            >
              {symbolsList.map((sym: string) => (
                <SortableStockRow 
                  key={sym} 
                  symbol={sym} 
                  data={stockDataDict[sym]}
                  analysisData={analysisDict[sym]}
                  ownedQuantity={portfolioDict[sym]?.quantity}
                  averagePrice={portfolioDict[sym]?.averagePrice}
                  loading={isStocksLoading}
                  onRemove={handleRemoveSymbol} 
                  onPress={openStockDetail}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      <StockDetailDrawer 
        isOpen={isOpen} 
        onOpenChange={setIsOpen} 
        symbol={selectedSymbol}
        symbolsList={symbolsList}
      />
      </div>
    </PullToRefresh>
  );
}
