"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { StockOverview } from "@/lib/stock-api";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function StockRow({ 
  symbol, 
  data,
  loading = false,
  onRemove, 
  onPress 
}: { 
  symbol: string, 
  data?: StockOverview | null,
  loading?: boolean,
  onRemove: (s: string) => void, 
  onPress: (s: string) => void 
}) {
  const { data: portfolioData } = useSWR('/api/portfolio', fetcher);
  const ownedStock = portfolioData?.data?.find((i: any) => i.symbol === symbol);

  if (loading) {
    return <div className="w-full h-20 rounded-2xl bg-content3/40 animate-pulse" />;
  }

  if (!data) {
    return (
      <div className="w-full bg-content2/10 backdrop-blur-md border border-danger/20 rounded-2xl p-4 flex flex-row items-center justify-between">
        <div className="flex-1 min-w-0 opacity-50">
          <h3 className="font-bold text-base line-through">{symbol}</h3>
          <p className="text-xs text-danger">Không có dữ liệu (Có thể mã bị hủy niêm yết hoặc sai tên)</p>
        </div>
        <button 
          className="p-2 text-danger opacity-80 hover:opacity-100 hover:bg-danger/10 rounded-full transition-all ml-1 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(symbol);
          }}
        >
          <Trash2 size={18} />
        </button>
      </div>
    );
  }

  const getPriceColor = (price: number, ref: number, ceil: number, floor: number) => {
    if (price >= ceil) return "text-fuchsia-500";
    if (price <= floor) return "text-cyan-500";
    if (price > ref) return "text-emerald-500";
    if (price < ref) return "text-red-500";
    return "text-warning-500";
  };

  const colorClass = getPriceColor(data.price, data.referencePrice, data.ceilingPrice, data.floorPrice);
  const isUp = data.percentChange > 0;
  const isDown = data.percentChange < 0;

  return (
    <div 
      onClick={() => onPress(symbol)} 
      className="w-full bg-content2/40 hover:bg-content2 backdrop-blur-md border border-white/5 transition-all shadow-sm rounded-2xl cursor-pointer p-4 flex flex-row items-center justify-between"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-base">{symbol}</h3>
          {data?.exchange && (
            <span className="text-[10px] font-medium bg-content2 text-default-500 px-1.5 py-0.5 rounded">
              {data.exchange}
            </span>
          )}
        </div>
        <p className="text-xs text-default-500 truncate">{data?.name || "Đang cập nhật..."}</p>
        
        {ownedStock && (
          <div className="mt-1 flex">
            <div className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold flex items-center gap-1 w-fit">
              👜 {ownedStock.quantity.toLocaleString()} cổ (Giá: {ownedStock.averagePrice.toLocaleString()})
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end gap-1">
          <span className={`font-black text-xl ${colorClass}`}>
            {(data.price / 1000).toFixed(2)}
          </span>
          <div className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-md ${
            isUp ? 'bg-emerald-500/15 text-emerald-500' : 
            isDown ? 'bg-red-500/15 text-red-500' : 
            'bg-warning-500/15 text-warning-500'
          }`}>
            {isUp ? '+' : ''}{data.percentChange}%
          </div>
        </div>
        
        <button 
          className="p-2 text-danger opacity-40 hover:opacity-100 hover:bg-danger/10 rounded-full transition-all ml-1 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(symbol);
          }}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
