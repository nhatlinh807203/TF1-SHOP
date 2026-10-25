import nodemailer from "nodemailer";
import type { OrderDocument } from "@/lib/db";

const DEFAULT_ORDER_NOTIFICATION_EMAIL = "letiennhatlinh08072003@gmail.com";

function getGmailTransport() {
  const user =
    process.env.EMAIL_USER?.trim() || process.env.GMAIL_USER?.trim();
  const password = (
    process.env.EMAIL_PASS ||
    process.env.GMAIL_APP_PASSWORD ||
    ""
  ).replace(/\s/g, "");
  if (!user || !password) {
    throw new Error(
      "EMAIL_USER and EMAIL_PASS (or their GMAIL_* aliases) must be configured.",
    );
  }

  const service = process.env.EMAIL_SERVICE?.trim() || "gmail";
  return {
    transport: nodemailer.createTransport({
      service,
      auth: { user, pass: password },
    }),
    user,
  };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export async function sendPaymentReportedEmail(
  orderId: string,
  order: OrderDocument,
) {
  const { transport, user } = getGmailTransport();
  const shopAddress =
    process.env.ORDER_NOTIFICATION_EMAIL?.trim() ||
    DEFAULT_ORDER_NOTIFICATION_EMAIL;
  const recipients = [
    { address: shopAddress, isCustomer: false },
    ...(order.customer.email === shopAddress
      ? []
      : [{ address: order.customer.email, isCustomer: true }]),
  ];
  const formattedTotal = new Intl.NumberFormat("vi-VN").format(order.total);
  const paymentReference = `TF1SHOP ${orderId}`;
  const textItems = order.items
    .map(
      (item) =>
        `- ${item.name} | Số lượng: ${item.quantity} | Đơn giá: ${new Intl.NumberFormat("vi-VN").format(item.unitPrice)} đ | Thành tiền: ${new Intl.NumberFormat("vi-VN").format(item.lineTotal)} đ`,
    )
    .join("\n");

  const orderDetailsText = [
    "",
    textItems,
    "",
    `Tổng tiền: ${formattedTotal} đ`,
    `Nội dung chuyển khoản yêu cầu: ${paymentReference}`,
    "",
    `Khách hàng: ${order.customer.name}`,
    `Email: ${order.customer.email}`,
    `Số điện thoại: ${order.customer.phone}`,
    `Địa chỉ: ${order.customer.address}`,
  ].join("\n");
  const orderDetailsHtml = `<h2>Sản phẩm</h2>
      <ul>${order.items
        .map(
          (item) =>
            `<li>${escapeHtml(item.name)} × ${item.quantity}: ${new Intl.NumberFormat("vi-VN").format(item.lineTotal)} đ</li>`,
        )
        .join("")}</ul>
      <p><strong>Tổng tiền:</strong> ${formattedTotal} đ<br>
      <strong>Nội dung chuyển khoản yêu cầu:</strong> ${escapeHtml(paymentReference)}</p>
      <h2>Thông tin khách hàng</h2>
      <p><strong>Họ tên:</strong> ${escapeHtml(order.customer.name)}<br>
      <strong>Email:</strong> ${escapeHtml(order.customer.email)}<br>
      <strong>Số điện thoại:</strong> ${escapeHtml(order.customer.phone)}<br>
      <strong>Địa chỉ:</strong> ${escapeHtml(order.customer.address)}</p>`;
  const results = await Promise.allSettled(
    recipients.map(({ address, isCustomer }) => {
      const subject = isCustomer
        ? `Đã nhận xác nhận thanh toán đơn TF1SHOP #${orderId}`
        : `CÓ ĐƠN ĐẶT HÀNG MỚI #${orderId} - Khách báo đã chuyển khoản`;
      const introduction = isCustomer
        ? `TF1SHOP đã nhận thông báo bạn đã chuyển khoản cho đơn #${orderId}.`
        : `Có đơn đặt hàng mới #${orderId}. Khách hàng đã nhấn xác nhận đã chuyển khoản. Vui lòng kiểm tra giao dịch ngân hàng trước khi xác nhận đơn đã thanh toán.`;
      return transport.sendMail({
        from: `"TF1SHOP" <${user}>`,
        to: address,
        replyTo: order.customer.email,
        subject,
        text: `${introduction}${orderDetailsText}`,
        html: `<div style="font-family:Arial,sans-serif;color:#222;max-width:720px;margin:auto">
          <h1 style="color:#9a711b">${escapeHtml(
            isCustomer
              ? `Đã nhận xác nhận thanh toán đơn #${orderId}`
              : `CÓ ĐƠN ĐẶT HÀNG MỚI #${orderId}`,
          )}</h1>
          <p>${escapeHtml(introduction)}</p>
          ${orderDetailsHtml}
        </div>`,
      });
    }),
  );
  const failedDeliveries = results.filter(
    (result) => result.status === "rejected",
  );
  if (failedDeliveries.length > 0) {
    throw new Error(
      `Payment notification email failed for ${failedDeliveries.length} recipient(s).`,
    );
  }
}

export async function sendPaymentConfirmedEmail(
  orderId: string,
  order: OrderDocument,
) {
  const { transport, user } = getGmailTransport();
  const total = new Intl.NumberFormat("vi-VN").format(order.total);
  const itemsText = order.items
    .map(
      (item) =>
        `- ${item.name} × ${item.quantity}: ${new Intl.NumberFormat("vi-VN").format(item.lineTotal)} đ`,
    )
    .join("\n");
  const itemsHtml = order.items
    .map(
      (item) =>
        `<li>${escapeHtml(item.name)} × ${item.quantity}: ${new Intl.NumberFormat("vi-VN").format(item.lineTotal)} đ</li>`,
    )
    .join("");

  await transport.sendMail({
    from: `"TF1SHOP" <${user}>`,
    to: order.customer.email,
    subject: `Thanh toán thành công - Đơn hàng TF1SHOP #${orderId}`,
    text: [
      `Xin chào ${order.customer.name},`,
      "",
      `TF1SHOP xác nhận đã nhận được thanh toán cho đơn hàng #${orderId}.`,
      "Đơn hàng của bạn đang chờ được xử lý và gửi đi. Chúng tôi sẽ cập nhật khi đơn hàng được bàn giao cho đơn vị vận chuyển.",
      "",
      itemsText,
      "",
      `Tổng thanh toán: ${total} đ`,
      `Mã đơn hàng: ${orderId}`,
      "",
      "Cảm ơn bạn đã mua sắm tại TF1SHOP.",
    ].join("\n"),
    html: `<div style="font-family:Arial,sans-serif;color:#222;max-width:640px;margin:auto;line-height:1.6">
      <h1 style="color:#9a711b">Thanh toán thành công</h1>
      <p>Xin chào ${escapeHtml(order.customer.name)},</p>
      <p>TF1SHOP xác nhận đã nhận được thanh toán cho đơn hàng <strong>#${escapeHtml(orderId)}</strong>.</p>
      <p>Đơn hàng của bạn đang chờ được xử lý và gửi đi. Chúng tôi sẽ cập nhật khi đơn hàng được bàn giao cho đơn vị vận chuyển.</p>
      <h2>Thông tin đơn hàng</h2>
      <ul>${itemsHtml}</ul>
      <p><strong>Tổng thanh toán:</strong> ${total} đ<br>
      <strong>Mã đơn hàng:</strong> ${escapeHtml(orderId)}</p>
      <p>Cảm ơn bạn đã mua sắm tại TF1SHOP.</p>
    </div>`,
  });
}
