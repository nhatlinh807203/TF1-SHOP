import Link from "next/link";
import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import CartCheckout from "@/components/CartCheckout";

export default function StackPage() {
  return (
    <section className="min-h-[60vh] bg-[#090b0c] px-4 py-12 text-white sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold tracking-[0.2em] text-[#d9b754]">
          HOLOVAULT
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Giỏ hàng</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Kiểm tra sản phẩm và gửi yêu cầu trao đổi với cửa hàng.
        </p>
        <div className="mt-8">
          <Suspense
            fallback={
              <p className="py-10 text-center text-sm text-zinc-400">
                Đang tải giỏ hàng...
              </p>
            }
          >
            <CheckoutContent />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

async function CheckoutContent() {
  const session = await getSession();
  const user = session ? await getUserById(session.id) : null;

  return (
    user ? (
      <CartCheckout
        customer={{
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
        }}
      />
    ) : (
      <div className="rounded-2xl border border-white/[0.08] bg-[#101314] px-6 py-10 text-center">
        <h2 className="text-lg font-medium">Đăng nhập để đặt hàng</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Vui lòng đăng nhập để tiếp tục và nhận email xác nhận đơn hàng.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex rounded-lg bg-gradient-to-b from-[#f0d783] to-[#c79732] px-5 py-2.5 text-sm font-semibold text-[#211805]"
        >
          Đăng nhập
        </Link>
      </div>
    )
  );
}
