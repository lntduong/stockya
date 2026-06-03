"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AnalysisCardProps {
  item: any;
  ownedStock?: any;
  onPress: (symbol: string) => void;
}

export default function AnalysisCard({ item, ownedStock, onPress }: AnalysisCardProps) {
  return (
    <div
      onClick={() => onPress(item.symbol)}
      className="bg-content2/40 cursor-pointer hover:bg-content2 transition-all backdrop-blur-md rounded-3xl p-5 border border-white/5 flex flex-col gap-4"
    >
      {/* Header: Symbol & Recommendation Badge */}
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black">
            {item.symbol}
          </h2>
          <span className="text-default-500 font-bold">
            {item.currentPrice?.toFixed(2)}
          </span>
        </div>

        <div
          className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wider ${
            item.action === "BUY_STRONG"
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
              : item.action === "BUY"
                ? "bg-emerald-500/20 text-emerald-500"
                : item.action === "SELL_STRONG"
                  ? "bg-danger text-white shadow-lg shadow-danger/30"
                  : item.action === "SELL"
                    ? "bg-danger/20 text-danger-500"
                    : "bg-default-200 text-default-600"
          }`}
        >
          {item.action === "BUY_STRONG"
            ? "🔥 MUA MẠNH"
            : item.action === "BUY"
              ? "MUA THĂM DÒ"
              : item.action === "SELL_STRONG"
                ? "⚠️ BÁN GẤP"
                : item.action === "SELL"
                  ? "CANH BÁN"
                  : "NẮM GIỮ"}
        </div>
      </div>

      {/* Overall Score */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-sm text-default-500">
            Điểm định lượng (Score)
          </span>
          <div
            className={`px-3 py-0.5 rounded-xl text-lg font-black tracking-wider shadow-sm ${
              item.score >= 6
                ? "bg-emerald-500 text-white shadow-emerald-500/30"
                : item.score >= 2
                  ? "bg-emerald-500/20 text-emerald-500"
                  : item.score >= -1
                    ? "bg-default-200 text-default-600"
                    : item.score >= -5
                      ? "bg-danger/20 text-danger-500"
                      : "bg-danger text-white shadow-danger/30"
            }`}
          >
            {item.score > 0 ? "+" : ""}
            {item.score}
            <span className="text-sm font-bold opacity-60">
              /10
            </span>
          </div>
        </div>

        {/* Score Progress Bar from -10 to +10 */}
        <div className="w-full bg-content1 h-2.5 rounded-full overflow-hidden relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20 z-10" />
          <div
            className={`absolute top-0 bottom-0 transition-all duration-1000 ${
              item.score > 0
                ? "bg-emerald-500 left-1/2"
                : "bg-danger-500 right-1/2"
            }`}
            style={{
              width: `${Math.abs(item.score) * 5}%`,
              right: item.score < 0 ? "50%" : "auto",
            }}
          />
        </div>
      </div>

      {/* Trend Analysis (SMA) */}
      <div className="flex flex-col gap-2 mt-2">
        <div className="flex items-center gap-2">
          {item.trend?.includes("UP") ? (
            <TrendingUp
              className="text-emerald-500"
              size={18}
            />
          ) : item.trend?.includes("DOWN") ? (
            <TrendingDown
              className="text-danger-500"
              size={18}
            />
          ) : (
            <Minus className="text-default-400" size={18} />
          )}
          <span className="font-bold text-sm">
            Xu hướng: {item.trendText}
          </span>
        </div>
        <p className="text-xs text-default-400 leading-relaxed bg-content1/50 p-3 rounded-xl">
          {item.trendDesc} (SMA20: {item.sma20?.toFixed(2)},
          SMA50: {item.sma50?.toFixed(2)})
        </p>
      </div>

      {/* Technical Indicators Grid */}
      <div className="grid grid-cols-2 gap-2 mt-1">
        <div className="bg-content1/50 rounded-xl p-3 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-default-400 uppercase tracking-wider">
            MACD Động lượng
          </span>
          <span
            className={`text-sm font-bold ${
              item.macdState === "BULLISH"
                ? "text-emerald-500"
                : item.macdState === "BEARISH"
                  ? "text-danger-500"
                  : "text-default-500"
            }`}
          >
            {item.macdText}
          </span>
        </div>

        <div className="bg-content1/50 rounded-xl p-3 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-default-400 uppercase tracking-wider">
            Bollinger Bands
          </span>
          <span
            className={`text-sm font-bold ${
              item.bbState === "LOWER_BAND"
                ? "text-emerald-500"
                : item.bbState === "UPPER_BAND"
                  ? "text-danger-500"
                  : "text-default-500"
            }`}
          >
            {item.bbText}
          </span>
        </div>

        <div className="bg-content1/50 rounded-xl p-3 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-default-400 uppercase tracking-wider">
            VSA Dòng tiền
          </span>
          <span
            className={`text-sm font-bold ${
              item.vsaState === "ACCUMULATION"
                ? "text-emerald-500"
                : item.vsaState === "DISTRIBUTION"
                  ? "text-danger-500"
                  : "text-default-500"
            }`}
          >
            {item.vsaText}
          </span>
        </div>

        <div className="bg-content1/50 rounded-xl p-3 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-default-400 uppercase tracking-wider">
            RSI ({item.rsi?.toFixed(0)})
          </span>
          <span
            className={`text-sm font-bold ${
              item.rsiState === "OVERSOLD"
                ? "text-emerald-500"
                : item.rsiState === "OVERBOUGHT"
                  ? "text-warning-500"
                  : "text-default-500"
            }`}
          >
            {item.rsiText}
          </span>
        </div>
      </div>

      {ownedStock && (
        <div className="mt-1 flex">
          <div className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded-md font-bold flex items-center gap-1 w-fit">
            👜 Đang giữ{" "}
            {ownedStock.quantity.toLocaleString()} cổ (Giá
            vốn: {ownedStock.averagePrice.toLocaleString()})
          </div>
        </div>
      )}
    </div>
  );
}
