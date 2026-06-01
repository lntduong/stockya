"use client";

import { useEffect, useState } from "react";

function isMarketOpen() {
  const now = new Date();
  const vnTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const day = vnTime.getDay();
  
  if (day === 0 || day === 6) return false; // T7, CN
  
  const hours = vnTime.getHours();
  const minutes = vnTime.getMinutes();
  const timeStr = hours + minutes / 60;
  
  const isMorning = timeStr >= 9 && timeStr <= 11.5; // 09:00 - 11:30
  const isAfternoon = timeStr >= 13 && timeStr <= 15; // 13:00 - 15:00
  
  return isMorning || isAfternoon;
}

export default function MarketStatus() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsOpen(isMarketOpen());
    
    // Cập nhật trạng thái mỗi 60 giây
    const interval = setInterval(() => {
      setIsOpen(isMarketOpen());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return <div className="h-6 w-24"></div>;

  return (
    <div className="flex items-center gap-1.5 bg-content2 px-2 py-1 rounded-full border border-black/5 dark:border-white/5">
      <span className="relative flex h-2.5 w-2.5">
        {isOpen && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOpen ? 'bg-emerald-500' : 'bg-danger-500'}`}></span>
      </span>
      <span className="text-xs font-medium text-default-600">
        {isOpen ? "Đang mở cửa" : "Đã đóng cửa"}
      </span>
    </div>
  );
}
