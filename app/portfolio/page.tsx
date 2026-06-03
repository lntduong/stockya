"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import StockDetailDrawer from "@/components/stock-detail-drawer";
import { TreemapHeatmap } from "@/components/treemap-heatmap";
import PullToRefresh from "@/components/pull-to-refresh";
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface PortfolioItem {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice?: number;
  name?: string;
}

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchPortfolio = async () => {
      try {
        const res = await fetch("/api/portfolio");
        const json = await res.json();
        
        if (json.data && isMounted) {
          const portfolioData = json.data as PortfolioItem[];
          setItems(portfolioData);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching portfolio:", error);
        if (isMounted) setLoading(false);
      }
    };
    
    fetchPortfolio();
    
    return () => { isMounted = false; };
  }, []);

  const symbolsQuery = items.map(i => i.symbol).join(',');

  const { data: stockDataResponse } = useSWR(
    symbolsQuery ? `/api/stock/bulk?symbols=${symbolsQuery}` : null,
    fetcher,
    { refreshInterval: 10000 } // Tự động làm mới mỗi 10 giây
  );

  const stockDataDict = stockDataResponse?.data || {};

  const mergedItems = items.map(item => {
    const stock = stockDataDict[item.symbol];
    return {
      ...item,
      currentPrice: stock ? stock.price : item.currentPrice,
      name: stock ? stock.name : item.name,
    };
  });

  const totalCost = mergedItems.reduce((acc, item) => acc + (item.quantity * item.averagePrice), 0);
  const currentValue = mergedItems.reduce((acc, item) => acc + (item.quantity * (item.currentPrice || item.averagePrice)), 0);
  const totalPnL = currentValue - totalCost;
  const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  const handleRefresh = async () => {
    await mutate('/api/portfolio');
    if (symbolsQuery) {
      await mutate(`/api/stock/bulk?symbols=${symbolsQuery}`);
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-primary/20 rounded-2xl">
          <Wallet className="text-primary" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Tài sản</h1>
          <p className="text-sm text-default-500 font-medium">Quản lý danh mục đầu tư</p>
        </div>
      </div>
      
      <div className="bg-content2/50 backdrop-blur-md border border-black/5 dark:border-white/5 rounded-3xl p-6 shadow-sm">
        <p className="text-sm text-default-500 font-medium mb-1">Tổng tài sản (VND)</p>
        <h2 className="text-4xl font-black tracking-tighter mb-4">
          {loading ? "..." : (currentValue).toLocaleString()}
        </h2>
        
        <div className="flex gap-6 border-t border-black/10 dark:border-white/10 pt-4">
          <div className="flex flex-col">
            <span className="text-xs text-default-500 font-medium mb-1">Tổng vốn</span>
            <span className="font-bold">{loading ? "..." : totalCost.toLocaleString()}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-default-500 font-medium mb-1">Lãi / Lỗ</span>
            <div className={`flex items-center gap-1 font-bold ${totalPnL > 0 ? 'text-emerald-500' : totalPnL < 0 ? 'text-danger-500' : 'text-default-500'}`}>
              {totalPnL > 0 ? <ArrowUpRight size={16} /> : totalPnL < 0 ? <ArrowDownRight size={16} /> : null}
              <span>{Math.abs(totalPnL).toLocaleString()} ({totalPnL > 0 ? '+' : totalPnL < 0 ? '-' : ''}{Math.abs(totalPnLPercent).toFixed(2)}%)</span>
            </div>
          </div>
        </div>
      </div>
      
      {mergedItems.length > 0 && (
        <div className="mb-2">
          <TreemapHeatmap 
            data={mergedItems.map(item => {
              const currentPrice = item.currentPrice || item.averagePrice;
              const pnlPercent = item.averagePrice > 0 ? (currentPrice - item.averagePrice) / item.averagePrice * 100 : 0;
              return {
                symbol: item.symbol,
                weight: item.quantity * currentPrice,
                change: pnlPercent
              };
            })} 
            title="Bản đồ Nhiệt Tài sản (Theo Giá trị đầu tư)" 
          />
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h3 className="font-bold text-sm text-default-500 tracking-wide px-1">CỔ PHIẾU ĐANG GIỮ</h3>
        
        {loading ? (
          <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div></div>
        ) : mergedItems.length === 0 ? (
          <div className="text-center p-10 bg-content2/30 rounded-3xl border border-black/5 dark:border-white/5">
            <p className="text-default-500">Chưa có cổ phiếu nào trong danh mục.</p>
            <p className="text-xs text-default-400 mt-2">Hãy mở một mã cổ phiếu và bấm Mua để thêm vào đây.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {mergedItems.map((item) => {
              const currentPrice = item.currentPrice || item.averagePrice;
              const pnl = (currentPrice - item.averagePrice) * item.quantity;
              const pnlPercent = (currentPrice - item.averagePrice) / item.averagePrice * 100;
              
              return (
                <div 
                  key={item.symbol}
                  onClick={() => setSelectedSymbol(item.symbol)}
                  className="bg-content2/40 hover:bg-content2 transition-all p-4 rounded-2xl flex items-center justify-between border border-black/5 dark:border-white/5 cursor-pointer"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-black text-lg tracking-tight">{item.symbol}</span>
                    <span className="text-xs text-default-500 font-medium">{item.quantity.toLocaleString()} cổ phiếu</span>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-bold text-base">{(currentPrice).toLocaleString()}</span>
                    <span className={`text-xs font-bold ${pnl > 0 ? 'text-emerald-500' : pnl < 0 ? 'text-danger-500' : 'text-default-500'}`}>
                      {pnl > 0 ? '+' : ''}{pnl.toLocaleString()} ({pnlPercent > 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <StockDetailDrawer 
        isOpen={!!selectedSymbol}
        onOpenChange={(open) => !open && setSelectedSymbol(null)}
        symbol={selectedSymbol}
        symbolsList={mergedItems.map(i => i.symbol)}
      />
      </div>
    </PullToRefresh>
  );
}
