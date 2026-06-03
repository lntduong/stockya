"use client";

import { useEffect, useState } from "react";
import { Activity, TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldCheck } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AnalysisPage() {
  const [tab, setTab] = useState<'portfolio' | 'watchlist'>('portfolio');
  const [groups, setGroups] = useState<{name: string, items: any[]}[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: watchlistsResponse } = useSWR('/api/sheets', fetcher);
  const watchlists = watchlistsResponse?.data || [];

  const { data: portfolioResponse } = useSWR('/api/portfolio', fetcher);
  const portfolioItems = portfolioResponse?.data || [];
  const portfolioSymbols = portfolioItems.map((item: any) => item.symbol);

  useEffect(() => {
    let isMounted = true;
    
    const fetchAnalysis = async () => {
      setLoading(true);
      setGroups([]);
      try {
        let fetchGroups: { name: string, symbols: string[] }[] = [];
        let allSymbolsToFetch = new Set<string>();
        
        if (tab === 'portfolio') {
          if (portfolioSymbols.length > 0) {
            fetchGroups.push({ name: 'Tài sản của tôi', symbols: portfolioSymbols });
            portfolioSymbols.forEach((s: string) => allSymbolsToFetch.add(s));
          }
        } else {
          (watchlists || []).forEach((wl: any) => {
            if (wl.symbols) {
              const syms = wl.symbols.split(',').filter(Boolean);
              if (syms.length > 0) {
                fetchGroups.push({ name: wl.name, symbols: syms });
                syms.forEach((s: string) => allSymbolsToFetch.add(s));
              }
            }
          });
        }
        
        if (allSymbolsToFetch.size > 0) {
          const analysisRes = await fetch(`/api/analysis?symbols=${Array.from(allSymbolsToFetch).join(',')}`);
          const analysisJson = await analysisRes.json();
          const analysisData = analysisJson.data || [];
          
          // Map array to dictionary by symbol
          const analysisDict: Record<string, any> = {};
          analysisData.forEach((item: any) => {
            analysisDict[item.symbol] = item;
          });
          
          // Construct the final groups
          const finalGroups = fetchGroups.map(g => ({
            name: g.name,
            items: g.symbols.map(s => analysisDict[s]).filter(Boolean)
          })).filter(g => g.items.length > 0);
          
          if (isMounted) setGroups(finalGroups);
        } else {
          if (isMounted) setGroups([]);
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
        ) : groups.length === 0 ? (
          <div className="text-center p-10 bg-content2/30 rounded-3xl border border-white/5">
            <p className="text-default-500">Chưa có dữ liệu phân tích.</p>
          </div>
        ) : (
          groups.map((group, gIndex) => (
            <div key={gIndex} className="flex flex-col gap-4 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1.5 h-6 bg-fuchsia-500 rounded-full"></div>
                <h3 className="font-extrabold text-lg tracking-wide">{group.name}</h3>
                <span className="text-xs bg-content2 text-default-500 font-bold px-2 py-0.5 rounded-full">{group.items.length}</span>
              </div>
              
              {group.items.map((item) => {
                const ownedStock = portfolioItems.find((i: any) => i.symbol === item.symbol);
                return (
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

                  {/* Overall Score */}
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-default-500">Điểm định lượng (Score)</span>
                      <div className={`px-3 py-0.5 rounded-xl text-lg font-black tracking-wider shadow-sm ${
                        item.score >= 6 ? 'bg-emerald-500 text-white shadow-emerald-500/30' :
                        item.score >= 2 ? 'bg-emerald-500/20 text-emerald-500' :
                        item.score >= -1 ? 'bg-default-200 text-default-600' :
                        item.score >= -5 ? 'bg-danger/20 text-danger-500' : 
                        'bg-danger text-white shadow-danger/30'
                      }`}>
                        {item.score > 0 ? '+' : ''}{item.score}<span className="text-sm font-bold opacity-60">/10</span>
                      </div>
                    </div>
                    
                    {/* Score Progress Bar from -10 to +10 */}
                    <div className="w-full bg-content1 h-2.5 rounded-full overflow-hidden relative">
                      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20 z-10" />
                      <div 
                        className={`absolute top-0 bottom-0 transition-all duration-1000 ${
                          item.score > 0 ? 'bg-emerald-500 left-1/2' : 'bg-danger-500 right-1/2'
                        }`}
                        style={{ width: `${Math.abs(item.score) * 5}%`, right: item.score < 0 ? '50%' : 'auto' }}
                      />
                    </div>
                  </div>

                  {/* Trend Analysis (SMA) */}
                  <div className="flex flex-col gap-2 mt-2">
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

                  {/* Technical Indicators Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="bg-content1/50 rounded-xl p-3 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-default-400 uppercase tracking-wider">MACD Động lượng</span>
                      <span className={`text-sm font-bold ${
                        item.macdState === 'BULLISH' ? 'text-emerald-500' : 
                        item.macdState === 'BEARISH' ? 'text-danger-500' : 'text-default-500'
                      }`}>{item.macdText}</span>
                    </div>
                    
                    <div className="bg-content1/50 rounded-xl p-3 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-default-400 uppercase tracking-wider">Bollinger Bands</span>
                      <span className={`text-sm font-bold ${
                        item.bbState === 'LOWER_BAND' ? 'text-emerald-500' : 
                        item.bbState === 'UPPER_BAND' ? 'text-danger-500' : 'text-default-500'
                      }`}>{item.bbText}</span>
                    </div>
                    
                    <div className="bg-content1/50 rounded-xl p-3 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-default-400 uppercase tracking-wider">VSA Dòng tiền</span>
                      <span className={`text-sm font-bold ${
                        item.vsaState === 'ACCUMULATION' ? 'text-emerald-500' : 
                        item.vsaState === 'DISTRIBUTION' ? 'text-danger-500' : 'text-default-500'
                      }`}>{item.vsaText}</span>
                    </div>

                    <div className="bg-content1/50 rounded-xl p-3 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-default-400 uppercase tracking-wider">RSI ({item.rsi?.toFixed(0)})</span>
                      <span className={`text-sm font-bold ${
                        item.rsiState === 'OVERSOLD' ? 'text-emerald-500' : 
                        item.rsiState === 'OVERBOUGHT' ? 'text-warning-500' : 'text-default-500'
                      }`}>{item.rsiText}</span>
                    </div>
                  </div>  

                  {ownedStock && (
                    <div className="mt-1 flex">
                      <div className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded-md font-bold flex items-center gap-1 w-fit">
                        👜 Đang giữ {ownedStock.quantity.toLocaleString()} cổ (Giá vốn: {ownedStock.averagePrice.toLocaleString()})
                      </div>
                    </div>
                  )}
                </div>
              )})}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
