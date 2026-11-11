"use client";

import { useEffect, useState, type FormEvent } from "react";
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

type QuoteContactMethod = "zalo" | "facebook" | "phone" | "email";
type QuoteDeliveryMethod = "ship" | "meet" | "undecided";

export default function CartCheckout({ customer }: CartCheckoutProps) {
  const { items, isReady, updateQuantity, removeItem, clearCart } = useCart();
  const [checkoutStarted, setCheckoutStarted] = useState(false);
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [address, setAddress] = useState(customer.address);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [isReportingPayment, setIsReportingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [quoteRequestOpen, setQuoteRequestOpen] = useState(false);
  const [quoteRequestSent, setQuoteRequestSent] = useState(false);
  const [quoteRequestError, setQuoteRequestError] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");
  const [contactMethod, setContactMethod] =
    useState<QuoteContactMethod>("zalo");
  const [contactValue, setContactValue] = useState(customer.phone);
  const [deliveryMethod, setDeliveryMethod] =
    useState<QuoteDeliveryMethod>("undecided");
  const [shippingAddress, setShippingAddress] = useState(customer.address);
  const [cartStatusResult, setCartStatusResult] = useState<{
    cartKey: string;
    quoteOnlyProducts: Array<{
      productId: string;
      referencePrice: number;
      tcgplayerPriceUsd: number | null;
      isTcgplayerPrice: boolean;
    }>;
  } | null>(null);
  const [cartStatusFailure, setCartStatusFailure] = useState<{
    cartKey: string;
    message: string;
  } | null>(null);
  const [cartStatusAttempt, setCartStatusAttempt] = useState(0);
  const cartKey = items
    .map((item) => item.productId)
    .sort()
    .join(",");
  const currentCartStatus =
    cartStatusResult?.cartKey === cartKey ? cartStatusResult : null;
  const cartStatusError =
    cartStatusFailure?.cartKey === cartKey ? cartStatusFailure.message : "";
  const quoteOnlyProductIds =
    cartKey === ""
      ? []
      : (currentCartStatus?.quoteOnlyProducts.map(
          (product) => product.productId,
        ) ?? null);
  const referencePriceByProductId = new Map(
    currentCartStatus?.quoteOnlyProducts.map((product) => [
      product.productId,
      product.referencePrice,
    ]) ?? [],
  );
  const tcgplayerProductIds = new Set(
    currentCartStatus?.quoteOnlyProducts
      .filter((product) => product.isTcgplayerPrice)
      .map((product) => product.productId) ?? [],
  );
  const tcgplayerUsdByProductId = new Map(
    currentCartStatus?.quoteOnlyProducts.flatMap((product) =>
      typeof product.tcgplayerPriceUsd === "number"
        ? [[product.productId, product.tcgplayerPriceUsd] as const]
        : [],
    ) ?? [],
  );
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
    (sum, item) =>
      sum +
      (quoteOnlyProductIds?.includes(item.productId)
        ? 0
        : item.price * item.quantity),
    0,
  );
  const quoteOnlyItems = items.filter((item) =>
    quoteOnlyProductIds?.includes(item.productId),
  );
  const quoteReferenceTotal = quoteOnlyItems.reduce(
    (sum, item) =>
      sum +
      (referencePriceByProductId.get(item.productId) ?? item.price) *
        item.quantity,
    0,
  );
  const cartStatusReady =
    isReady &&
    (cartKey === "" || currentCartStatus !== null) &&
    !cartStatusError;

  useEffect(() => {
    if (!isReady || cartKey === "") {
      return;
    }

    const controller = new AbortController();
    void fetch("/api/products/cart-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: cartKey.split(",") }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = (await response.json()) as {
          message?: string;
          quoteOnlyProducts?: Array<{
            productId: string;
            referencePrice: number;
            tcgplayerPriceUsd: number | null;
            isTcgplayerPrice: boolean;
          }>;
        };
        if (
          !response.ok ||
          !Array.isArray(result.quoteOnlyProducts) ||
          !result.quoteOnlyProducts.every(
            (product) =>
              typeof product.productId === "string" &&
              typeof product.referencePrice === "number" &&
              Number.isSafeInteger(product.referencePrice) &&
              product.referencePrice > 0 &&
              (product.tcgplayerPriceUsd === null ||
                (typeof product.tcgplayerPriceUsd === "number" &&
                  Number.isFinite(product.tcgplayerPriceUsd) &&
                  product.tcgplayerPriceUsd >= 0)) &&
              typeof product.isTcgplayerPrice === "boolean",
          )
        ) {
          throw new Error(result.message ?? "Không thể kiểm tra giỏ hàng.");
        }
        setCartStatusResult({
          cartKey,
          quoteOnlyProducts: result.quoteOnlyProducts,
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setCartStatusFailure({
          cartKey,
          message:
            error instanceof Error
              ? error.message
              : "Không thể kiểm tra giỏ hàng. Vui lòng thử lại.",
        });
      });

    return () => controller.abort();
  }, [isReady, cartKey, cartStatusAttempt]);

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cartStatusReady || quoteOnlyItems.length > 0) {
      setErrorMessage(
        cartStatusError ||
          "Thẻ bài có giá tham khảo, vui lòng xóa khỏi giỏ và liên hệ cửa hàng để xác nhận giá.",
      );
      return;
    }
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

  async function submitQuoteRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cartStatusReady || quoteOnlyItems.length === 0) {
      setQuoteRequestError("Không tìm thấy thẻ cần gửi yêu cầu trao đổi.");
      return;
    }
    if (quoteReferenceTotal < 50_000) {
      setQuoteRequestError(
        "Giá trị tham khảo tối thiểu để gửi yêu cầu là 50.000 đ.",
      );
      return;
    }

    setIsSubmittingQuote(true);
    setQuoteRequestError("");
    try {
      const response = await fetch("/api/products/quote-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: quoteOnlyItems.map(({ productId, quantity }) => ({
            productId,
            quantity,
          })),
          customer: {
            name,
            contactMethod,
            contactValue,
            deliveryMethod,
            shippingAddress:
              deliveryMethod === "ship" ? shippingAddress : "",
            message: quoteMessage,
          },
        }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setQuoteRequestError(
          result.message ?? "Không thể gửi yêu cầu trao đổi.",
        );
        return;
      }

      setQuoteRequestSent(true);
      setQuoteRequestOpen(false);
    } catch {
      setQuoteRequestError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setIsSubmittingQuote(false);
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
    const paymentReference = `HOLOVAULT ${confirmation.orderId}`;
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
          {cartStatusReady && quoteOnlyItems.length === 0 ? (
            <p className="text-lg font-semibold text-[#e5bf62]">
              Tổng: {formatPrice(total)}
            </p>
          ) : (
            <p className="text-sm text-cyan-100">
              {cartStatusError ||
                (cartStatusReady
                  ? "Cần xác nhận giá thẻ với cửa hàng"
                  : "Đang kiểm tra sản phẩm trong giỏ...")}
            </p>
          )}
        </div>
        {cartStatusError && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-400/20 bg-red-400/[0.05] p-3 text-sm text-red-300"
          >
            <span>{cartStatusError}</span>
            <button
              type="button"
              onClick={() => setCartStatusAttempt((attempt) => attempt + 1)}
              className="rounded-lg border border-red-300/20 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-300/[0.08]"
            >
              Thử kiểm tra lại
            </button>
          </div>
        )}
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
              {quoteOnlyProductIds?.includes(item.productId) && (
                <p className="mt-1 text-xs text-cyan-100">
                  Giá tham khảo
                  {tcgplayerProductIds.has(item.productId)
                    ? " TCGplayer"
                    : ""}
                  :{" "}
                  {referencePriceByProductId.has(item.productId)
                    ? tcgplayerUsdByProductId.has(item.productId)
                      ? `$${tcgplayerUsdByProductId.get(item.productId)?.toFixed(2)} USD`
                      : formatPrice(
                          referencePriceByProductId.get(item.productId) ??
                            item.price,
                        )
                    : "Đang kiểm tra"}
                </p>
              )}
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

      {quoteOnlyItems.length > 0 ? (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,0.85fr)]">
          <section className="rounded-2xl border border-white/[0.08] bg-[#101314] p-5 sm:p-6">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-500">
              HOLOVAULT / TRAO ĐỔI
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Gửi yêu cầu trao đổi
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Cửa hàng sẽ kiểm tra thẻ, liên hệ riêng để trao đổi chi tiết và
              thống nhất giá.
            </p>
            {quoteRequestSent && (
              <div
                role="status"
                className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.05] p-3 text-sm text-emerald-300"
              >
                Đã gửi yêu cầu trao đổi. Cửa hàng sẽ liên hệ với bạn sớm.
              </div>
            )}
            {quoteRequestError && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-red-400/20 bg-red-400/[0.05] p-3 text-sm text-red-300"
              >
                {quoteRequestError}
              </p>
            )}
            {quoteRequestOpen ? (
              <form onSubmit={submitQuoteRequest} className="mt-5 space-y-4">
                <label className="block space-y-1.5 text-xs font-medium tracking-wide text-zinc-400">
                  TÊN CỦA BẠN
                  <input
                    required
                    autoComplete="name"
                    minLength={2}
                    maxLength={100}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="h-11 w-full rounded-lg border border-white/[0.1] bg-[#090b0c] px-3 text-sm text-white outline-none focus:border-cyan-100/30"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-[minmax(145px,0.55fr)_minmax(0,1.8fr)]">
                  <label className="block space-y-1.5 text-xs font-medium tracking-wide text-zinc-400">
                    LIÊN HỆ QUA
                    <select
                      value={contactMethod}
                      onChange={(event) => {
                        const method = event.target.value as QuoteContactMethod;
                        setContactMethod(method);
                        setContactValue(
                          method === "email"
                            ? customer.email
                            : method === "facebook"
                              ? ""
                              : customer.phone,
                        );
                      }}
                      className="h-11 w-full rounded-lg border border-white/[0.1] bg-[#090b0c] px-3 text-sm text-white outline-none focus:border-cyan-100/30"
                    >
                      <option value="zalo">Zalo</option>
                      <option value="facebook">Facebook</option>
                      <option value="phone">Điện thoại</option>
                      <option value="email">Email</option>
                    </select>
                  </label>
                  <label className="block space-y-1.5 text-xs font-medium tracking-wide text-zinc-400">
                    TÀI KHOẢN / LIÊN KẾT
                    <input
                      required
                      type={contactMethod === "email" ? "email" : "text"}
                      minLength={3}
                      maxLength={254}
                      value={contactValue}
                      onChange={(event) => setContactValue(event.target.value)}
                      placeholder={
                        contactMethod === "email"
                          ? "Email liên hệ"
                          : contactMethod === "phone"
                            ? "Số điện thoại"
                            : contactMethod === "facebook"
                              ? "Dán link trang cá nhân Facebook"
                              : "Số điện thoại Zalo"
                      }
                      className="h-11 w-full rounded-lg border border-white/[0.1] bg-[#090b0c] px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-100/30"
                    />
                  </label>
                </div>
                <p className="-mt-2 text-[11px] leading-5 text-zinc-500">
                  Email tài khoản nhận phản hồi: {customer.email}
                </p>
                <p className="text-xs font-medium tracking-wide text-zinc-400">
                  BẠN MUỐN NHẬN CARD THẾ NÀO?
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {(
                    [
                      ["ship", "Gửi hàng", "Gửi đến địa chỉ của bạn"],
                      ["meet", "Giao dịch trực tiếp", "Hẹn gặp trực tiếp"],
                      ["undecided", "Chưa quyết định", "Trao đổi với cửa hàng sau"],
                    ] as const
                  ).map(([method, title, description]) => (
                    <label
                      key={method}
                      className={`flex min-h-[76px] cursor-pointer flex-col justify-center rounded-lg border p-3 transition ${
                        deliveryMethod === method
                          ? "border-cyan-100/40 bg-cyan-100/[0.06]"
                          : "border-white/[0.1] bg-[#090b0c] hover:border-white/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name="quote-delivery"
                        value={method}
                        checked={deliveryMethod === method}
                        onChange={() => setDeliveryMethod(method)}
                        className="sr-only"
                      />
                      <span className="text-sm font-semibold text-zinc-100">
                        {title}
                      </span>
                      <span className="mt-1 text-[11px] text-zinc-500">
                        {description}
                      </span>
                    </label>
                  ))}
                </div>
                {deliveryMethod === "ship" && (
                  <label className="block space-y-1.5 text-xs font-medium text-zinc-400">
                    ĐỊA CHỈ NHẬN HÀNG
                    <textarea
                      required
                      autoComplete="street-address"
                      minLength={5}
                      maxLength={250}
                      rows={2}
                      value={shippingAddress}
                      onChange={(event) =>
                        setShippingAddress(event.target.value)
                      }
                      className="w-full resize-y rounded-lg border border-white/[0.1] bg-[#090b0c] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-100/30"
                    />
                  </label>
                )}
                <label className="block space-y-1.5 text-xs font-medium tracking-wide text-zinc-400">
                  GHI CHÚ
                  <textarea
                    maxLength={1000}
                    rows={4}
                    value={quoteMessage}
                    onChange={(event) => setQuoteMessage(event.target.value)}
                    placeholder="Thời gian liên hệ, mong muốn đổi card hoặc ghi chú khác"
                    className="w-full resize-y rounded-lg border border-white/[0.1] bg-[#090b0c] px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-cyan-100/30"
                  />
                </label>
                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setQuoteRequestOpen(false)}
                    disabled={isSubmittingQuote}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/[0.1] px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/[0.04] disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={
                      !cartStatusReady ||
                      isSubmittingQuote ||
                      quoteReferenceTotal < 50_000
                    }
                    className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#c52d1d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#df3825] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmittingQuote
                      ? "Đang gửi..."
                      : "Gửi yêu cầu trao đổi"}
                  </button>
                </div>
              </form>
            ) : quoteRequestSent ? null : (
              <button
                type="button"
                onClick={() => {
                  setQuoteRequestError("");
                  setQuoteRequestOpen(true);
                }}
                disabled={!cartStatusReady}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-cyan-100 px-5 py-3 text-sm font-semibold text-[#07191c] transition hover:bg-cyan-50 disabled:cursor-wait disabled:opacity-60"
              >
                Nhận yêu cầu trao đổi
              </button>
            )}
          </section>

          <aside className="rounded-2xl border border-white/[0.08] bg-[#101314] p-5">
            <p className="text-xs font-semibold tracking-[0.15em] text-zinc-500">
              STACK GỬI KÈM
            </p>
            <p className="mt-3 text-xl font-semibold text-white">
              {quoteOnlyItems.reduce((sum, item) => sum + item.quantity, 0)} lá
            </p>
            <ul className="mt-4 divide-y divide-white/[0.07]">
              {quoteOnlyItems.map((item) => (
                <li
                  key={item.productId}
                  className="flex justify-between gap-3 py-3 text-sm"
                >
                  <span className="min-w-0 text-zinc-300">
                    {item.name}
                    <span className="ml-1 text-zinc-500">
                      {tcgplayerProductIds.has(item.productId)
                        ? "TCGPLAYER"
                        : "HOLO"}
                    </span>
                  </span>
                  <span className="shrink-0 text-zinc-300">×{item.quantity}</span>
                </li>
              ))}
            </ul>
            <div className="mt-1 border-t border-white/[0.08] pt-4">
              {tcgplayerUsdByProductId.size > 0 && (
                <>
                  <p className="text-xs font-semibold tracking-[0.15em] text-zinc-500">
                    TỔNG THAM KHẢO TCGPLAYER
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {cartStatusReady
                      ? `$${quoteOnlyItems
                          .reduce(
                            (total, item) =>
                              total +
                              (tcgplayerUsdByProductId.get(item.productId) ??
                                0) *
                                item.quantity,
                            0,
                          )
                          .toFixed(2)} USD`
                      : "Đang tải..."}
                  </p>
                </>
              )}
              {quoteOnlyItems.some(
                (item) => !tcgplayerUsdByProductId.has(item.productId),
              ) && (
                <>
                  <p className="mt-3 text-xs font-semibold tracking-[0.15em] text-zinc-500">
                    TỔNG THAM KHẢO SẢN PHẨM KHÁC
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {formatPrice(
                      quoteOnlyItems.reduce(
                        (total, item) =>
                          total +
                          (!tcgplayerUsdByProductId.has(item.productId)
                            ? (referencePriceByProductId.get(item.productId) ??
                                item.price) * item.quantity
                            : 0),
                        0,
                      ),
                    )}
                  </p>
                </>
              )}
              <p className="mt-2 text-xs leading-5 text-zinc-400">
                Yêu cầu cần đạt tối thiểu 50.000 đ theo giá quy đổi nội bộ.
                Mọi mức giá chỉ tham khảo, không xác nhận giao dịch.
              </p>
              <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                Giá trị quy đổi hiện tại để xét ngưỡng:{" "}
                {formatPrice(quoteReferenceTotal)}
              </p>
            </div>
          </aside>
        </div>
      ) : checkoutStarted ? (
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
              disabled={
                isSubmitting ||
                items.length === 0 ||
                !cartStatusReady ||
                quoteOnlyItems.length > 0
              }
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
          {quoteOnlyItems.length > 0 && (
            <p className="mt-5 text-sm text-cyan-100">
              Hãy xóa thẻ cần báo giá khỏi giỏ để tiếp tục thanh toán sản phẩm
              khác.
            </p>
          )}
          {cartStatusError && (
            <p role="alert" className="mt-5 text-sm text-red-300">
              {cartStatusError}
            </p>
          )}
          <button
            type="button"
            onClick={() => setCheckoutStarted(true)}
            disabled={
              items.length === 0 ||
              !cartStatusReady ||
              quoteOnlyItems.length > 0
            }
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-gradient-to-b from-[#f0d783] to-[#c79732] px-4 py-3 text-sm font-semibold text-[#211805] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-7"
          >
            Tiếp tục thanh toán
          </button>
        </div>
      )}
    </div>
  );
}
