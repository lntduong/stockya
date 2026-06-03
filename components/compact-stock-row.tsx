"use client";

import { Trash2 } from "lucide-react";
import { getStockName, getStockExchange } from "@/lib/stock-names";

interface CompactStockRowProps {
  symbol: string;
  priceData?: any;
  analysisData?: any;
  ownedQuantity?: number;
  averagePrice?: number;
  loading?: boolean;
  onPress: (symbol: string) => void;
  onRemove?: (symbol: string) => void;
  isPortfolioView?: boolean;
}

export default function CompactStockRow({
  symbol,
  priceData,
  analysisData,
  ownedQuantity,
  averagePrice,
  loading = false,
  onPress,
  onRemove,
  isPortfolioView = false,
}: CompactStockRowProps) {
  if (loading) {
    return <div className="w-full h-16 rounded-xl bg-content3/40 animate-pulse" />;
  }

  const name = getStockName(symbol);
  const exchange = getStockExchange(symbol);

  if (!priceData && !isPortfolioView) {
    return (
      <div className="w-full bg-content2/10 backdrop-blur-md border border-danger/20 rounded-xl p-3 flex flex-row items-center justify-between">
        <div className="flex-1 min-w-0 opacity-50">
          <h3 className="font-bold text-base line-through">{symbol}</h3>
          <p className="text-xs text-danger">Không có dữ liệu</p>
        </div>
        {onRemove && (
          <button 
            className="p-2 text-danger opacity-80 hover:opacity-100 hover:bg-danger/10 rounded-full transition-all ml-1 z-10"
            onClick={(e) => { e.stopPropagation(); onRemove(symbol); }}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    );
  }

  // Price Info
  const currentPrice = priceData?.price || averagePrice || 0;
  const refPrice = priceData?.referencePrice || currentPrice;
  const ceilPrice = priceData?.ceilingPrice || currentPrice;
  const floorPrice = priceData?.floorPrice || currentPrice;
  const percentChange = priceData?.percentChange || 0;

  const getPriceColor = (price: number) => {
    if (price >= ceilPrice) return "text-fuchsia-500";
    if (price <= floorPrice) return "text-cyan-500";
    if (price > refPrice) return "text-emerald-500";
    if (price < refPrice) return "text-red-500";
    return "text-warning-500";
  };

  const priceColor = getPriceColor(currentPrice);
  const isUp = percentChange > 0;
  const isDown = percentChange < 0;

  // Analysis Info
  const score = analysisData?.score;
  const action = analysisData?.action; // BUY_STRONG, BUY, SELL, SELL_STRONG, HOLD

  // Portfolio PnL Info
  let pnl = 0;
  let pnlPercent = 0;
  if (ownedQuantity && averagePrice) {
    pnl = (currentPrice - averagePrice) * ownedQuantity;
    pnlPercent = ((currentPrice - averagePrice) / averagePrice) * 100;
  }

  return (
    <div 
      onClick={() => onPress(symbol)} 
      className="w-full bg-content2/40 hover:bg-content2 backdrop-blur-md border border-white/5 transition-all shadow-sm rounded-xl cursor-pointer p-3 flex flex-row items-center justify-between gap-2"
    >
      {/* Left: Symbol & Ownership/Name */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <h3 className="font-bold text-base">{symbol}</h3>
          {exchange && (
            <span className="text-[9px] font-medium bg-content3 text-default-500 px-1 rounded">
              {exchange}
            </span>
          )}
        </div>
        
        {ownedQuantity && averagePrice ? (
          <div className="mt-0.5 flex items-center gap-1">
            <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">
              {ownedQuantity.toLocaleString()} cổ
            </span>
            <span className={`text-[10px] font-bold ${pnl > 0 ? 'text-emerald-500' : pnl < 0 ? 'text-danger-500' : 'text-default-500'}`}>
              {pnl > 0 ? '+' : ''}{pnlPercent.toFixed(1)}%
            </span>
          </div>
        ) : (
          <p className="text-[10px] text-default-500 truncate mt-0.5" title={name}>{name}</p>
        )}
      </div>
      
      {/* Middle: Analysis Score & Badge (Only if available) */}
      <div className="flex flex-col items-center justify-center w-20">
        {score !== undefined ? (
          <>
            <div className={`text-xs font-black ${score >= 6 ? 'text-emerald-500' : score <= -5 ? 'text-danger-500' : score >= 2 ? 'text-emerald-500/70' : score < 0 ? 'text-danger-500/70' : 'text-default-500'}`}>
              {score > 0 ? '+' : ''}{score}/10
            </div>
            <div className={`text-[8px] font-black tracking-wider px-1.5 py-0.5 rounded mt-0.5 ${
              action === 'BUY_STRONG' ? 'bg-emerald-500 text-white' : 
              action === 'BUY' ? 'bg-emerald-500/20 text-emerald-500' :
              action === 'SELL_STRONG' ? 'bg-danger text-white' :
              action === 'SELL' ? 'bg-danger/20 text-danger-500' :
              'bg-default-200 text-default-600'
            }`}>
              {action === 'BUY_STRONG' ? 'MUA MẠNH' : 
               action === 'BUY' ? 'MUA' : 
               action === 'SELL_STRONG' ? 'BÁN MẠNH' : 
               action === 'SELL' ? 'BÁN' : 'GIỮ'}
            </div>
          </>
        ) : (
          <div className="w-6 h-0.5 bg-white/5 rounded-full" /> // Placeholder
        )}
      </div>

      {/* Right: Price & Percent Change */}
      <div className="flex items-center gap-2 w-24 justify-end">
        <div className="flex flex-col items-end">
          <span className={`font-black text-base ${priceColor}`}>
            {(currentPrice / (isPortfolioView ? 1 : 1000)).toFixed(2)}
          </span>
          <div className={`text-[10px] font-bold px-1.5 rounded-sm mt-0.5 ${
            isUp ? 'bg-emerald-500/15 text-emerald-500' : 
            isDown ? 'bg-red-500/15 text-red-500' : 
            'bg-warning-500/15 text-warning-500'
          }`}>
            {isUp ? '+' : ''}{percentChange}%
          </div>
        </div>
        
        {onRemove && (
          <button 
            className="p-1.5 text-danger opacity-40 hover:opacity-100 hover:bg-danger/10 rounded-full transition-all ml-1 z-10"
            onClick={(e) => { e.stopPropagation(); onRemove(symbol); }}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
