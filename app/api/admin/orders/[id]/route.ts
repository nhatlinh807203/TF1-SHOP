import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getAdminUserForApi } from "@/lib/auth";
import { getOrdersCollection } from "@/lib/db";
import {
  sendPaymentConfirmedEmail,
  sendPaymentReportedEmail,
} from "@/lib/order-email";

interface AdminOrderRouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: AdminOrderRouteContext) {
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Mã đơn hàng không hợp lệ." },
      { status: 400 },
    );
  }
  if (!(await getAdminUserForApi())) {
    return NextResponse.json(
      { message: "Bạn cần đăng nhập bằng tài khoản quản trị." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Dữ liệu gửi lên không hợp lệ." },
      { status: 400 },
    );
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("paymentStatus" in body) ||
    (body.paymentStatus !== "pending" && body.paymentStatus !== "paid")
  ) {
    return NextResponse.json(
      { message: "Trạng thái thanh toán không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    const orders = await getOrdersCollection();
    const orderId = new ObjectId(id);
    const order = await orders.findOne({ _id: orderId });
    if (!order) {
      return NextResponse.json(
        { message: "Không tìm thấy đơn hàng." },
        { status: 404 },
      );
    }
    if (body.paymentStatus === "paid" && order.paymentStatus !== "reported" && order.paymentStatus !== "paid") {
      return NextResponse.json(
        { message: "Khách chưa báo đã chuyển khoản cho đơn này." },
        { status: 409 },
      );
    }
    if (
      body.paymentStatus === "paid" &&
      order.paymentStatus !== "paid" &&
      order.paymentNotificationStatus !== "sent"
    ) {
      return NextResponse.json(
        {
          message:
            "Chưa gửi được thông báo thanh toán của khách. Hãy gửi lại email trước khi xác nhận thanh toán.",
        },
        { status: 409 },
      );
    }

    if (body.paymentStatus === "paid" && order.paymentStatus !== "paid") {
      await orders.updateOne(
        { _id: orderId },
        {
          $set: {
            paymentStatus: "paid",
            updatedAt: new Date(),
          },
        },
      );
      order.paymentStatus = "paid";
    } else if (body.paymentStatus === "pending") {
      await orders.updateOne(
        { _id: orderId },
        {
          $set: {
            paymentStatus: "pending",
            updatedAt: new Date(),
          },
        },
      );
      order.paymentStatus = "pending";
    }

    let customerEmailSent = order.paymentConfirmationEmailStatus === "sent";
    let emailMessage: string | undefined;
    if (
      body.paymentStatus === "paid" &&
      order.paymentConfirmationEmailStatus !== "sent"
    ) {
      try {
        await sendPaymentConfirmedEmail(id, order);
        await orders.updateOne(
          { _id: orderId },
          {
            $set: {
              paymentConfirmationEmailStatus: "sent",
              updatedAt: new Date(),
            },
          },
        );
        customerEmailSent = true;
      } catch (error) {
        console.error("Payment confirmation email failed:", error);
        await orders.updateOne(
          { _id: orderId },
          {
            $set: {
              paymentConfirmationEmailStatus: "failed",
              updatedAt: new Date(),
            },
          },
        );
        emailMessage =
          "Thanh toán đã được xác nhận nhưng chưa gửi được email cho khách. Hãy dùng nút gửi lại email.";
      }
    }

    revalidatePath("/admin/orders", "page");
    return NextResponse.json({
      success: true,
      paymentStatus: body.paymentStatus,
      customerEmailSent,
      message:
        emailMessage ??
        (body.paymentStatus === "paid"
          ? "Đã xác nhận thanh toán và gửi email cho khách hàng."
          : "Đã cập nhật trạng thái đơn hàng."),
    });
  } catch (error) {
    console.error("Order payment status update failed:", error);
    return NextResponse.json(
      { message: "Không thể cập nhật trạng thái thanh toán." },
      { status: 500 },
    );
  }
}

export async function POST(_request: Request, context: AdminOrderRouteContext) {
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Mã đơn hàng không hợp lệ." },
      { status: 400 },
    );
  }
  if (!(await getAdminUserForApi())) {
    return NextResponse.json(
      { message: "Bạn cần đăng nhập bằng tài khoản quản trị." },
      { status: 401 },
    );
  }

  try {
    const orders = await getOrdersCollection();
    const orderId = new ObjectId(id);
    const order = await orders.findOne({ _id: orderId });
    if (!order) {
      return NextResponse.json(
        { message: "Không tìm thấy đơn hàng." },
        { status: 404 },
      );
    }

    if (order.paymentStatus === "paid") {
      await sendPaymentConfirmedEmail(id, order);
      await orders.updateOne(
        { _id: orderId },
        {
          $set: {
            paymentConfirmationEmailStatus: "sent",
            updatedAt: new Date(),
          },
        },
      );
      revalidatePath("/admin/orders", "page");
      return NextResponse.json({
        success: true,
        message: "Đã gửi lại email xác nhận thanh toán cho khách hàng.",
      });
    }

    if (order.paymentStatus !== "reported") {
      return NextResponse.json(
        { message: "Khách chưa báo đã chuyển khoản cho đơn này." },
        { status: 409 },
      );
    }

    await sendPaymentReportedEmail(id, order);
    await orders.updateOne(
      { _id: orderId },
      {
        $set: {
          paymentNotificationStatus: "sent",
          updatedAt: new Date(),
        },
      },
    );
    revalidatePath("/admin/orders", "page");
    return NextResponse.json({
      success: true,
      message: "Đã gửi lại email thông báo thanh toán cho cửa hàng và khách.",
    });
  } catch (error) {
    console.error("Order email resend failed:", error);
    return NextResponse.json(
      {
        message:
          "Không gửi được email. Kiểm tra EMAIL_USER, EMAIL_PASS và kết nối Gmail.",
      },
      { status: 502 },
    );
  }
}
