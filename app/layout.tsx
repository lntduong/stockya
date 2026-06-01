import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import AppNavbar from "@/components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stockya - Theo dõi chứng khoán",
  description: "Ứng dụng theo dõi chứng khoán cá nhân chuẩn Mobile",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning={true}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <AppNavbar />
          <main className="flex-1 w-full max-w-md mx-auto p-4 sm:p-6 pb-20">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
