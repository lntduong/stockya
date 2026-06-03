"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Plus } from "lucide-react";
import { STOCK_NAMES } from "@/lib/stock-names";

interface StockSearchInputProps {
  onSelect: (symbol: string) => void;
  placeholder?: string;
  buttonText?: string;
  showAddButton?: boolean;
}

export default function StockSearchInput({ 
  onSelect, 
  placeholder = "Tìm mã cổ phiếu...",
  buttonText = "Thêm",
  showAddButton = true
}: StockSearchInputProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<{symbol: string, name: string}[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const matches = Object.entries(STOCK_NAMES)
      .filter(([symbol, info]) => 
        symbol.toLowerCase().includes(q) || 
        (info.name && info.name.toLowerCase().includes(q))
      )
      .slice(0, 8) // Limit to 8 results to avoid huge dropdowns
      .map(([symbol, info]) => ({ symbol, name: info.name }));
    
    setResults(matches);
    setIsOpen(true);
  }, [query]);

  const handleSelect = (symbol: string) => {
    onSelect(symbol.toUpperCase());
    setQuery("");
    setIsOpen(false);
  };

  const handleAddClick = () => {
    if (query.trim()) {
      handleSelect(query);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-default-400" />
          </div>
          <input 
            type="text" 
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim() && setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (results.length > 0) handleSelect(results[0].symbol);
                else handleAddClick();
              }
            }}
            className="w-full bg-content2 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary transition-colors uppercase font-bold"
          />
        </div>
        
        {showAddButton && (
          <button 
            onClick={handleAddClick}
            disabled={!query.trim()}
            className="bg-primary text-white font-bold px-4 rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">{buttonText}</span>
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-content1/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {results.map((item) => (
            <button
              key={item.symbol}
              onClick={() => handleSelect(item.symbol)}
              className="w-full text-left px-4 py-3 hover:bg-content3/50 border-b border-white/5 last:border-0 flex flex-col transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-black text-primary">{item.symbol}</span>
                {STOCK_NAMES[item.symbol]?.exchange && (
                  <span className="text-[10px] bg-content3 text-default-400 px-1.5 py-0.5 rounded font-bold">
                    {STOCK_NAMES[item.symbol].exchange}
                  </span>
                )}
              </div>
              <span className="text-xs text-default-500 font-medium truncate mt-0.5">{item.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
