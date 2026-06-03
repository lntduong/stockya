"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createChart, CandlestickSeries } from "lightweight-charts";
import { StockOverview, StockHistoryData } from "@/lib/stock-api";
import { ArrowLeft, Briefcase, TrendingUp, TrendingDown } from "lucide-react";
import useSWR from 'swr';
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function StockDetailPage() {
  const router = useRouter();
  const params = useParams();
  const activeSymbol = typeof params.symbol === 'string' ? params.symbol.toUpperCase() : '';

  // Data fetching
  const { data: portfolioData } = useSWR('/api/portfolio', fetcher);
  const ownedStock = portfolioData?.data?.find((item: any) => item.symbol === activeSymbol);
  const portfolioItems = portfolioData?.data || [];

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [overview, setOverview] = useState<StockOverview | null>(null);
  const [history, setHistory] = useState<StockHistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Alert states
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [savingAlert, setSavingAlert] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState(false);

  // Trade states
  const [tradeQuantity, setTradeQuantity] = useState("");
  const [tradePrice, setTradePrice] = useState("");
  const [tradeAction, setTradeAction] = useState<"BUY" | "SELL">("BUY");
  const [trading, setTrading] = useState(false);
  const [tradeSuccess, setTradeSuccess] = useState(false);

  useEffect(() => {
    if (!activeSymbol) return;
    
    let isMounted = true;
    setLoading(true);

    const fetchData = async () => {
      try {
        const endDate = new Date().toISOString().split('T')[0];
        const d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        const startDate = d.toISOString().split('T')[0];

        const [overviewRes, historyRes, alertRes] = await Promise.all([
          fetch(`/api/stock?symbol=${activeSymbol}&type=overview`),
          fetch(`/api/stock?symbol=${activeSymbol}&type=history&start=${startDate}&end=${endDate}`),
          fetch(`/api/alerts?symbol=${activeSymbol}`)
        ]);

        const overviewJson = await overviewRes.json();
        const historyJson = await historyRes.json();
        const alertJson = await alertRes.json();

        if (isMounted) {
          setOverview(overviewJson.data);
          setHistory(historyJson.data || []);
          
          if (overviewJson.data) {
             setTradePrice((overviewJson.data.price / 1000).toFixed(2).toString());
          }
          
          if (alertJson.data) {
             setMinPrice(alertJson.data.minPrice ? (alertJson.data.minPrice / 1000).toString() : "");
             setMaxPrice(alertJson.data.maxPrice ? (alertJson.data.maxPrice / 1000).toString() : "");
             setIsAlertActive(alertJson.data.isActive);
          }
          setLoading(false);
        }
      } catch (e) {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, [activeSymbol]);

  useEffect(() => {
    if (!chartContainerRef.current || history.length === 0 || loading) return;

    chartContainerRef.current.innerHTML = "";

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#A1A1AA',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        rightOffset: 5,
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    const data = history
      .map(item => ({
        time: item.time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }))
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    candlestickSeries.setData(data);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [history, loading]);

  const handleTrade = async () => {
    if (!activeSymbol || !tradeQuantity || !tradePrice) return;
    setTrading(true);
    setTradeSuccess(false);
    
    const qty = parseInt(tradeQuantity);
    const prc = parseFloat(tradePrice) * 1000;
    const qtyChange = tradeAction === "BUY" ? qty : -qty;

    try {
      const res = await fetch('/api/portfolio/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: activeSymbol,
          quantityChange: qtyChange,
          price: prc
        })
      });
      
      if (!res.ok) throw new Error("Lỗi giao dịch");
      
      setTradeSuccess(true);
      setTradeQuantity("");
      setTimeout(() => setTradeSuccess(false), 3000);
    } catch (error) {
      alert("Lỗi giao dịch! Đảm bảo bạn có Tab Portfolio trên Google Sheets.");
    } finally {
      setTrading(false);
    }
  };

  const handleSaveAlert = async () => {
    if (!activeSymbol) return;
    setSavingAlert(true);
    setAlertSuccess(false);
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: activeSymbol,
          minPrice: parseFloat(minPrice) * 1000 || 0,
          maxPrice: parseFloat(maxPrice) * 1000 || 0,
          isActive: isAlertActive,
          telegramChatId: ''
        })
      });
      
      if (!res.ok) throw new Error("Lỗi khi lưu dữ liệu");
      
      setAlertSuccess(true);
      setTimeout(() => setAlertSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      alert("Lỗi lưu dữ liệu! Vui lòng đảm bảo bạn đã tạo tab 'Alerts' trên Google Sheets.");
    } finally {
      setSavingAlert(false);
    }
  };

  const getPriceColor = (price: number, ref: number, ceil: number, floor: number) => {
    if (price >= ceil) return "text-fuchsia-500";
    if (price <= floor) return "text-cyan-500";
    if (price > ref) return "text-emerald-500";
    if (price < ref) return "text-red-500";
    return "text-warning-500";
  };

  const fillPrice = (type: 'floor' | 'ref' | 'ceil') => {
    if (!overview) return;
    if (type === 'floor') setTradePrice((overview.floorPrice / 1000).toFixed(2));
    if (type === 'ref') setTradePrice((overview.referencePrice / 1000).toFixed(2));
    if (type === 'ceil') setTradePrice((overview.ceilingPrice / 1000).toFixed(2));
  };

  const fillQuantity = (amount: number | 'all') => {
    if (amount === 'all') {
      if (tradeAction === 'SELL' && ownedStock) {
        setTradeQuantity(ownedStock.quantity.toString());
      }
    } else {
      setTradeQuantity(amount.toString());
    }
  };

  return (
    <div className="min-h-screen bg-background pb-48 animate-in fade-in duration-300">
      <div className="sticky top-0 bg-background/90 backdrop-blur-xl z-20 px-5 pt-safe border-b border-white/5 flex items-center shadow-sm">
        <button 
          className="p-2.5 -ml-2 mr-3 hover:bg-content2 rounded-full transition-colors"
          onClick={() => router.back()}
        >
          <ArrowLeft size={24} />
        </button>
        <div className="py-3 flex-1">
          {activeSymbol && (
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black tracking-tight">{activeSymbol}</h2>
            </div>
          )}
          {overview && <p className="text-sm text-default-400 font-medium truncate">{overview.name}</p>}
        </div>
      </div>
      
      <div className="px-5 pt-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {overview ? (
              <>
                <div className="flex items-end gap-3">
                  <span className={`text-5xl font-black tracking-tighter ${getPriceColor(overview.price, overview.referencePrice, overview.ceilingPrice, overview.floorPrice)}`}>
                    {(overview.price / 1000).toFixed(2)}
                  </span>
                  <span className={`text-xl font-bold mb-1.5 ${overview.percentChange > 0 ? 'text-emerald-500' : overview.percentChange < 0 ? 'text-red-500' : 'text-warning-500'}`}>
                    {overview.percentChange > 0 ? '+' : ''}{overview.percentChange}%
                  </span>
                </div>

                {ownedStock && (
                  <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/20 rounded-full text-primary">
                        <Briefcase size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-primary font-bold uppercase tracking-wider mb-0.5">Tài sản của bạn</span>
                        <span className="font-black text-lg">{ownedStock.quantity.toLocaleString()} cổ phiếu</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-default-500 font-medium mb-0.5">Giá vốn</span>
                      <span className="font-bold">{(ownedStock.averagePrice > 1000 ? ownedStock.averagePrice / 1000 : ownedStock.averagePrice).toLocaleString('en-US', {maximumFractionDigits: 2})}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 bg-content2/50 border border-white/5 p-4 rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-xs text-default-500 font-medium mb-0.5">Tham chiếu</span>
                    <span className="text-warning-500 font-bold text-sm">{(overview.referencePrice / 1000).toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-default-500 font-medium mb-0.5">Trần</span>
                    <span className="text-fuchsia-500 font-bold text-sm">{(overview.ceilingPrice / 1000).toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-default-500 font-medium mb-0.5">Sàn</span>
                    <span className="text-cyan-500 font-bold text-sm">{(overview.floorPrice / 1000).toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col mt-2">
                    <span className="text-xs text-default-500 font-medium mb-0.5">KLGD</span>
                    <span className="font-semibold text-sm">{(overview.volume / 1000).toLocaleString()}K</span>
                  </div>
                  <div className="flex flex-col mt-2">
                    <span className="text-xs text-default-500 font-medium mb-0.5">P/E</span>
                    <span className="font-semibold text-sm">{overview.pe || '--'}</span>
                  </div>
                  <div className="flex flex-col mt-2">
                    <span className="text-xs text-default-500 font-medium mb-0.5">EPS</span>
                    <span className="font-semibold text-sm">{overview.eps ? overview.eps.toLocaleString() : '--'}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center px-1">
                    <h3 className="font-bold text-sm text-default-500 tracking-wide">BIỂU ĐỒ GIÁ (1 NĂM)</h3>
                  </div>
                  <div 
                    ref={chartContainerRef} 
                    className="w-full h-[300px] rounded-2xl overflow-hidden border border-black/10 dark:border-white/5 bg-[#12141C]"
                  />
                </div>
              </>
            ) : (
              <div className="bg-danger/10 border border-danger/20 p-4 rounded-2xl">
                <p className="text-danger font-medium text-sm">Không thể tải dữ liệu thị trường cho mã này. Tuy nhiên, bạn vẫn có thể thực hiện giao dịch Bán để loại bỏ mã này khỏi Danh mục.</p>
              </div>
            )}

            {/* Trading UI */}
            <div className="flex flex-col gap-3 mt-2">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-bold text-sm text-default-500 tracking-wide">💼 GIAO DỊCH</h3>
              </div>
              
              <div className="bg-content2/50 border border-black/5 dark:border-white/5 p-4 rounded-2xl flex flex-col gap-4">
                <div className="flex bg-content3/50 p-1 rounded-xl">
                  <button 
                    onClick={() => setTradeAction("BUY")}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${tradeAction === 'BUY' ? 'bg-emerald-500 text-white shadow-sm' : 'text-default-500'}`}
                  >
                    MUA
                  </button>
                  <button 
                    onClick={() => setTradeAction("SELL")}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${tradeAction === 'SELL' ? 'bg-danger text-white shadow-sm' : 'text-default-500'}`}
                  >
                    BÁN
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-1">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-default-500 font-medium">Khối lượng</span>
                      <div className="flex gap-1">
                        <button onClick={() => fillQuantity(100)} className="text-[10px] bg-content3 px-2 py-0.5 rounded font-bold text-default-500">100</button>
                        <button onClick={() => fillQuantity(1000)} className="text-[10px] bg-content3 px-2 py-0.5 rounded font-bold text-default-500">1k</button>
                        {tradeAction === 'SELL' && ownedStock && (
                          <button onClick={() => fillQuantity('all')} className="text-[10px] bg-danger/20 text-danger px-2 py-0.5 rounded font-bold">ALL</button>
                        )}
                      </div>
                    </div>
                    <input 
                      type="number"
                      placeholder="VD: 1000"
                      value={tradeQuantity}
                      onChange={(e) => setTradeQuantity(e.target.value)}
                      className="w-full bg-content1 border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 text-base outline-none focus:border-primary transition-colors font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-default-500 font-medium">Giá đặt</span>
                      <div className="flex gap-1">
                        <button onClick={() => fillPrice('floor')} className="text-[10px] bg-cyan-500/10 text-cyan-500 px-2 py-0.5 rounded font-bold">Sàn</button>
                        <button onClick={() => fillPrice('ref')} className="text-[10px] bg-warning-500/10 text-warning-500 px-2 py-0.5 rounded font-bold">Khớp</button>
                        <button onClick={() => fillPrice('ceil')} className="text-[10px] bg-fuchsia-500/10 text-fuchsia-500 px-2 py-0.5 rounded font-bold">Trần</button>
                      </div>
                    </div>
                    <input 
                      type="number"
                      placeholder="Giá khớp"
                      value={tradePrice}
                      onChange={(e) => setTradePrice(e.target.value)}
                      className="w-full bg-content1 border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 text-base outline-none focus:border-primary transition-colors font-bold"
                    />
                  </div>
                </div>
                
                <button 
                  onClick={handleTrade}
                  disabled={trading || !tradeQuantity || !tradePrice}
                  className={`w-full py-3.5 mt-2 rounded-xl font-bold text-base transition-all ${tradeSuccess ? 'bg-primary text-white' : tradeAction === 'BUY' ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-danger/20 text-danger-500 hover:bg-danger hover:text-white'} ${trading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {trading ? 'Đang xử lý...' : tradeSuccess ? 'Thành công!' : `Xác nhận ${tradeAction === 'BUY' ? 'Mua' : 'Bán'}`}
                </button>
              </div>
            </div>

            {/* Alert Settings */}
            <div className="flex flex-col gap-3 mt-2 mb-6">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-bold text-sm text-default-500 tracking-wide">🔔 CẢNH BÁO GIÁ</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-medium">{isAlertActive ? 'Đang bật' : 'Đang tắt'}</span>
                  <button
                    onClick={() => setIsAlertActive(!isAlertActive)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAlertActive ? 'bg-emerald-500' : 'bg-default-300'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isAlertActive ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </label>
              </div>
              
              <div className="grid grid-cols-2 gap-4 bg-content2/50 border border-black/5 dark:border-white/5 p-4 rounded-2xl">
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-default-500 font-medium">Giá Cắt lỗ (Sàn)</span>
                  <input 
                    type="number"
                    placeholder="VD: 24.5"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full bg-content1 border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 text-base outline-none focus:border-primary transition-colors text-cyan-500 font-bold"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-default-500 font-medium">Giá Chốt lời (Trần)</span>
                  <input 
                    type="number"
                    placeholder="VD: 28.0"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full bg-content1 border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 text-base outline-none focus:border-primary transition-colors text-fuchsia-500 font-bold"
                  />
                </div>
              </div>
              
              <button 
                onClick={handleSaveAlert}
                disabled={savingAlert}
                className={`w-full py-4 rounded-xl font-bold text-base transition-all ${alertSuccess ? 'bg-emerald-500 text-white' : 'bg-primary text-white hover:bg-primary/90'} ${savingAlert ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {savingAlert ? 'Đang lưu...' : alertSuccess ? 'Đã lưu thành công!' : 'Lưu cấu hình cảnh báo'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Portfolio Horizontal List (Sticky at bottom, above bottom-nav which is h-16) */}
      {portfolioItems.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 bg-content2/95 backdrop-blur-xl border-t border-black/5 dark:border-white/5 pb-3 pt-3 px-4 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.5)] z-40">
          <h4 className="text-[10px] font-bold text-default-400 uppercase tracking-wider mb-2 px-1">Danh mục của bạn</h4>
          <div className="flex overflow-x-auto gap-3 pb-4 snap-x hide-scrollbar">
            {portfolioItems.map((item: any) => {
              const isActive = item.symbol === activeSymbol;
              return (
                <Link 
                  href={`/stock/${item.symbol}`} 
                  key={item.symbol}
                  className={`flex flex-col min-w-[100px] p-2.5 rounded-xl border transition-all snap-start ${isActive ? 'bg-primary/20 border-primary shadow-sm' : 'bg-content3/50 border-white/5 hover:bg-content3'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-black text-sm ${isActive ? 'text-primary' : ''}`}>{item.symbol}</span>
                    <span className="text-[10px] font-medium text-default-400 bg-black/20 px-1.5 rounded">{item.quantity}</span>
                  </div>
                  {/* Current price would ideally be here if we fetch bulk prices, but SWR only has quantity/avgPrice. We can show avgPrice. */}
                  <span className="text-xs text-default-500 font-medium">Vốn: {(item.averagePrice > 1000 ? item.averagePrice / 1000 : item.averagePrice).toLocaleString('en-US', {maximumFractionDigits: 1})}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
