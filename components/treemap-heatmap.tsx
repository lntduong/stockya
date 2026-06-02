"use client";

import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3-hierarchy';
import { Maximize2, Minimize2 } from 'lucide-react';

export interface HeatmapItem {
  symbol: string;
  weight: number; // For sizing (e.g., Trị giá hoặc Khối lượng)
  change: number; // % change for coloring
}

interface TreemapNode {
  name: string;
  weight?: number;
  change?: number;
  children?: TreemapNode[];
}

export function TreemapHeatmap({ data, title }: { data: HeatmapItem[], title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isFullscreen]);

  const leaves = useMemo(() => {
    if (dimensions.width === 0 || dimensions.height === 0 || data.length === 0) return [];
    
    const validData = data.filter(d => d.weight > 0);
    if (validData.length === 0) return [];

    const root = d3.hierarchy<TreemapNode>({ 
      name: 'root', 
      children: validData.map(d => ({ name: d.symbol, weight: d.weight, change: d.change })) 
    })
      .sum(d => d.weight || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const treemapLayout = d3.treemap<TreemapNode>()
      .size([dimensions.width, dimensions.height])
      .paddingInner(2)
      .paddingOuter(2)
      .round(true);

    treemapLayout(root);
    return root.leaves() as d3.HierarchyRectangularNode<TreemapNode>[];
  }, [data, dimensions]);

  const getColor = (change: number) => {
    if (change >= 6.8) return 'bg-[#c026d3]'; // Tím (Trần)
    if (change >= 3) return 'bg-[#10b981]'; // Xanh lá đậm
    if (change > 0.5) return 'bg-[#34d399]'; // Xanh lá nhạt
    if (change <= -6.8) return 'bg-[#06b6d4]'; // Xanh lơ (Sàn)
    if (change <= -3) return 'bg-[#ef4444]'; // Đỏ đậm
    if (change < -0.5) return 'bg-[#fb7185]'; // Đỏ nhạt
    return 'bg-[#eab308]'; // Vàng (Tham chiếu)
  };

  const renderContent = () => (
    <div className={`flex flex-col w-full bg-content1/30 backdrop-blur-xl overflow-hidden border border-white/10 shadow-2xl transition-all ${isFullscreen ? 'h-full rounded-none md:rounded-3xl' : 'h-[350px] rounded-3xl'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/5 bg-content2/50">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-fuchsia-500 rounded-full"></div>
          <h3 className="font-bold text-sm tracking-wide uppercase text-default-600">{title}</h3>
        </div>
        <button 
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1.5 bg-content3/50 rounded-xl hover:bg-content3 transition-colors text-default-500"
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>
      
      {/* Chart Area */}
      <div className="flex-1 w-full relative overflow-hidden" ref={containerRef}>
        {leaves.map((leaf, i) => {
          const { x0, y0, x1, y1 } = leaf;
          const nodeData = leaf.data;
          const width = x1 - x0;
          const height = y1 - y0;
          const change = nodeData.change || 0;
          
          return (
            <div
              key={i}
              className={`absolute transition-all duration-700 ease-out overflow-hidden rounded-md flex flex-col items-center justify-center text-white shadow-sm ${getColor(change)} hover:brightness-110 cursor-pointer`}
              style={{
                left: `${x0}px`,
                top: `${y0}px`,
                width: `${width}px`,
                height: `${height}px`,
              }}
            >
              {width > 35 && height > 25 && (
                <>
                  <span className={`font-black tracking-tighter ${width > 70 && height > 50 ? 'text-lg' : 'text-xs'}`}>
                    {nodeData.name}
                  </span>
                  {height > 45 && (
                    <span className="text-[10px] font-bold opacity-90 tracking-tighter">
                      {change > 0 ? '+' : ''}{change.toFixed(1)}%
                    </span>
                  )}
                </>
              )}
            </div>
          );
        })}
        {leaves.length === 0 && dimensions.width > 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-default-500 text-sm font-medium">
            Đang tải dữ liệu...
          </div>
        )}
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background animate-in fade-in zoom-in-95 duration-200 md:p-6 md:bg-black/80">
        {renderContent()}
      </div>
    );
  }

  return renderContent();
}
