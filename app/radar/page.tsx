"use client";

import { useState } from "react";
import useSWR, { mutate } from 'swr';
import { useRouter } from "next/navigation";
import { Radar, TrendingUp, TrendingDown, Clock, AlertTriangle } from "lucide-react";
import PullToRefresh from "@/components/pull-to-refresh";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function RadarPage() {
  const router = useRouter();
  const { data, error, isLoading } = useSWR('/api/radar', fetcher, {
    refreshInterval: 60000, // Refresh every minute
    revalidateOnFocus: true
  });

  const { data: portfolioData } = useSWR('/api/portfolio', fetcher);
  const portfolioItems = portfolioData?.data || [];

  const renderStockCard = (item: any, isBuy: boolean) => {
    const ownedStock = portfolioItems.find((i: any) => i.symbol === item.symbol);
    
    return (
      <div 
        key={item.symbol}
        onClick={() => router.push(`/stock/${item.symbol}`)}
        className={`bg-content2/40 hover:bg-content2 transition-all p-4 rounded-2xl flex flex-col gap-3 border cursor-pointer ${
          isBuy ? 'border-emerald-500/20 hover:border-emerald-500/40' : 'border-danger/20 hover:border-danger/40'
        }`}
      >
        <div className="flex justify-between items-start">
          <div>
            <span className="font-black text-xl tracking-tight">{item.symbol}</span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                isBuy ? 'bg-emerald-500/20 text-emerald-500' : 'bg-danger/20 text-danger-500'
              }`}>
                {item.score > 0 ? '+' : ''}{item.score}/10
              </div>
              <span className="text-xs text-default-500 font-medium">{item.action}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="font-bold text-lg">{item.currentPrice.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="flex flex-col">
            <span className="text-[10px] text-default-500 uppercase font-bold">Xu hướng</span>
            <span className={`text-xs font-medium ${item.trend.includes('UP') ? 'text-emerald-500' : item.trend.includes('DOWN') ? 'text-danger-500' : 'text-default-500'}`}>
              {item.trendText}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-default-500 uppercase font-bold">Dòng tiền</span>
            <span className={`text-xs font-medium ${item.vsaState === 'ACCUMULATION' ? 'text-emerald-500' : item.vsaState === 'DISTRIBUTION' ? 'text-danger-500' : 'text-default-500'}`}>
              {item.vsaText}
            </span>
          </div>
        </div>

        {ownedStock && (
          <div className="mt-1 flex">
            <div className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded-md font-bold flex items-center gap-1 w-fit">
              👜 Bạn đang giữ {ownedStock.quantity.toLocaleString()} cổ (Giá vốn: {ownedStock.averagePrice.toLocaleString()})
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleRefresh = async () => {
    await mutate('/api/radar');
  };

  const allSymbols = [...(data?.data?.buy || []), ...(data?.data?.sell || [])].map((item: any) => item.symbol);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-fuchsia-500/20 rounded-2xl relative overflow-hidden">
          <Radar className="text-fuchsia-500 relative z-10 animate-spin-slow" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Radar Quét</h1>
          <p className="text-sm text-default-500 font-medium">Tự động phát hiện tín hiệu</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Radar size={48} className="text-fuchsia-500 animate-ping opacity-50" />
          <p className="text-default-500 font-medium">Đang quét TOP 50 mã cổ phiếu...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-danger/10 text-danger rounded-2xl border border-danger/20 flex flex-col items-center text-center gap-2">
          <AlertTriangle size={32} />
          <p className="font-bold">Lỗi quét dữ liệu</p>
          <p className="text-sm">Vui lòng thử lại sau ít phút.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs font-medium text-default-400 bg-content2/30 p-3 rounded-xl border border-white/5">
            <span className="flex items-center gap-1">
              <Radar size={14} /> Quét {data?.data?.scannedCount || 0} mã thanh khoản
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} /> Tự động cập nhật
            </span>
          </div>

          <div className="flex flex-col gap-4 mt-2">
            <div className="flex items-center gap-2 px-1">
              <TrendingUp className="text-emerald-500" size={24} />
              <h2 className="text-xl font-black tracking-tight">CƠ HỘI MUA (Score ≥ 4)</h2>
            </div>
            
            {data?.data?.buy?.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-white/10 rounded-2xl text-default-500 text-sm">
                Không có tín hiệu MUA rõ ràng nào lúc này.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {data?.data?.buy?.map((item: any) => renderStockCard(item, true))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 mt-6">
            <div className="flex items-center gap-2 px-1">
              <TrendingDown className="text-danger-500" size={24} />
              <h2 className="text-xl font-black tracking-tight">CẢNH BÁO BÁN (Score ≤ -4)</h2>
            </div>
            
            {data?.data?.sell?.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-white/10 rounded-2xl text-default-500 text-sm">
                Không có tín hiệu BÁN rõ ràng nào lúc này.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {data?.data?.sell?.map((item: any) => renderStockCard(item, false))}
              </div>
            )}
          </div>
        </>
      )}

      </div>
    </PullToRefresh>
  );
}
