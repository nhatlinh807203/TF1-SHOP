"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import {
  createVietQrUrl,
  VIETQR_ACCOUNT_NAME,
  VIETQR_ACCOUNT_NUMBER,
  VIETQR_BANK_ID,
} from "@/lib/vietqr";

interface CartCheckoutProps {
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
}

function formatPrice(price: number) {
  return `${new Intl.NumberFormat("vi-VN").format(price)} đ`;
}

export default function CartCheckout({ customer }: CartCheckoutProps) {
  const { items, isReady, updateQuantity, removeItem, clearCart } = useCart();
  const [checkoutStarted, setCheckoutStarted] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReportingPayment, setIsReportingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmation, setConfirmation] = useState<{
    orderId: string;
    total: number;
    paymentReported: boolean;
    notificationSent: boolean;
    customer: {
      name: string;
      phone: string;
      address: string;
    };
  } | null>(null);

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name,
            phone,
            address,
          },
          items: items.map(({ productId, quantity }) => ({
            productId,
            quantity,
          })),
        }),
      });
      const result = (await response.json()) as {
        message?: string;
        orderId?: string;
        total?: number;
      };
      if (
        !response.ok ||
        !result.orderId ||
        typeof result.total !== "number" ||
        !Number.isSafeInteger(result.total) ||
        result.total < 1
      ) {
        setErrorMessage(result.message ?? "Không thể đặt hàng. Vui lòng thử lại.");
        return;
      }

      clearCart();
      setConfirmation({
        orderId: result.orderId,
        total: result.total,
        paymentReported: false,
        notificationSent: false,
        customer: {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
        },
      });
    } catch {
      setErrorMessage("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmPayment() {
    if (!confirmation) {
      return;
    }
    setIsReportingPayment(true);
    setErrorMessage("");
    try {
      const response = await fetch(
        `/api/orders/${confirmation.orderId}/payment-confirmation`,
        { method: "POST" },
      );
      const result = (await response.json()) as {
        message?: string;
        notificationSent?: boolean;
      };
      if (!response.ok) {
        throw new Error(result.message ?? "Không thể xác nhận thanh toán.");
      }
      setConfirmation((current) =>
        current
          ? {
              ...current,
              paymentReported: true,
              notificationSent: result.notificationSent === true,
            }
          : current,
      );
      if (result.notificationSent !== true) {
        setErrorMessage(
          result.message ?? "Chưa gửi được email cho cửa hàng. Hãy thử lại.",
        );
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể kết nối máy chủ. Vui lòng thử lại.",
      );
    } finally {
      setIsReportingPayment(false);
    }
  }

  if (confirmation) {
    const paymentReference = `TF1SHOP ${confirmation.orderId}`;
    const qrUrl = createVietQrUrl(confirmation.total, paymentReference);

    return (
      <section className="rounded-2xl border border-emerald-400/20 bg-[#101314] p-6 sm:p-8">
        <p className="text-sm font-medium tracking-wide text-emerald-300">
          {confirmation.paymentReported
            ? "ĐÃ GỬI XÁC NHẬN THANH TOÁN"
            : "ĐƠN HÀNG ĐÃ ĐƯỢC TẠO"}
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          {confirmation.paymentReported
            ? "Đã gửi thông báo thanh toán"
            : "Thanh toán đơn hàng"}
        </h2>
        <p className="mt-3 text-sm text-zinc-400">
          Mã đơn hàng:{" "}
          <span className="font-mono text-zinc-200">{confirmation.orderId}</span>
        </p>
        <div className="mt-4 rounded-xl border border-white/[0.08] bg-[#090b0c] p-4">
          <h3 className="font-semibold text-white">Thông tin khách hàng</h3>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">Họ tên</dt>
              <dd className="text-zinc-200">{confirmation.customer.name}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Email</dt>
              <dd className="break-all text-zinc-200">{customer.email}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Số điện thoại</dt>
              <dd className="text-zinc-200">{confirmation.customer.phone}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-zinc-500">Địa chỉ nhận hàng</dt>
              <dd className="text-zinc-200">{confirmation.customer.address}</dd>
            </div>
          </dl>
        </div>
        <div className="mt-6 grid gap-5 rounded-xl border border-[#d4a537]/20 bg-[#090b0c] p-4 sm:grid-cols-[280px_1fr] sm:items-center">
          <Image
            src={qrUrl}
            alt={`Mã QR thanh toán ${formatPrice(confirmation.total)}`}
            width={280}
            height={280}
            unoptimized
            className="mx-auto h-auto w-full max-w-[280px] rounded-lg bg-white p-2"
          />
          <div>
            <h3 className="text-lg font-semibold text-white">
              Bước 1: Quét mã để chuyển khoản
            </h3>
            <p className="mt-3 text-2xl font-bold text-[#e5bf62]">
              {formatPrice(confirmation.total)}
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-500">Ngân hàng</dt>
                <dd className="text-right text-zinc-200">
                  Techcombank ({VIETQR_BANK_ID})
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-500">Số tài khoản</dt>
                <dd className="text-right font-mono text-zinc-200">
                  {VIETQR_ACCOUNT_NUMBER}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-500">Chủ tài khoản</dt>
                <dd className="text-right text-zinc-200">
                  {VIETQR_ACCOUNT_NAME}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-500">Nội dung chuyển khoản</dt>
                <dd className="text-right font-mono text-zinc-200">
                  {paymentReference}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-xs leading-5 text-zinc-500">
              Vui lòng chuyển đúng số tiền và nội dung. Sau khi chuyển khoản
              thành công, nhấn nút xác nhận bên dưới. Cửa hàng sẽ kiểm tra giao
              dịch trước khi cập nhật trạng thái đã thanh toán.
            </p>
            <a
              href="https://zalo.me/0886007589"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-sky-400/25 px-4 py-2 text-sm font-medium text-sky-200 transition hover:bg-sky-400/10"
            >
              Cần hỗ trợ? Nhắn Zalo 0886007589
            </a>
          </div>
        </div>
        {confirmation.paymentReported ? (
          <p
            role={confirmation.notificationSent ? "status" : "alert"}
            className={`mt-4 text-sm ${
              confirmation.notificationSent
                ? "text-emerald-300"
                : "text-amber-300"
            }`}
          >
            {confirmation.notificationSent
              ? "Thông báo đơn hàng mới đã được gửi đến cửa hàng và email xác nhận đã được gửi đến bạn. Cửa hàng sẽ đối soát giao dịch và cập nhật trạng thái thanh toán."
              : "Chúng tôi đã ghi nhận thông tin bạn đã chuyển khoản nhưng chưa thể gửi email thông báo. Vui lòng thử gửi lại hoặc liên hệ cửa hàng để được hỗ trợ."}
          </p>
        ) : (
          <div className="mt-5">
            {errorMessage && (
              <p role="alert" className="mb-3 text-sm text-red-300">
                {errorMessage}
              </p>
            )}
            <button
              type="button"
              onClick={() => void confirmPayment()}
              disabled={isReportingPayment}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-gradient-to-b from-[#f0d783] to-[#c79732] px-5 py-3 text-sm font-semibold text-[#211805] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
            >
              {isReportingPayment
                ? "Đang gửi xác nhận..."
                : "Bước 2: Tôi đã chuyển khoản - xác nhận thanh toán"}
            </button>
          </div>
        )}
        {confirmation.paymentReported &&
          !confirmation.notificationSent && (
            <button
              type="button"
              onClick={() => void confirmPayment()}
              disabled={isReportingPayment}
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-white/[0.1] px-4 py-2 text-sm text-zinc-200 disabled:opacity-50"
            >
              {isReportingPayment ? "Đang gửi..." : "Gửi lại thông báo"}
            </button>
          )}
        <Link
          href="/"
          className="mt-6 inline-flex rounded-lg bg-gradient-to-b from-[#f0d783] to-[#c79732] px-5 py-2.5 text-sm font-semibold text-[#211805] transition hover:brightness-110"
        >
          Tiếp tục mua sắm
        </Link>
      </section>
    );
  }

  if (!isReady) {
    return (
      <p className="rounded-xl border border-white/[0.08] bg-[#101314] p-6 text-sm text-zinc-400">
        Đang tải giỏ hàng...
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/[0.1] bg-[#101314] px-6 py-12 text-center">
        <p className="text-lg font-medium text-zinc-200">Giỏ hàng đang trống</p>
        <p className="mt-2 text-sm text-zinc-500">
          Thêm sản phẩm bạn muốn mua để tiếp tục.
        </p>
        <Link
          href="/#danh-muc"
          className="mt-5 inline-flex rounded-lg bg-gradient-to-b from-[#f0d783] to-[#c79732] px-5 py-2.5 text-sm font-semibold text-[#211805]"
        >
          Khám phá sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold text-white">Sản phẩm trong giỏ</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {items.reduce((count, item) => count + item.quantity, 0)} sản phẩm
            </p>
          </div>
          <p className="text-lg font-semibold text-[#e5bf62]">
            Tổng: {formatPrice(total)}
          </p>
        </div>
        {items.map((item) => (
          <article
            key={item.productId}
            className="flex gap-4 rounded-xl border border-white/[0.08] bg-[#101314] p-3 sm:p-4"
          >
            <Link
              href={`/products/${item.productId}`}
              aria-label={`Xem ${item.name}`}
              className="h-24 w-20 shrink-0 rounded-lg border border-white/[0.08] bg-[#151413] bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url("${item.imageUrl}")` }}
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <Link
                href={`/products/${item.productId}`}
                className="line-clamp-2 font-medium text-zinc-100 hover:text-[#efd486]"
              >
                {item.name}
              </Link>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                <div className="flex items-center rounded-lg border border-white/[0.1]">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1)
                    }
                    aria-label={`Giảm số lượng ${item.name}`}
                    className="p-1.5 text-zinc-300 hover:text-white"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-7 text-center text-xs text-white">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1)
                    }
                    disabled={item.quantity >= item.stock}
                    aria-label={`Tăng số lượng ${item.name}`}
                    className="p-1.5 text-zinc-300 hover:text-white disabled:cursor-not-allowed disabled:text-zinc-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  aria-label={`Xóa ${item.name} khỏi giỏ`}
                  className="inline-flex items-center gap-1 text-xs text-red-300 hover:text-red-200"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Xóa
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {checkoutStarted ? (
        <form
          onSubmit={submitOrder}
          className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#101314] p-5 sm:p-6"
        >
          <div>
            <h2 className="text-lg font-semibold text-white">
              Xác nhận thông tin giao hàng
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Vui lòng nhập chính xác họ tên người nhận, số điện thoại và địa
              chỉ đầy đủ (số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố)
              để cửa hàng giao hàng đúng nơi.
            </p>
          </div>

          <label className="block space-y-1.5 text-xs text-zinc-400">
            Họ và tên người nhận
            <input
              required
              autoComplete="name"
              minLength={2}
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nhập họ tên người nhận"
              className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#090b0c] px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#d4a537]/50"
            />
          </label>

          <label className="block space-y-1.5 text-xs text-zinc-400">
            Email nhận xác nhận đơn
            <input
              type="email"
              readOnly
              value={customer.email}
              className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#090b0c] px-3 text-sm text-zinc-400 outline-none"
            />
            <span className="block text-[11px] text-zinc-600">
              Email lấy từ tài khoản đang đăng nhập.
            </span>
          </label>

          <label className="block space-y-1.5 text-xs text-zinc-400">
            Số điện thoại nhận hàng
            <input
              required
              type="tel"
              autoComplete="tel"
              minLength={7}
              maxLength={20}
              pattern="[+0-9() .-]+"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Ví dụ: 09xxxxxxxx"
              className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#090b0c] px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#d4a537]/50"
            />
          </label>

          <label className="block space-y-1.5 text-xs text-zinc-400">
            Địa chỉ giao hàng đầy đủ
            <textarea
              required
              autoComplete="street-address"
              minLength={5}
              maxLength={250}
              rows={3}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
              className="w-full resize-y rounded-lg border border-white/[0.08] bg-[#090b0c] px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#d4a537]/50"
            />
          </label>

          {errorMessage && (
            <p
              role="alert"
              className="rounded-lg bg-red-400/[0.08] p-3 text-sm text-red-300"
            >
              {errorMessage}
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setCheckoutStarted(false);
                setErrorMessage("");
              }}
              disabled={isSubmitting}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/[0.1] px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/[0.04] disabled:opacity-50"
            >
              Quay lại giỏ hàng
            </button>
            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-gradient-to-b from-[#f0d783] to-[#c79732] px-5 py-3 text-sm font-semibold text-[#211805] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60 sm:flex-none"
            >
              {isSubmitting
                ? "Đang tạo đơn và mã QR..."
                : "Xác nhận thông tin và tiếp tục thanh toán"}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-[#101314] p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white">Thanh toán</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Tiếp tục để nhập và xác nhận thông tin người nhận hàng. Mã QR thanh
            toán sẽ hiển thị sau khi thông tin được xác nhận.
          </p>
          <button
            type="button"
            onClick={() => setCheckoutStarted(true)}
            disabled={items.length === 0}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-gradient-to-b from-[#f0d783] to-[#c79732] px-4 py-3 text-sm font-semibold text-[#211805] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-7"
          >
            Tiếp tục thanh toán
          </button>
        </div>
      )}
    </div>
  );
}
