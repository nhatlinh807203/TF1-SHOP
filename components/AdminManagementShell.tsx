"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";

interface AdminManagementShellProps {
  admin: {
    name: string;
    email: string;
  };
  title: string;
  children: React.ReactNode;
}

const navigation = [
  { label: "Tổng quan", href: "/admin", icon: LayoutDashboard },
  { label: "Sản phẩm", href: "/admin/products", icon: Package },
  { label: "Đơn hàng", href: "/admin/orders", icon: ShoppingBag },
  { label: "Khách hàng", href: "/admin#customers", icon: Users },
];

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function AdminManagementShell({
  admin,
  title,
  children,
}: AdminManagementShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#090b0c] text-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/[0.06] bg-[#0c0e0f] lg:flex">
        <Link
          href="/"
          className="flex h-[76px] items-center gap-3 border-b border-white/[0.06] px-6"
        >
          <span className="relative h-9 w-9 overflow-hidden rounded-xl">
            <Image src="/images/holovault.jpg" alt="" fill sizes="36px" className="object-cover" />
          </span>
          <span className="text-sm font-bold tracking-[0.16em] text-cyan-100">
            HOLOVAULT
          </span>
        </Link>

        <div className="px-4 pt-7">
          <p className="px-3 text-[10px] font-semibold tracking-[0.18em] text-zinc-600">
            CỬA HÀNG
          </p>
          <nav aria-label="Quản lý cửa hàng" className="mt-3 space-y-1">
            {navigation.map(({ label, href, icon: Icon }) => {
              const destination = href.split("#")[0];
              const active = pathname === destination;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-cyan-100/[0.08] font-medium text-cyan-100 ring-1 ring-inset ring-cyan-100/20"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-white/[0.06] p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-100/10 text-xs font-semibold text-cyan-100">
              {getInitials(admin.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {admin.name}
              </p>
              <p className="truncate text-xs text-zinc-500">Quản trị viên</p>
            </div>
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-white/[0.06] bg-[#090b0c]/90 px-4 backdrop-blur-xl sm:px-7">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm font-bold tracking-[0.12em] text-cyan-100 lg:hidden"
            >
              HOLOVAULT
            </Link>
            <span className="hidden h-5 w-px bg-white/10 lg:block" />
            <p className="text-sm text-zinc-400">{title}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden text-sm text-zinc-500 sm:block">
              {admin.email}
            </span>
            <button
              type="button"
              aria-label="Thông báo"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
            >
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-200" />
            </button>
            <Link
              href="/"
              className="hidden items-center gap-2 rounded-full border border-white/[0.08] px-3 py-2 text-xs text-zinc-400 transition hover:border-white/20 hover:text-white sm:flex"
            >
              <LogOut className="h-3.5 w-3.5" />
              Về cửa hàng
            </Link>
          </div>
        </header>

        <nav
          aria-label="Điều hướng quản trị"
          className="flex gap-2 overflow-x-auto border-b border-white/[0.06] px-4 py-3 lg:hidden"
        >
          {navigation.map(({ label, href, icon: Icon }) => {
            const active = pathname === href.split("#")[0];
            return (
              <Link
                key={href}
                href={href}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                  active
                    ? "bg-cyan-100/[0.08] text-cyan-100"
                    : "text-zinc-400"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <main className="mx-auto max-w-[1440px] space-y-8 px-4 py-7 sm:px-7 sm:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
