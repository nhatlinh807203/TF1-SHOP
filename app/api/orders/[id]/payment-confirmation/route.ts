import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getOrdersCollection } from "@/lib/db";
import { sendPaymentReportedEmail } from "@/lib/order-email";

interface PaymentConfirmationContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  _request: Request,
  context: PaymentConfirmationContext,
) {
  const sessionUser = await getSession();
  if (!sessionUser || !ObjectId.isValid(sessionUser.id)) {
    return NextResponse.json(
      { message: "Vui lòng đăng nhập để xác nhận thanh toán." },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Mã đơn hàng không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    const orders = await getOrdersCollection();
    const orderId = new ObjectId(id);
    const userId = new ObjectId(sessionUser.id);
    let order = await orders.findOne({ _id: orderId, userId });
    if (!order) {
      return NextResponse.json(
        { message: "Không tìm thấy đơn hàng của tài khoản này." },
        { status: 404 },
      );
    }
    if (order.paymentStatus === "paid") {
      return NextResponse.json({
        notificationSent: true,
        message: "Cửa hàng đã xác nhận đơn hàng đã thanh toán.",
      });
    }

    if (order.paymentStatus !== "reported") {
      const update = await orders.updateOne(
        { _id: orderId, userId, paymentStatus: "pending" },
        {
          $set: {
            paymentStatus: "reported",
            paymentReportedAt: new Date(),
            updatedAt: new Date(),
          },
        },
      );
      if (update.matchedCount === 0) {
        order = await orders.findOne({ _id: orderId, userId });
        if (!order || order.paymentStatus !== "reported") {
          return NextResponse.json(
            { message: "Trạng thái đơn hàng vừa thay đổi. Hãy tải lại trang." },
            { status: 409 },
          );
        }
      } else {
        order.paymentStatus = "reported";
      }
    }

    if (order.paymentNotificationStatus === "sent") {
      return NextResponse.json({
        notificationSent: true,
        message:
          "Thông báo thanh toán của bạn đã được gửi đến cửa hàng. Đơn hàng sẽ được cập nhật sau khi giao dịch được đối soát.",
      });
    }

    try {
      await sendPaymentReportedEmail(id, order);
      await orders.updateOne(
        { _id: orderId, userId },
        {
          $set: {
            paymentNotificationStatus: "sent",
            updatedAt: new Date(),
          },
        },
      );
      return NextResponse.json({
        notificationSent: true,
        message:
          "Thông báo đơn hàng mới đã được gửi đến cửa hàng và email xác nhận đã được gửi đến khách hàng. Cửa hàng cần đối soát giao dịch trước khi cập nhật trạng thái thanh toán.",
      });
    } catch (error) {
      console.error("Payment report email delivery failed:", error);
      await orders.updateOne(
        { _id: orderId, userId },
        {
          $set: {
            paymentNotificationStatus: "failed",
            updatedAt: new Date(),
          },
        },
      );
      return NextResponse.json({
        notificationSent: false,
        message:
          "Đã ghi nhận thông tin bạn báo đã chuyển khoản nhưng chưa thể gửi email thông báo. Vui lòng thử gửi lại hoặc liên hệ cửa hàng để được hỗ trợ.",
      });
    }
  } catch (error) {
    console.error("Payment confirmation failed:", error);
    return NextResponse.json(
      { message: "Không thể xác nhận thanh toán lúc này. Vui lòng thử lại." },
      { status: 500 },
    );
  }
}
