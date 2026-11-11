import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getProductsCollection, getUserById } from "@/lib/db";
import { sendQuoteExchangeRequestEmail } from "@/lib/order-email";
import { getTcgplayerReferencePrice } from "@/lib/tcgplayer-pricing";

interface QuoteRequestItem {
  productId: string;
  quantity: number;
}

type QuoteContactMethod = "zalo" | "facebook" | "phone" | "email";
type QuoteDeliveryMethod = "ship" | "meet" | "undecided";

class QuoteRequestError extends Error {
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

function isQuoteContactMethod(value: unknown): value is QuoteContactMethod {
  return (
    value === "zalo" ||
    value === "facebook" ||
    value === "phone" ||
    value === "email"
  );
}

function isQuoteDeliveryMethod(value: unknown): value is QuoteDeliveryMethod {
  return value === "ship" || value === "meet" || value === "undecided";
}

function parseQuoteRequest(value: unknown): {
  items: QuoteRequestItem[];
  name: string;
  contactMethod: QuoteContactMethod;
  contactValue: string;
  deliveryMethod: QuoteDeliveryMethod;
  shippingAddress: string;
  message: string;
} {
  if (!isRecord(value) || !Array.isArray(value.items) || !isRecord(value.customer)) {
    throw new QuoteRequestError(
      "Thông tin yêu cầu trao đổi không hợp lệ.",
      400,
    );
  }
  if (value.items.length < 1 || value.items.length > 50) {
    throw new QuoteRequestError("Yêu cầu cần có từ 1 đến 50 sản phẩm.", 400);
  }
  const productIds = new Set<string>();
  const items = value.items.map((item) => {
    if (
      !isRecord(item) ||
      typeof item.productId !== "string" ||
      !ObjectId.isValid(item.productId) ||
      typeof item.quantity !== "number" ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 100 ||
      productIds.has(item.productId)
    ) {
      throw new QuoteRequestError(
        "Thông tin sản phẩm trong yêu cầu không hợp lệ.",
        400,
      );
    }
    productIds.add(item.productId);
    return { productId: item.productId, quantity: item.quantity };
  });

  const {
    name,
    contactMethod,
    contactValue,
    deliveryMethod,
    shippingAddress,
    message,
  } = value.customer;
  if (
    typeof name !== "string" ||
    !isQuoteContactMethod(contactMethod) ||
    typeof contactValue !== "string" ||
    !isQuoteDeliveryMethod(deliveryMethod) ||
    (shippingAddress !== undefined && typeof shippingAddress !== "string") ||
    (message !== undefined && typeof message !== "string")
  ) {
    throw new QuoteRequestError("Vui lòng kiểm tra lại thông tin liên hệ.", 400);
  }

  const normalizedName = name.trim();
  const normalizedContactValue = contactValue.trim();
  const normalizedShippingAddress =
    typeof shippingAddress === "string" ? shippingAddress.trim() : "";
  const normalizedMessage = typeof message === "string" ? message.trim() : "";
  if (normalizedName.length < 2 || normalizedName.length > 100) {
    throw new QuoteRequestError("Họ tên cần có từ 2 đến 100 ký tự.", 400);
  }
  if (normalizedContactValue.length < 3 || normalizedContactValue.length > 254) {
    throw new QuoteRequestError(
      "Thông tin liên hệ cần có từ 3 đến 254 ký tự.",
      400,
    );
  }
  if (
    contactMethod === "email" &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedContactValue)
  ) {
    throw new QuoteRequestError("Email liên hệ chưa đúng định dạng.", 400);
  }
  if (
    contactMethod === "facebook" &&
    !/^(https?:\/\/)?(www\.)?(facebook\.com|fb\.com)\/\S+$/i.test(
      normalizedContactValue,
    )
  ) {
    throw new QuoteRequestError(
      "Vui lòng nhập liên kết trang cá nhân Facebook hợp lệ.",
      400,
    );
  }
  if (contactMethod === "phone") {
    const phoneDigits = normalizedContactValue.replace(/\D/g, "");
    if (
      !/^[+\d\s().-]+$/.test(normalizedContactValue) ||
      phoneDigits.length < 7 ||
      phoneDigits.length > 15
    ) {
      throw new QuoteRequestError("Số điện thoại chưa đúng định dạng.", 400);
    }
  }
  if (
    deliveryMethod === "ship" &&
    (normalizedShippingAddress.length < 5 ||
      normalizedShippingAddress.length > 250)
  ) {
    throw new QuoteRequestError(
      "Địa chỉ nhận hàng cần có từ 5 đến 250 ký tự.",
      400,
    );
  }
  if (normalizedMessage.length > 1000) {
    throw new QuoteRequestError("Ghi chú không được vượt quá 1.000 ký tự.", 400);
  }

  return {
    items,
    name: normalizedName,
    contactMethod,
    contactValue: normalizedContactValue,
    deliveryMethod,
    shippingAddress: normalizedShippingAddress,
    message: normalizedMessage,
  };
}

export async function POST(request: Request) {
  const sessionUser = await getSession();
  if (!sessionUser || !ObjectId.isValid(sessionUser.id)) {
    return NextResponse.json(
      { message: "Vui lòng đăng nhập để gửi yêu cầu trao đổi." },
      { status: 401 },
    );
  }

  let submitted: ReturnType<typeof parseQuoteRequest>;
  try {
    submitted = parseQuoteRequest(await request.json());
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error
          ? error.message
          : "Thông tin yêu cầu trao đổi không hợp lệ.",
      },
      { status: error instanceof QuoteRequestError ? error.status : 400 },
    );
  }

  try {
    const user = await getUserById(sessionUser.id);
    if (!user) {
      return NextResponse.json(
        { message: "Không tìm thấy tài khoản. Vui lòng đăng nhập lại." },
        { status: 401 },
      );
    }

    const products = await getProductsCollection();
    const selectedProducts = await products
      .find({
        _id: {
          $in: submitted.items.map((item) => new ObjectId(item.productId)),
        },
        active: true,
        type: "card",
      })
      .toArray();
    const productsById = new Map(
      selectedProducts.map((product) => [product._id.toString(), product]),
    );
    let referenceTotal = 0;
    const emailItems = submitted.items.map((item) => {
      const product = productsById.get(item.productId);
      if (!product) {
        throw new QuoteRequestError(
          "Một thẻ trong giỏ không còn được kinh doanh.",
          409,
        );
      }
      if (product.stock < item.quantity) {
        throw new QuoteRequestError(
          `Thẻ "${product.name}" không đủ số lượng tồn kho.`,
          409,
        );
      }
      if (!Number.isSafeInteger(product.price) || product.price < 0) {
        throw new QuoteRequestError(
          `Giá tham khảo của thẻ "${product.name}" không hợp lệ.`,
          409,
        );
      }
      const referencePrice = product.riftbound
        ? (getTcgplayerReferencePrice(
            product.riftbound.tcgplayerPriceUsd ?? NaN,
          ) ?? product.price)
        : product.price;
      const lineTotal = referencePrice * item.quantity;
      if (!Number.isSafeInteger(lineTotal + referenceTotal)) {
        throw new QuoteRequestError(
          "Tổng giá trị tham khảo vượt quá giới hạn cho phép.",
          400,
        );
      }
      referenceTotal += lineTotal;
      return {
        name: product.name,
        quantity: item.quantity,
        referencePrice,
        tcgplayerPriceUsd:
          typeof product.riftbound?.tcgplayerPriceUsd === "number"
            ? product.riftbound.tcgplayerPriceUsd
            : null,
        priceSource:
          typeof product.riftbound?.tcgplayerPriceUsd === "number"
            ? "TCGplayer" as const
            : null,
      };
    });
    if (referenceTotal < 50_000) {
      throw new QuoteRequestError(
        "Giá trị tham khảo tối thiểu để gửi yêu cầu là 50.000 đ.",
        400,
      );
    }

    await sendQuoteExchangeRequestEmail({
      customer: {
        name: submitted.name,
        email: user.email,
        contactMethod: submitted.contactMethod,
        contactValue: submitted.contactValue,
        deliveryMethod: submitted.deliveryMethod,
        shippingAddress: submitted.shippingAddress,
        message: submitted.message,
      },
      items: emailItems,
    });

    return NextResponse.json({
      message: "Đã gửi yêu cầu trao đổi đến cửa hàng.",
    });
  } catch (error) {
    if (error instanceof QuoteRequestError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }
    console.error("Quote exchange request failed:", error);
    return NextResponse.json(
      { message: "Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau." },
      { status: 502 },
    );
  }
}
