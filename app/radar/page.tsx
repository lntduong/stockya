"use client";

import { useState } from "react";
import useSWR, { mutate } from 'swr';
import { useRouter } from "next/navigation";
import { Radar, TrendingUp, TrendingDown, Clock, AlertTriangle } from "lucide-react";
import PullToRefresh from "@/components/pull-to-refresh";
import AnalysisCard from "@/components/analysis-card";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function RadarPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  
  const { data, error, isLoading } = useSWR('/api/radar', fetcher, {
    refreshInterval: 60000, // Refresh every minute
    revalidateOnFocus: true
  });

  const { data: portfolioData } = useSWR('/api/portfolio', fetcher);
  const portfolioItems = portfolioData?.data || [];

  const renderStockCard = (item: any, isBuy: boolean, index: number) => {
    const ownedStock = portfolioItems.find((i: any) => i.symbol === item.symbol);
    
    return (
      <div key={item.symbol} className="relative mt-2">
         {/* Rank Badge */}
         <div className={`absolute -top-3 -left-3 w-8 h-8 flex items-center justify-center rounded-full text-white font-black z-10 shadow-lg border-2 border-background ${
            isBuy ? 'bg-emerald-500' : 'bg-danger-500'
         }`}>
            #{index + 1}
         </div>
         
         <div className={`rounded-[1.6rem] border-2 shadow-lg ${isBuy ? 'border-emerald-500/30' : 'border-danger-500/30'}`}>
            <AnalysisCard
               item={item}
               ownedStock={ownedStock}
               onPress={(sym) => router.push(`/stock/${sym}`)}
            />
         </div>
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

          {/* Tabs */}
          <div className="flex gap-2">
            <div className="flex-1 flex bg-content2/50 p-1.5 rounded-2xl border border-white/5">
              <button
                onClick={() => setTab("buy")}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${tab === "buy" ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "text-default-500 hover:bg-content3"}`}
              >
                <TrendingUp size={20} />
                <span className="font-bold hidden sm:inline">CƠ HỘI MUA</span>
              </button>
              <button
                onClick={() => setTab("sell")}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${tab === "sell" ? "bg-danger text-white shadow-md shadow-danger/20" : "text-default-500 hover:bg-content3"}`}
              >
                <TrendingDown size={20} />
                <span className="font-bold hidden sm:inline">CẢNH BÁO BÁN</span>
              </button>
            </div>
          </div>

          {tab === "buy" && (
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
                <div className="grid grid-cols-1 gap-4">
                  {data?.data?.buy?.map((item: any, index: number) => renderStockCard(item, true, index))}
                </div>
              )}
            </div>
          )}

          {tab === "sell" && (
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-center gap-2 px-1">
                <TrendingDown className="text-danger-500" size={24} />
                <h2 className="text-xl font-black tracking-tight">CẢNH BÁO BÁN (Score ≤ -4)</h2>
              </div>
              
              {data?.data?.sell?.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-white/10 rounded-2xl text-default-500 text-sm">
                  Không có tín hiệu BÁN rõ ràng nào lúc này.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {data?.data?.sell?.map((item: any, index: number) => renderStockCard(item, false, index))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      </div>
    </PullToRefresh>
  );
}
