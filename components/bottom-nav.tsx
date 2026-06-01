"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LineChart, Briefcase, Activity } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t border-black/10 dark:border-white/10 safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        <Link 
          href="/"
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname === '/' || pathname.startsWith('/watchlist') ? 'text-primary' : 'text-default-500 hover:text-default-800 dark:hover:text-default-300'}`}
        >
          <LineChart size={24} strokeWidth={pathname === '/' || pathname.startsWith('/watchlist') ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Thị trường</span>
        </Link>
        
        <Link 
          href="/analysis"
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname.startsWith('/analysis') ? 'text-primary' : 'text-default-500 hover:text-default-800 dark:hover:text-default-300'}`}
        >
          <Activity size={24} strokeWidth={pathname.startsWith('/analysis') ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Phân tích</span>
        </Link>
        
        <Link 
          href="/portfolio"
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname.startsWith('/portfolio') ? 'text-primary' : 'text-default-500 hover:text-default-800 dark:hover:text-default-300'}`}
        >
          <Briefcase size={24} strokeWidth={pathname.startsWith('/portfolio') ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Tài sản</span>
        </Link>
      </div>
    </div>
  );
}
