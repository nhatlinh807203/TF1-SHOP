import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <section className="min-h-[60vh] bg-[#07090a] px-4 py-14 text-white sm:py-20">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/[0.08] bg-[#0a0d0e] p-6 sm:p-9">
        <p className="text-sm font-medium text-[#e2bb52]">TÀI KHOẢN TF1SHOP</p>
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
            className="mt-8 inline-flex rounded-full bg-gradient-to-b from-[#ecd07a] to-[#c9972a] px-5 py-2.5 text-sm font-semibold text-[#1a1205] transition hover:brightness-110"
          >
            Mở trang quản trị
          </Link>
        )}
      </div>
    </section>
  );
}
