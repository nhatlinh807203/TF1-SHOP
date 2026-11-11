"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { Cinzel, Manrope } from "next/font/google";
import { useCart } from "@/components/CartProvider";
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
  LogOut,
  Shield,
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

interface SessionUser {
  name: string;
  email: string;
  role: "user" | "admin";
}

interface HeaderProps {
  initialUser: SessionUser | null;
}

export default function Header({ initialUser }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const { itemCount } = useCart();
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(initialUser);
  const [logoutError, setLogoutError] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Session request failed with status ${response.status}.`);
        }
        const data: { user: SessionUser | null } = await response.json();
        if (active) {
          setSessionUser(data.user);
        }
      } catch (error) {
        console.error("Unable to load the signed-in user:", error);
      }
    }

    void loadSession();
    return () => {
      active = false;
    };
  }, [pathname]);

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

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  async function handleLogout() {
    setLogoutError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error(`Logout request failed with status ${response.status}.`);
      }
      setSessionUser(null);
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Unable to sign out:", error);
      setLogoutError("Không thể đăng xuất. Vui lòng thử lại.");
    }
  }

  return (
    <header className={`${manrope.className} sticky top-0 z-50 w-full text-white`}>
      {/* Thanh thông báo: tự thu lại khi cuộn */}
      {ANNOUNCEMENT && (
        <div
          className={`overflow-hidden bg-[#202020] text-center text-[10px] tracking-wide text-cyan-100 transition-[height] duration-300 motion-reduce:transition-none sm:text-xs ${
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
            ? "bg-[#1b1b1b]/90 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl"
            : "bg-[#1b1b1b]"
        }`}
      >
        <div
          className={`mx-auto flex max-w-7xl items-center gap-2 px-3 transition-[height] duration-300 motion-reduce:transition-none sm:gap-4 sm:px-4 lg:gap-8 lg:px-6 ${
            scrolled ? "h-16" : "h-[72px]"
          }`}
        >
          {/* Logo + wordmark */}
          <Link href="/" className="group flex shrink-0 items-center gap-2 sm:gap-3.5" aria-label="Holovault - Trang chủ">
            <div
              className={`relative overflow-hidden rounded-xl ring-1 ring-white/15 ring-offset-2 ring-offset-[#1b1b1b] transition-all duration-300 group-hover:ring-[#12c6df]/70 group-hover:shadow-[0_0_22px_rgba(18,198,223,0.35)] ${
                scrolled ? "h-9 w-9 sm:h-10 sm:w-10" : "h-10 w-10 sm:h-11 sm:w-11"
              }`}
            >
              <Image
                src="/images/holovault.jpg"
                alt=""
                fill
                sizes="44px"
                className="object-cover"
                priority
              />
            </div>
            <span
              className={`${cinzel.className} bg-gradient-to-r from-white via-cyan-100 to-[#64e6f4] bg-clip-text font-bold leading-none tracking-[0.14em] text-transparent transition-[font-size] duration-300 ${
                scrolled ? "text-[1.1rem] sm:text-[1.4rem]" : "text-[1.2rem] sm:text-[1.6rem]"
              }`}
            >
              HOLOVAULT
            </span>
          </Link>

          {/* Nav dạng viên thuốc */}
          <nav
            className="hidden items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.03] p-1 xl:flex"
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
                      ? "bg-cyan-100/[0.08] text-cyan-100 ring-1 ring-inset ring-cyan-100/20"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {name}
                </Link>
              );
            })}
          </nav>

          {/* Tìm kiếm */}
          <form role="search" action="/singles" className="group relative ml-auto hidden max-w-md flex-1 xl:block">
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
          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1.5 xl:ml-0">
            <button
              type="button"
              className="hidden h-10 items-center gap-1.5 rounded-full px-3 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-white xl:flex"
              aria-label="Đổi ngôn ngữ"
            >
              <Globe className="h-4 w-4" strokeWidth={1.75} />
              EN
            </button>

            <Link
              href={sessionUser ? "/account" : "/login"}
              className="flex h-9 w-9 items-center justify-center rounded-full p-0 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white sm:h-10 sm:w-auto sm:px-2 xl:max-w-48 xl:gap-2 xl:px-3"
              aria-label={sessionUser ? `Tài khoản ${sessionUser.name}` : "Đăng nhập"}
            >
              <User className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {sessionUser && (
                <span className="hidden max-w-32 truncate text-sm xl:inline">
                  {sessionUser.name}
                </span>
              )}
            </Link>
            {sessionUser?.role === "admin" && (
              <Link
                href="/admin"
                className="hidden h-10 items-center gap-1.5 rounded-full px-3 text-sm text-cyan-100 transition-colors hover:bg-white/5 xl:flex"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
            {sessionUser && (
              <button
                type="button"
                onClick={handleLogout}
                className="hidden h-10 items-center gap-1.5 rounded-full px-3 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-white xl:flex"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline">Đăng xuất</span>
              </button>
            )}

            {/* Nút chính: vàng đặc, điểm nhấn duy nhất của header */}
            <Link
              href="/stack"
              aria-label={`Giỏ hàng, ${itemCount} sản phẩm`}
              className="group/stack flex h-9 items-center gap-1 rounded-full bg-gradient-to-r from-[#12c6df] to-[#64e6f4] px-1.5 text-sm font-bold text-[#07191c] shadow-[0_6px_22px_-8px_rgba(18,198,223,0.65)] transition hover:brightness-110 active:scale-[0.98] sm:ml-1 sm:h-10 sm:gap-2 sm:pl-4 sm:pr-1.5"
            >
              <Layers className="h-4 w-4" strokeWidth={2} />
              <span className="hidden sm:inline">Giỏ hàng</span>
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#1b1b1b]/90 px-1.5 text-xs font-bold tabular-nums text-white sm:h-7 sm:min-w-7 sm:px-2">
                {itemCount}
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setOpenPath(open ? null : pathname)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-white/5 xl:hidden sm:h-10 sm:w-10"
              aria-label={open ? "Đóng menu" : "Mở menu"}
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Đường vàng mảnh ở đáy, chỉ hiện khi cuộn */}
        <div
          className={`pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-cyan-100/40 to-transparent transition-opacity duration-300 ${
            scrolled ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      {/* Menu mobile */}
      <div
        className={`grid bg-[#1b1b1b]/95 backdrop-blur-xl transition-[grid-template-rows] duration-300 motion-reduce:transition-none xl:hidden ${
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
                    ? "bg-cyan-100/[0.08] text-cyan-100 ring-1 ring-inset ring-cyan-100/20"
                    : "text-zinc-300 hover:bg-white/5"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {name}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              <Link
                href={sessionUser ? "/account" : "/login"}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.08] py-3 text-sm text-zinc-300"
              >
                <User className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span className="truncate">
                  {sessionUser ? sessionUser.name : "Tài khoản"}
                </span>
              </Link>
              {sessionUser?.role === "admin" && (
                <Link
                  href="/admin"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.08] py-3 text-sm text-[#f0d68f]"
                >
                  <Shield className="h-4 w-4" /> Admin
                </Link>
              )}
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.08] py-3 text-sm text-zinc-300"
              >
                <Globe className="h-4 w-4" strokeWidth={1.75} /> EN
              </button>
            </div>
            {sessionUser && (
              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] py-3 text-sm text-zinc-300"
              >
                <LogOut className="h-4 w-4" /> Đăng xuất
              </button>
            )}
            {logoutError && (
              <p role="alert" className="mt-2 text-center text-sm text-red-300">
                {logoutError}
              </p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}