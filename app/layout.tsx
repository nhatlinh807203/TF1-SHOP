import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import HeaderWithSession from "@/components/HeaderWithSession";
import Footer from "@/components/Footer";
import { CartProvider } from "@/components/CartProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TF1SHOP",
  description: "Cửa hàng sưu tầm và giao dịch thẻ bài.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>
          <Suspense
            fallback={
              <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#07090a] text-white">
                <div className="mx-auto flex h-[72px] max-w-7xl items-center px-4 lg:px-6">
                  <Link
                    href="/"
                    aria-label="TF1SHOP - Trang chủ"
                    className="font-serif text-2xl font-bold tracking-[0.14em] text-[#e2bb52]"
                  >
                    TF1SHOP
                  </Link>
                </div>
              </header>
            }
          >
            <HeaderWithSession />
          </Suspense>
          <main className="flex-1">{children}</main>
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        </CartProvider>
      </body>
    </html>
  );
}