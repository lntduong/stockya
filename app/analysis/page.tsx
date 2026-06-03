"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  LayoutGrid,
  List,
  Search,
  Loader2,
} from "lucide-react";
import useSWR, { mutate } from "swr";
import PullToRefresh from "@/components/pull-to-refresh";
import CompactStockRow from "@/components/compact-stock-row";
import AnalysisCard from "@/components/analysis-card";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AnalysisPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"portfolio" | "watchlist">("portfolio");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.toUpperCase().trim());
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data: watchlistsResponse } = useSWR("/api/sheets", fetcher);
  const watchlists = watchlistsResponse?.data || [];

  const { data: portfolioResponse } = useSWR("/api/portfolio", fetcher);
  const portfolioItems = portfolioResponse?.data || [];

  // Compute groups and symbols synchronously to avoid useEffect loops
  const fetchGroups: { name: string; symbols: string[] }[] = [];
  const allSymbolsToFetch = new Set<string>();

  if (tab === "portfolio") {
    const portfolioSymbols = portfolioItems.map((item: any) => item.symbol);
    if (portfolioSymbols.length > 0) {
      fetchGroups.push({ name: "Tài sản của tôi", symbols: portfolioSymbols });
      portfolioSymbols.forEach((s: string) => allSymbolsToFetch.add(s));
    }
  } else {
    watchlists.forEach((wl: any) => {
      if (wl.symbols) {
        const syms = wl.symbols.split(",").filter(Boolean);
        if (syms.length > 0) {
          fetchGroups.push({ name: wl.name, symbols: syms });
          syms.forEach((s: string) => allSymbolsToFetch.add(s));
        }
      }
    });
  }

  const symbolsQuery = Array.from(allSymbolsToFetch).join(",");

  const { data: stockDataResponse } = useSWR(
    symbolsQuery ? `/api/stock/bulk?symbols=${symbolsQuery}` : null,
    fetcher,
    { refreshInterval: 60000 },
  );

  const {
    data: analysisResponse,
    isLoading,
    mutate: mutateAnalysis,
  } = useSWR(
    symbolsQuery ? `/api/analysis?symbols=${symbolsQuery}` : null,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 60000 },
  );

  const { data: searchAnalysisData, isLoading: isSearchingAnalysis } = useSWR(
    debouncedSearch ? `/api/analysis?symbols=${debouncedSearch}` : null,
    fetcher
  );

  const { data: searchStockData } = useSWR(
    debouncedSearch ? `/api/stock/bulk?symbols=${debouncedSearch}` : null,
    fetcher
  );

  const stockDataDict = stockDataResponse?.data || {};

  const analysisData = analysisResponse?.data || [];
  const analysisDict: Record<string, any> = {};
  analysisData.forEach((item: any) => {
    analysisDict[item.symbol] = item;
  });

  const groups = fetchGroups
    .map((g) => ({
      name: g.name,
      items: g.symbols.map((s) => analysisDict[s]).filter(Boolean),
    }))
    .filter((g) => g.items.length > 0);

  const handleRefresh = async () => {
    if (tab === "portfolio") {
      await mutate("/api/portfolio");
    } else {
      await mutate("/api/sheets");
    }
    if (symbolsQuery) {
      await mutateAnalysis();
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-fuchsia-500/20 rounded-2xl">
            <Activity className="text-fuchsia-500" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Sức mạnh</h1>
            <p className="text-sm text-default-500 font-medium">
              Robot Khuyến nghị Mua / Bán
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-default-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm sức mạnh cổ phiếu... (VD: VNM)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-content2/50 border border-white/5 rounded-2xl pl-10 pr-10 py-3 text-sm outline-none focus:border-fuchsia-500 transition-colors uppercase font-bold"
          />
          {isSearchingAnalysis && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
               <Loader2 size={16} className="text-fuchsia-500 animate-spin" />
            </div>
          )}
        </div>

        {/* Search Result */}
        {debouncedSearch && searchAnalysisData?.data?.[0] && (
          <div className="flex flex-col gap-3 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="flex items-center gap-2 px-1">
               <Search className="text-fuchsia-500" size={18} />
               <h3 className="font-extrabold text-sm tracking-wide text-fuchsia-500">KẾT QUẢ TÌM KIẾM</h3>
             </div>
             {viewMode === "list" ? (
                <CompactStockRow 
                   symbol={debouncedSearch}
                   priceData={searchStockData?.data?.[debouncedSearch]}
                   analysisData={searchAnalysisData.data[0]}
                   onPress={(sym) => router.push(`/stock/${sym}`)}
                />
             ) : (
                <AnalysisCard 
                   item={searchAnalysisData.data[0]}
                   onPress={(sym) => router.push(`/stock/${sym}`)}
                />
             )}
          </div>
        )}

        {/* Tabs & View Toggle */}
        <div className="flex gap-2">
          <div className="flex-1 flex bg-content2/50 p-1.5 rounded-2xl border border-white/5">
            <button
              onClick={() => setTab("portfolio")}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === "portfolio" ? "bg-primary text-white shadow-md" : "text-default-500 hover:bg-content3"}`}
            >
              Danh mục của tôi
            </button>
            <button
              onClick={() => setTab("watchlist")}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === "watchlist" ? "bg-primary text-white shadow-md" : "text-default-500 hover:bg-content3"}`}
            >
              Đang theo dõi
            </button>
          </div>

          <div className="flex bg-content2/50 p-1.5 rounded-2xl border border-white/5">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-xl transition-all ${viewMode === "list" ? "bg-primary text-white shadow-md" : "text-default-500 hover:bg-content3"}`}
            >
              <List size={20} />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`p-2 rounded-xl transition-all ${viewMode === "card" ? "bg-primary text-white shadow-md" : "text-default-500 hover:bg-content3"}`}
            >
              <LayoutGrid size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin" />
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center p-10 bg-content2/30 rounded-3xl border border-white/5">
              <p className="text-default-500">Chưa có dữ liệu phân tích.</p>
            </div>
          ) : (
            groups.map((group, gIndex) => (
              <div
                key={gIndex}
                className="flex flex-col gap-4 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1.5 h-6 bg-fuchsia-500 rounded-full"></div>
                  <h3 className="font-extrabold text-lg tracking-wide">
                    {group.name}
                  </h3>
                  <span className="text-xs bg-content2 text-default-500 font-bold px-2 py-0.5 rounded-full">
                    {group.items.length}
                  </span>
                </div>

                {viewMode === "list" ? (
                  <div className="flex flex-col gap-2">
                    {group.items.map((item) => {
                      const ownedStock = portfolioItems.find(
                        (i: any) => i.symbol === item.symbol,
                      );
                      return (
                        <CompactStockRow
                          key={item.symbol}
                          symbol={item.symbol}
                          priceData={stockDataDict[item.symbol]}
                          analysisData={item}
                          ownedQuantity={ownedStock?.quantity}
                          averagePrice={ownedStock?.averagePrice}
                          onPress={(sym) => router.push(`/stock/${sym}`)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {group.items.map((item) => {
                      const ownedStock = portfolioItems.find(
                        (i: any) => i.symbol === item.symbol,
                      );
                      return (
                        <AnalysisCard
                          key={item.symbol}
                          item={item}
                          ownedStock={ownedStock}
                          onPress={(sym) => router.push(`/stock/${sym}`)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </PullToRefresh>
  );
}
