"use client";

import { useState } from "react";
import { Mail, RefreshCw } from "lucide-react";

interface ManagedOrder {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  total: number;
  paymentStatus: "pending" | "reported" | "paid";
  paymentNotificationStatus: "sent" | "failed" | null;
  paymentConfirmationEmailStatus: "sent" | "failed" | null;
  paymentReportedAt: string | null;
  createdAt: string;
}

interface OrderManagerProps {
  initialOrders: ManagedOrder[];
}

function formatPrice(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)} đ`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function OrderManager({ initialOrders }: OrderManagerProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function updatePaymentStatus(order: ManagedOrder) {
    const nextStatus = order.paymentStatus === "paid" ? "pending" : "paid";
    setBusyOrderId(order.id);
    setMessage("");
    setIsError(false);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: nextStatus }),
      });
      const result = (await response.json()) as {
        message?: string;
        paymentStatus?: ManagedOrder["paymentStatus"];
        customerEmailSent?: boolean;
      };
      if (!response.ok) {
        throw new Error(result.message ?? "Không thể cập nhật đơn hàng.");
      }
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id
            ? {
                ...item,
                paymentStatus: result.paymentStatus ?? nextStatus,
                paymentConfirmationEmailStatus:
                  nextStatus === "paid"
                    ? result.customerEmailSent
                      ? "sent"
                      : "failed"
                    : item.paymentConfirmationEmailStatus,
              }
            : item,
        ),
      );
      setMessage(
        result.message ??
          (nextStatus === "paid"
            ? "Đã xác nhận thanh toán và gửi email cho khách."
            : "Đã cập nhật trạng thái thanh toán."),
      );
      setIsError(nextStatus === "paid" && result.customerEmailSent !== true);
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error ? error.message : "Không thể cập nhật đơn hàng.",
      );
    } finally {
      setBusyOrderId(null);
    }
  }

  async function resendOrderEmail(order: ManagedOrder) {
    setBusyOrderId(order.id);
    setMessage("");
    setIsError(false);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "POST",
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(result.message ?? "Không thể gửi lại email đơn hàng.");
      }
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id
            ? order.paymentStatus === "paid"
              ? { ...item, paymentConfirmationEmailStatus: "sent" }
              : { ...item, paymentNotificationStatus: "sent" }
            : item,
        ),
      );
      setMessage(
        order.paymentStatus === "paid"
          ? "Đã gửi lại email xác nhận thanh toán cho khách hàng."
          : "Đã gửi lại email thông báo thanh toán cho cửa hàng và khách.",
      );
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Không thể gửi lại email đơn hàng.",
      );
    } finally {
      setBusyOrderId(null);
    }
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[#d9b754]">
            ĐƠN HÀNG
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            Quản lý đơn hàng
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Hiển thị tối đa 200 đơn mới nhất. Cửa hàng xác nhận thanh toán sau
            khi kiểm tra giao dịch ngân hàng.
          </p>
        </div>
        <span className="rounded-lg border border-white/[0.08] px-3 py-2 text-sm text-zinc-300">
          {orders.length} đơn hàng
        </span>
      </header>

      {message && (
        <p
          role={isError ? "alert" : "status"}
          className={`rounded-lg border p-3 text-sm ${
            isError
              ? "border-red-400/20 bg-red-400/[0.06] text-red-300"
              : "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300"
          }`}
        >
          {message}
        </p>
      )}

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.1] bg-[#101314] px-6 py-12 text-center text-sm text-zinc-500">
          Chưa có đơn hàng nào.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isBusy = busyOrderId === order.id;
            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101314]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.06] p-4 sm:p-5">
                  <div>
                    <p className="font-mono text-sm text-[#e5bf62]">
                      #{order.id}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatDate(order.createdAt)}
                    </p>
                    {order.paymentReportedAt && (
                      <p className="mt-1 text-xs text-sky-300">
                        Khách báo đã chuyển khoản:{" "}
                        {formatDate(order.paymentReportedAt)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        order.paymentStatus === "paid"
                          ? "bg-emerald-400/10 text-emerald-300"
                          : order.paymentStatus === "reported"
                            ? "bg-sky-400/10 text-sky-200"
                            : "bg-amber-400/10 text-amber-200"
                      }`}
                    >
                      {order.paymentStatus === "paid"
                        ? "Đã xác nhận thanh toán"
                        : order.paymentStatus === "reported"
                          ? "Khách báo đã chuyển khoản"
                          : "Chờ thanh toán"}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        order.paymentNotificationStatus === "sent"
                          ? "bg-sky-400/10 text-sky-300"
                          : order.paymentNotificationStatus === "failed"
                            ? "bg-red-400/10 text-red-300"
                            : "bg-white/[0.05] text-zinc-400"
                      }`}
                    >
                      {order.paymentNotificationStatus === "sent"
                        ? "Email báo thanh toán đã gửi"
                        : order.paymentNotificationStatus === "failed"
                          ? "Email báo thanh toán lỗi"
                          : "Chưa báo thanh toán"}
                    </span>
                    {order.paymentStatus === "paid" && (
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          order.paymentConfirmationEmailStatus === "sent"
                            ? "bg-emerald-400/10 text-emerald-300"
                            : "bg-red-400/10 text-red-300"
                        }`}
                      >
                        {order.paymentConfirmationEmailStatus === "sent"
                          ? "Email xác nhận cho khách đã gửi"
                          : "Email xác nhận cho khách chưa gửi"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[1fr_0.8fr]">
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Thông tin khách hàng
                    </h2>
                    <dl className="mt-3 space-y-1.5 text-sm">
                      <div className="flex gap-2">
                        <dt className="text-zinc-500">Tên:</dt>
                        <dd className="text-zinc-200">{order.customer.name}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-zinc-500">Email:</dt>
                        <dd className="break-all text-zinc-200">
                          {order.customer.email}
                        </dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-zinc-500">Điện thoại:</dt>
                        <dd className="text-zinc-200">{order.customer.phone}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-zinc-500">Địa chỉ:</dt>
                        <dd className="text-zinc-200">{order.customer.address}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Sản phẩm đặt mua
                    </h2>
                    <ul className="mt-3 space-y-2">
                      {order.items.map((item) => (
                        <li
                          key={item.productId}
                          className="flex justify-between gap-3 text-sm"
                        >
                          <span className="text-zinc-300">
                            {item.name} × {item.quantity}
                          </span>
                          <span className="shrink-0 text-zinc-400">
                            {formatPrice(item.lineTotal)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 border-t border-white/[0.06] pt-3 text-right font-semibold text-[#e5bf62]">
                      Tổng: {formatPrice(order.total)}
                    </p>
                  </div>
                </div>

                <footer className="flex flex-wrap gap-2 border-t border-white/[0.06] p-4 sm:px-5">
                  <button
                    type="button"
                    onClick={() => void updatePaymentStatus(order)}
                    disabled={isBusy || order.paymentStatus === "pending"}
                    className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#d4a537]/25 px-3 py-2 text-xs font-medium text-[#efd486] transition hover:bg-[#d4a537]/10 disabled:opacity-50"
                  >
                    {order.paymentStatus === "paid"
                      ? "Đánh dấu chờ thanh toán"
                      : order.paymentStatus === "reported"
                        ? "Xác nhận đã thanh toán"
                        : "Chờ khách báo đã chuyển khoản"}
                  </button>
                  {(order.paymentStatus === "reported" ||
                    order.paymentStatus === "paid") &&
                    (order.paymentStatus === "paid"
                      ? order.paymentConfirmationEmailStatus !== "sent"
                      : order.paymentNotificationStatus !== "sent") && (
                      <button
                        type="button"
                        onClick={() => void resendOrderEmail(order)}
                        disabled={isBusy}
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/[0.04] disabled:opacity-50"
                      >
                        {isBusy ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Mail className="h-3.5 w-3.5" />
                        )}
                        {order.paymentStatus === "paid"
                          ? "Gửi lại email xác nhận cho khách"
                          : "Gửi lại email báo thanh toán"}
                      </button>
                    )}
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
