"use client";

import { TrendingUp } from "lucide-react";
import Link from "next/link";
import ThemeSwitch from "./theme-switch";
import MarketStatus from "./market-status";

export default function AppNavbar() {
  return (
    <nav className="flex items-center p-4 border-b border-black/10 dark:border-white/10 bg-background/70 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-md mx-auto w-full">
        <Link href="/" className="flex items-center gap-2">
          <TrendingUp className="text-emerald-500" size={24} />
          <p className="font-bold text-inherit text-xl tracking-tight hidden sm:block">Stockya</p>
        </Link>
        <div className="flex flex-1 items-center justify-end gap-3">
          <MarketStatus />
          <ThemeSwitch />
        </div>
      </div>
    </nav>
  );
}
