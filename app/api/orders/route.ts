import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getOrdersCollection,
  getProductsCollection,
  getUserById,
  startDatabaseSession,
  type OrderDocument,
  type OrderItemDocument,
} from "@/lib/db";

interface SubmittedOrderItem {
  productId: string;
  quantity: number;
}

interface SubmittedCustomer {
  name: string;
  phone: string;
  address: string;
}

class OrderRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseOrderRequest(
  value: unknown,
): { items: SubmittedOrderItem[]; customer: SubmittedCustomer } {
  if (!isRecord(value) || !Array.isArray(value.items) || !isRecord(value.customer)) {
    throw new OrderRequestError("Thông tin đặt hàng không hợp lệ.", 400);
  }
  if (value.items.length < 1 || value.items.length > 50) {
    throw new OrderRequestError("Giỏ hàng cần có từ 1 đến 50 sản phẩm.", 400);
  }

  const itemIds = new Set<string>();
  const items: SubmittedOrderItem[] = value.items.map((item) => {
    if (
      !isRecord(item) ||
      typeof item.productId !== "string" ||
      !ObjectId.isValid(item.productId) ||
      typeof item.quantity !== "number" ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 100 ||
      itemIds.has(item.productId)
    ) {
      throw new OrderRequestError("Thông tin sản phẩm trong giỏ không hợp lệ.", 400);
    }
    itemIds.add(item.productId);
    return { productId: item.productId, quantity: item.quantity };
  });

  const { name, phone, address } = value.customer;
  if (
    typeof name !== "string" ||
    typeof phone !== "string" ||
    typeof address !== "string"
  ) {
    throw new OrderRequestError("Vui lòng điền đủ thông tin nhận hàng.", 400);
  }
  const normalizedName = name.trim();
  const normalizedPhone = phone.trim();
  const normalizedAddress = address.trim();
  const phoneDigits = normalizedPhone.replace(/\D/g, "");
  if (normalizedName.length < 2 || normalizedName.length > 100) {
    throw new OrderRequestError("Họ tên cần có từ 2 đến 100 ký tự.", 400);
  }
  if (
    !/^[+\d\s().-]+$/.test(normalizedPhone) ||
    phoneDigits.length < 7 ||
    phoneDigits.length > 15
  ) {
    throw new OrderRequestError("Số điện thoại chưa đúng định dạng.", 400);
  }
  if (normalizedAddress.length < 5 || normalizedAddress.length > 250) {
    throw new OrderRequestError("Địa chỉ cần có từ 5 đến 250 ký tự.", 400);
  }

  return {
    items,
    customer: {
      name: normalizedName,
      phone: normalizedPhone,
      address: normalizedAddress,
    },
  };
}

export async function POST(request: Request) {
  const sessionUser = await getSession();
  if (!sessionUser) {
    return NextResponse.json(
      { message: "Vui lòng đăng nhập để đặt hàng." },
      { status: 401 },
    );
  }

  const user = await getUserById(sessionUser.id);
  if (!user) {
    return NextResponse.json(
      { message: "Không tìm thấy tài khoản. Vui lòng đăng nhập lại." },
      { status: 401 },
    );
  }

  let submitted: { items: SubmittedOrderItem[]; customer: SubmittedCustomer };
  try {
    submitted = parseOrderRequest(await request.json());
  } catch (error) {
    if (error instanceof OrderRequestError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { message: "Dữ liệu gửi lên không hợp lệ." },
      { status: 400 },
    );
  }

  const session = await startDatabaseSession();
  let transactionResult:
    | { orderId: ObjectId; order: OrderDocument }
    | undefined;

  try {
    transactionResult = await session.withTransaction(async () => {
      const products = await getProductsCollection();
      const productIds = submitted.items.map(
        (item) => new ObjectId(item.productId),
      );
      const availableProducts = await products
        .find(
          { _id: { $in: productIds }, active: true },
          { session },
        )
        .toArray();
      const productsById = new Map(
        availableProducts.map((product) => [product._id.toString(), product]),
      );

      const orderItems: OrderItemDocument[] = submitted.items.map((item) => {
        const product = productsById.get(item.productId);
        if (!product) {
          throw new OrderRequestError(
            "Một sản phẩm không còn được kinh doanh.",
            409,
          );
        }
        if (product.type === "card") {
          throw new OrderRequestError(
            "Giá thẻ bài chỉ mang tính tham khảo. Vui lòng liên hệ cửa hàng để xác nhận giá và đặt mua.",
            409,
          );
        }
        if (product.stock < item.quantity) {
          throw new OrderRequestError(
            `Sản phẩm "${product.name}" không đủ số lượng tồn kho.`,
            409,
          );
        }
        const lineTotal = product.price * item.quantity;
        if (!Number.isSafeInteger(lineTotal)) {
          throw new OrderRequestError("Tổng tiền đơn hàng vượt giới hạn.", 400);
        }
        return {
          productId: item.productId,
          name: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          lineTotal,
        };
      });
      const total = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
      if (!Number.isSafeInteger(total)) {
        throw new OrderRequestError("Tổng tiền đơn hàng vượt giới hạn.", 400);
      }

      for (const item of submitted.items) {
        const result = await products.updateOne(
          {
            _id: new ObjectId(item.productId),
            active: true,
            stock: { $gte: item.quantity },
          },
          { $inc: { stock: -item.quantity }, $set: { updatedAt: new Date() } },
          { session },
        );
        if (result.modifiedCount !== 1) {
          throw new OrderRequestError(
            "Tồn kho vừa thay đổi. Vui lòng kiểm tra lại giỏ hàng.",
            409,
          );
        }
      }

      const now = new Date();
      const newOrderId = new ObjectId();
      const newOrder: OrderDocument = {
        userId: user._id,
        customer: {
          ...submitted.customer,
          email: user.email,
        },
        items: orderItems,
        total,
        status: "confirmed",
        paymentStatus: "pending",
        createdAt: now,
        updatedAt: now,
      };
      await (await getOrdersCollection()).insertOne(
        { ...newOrder, _id: newOrderId },
        { session },
      );
      return { orderId: newOrderId, order: newOrder };
    });
  } catch (error) {
    if (error instanceof OrderRequestError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }
    console.error("Order creation failed:", error);
    return NextResponse.json(
      { message: "Không thể tạo đơn hàng lúc này. Vui lòng thử lại." },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }

  if (!transactionResult) {
    console.error("Order transaction completed without an order.");
    return NextResponse.json(
      { message: "Không thể xác nhận đơn hàng lúc này." },
      { status: 500 },
    );
  }

  revalidatePath("/", "page");
  for (const item of submitted.items) {
    revalidatePath(`/products/${item.productId}`, "page");
  }

  return NextResponse.json(
    {
      orderId: transactionResult.orderId.toString(),
      total: transactionResult.order.total,
      message: "Đơn hàng đã được tạo. Vui lòng thanh toán để tiếp tục.",
    },
    { status: 201 },
  );
}
