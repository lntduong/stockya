"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<any>;
  children: ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const maxPullDistance = 80;
  const threshold = 60;

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only allow pull-to-refresh if we're at the very top of the page
    if (window.scrollY > 5) return;
    
    startYRef.current = e.touches[0].clientY;
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || isRefreshing) return;
    
    currentYRef.current = e.touches[0].clientY;
    const yDiff = currentYRef.current - startYRef.current;
    
    // Only pull down
    if (yDiff > 0) {
      // Add resistance
      const pull = Math.min(yDiff * 0.4, maxPullDistance);
      setPullDistance(pull);
      
      // Prevent default scrolling when pulling down at the top
      if (document.body.style.overflow !== 'hidden') {
        document.body.style.overflow = 'hidden';
      }
    }
  };

  const handleTouchEnd = async () => {
    document.body.style.overflow = '';
    
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    
    if (pullDistance > threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold); // Hold at threshold while refreshing
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div 
      className="relative w-full min-h-screen"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="absolute top-0 left-0 w-full flex justify-center items-center overflow-hidden transition-all duration-200 ease-out z-50 pointer-events-none"
        style={{ 
          height: `${pullDistance}px`,
          opacity: pullDistance / threshold
        }}
      >
        <div className={`p-2 bg-content1 rounded-full shadow-lg border border-white/10 ${isRefreshing ? 'animate-spin text-primary' : 'text-default-400'} transition-colors`}>
          <RefreshCw size={20} style={{ transform: `rotate(${pullDistance * 3}deg)` }} />
        </div>
      </div>
      
      <div 
        className="transition-transform duration-200 ease-out"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
