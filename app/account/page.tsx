import { Suspense } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function AccountPage() {
  return (
    <Suspense
      fallback={
        <section className="min-h-[60vh] bg-[#0b0f12] px-4 py-14 text-zinc-400 sm:py-20">
          Đang tải thông tin tài khoản...
        </section>
      }
    >
      <AccountContent />
    </Suspense>
  );
}

async function AccountContent() {
  const user = await requireUser();

  return (
    <section className="min-h-[60vh] bg-[#0b0f12] px-4 py-14 text-white sm:py-20">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/[0.08] bg-[#12191d] p-6 shadow-[0_24px_70px_-48px_rgba(0,0,0,0.9)] sm:p-9">
        <p className="text-sm font-medium text-cyan-200">TÀI KHOẢN HOLOVAULT</p>
        <h1 className="mt-2 text-2xl font-bold">Xin chào, {user.name}</h1>
        <dl className="mt-8 grid gap-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">Email</dt>
            <dd className="mt-1 break-all text-zinc-100">{user.email}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Số điện thoại</dt>
            <dd className="mt-1 text-zinc-100">{user.phone}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-zinc-500">Địa chỉ</dt>
            <dd className="mt-1 text-zinc-100">{user.address}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Vai trò</dt>
            <dd className="mt-1 text-zinc-100">
              {user.role === "admin" ? "Quản trị viên" : "Khách hàng"}
            </dd>
          </div>
        </dl>
        {user.role === "admin" && (
          <Link
            href="/admin"
            className="mt-8 inline-flex rounded-full bg-gradient-to-r from-[#12c6df] to-[#64e6f4] px-5 py-2.5 text-sm font-semibold text-[#07191c] shadow-[0_8px_24px_-12px_rgba(18,198,223,0.55)] transition duration-300 hover:-translate-y-0.5 hover:brightness-110"
          >
            Mở trang quản trị
          </Link>
        )}
      </div>
    </section>
  );
}
