"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Cinzel, Manrope } from "next/font/google";
import {
  Search,
  Layers,
  Gem,
  Award,
  Library,
  Menu,
  X,
  User,
  Globe,
} from "lucide-react";

// Tên shop: serif khắc La Mã. Phần còn lại: sans hiện đại, sạch.
const cinzel = Cinzel({ subsets: ["latin", "latin-ext"], weight: ["700"], display: "swap" });
const manrope = Manrope({ subsets: ["latin", "vietnamese"], display: "swap" });

// Nội dung thanh thông báo (sửa theo shop của bạn, để "" nếu muốn ẩn)
const ANNOUNCEMENT = "Miễn phí vận chuyển cho đơn từ 500.000đ";

const navItems = [
  { name: "Singles", href: "/singles", icon: Gem },
  { name: "Collector", href: "/collector", icon: Award },
  { name: "Decks", href: "/decks", icon: Library },
];

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [stackCount] = useState(0); // thay bằng state/context giỏ hàng
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Nhấn "/" để nhảy vào ô tìm kiếm
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !/^(INPUT|TEXTAREA)$/.test(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className={`${manrope.className} sticky top-0 z-50 w-full text-white`}>
      {/* Thanh thông báo: tự thu lại khi cuộn */}
      {ANNOUNCEMENT && (
        <div
          className={`overflow-hidden bg-[#0d1112] text-center text-xs tracking-wide text-[#d9bd73] transition-[height] duration-300 motion-reduce:transition-none ${
            scrolled ? "h-0" : "h-8"
          }`}
        >
          <p className="flex h-8 items-center justify-center px-4">{ANNOUNCEMENT}</p>
        </div>
      )}

      {/* Thanh chính */}
      <div
        className={`relative border-b border-white/[0.06] transition-colors duration-300 motion-reduce:transition-none ${
          scrolled
            ? "bg-[#07090a]/80 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl"
            : "bg-[#07090a]"
        }`}
      >
        <div
          className={`mx-auto flex max-w-7xl items-center gap-5 px-4 transition-[height] duration-300 motion-reduce:transition-none lg:gap-8 lg:px-6 ${
            scrolled ? "h-16" : "h-[72px]"
          }`}
        >
          {/* Logo + wordmark */}
          <Link href="/" className="group flex shrink-0 items-center gap-3.5" aria-label="TF1SHOP - Trang chủ">
            <div
              className={`relative overflow-hidden rounded-xl ring-1 ring-[#d4a537]/50 ring-offset-2 ring-offset-[#07090a] transition-all duration-300 group-hover:ring-[#62c7d9]/70 group-hover:shadow-[0_0_22px_rgba(98,199,217,0.35)] ${
                scrolled ? "h-10 w-10" : "h-11 w-11"
              }`}
            >
              <Image
                src="/images/tf1logo.jpg"
                alt=""
                fill
                sizes="44px"
                className="object-cover"
                priority
              />
            </div>
            <span
              className={`${cinzel.className} bg-gradient-to-b from-[#fcefbd] via-[#e2bb52] to-[#b3841f] bg-clip-text font-bold leading-none tracking-[0.14em] text-transparent transition-[font-size] duration-300 ${
                scrolled ? "text-[1.4rem]" : "text-[1.6rem]"
              }`}
            >
              TF1SHOP
            </span>
          </Link>

          {/* Nav dạng viên thuốc */}
          <nav
            className="hidden items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.03] p-1 md:flex"
            aria-label="Điều hướng chính"
          >
            {navItems.map(({ name, href }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-gradient-to-b from-[#d4a537]/25 to-[#d4a537]/10 text-[#f0d68f] ring-1 ring-inset ring-[#d4a537]/40"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {name}
                </Link>
              );
            })}
          </nav>

          {/* Tìm kiếm */}
          <form role="search" action="/singles" className="group relative ml-auto hidden max-w-md flex-1 lg:block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-[#62c7d9]" />
            <input
              ref={searchRef}
              type="search"
              name="q"
              placeholder="Tìm tên lá bài, bộ sưu tập..."
              className="h-10 w-full rounded-full border border-white/[0.08] bg-white/[0.04] pl-10 pr-10 text-sm text-white placeholder:text-zinc-500 transition focus:border-[#62c7d9]/50 focus:bg-white/[0.06] focus:outline-none focus:ring-4 focus:ring-[#62c7d9]/10 [&::-webkit-search-cancel-button]:hidden"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-white/10 bg-white/5 px-1.5 text-[11px] text-zinc-500 transition-opacity group-focus-within:opacity-0">
              /
            </kbd>
          </form>

          {/* Hành động */}
          <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
            <button
              type="button"
              className="hidden h-10 items-center gap-1.5 rounded-full px-3 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-white sm:flex"
              aria-label="Đổi ngôn ngữ"
            >
              <Globe className="h-4 w-4" strokeWidth={1.75} />
              EN
            </button>

            <Link
              href="/login"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/5 hover:text-white sm:flex"
              aria-label="Tài khoản"
            >
              <User className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </Link>

            {/* Nút chính: vàng đặc, điểm nhấn duy nhất của header */}
            <Link
              href="/stack"
              className="group/stack ml-1 flex h-10 items-center gap-2 rounded-full bg-gradient-to-b from-[#ecd07a] to-[#c9972a] pl-4 pr-1.5 text-sm font-semibold text-[#1a1205] shadow-[0_0_0_1px_rgba(255,236,170,0.35)_inset,0_6px_18px_-6px_rgba(212,165,55,0.6)] transition hover:brightness-110 active:scale-[0.98]"
            >
              <Layers className="h-4 w-4" strokeWidth={2} />
              <span className="hidden sm:inline">Stack</span>
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#1a1205]/90 px-2 text-xs font-bold tabular-nums text-[#f0d68f]">
                {stackCount}
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-white/5 md:hidden"
              aria-label={open ? "Đóng menu" : "Mở menu"}
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Đường vàng mảnh ở đáy, chỉ hiện khi cuộn */}
        <div
          className={`pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-[#d4a537]/50 to-transparent transition-opacity duration-300 ${
            scrolled ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      {/* Menu mobile */}
      <div
        className={`grid bg-[#07090a]/95 backdrop-blur-xl transition-[grid-template-rows] duration-300 motion-reduce:transition-none md:hidden ${
          open ? "grid-rows-[1fr] border-b border-white/[0.06]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-1 px-4 py-4">
            <form role="search" action="/singles" className="relative mb-3">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="search"
                name="q"
                placeholder="Tìm tên lá bài..."
                className="h-11 w-full rounded-full border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 text-sm placeholder:text-zinc-500 focus:border-[#62c7d9]/50 focus:outline-none"
              />
            </form>
            {navItems.map(({ name, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors ${
                  isActive(href)
                    ? "bg-[#d4a537]/10 text-[#f0d68f] ring-1 ring-inset ring-[#d4a537]/30"
                    : "text-zinc-300 hover:bg-white/5"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {name}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              <Link
                href="/account"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.08] py-3 text-sm text-zinc-300"
              >
                <User className="h-4 w-4" strokeWidth={1.75} /> Tài khoản
              </Link>
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.08] py-3 text-sm text-zinc-300"
              >
                <Globe className="h-4 w-4" strokeWidth={1.75} /> EN
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}