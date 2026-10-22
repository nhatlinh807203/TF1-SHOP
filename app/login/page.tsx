"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Cinzel, Manrope } from "next/font/google";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

const cinzel = Cinzel({ subsets: ["latin", "latin-ext"], weight: ["700"], display: "swap" });
const manrope = Manrope({ subsets: ["latin", "vietnamese"], display: "swap" });

// Ô nhập dạng viên thuốc, cùng kiểu với ô tìm kiếm trên header
const inputClass =
  "h-11 w-full rounded-full border border-white/[0.08] bg-white/[0.04] pl-11 pr-4 text-sm text-white placeholder:text-zinc-500 transition focus:border-[#62c7d9]/50 focus:bg-white/[0.06] focus:outline-none focus:ring-4 focus:ring-[#62c7d9]/10";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3a7.2 7.2 0 0 1-10.72-3.78H1.3v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.34 14.31a7.2 7.2 0 0 1 0-4.62v-3.1H1.3a12 12 0 0 0 0 10.82l4.04-3.1z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.8l3.44-3.44A11.9 11.9 0 0 0 12 0 12 12 0 0 0 1.3 6.59l4.04 3.1A7.2 7.2 0 0 1 12 4.75z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Email chưa đúng định dạng.");
      return;
    }
    if (password.length < 8) {
      setError("Mật khẩu cần có ít nhất 8 ký tự.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Email hoặc mật khẩu không đúng.");
      }
      router.push("/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đăng nhập. Hãy thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`${manrope.className} relative overflow-hidden bg-[#07090a]`}>
      {/* Vầng sáng rất nhẹ phía sau thẻ: xanh ngọc của mắt, vàng của lá bài */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[40rem] -translate-x-[75%] rounded-full bg-[#62c7d9]/[0.07] blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-24 h-80 w-[40rem] -translate-x-[20%] rounded-full bg-[#d4a537]/[0.07] blur-3xl" />

      <div className="relative mx-auto flex max-w-md flex-col items-center px-4 py-14 md:py-20">
        {/* Logo */}
        <Link href="/" aria-label="TF1SHOP - Trang chủ" className="group flex flex-col items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-2xl ring-1 ring-[#d4a537]/50 ring-offset-2 ring-offset-[#07090a] transition-all duration-300 group-hover:ring-[#62c7d9]/70 group-hover:shadow-[0_0_26px_rgba(98,199,217,0.35)]">
            <Image src="/images/tf1logo.jpg" alt="" fill sizes="64px" className="object-cover" priority />
          </div>
          <span
            className={`${cinzel.className} bg-gradient-to-b from-[#fcefbd] via-[#e2bb52] to-[#b3841f] bg-clip-text text-2xl font-bold leading-none tracking-[0.14em] text-transparent`}
          >
            TF1SHOP
          </span>
        </Link>

        {/* Thẻ form */}
        <div className="relative mt-9 w-full overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0a0d0e] p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] sm:p-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a537]/60 to-transparent" />

          {/* Chuyển Đăng nhập / Đăng ký: cùng kiểu nav viên thuốc của header */}
          <div className="mx-auto flex w-full items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.03] p-1">
            <span
              aria-current="page"
              className="flex-1 rounded-full bg-gradient-to-b from-[#d4a537]/25 to-[#d4a537]/10 py-2 text-center text-sm font-medium text-[#f0d68f] ring-1 ring-inset ring-[#d4a537]/40"
            >
              Đăng nhập
            </span>
            <Link
              href="/register"
              className="flex-1 rounded-full py-2 text-center text-sm font-medium text-zinc-400 transition-colors hover:text-white"
            >
              Đăng ký
            </Link>
          </div>

          <h1 className="mt-7 text-xl font-bold tracking-tight text-zinc-50">Chào mừng quay lại</h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Đăng nhập để xem đơn hàng và Stack của bạn.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-500/[0.08] px-4 py-3 text-sm text-red-300"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="group relative">
              <label htmlFor="email" className="sr-only">Email</label>
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-[#62c7d9]" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className={inputClass}
              />
            </div>

            <div className="group relative">
              <label htmlFor="password" className="sr-only">Mật khẩu</label>
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-[#62c7d9]" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 text-sm">
              <label className="flex cursor-pointer items-center gap-2.5 text-zinc-400">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-white/5 accent-[#d4a537]"
                />
                Ghi nhớ tôi
              </label>
              <Link href="/forgot-password" className="text-[#e2bb52] transition-colors hover:text-[#f6dd8a]">
                Quên mật khẩu?
              </Link>
            </div>

            {/* Nút vàng đặc: cùng kiểu nút Stack */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#ecd07a] to-[#c9972a] text-sm font-semibold text-[#1a1205] shadow-[0_0_0_1px_rgba(255,236,170,0.35)_inset,0_6px_18px_-6px_rgba(212,165,55,0.6)] transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4 text-xs text-zinc-600">
            <span className="h-px flex-1 bg-white/[0.08]" />
            hoặc
            <span className="h-px flex-1 bg-white/[0.08]" />
          </div>

          <a
            href="/api/auth/google"
            className="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-white/[0.1] bg-white/[0.03] text-sm font-medium text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
          >
            <GoogleIcon />
            Tiếp tục với Google
          </a>
        </div>

        <p className="mt-7 text-center text-xs text-zinc-600">
          Bằng việc đăng nhập, bạn đồng ý với{" "}
          <Link href="/terms" className="text-zinc-400 transition-colors hover:text-[#f0d68f]">
            Điều khoản sử dụng
          </Link>{" "}
          và{" "}
          <Link href="/privacy" className="text-zinc-400 transition-colors hover:text-[#f0d68f]">
            Chính sách bảo mật
          </Link>
          .
        </p>
      </div>
    </div>
  );
}