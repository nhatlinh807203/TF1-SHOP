"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Boxes,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Package,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tags,
  Users,
  Zap,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "user" | "admin";
  createdAt: string;
}

interface AdminDashboardProps {
  admin: {
    name: string;
    email: string;
  };
  monthLabel: string;
  stats: {
    totalAccounts: number;
    customerCount: number;
    adminCount: number;
    newAccountsThisMonth: number;
  };
  customers: Customer[];
  productCount: number;
}

const navigation = [
  { label: "Tổng quan", href: "/admin", icon: LayoutDashboard },
  { label: "Năng lượng", href: "/admin/energies", icon: Zap },
  { label: "Độ hiếm", href: "/admin/rarities", icon: Sparkles },
  { label: "Role", href: "/admin/roles", icon: Tags },
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Users;
  accent: "gold" | "cyan" | "violet" | "green";
}) {
  const accents = {
    gold: "bg-[#d4a537]/10 text-[#e5bf62] ring-[#d4a537]/15",
    cyan: "bg-cyan-400/10 text-cyan-300 ring-cyan-400/15",
    violet: "bg-violet-400/10 text-violet-300 ring-violet-400/15",
    green: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/15",
  };

  return (
    <article className="rounded-2xl border border-white/[0.07] bg-[#101314] p-5 transition hover:border-white/[0.12]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-400">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</p>
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${accents[accent]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-xs text-zinc-500">{detail}</p>
    </article>
  );
}

export default function AdminDashboard({
  admin,
  monthLabel,
  stats,
  customers,
  productCount,
}: AdminDashboardProps) {
  const [query, setQuery] = useState("");

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi");
    if (!normalizedQuery) {
      return customers;
    }

    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone]
        .join(" ")
        .toLocaleLowerCase("vi")
        .includes(normalizedQuery),
    );
  }, [customers, query]);

  return (
    <div className="min-h-screen bg-[#090b0c] text-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/[0.06] bg-[#0c0e0f] lg:flex">
        <Link href="/" className="flex h-[76px] items-center gap-3 border-b border-white/[0.06] px-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#f0d68f] to-[#bd8720] text-sm font-black text-[#1a1205]">
            T
          </span>
          <span className="text-sm font-bold tracking-[0.16em] text-[#f0d68f]">
            TF1SHOP
          </span>
        </Link>

        <div className="px-4 pt-7">
          <p className="px-3 text-[10px] font-semibold tracking-[0.18em] text-zinc-600">
            CỬA HÀNG
          </p>
          <nav aria-label="Quản lý cửa hàng" className="mt-3 space-y-1">
            {navigation.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  href === "/admin"
                    ? "bg-[#d4a537]/10 font-medium text-[#efd486] ring-1 ring-inset ring-[#d4a537]/15"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-white/[0.06] p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d4a537]/15 text-xs font-semibold text-[#efd486]">
              {getInitials(admin.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{admin.name}</p>
              <p className="truncate text-xs text-zinc-500">Quản trị viên</p>
            </div>
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-white/[0.06] bg-[#090b0c]/90 px-4 backdrop-blur-xl sm:px-7">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-bold tracking-[0.12em] text-[#f0d68f] lg:hidden">
              TF1SHOP
            </Link>
            <span className="hidden h-5 w-px bg-white/10 lg:block" />
            <p className="text-sm text-zinc-400">Khu vực quản trị</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden text-sm text-zinc-500 sm:block">{admin.email}</span>
            <button
              type="button"
              aria-label="Thông báo"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
            >
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#e3bc5e]" />
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
          {navigation.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                href === "/admin"
                  ? "bg-[#d4a537]/10 text-[#efd486]"
                  : "text-zinc-400"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <main className="mx-auto max-w-[1440px] space-y-8 px-4 py-7 sm:px-7 sm:py-9">
          <section id="overview" className="scroll-mt-24">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-500">Tổng quan cửa hàng</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Xin chào, {admin.name}
                </h1>
                <p className="mt-2 text-sm text-zinc-500">
                  Theo dõi hoạt động quản lý TF1SHOP tại đây.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#101314] px-3.5 py-2.5 text-sm text-zinc-300">
                <CalendarDays className="h-4 w-4 text-zinc-500" />
                {monthLabel}
              </div>
            </div>
          </section>

          <section aria-label="Thống kê tài khoản" className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            <StatCard
              label="Tổng tài khoản"
              value={stats.totalAccounts.toLocaleString("vi-VN")}
              detail="Tài khoản đã đăng ký trong shop"
              icon={Users}
              accent="gold"
            />
            <StatCard
              label="Khách hàng"
              value={stats.customerCount.toLocaleString("vi-VN")}
              detail="Tài khoản có vai trò khách hàng"
              icon={ShoppingBag}
              accent="cyan"
            />
            <StatCard
              label="Quản trị viên"
              value={stats.adminCount.toLocaleString("vi-VN")}
              detail="Tài khoản có quyền quản lý"
              icon={ShieldCheck}
              accent="violet"
            />
            <StatCard
              label="Đăng ký tháng này"
              value={stats.newAccountsThisMonth.toLocaleString("vi-VN")}
              detail="Tài khoản mới từ đầu tháng"
              icon={ArrowUpRight}
              accent="green"
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-white/[0.07] bg-[#101314] p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Doanh thu</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Biểu đồ sẽ hiển thị khi có dữ liệu đơn hàng.
                  </p>
                </div>
                <span className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-zinc-500">
                  Chưa có dữ liệu
                </span>
              </div>
              <div className="mt-7 flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-[#0c0e0f] text-center">
                <CreditCard className="h-6 w-6 text-zinc-600" />
                <p className="mt-3 text-sm text-zinc-400">Chưa có giao dịch để thống kê</p>
                <p className="mt-1 text-xs text-zinc-600">
                  Kết nối quản lý đơn hàng để theo dõi doanh thu.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-[#101314] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Tình trạng cửa hàng</h2>
                  <p className="mt-1 text-sm text-zinc-500">Các mục quản lý hiện có</p>
                </div>
                <Boxes className="h-5 w-5 text-[#d9b754]" />
              </div>
              <div className="mt-5 space-y-3">
                <div className="rounded-xl border border-white/[0.06] bg-[#0c0e0f] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-cyan-300" />
                      <span className="text-sm text-zinc-300">Sản phẩm</span>
                    </div>
                    <span className="text-xs text-cyan-300">
                      {productCount} sản phẩm
                    </span>
                  </div>
                </div>
                <div id="orders" className="scroll-mt-24 rounded-xl border border-white/[0.06] bg-[#0c0e0f] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="h-4 w-4 text-violet-300" />
                      <span className="text-sm text-zinc-300">Đơn hàng</span>
                    </div>
                    <span className="text-xs text-zinc-500">Chưa kết nối</span>
                  </div>
                </div>
                <div id="settings" className="scroll-mt-24 rounded-xl border border-white/[0.06] bg-[#0c0e0f] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Settings2 className="h-4 w-4 text-emerald-300" />
                      <span className="text-sm text-zinc-300">Phân quyền</span>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                      Đang bật
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                <CircleHelp className="h-3.5 w-3.5" />
                Số liệu hiển thị dựa trên tài khoản lưu trong hệ thống.
              </p>
            </div>
          </section>

          <section
            id="customers"
            className="scroll-mt-24 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#101314]"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-5 sm:px-6">
              <div>
                <h2 className="font-semibold">Khách hàng mới nhất</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Tối đa 100 tài khoản đăng ký gần đây.
                </p>
              </div>
              <span
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-3.5 py-2.5 text-xs font-medium text-zinc-400"
              >
                {customers.length} tài khoản
              </span>
            </div>

            <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6">
              <label className="relative block max-w-sm">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm theo tên, email, số điện thoại..."
                  className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#0c0e0f] pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[#d4a537]/40"
                />
              </label>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-white/[0.02] text-[11px] uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-6 py-3.5 font-medium">Khách hàng</th>
                    <th className="px-5 py-3.5 font-medium">Số điện thoại</th>
                    <th className="px-5 py-3.5 font-medium">Vai trò</th>
                    <th className="px-5 py-3.5 font-medium">Ngày tham gia</th>
                    <th className="px-5 py-3.5 font-medium">Trạng thái</th>
                    <th className="px-5 py-3.5">
                      <span className="sr-only">Chi tiết</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {filteredCustomers.map((customer, index) => (
                    <tr key={customer.id} className="transition hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                              index % 3 === 0
                                ? "bg-[#d4a537]/15 text-[#efd486]"
                                : index % 3 === 1
                                  ? "bg-cyan-400/10 text-cyan-300"
                                  : "bg-violet-400/10 text-violet-300"
                            }`}
                          >
                            {getInitials(customer.name)}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-zinc-200">
                              {customer.name}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-zinc-500">
                              {customer.email}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-zinc-400">
                        {customer.phone || "Chưa cập nhật"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] ${
                            customer.role === "admin"
                              ? "bg-[#d4a537]/10 text-[#e5bf62]"
                              : "bg-white/[0.05] text-zinc-400"
                          }`}
                        >
                          {customer.role === "admin" ? "Admin" : "Khách hàng"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-zinc-400">
                        {formatDate(customer.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2 text-xs text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                          Đã đăng ký
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <ArrowRight className="ml-auto h-4 w-4 text-zinc-600" />
                      </td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <Search className="mx-auto h-5 w-5 text-zinc-600" />
                        <p className="mt-3 text-sm text-zinc-400">
                          {customers.length === 0
                            ? "Chưa có tài khoản khách hàng."
                            : "Không tìm thấy tài khoản phù hợp."}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3.5 text-xs text-zinc-500 sm:px-6">
              <span>
                Đang hiển thị {filteredCustomers.length} / {customers.length} tài khoản
              </span>
              <span className="flex items-center gap-1.5">
                <ArrowDownRight className="h-3.5 w-3.5" />
                Dữ liệu mới nhất trước
              </span>
            </div>
          </section>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-5 text-xs text-zinc-600">
            <span>TF1SHOP Admin · Quản lý cửa hàng thẻ bài</span>
            <span>Truy cập dành riêng cho quản trị viên</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
