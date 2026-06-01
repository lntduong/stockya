"use client";

import { useEffect, useState } from "react";
import { Activity, TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldCheck } from "lucide-react";

export default function AnalysisPage() {
  const [tab, setTab] = useState<'portfolio' | 'watchlist'>('portfolio');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchAnalysis = async () => {
      setLoading(true);
      setData([]);
      try {
        let symbols: string[] = [];
        
        if (tab === 'portfolio') {
          const res = await fetch('/api/portfolio');
          const json = await res.json();
          symbols = (json.data || []).map((i: any) => i.symbol);
        } else {
          const res = await fetch('/api/sheets');
          const json = await res.json();
          const allSymbols = new Set<string>();
          (json.data || []).forEach((wl: any) => {
            if (wl.symbols) {
              wl.symbols.split(',').forEach((s: string) => allSymbols.add(s));
            }
          });
          symbols = Array.from(allSymbols);
        }
        
        if (symbols.length > 0) {
          const analysisRes = await fetch(`/api/analysis?symbols=${symbols.join(',')}`);
          const analysisJson = await analysisRes.json();
          if (isMounted) setData(analysisJson.data || []);
        } else {
          if (isMounted) setData([]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchAnalysis();
    return () => { isMounted = false; };
  }, [tab]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-fuchsia-500/20 rounded-2xl">
          <Activity className="text-fuchsia-500" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Sức mạnh</h1>
          <p className="text-sm text-default-500 font-medium">Robot Khuyến nghị Mua / Bán</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-content2/50 p-1.5 rounded-2xl border border-white/5">
        <button 
          onClick={() => setTab('portfolio')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'portfolio' ? 'bg-primary text-white shadow-md' : 'text-default-500 hover:bg-content3'}`}
        >
          Danh mục của tôi
        </button>
        <button 
          onClick={() => setTab('watchlist')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'watchlist' ? 'bg-primary text-white shadow-md' : 'text-default-500 hover:bg-content3'}`}
        >
          Đang theo dõi
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin" /></div>
        ) : data.length === 0 ? (
          <div className="text-center p-10 bg-content2/30 rounded-3xl border border-white/5">
            <p className="text-default-500">Chưa có dữ liệu phân tích.</p>
          </div>
        ) : (
          data.map((item) => (
            <div key={item.symbol} className="bg-content2/40 backdrop-blur-md rounded-3xl p-5 border border-white/5 flex flex-col gap-4">
              
              {/* Header: Symbol & Recommendation Badge */}
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black">{item.symbol}</h2>
                  <span className="text-default-500 font-bold">{(item.currentPrice).toFixed(2)}</span>
                </div>
                
                <div className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wider ${
                  item.action === 'BUY_STRONG' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 
                  item.action === 'BUY' ? 'bg-emerald-500/20 text-emerald-500' :
                  item.action === 'SELL_STRONG' ? 'bg-danger text-white shadow-lg shadow-danger/30' :
                  item.action === 'SELL' ? 'bg-danger/20 text-danger-500' :
                  'bg-default-200 text-default-600'
                }`}>
                  {item.action === 'BUY_STRONG' ? '🔥 MUA MẠNH' : 
                   item.action === 'BUY' ? 'MUA THĂM DÒ' : 
                   item.action === 'SELL_STRONG' ? '⚠️ BÁN GẤP' : 
                   item.action === 'SELL' ? 'CANH BÁN' : 'NẮM GIỮ'}
                </div>
              </div>

              {/* Trend Analysis */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  {item.trend.includes('UP') ? <TrendingUp className="text-emerald-500" size={18} /> : 
                   item.trend.includes('DOWN') ? <TrendingDown className="text-danger-500" size={18} /> : 
                   <Minus className="text-default-400" size={18} />}
                  <span className="font-bold text-sm">Xu hướng: {item.trendText}</span>
                </div>
                <p className="text-xs text-default-400 leading-relaxed bg-content1/50 p-3 rounded-xl">
                  {item.trendDesc} (SMA20: {item.sma20?.toFixed(2)}, SMA50: {item.sma50?.toFixed(2)})
                </p>
              </div>

              {/* RSI Analysis */}
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.rsiState === 'OVERBOUGHT' ? <AlertTriangle className="text-warning-500" size={18} /> : 
                     item.rsiState === 'OVERSOLD' ? <ShieldCheck className="text-emerald-500" size={18} /> : 
                     <Activity className="text-default-400" size={18} />}
                    <span className="font-bold text-sm">RSI Động lượng: {item.rsi?.toFixed(1)}</span>
                  </div>
                  <span className={`text-xs font-bold ${
                    item.rsiState === 'OVERBOUGHT' ? 'text-warning-500' : 
                    item.rsiState === 'OVERSOLD' ? 'text-emerald-500' : 'text-default-500'
                  }`}>
                    {item.rsiText}
                  </span>
                </div>
                
                {/* RSI Progress Bar */}
                <div className="w-full bg-content1 h-2.5 rounded-full overflow-hidden relative mt-1">
                  {/* Quá bán (0-30) */}
                  <div className="absolute left-0 top-0 bottom-0 w-[30%] bg-emerald-500/20" />
                  {/* Quá mua (70-100) */}
                  <div className="absolute right-0 top-0 bottom-0 w-[30%] bg-warning-500/20" />
                  {/* RSI Value Indicator */}
                  <div 
                    className={`absolute top-0 bottom-0 w-2 rounded-full transition-all duration-1000 ${
                      item.rsiState === 'OVERBOUGHT' ? 'bg-warning-500 shadow-[0_0_8px_rgba(245,165,36,1)]' : 
                      item.rsiState === 'OVERSOLD' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]' : 'bg-default-500'
                    }`}
                    style={{ left: `calc(${Math.min(Math.max(item.rsi || 50, 0), 100)}% - 4px)` }}
                  />
                </div>
                
                <p className="text-xs text-default-400 leading-relaxed bg-content1/50 p-3 rounded-xl mt-1">
                  {item.rsiDesc}
                </p>
              </div>
              
            </div>
          ))
        )}
      </div>
    </div>
  );
}
