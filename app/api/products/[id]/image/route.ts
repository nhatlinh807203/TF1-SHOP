import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getProductsCollection } from "@/lib/db";

interface ProductImageRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  context: ProductImageRouteContext,
) {
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Mã sản phẩm không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    const products = await getProductsCollection();
    const product = await products.findOne(
      { _id: new ObjectId(id) },
      { projection: { imageData: 1, imageContentType: 1 } },
    );
    if (!product?.imageData || !product.imageContentType) {
      return NextResponse.json(
        { message: "Không tìm thấy ảnh sản phẩm." },
        { status: 404 },
      );
    }

    const imageData = product.imageData.value();
    return new NextResponse(new Uint8Array(imageData), {
      headers: {
        "Content-Type": product.imageContentType,
        "Content-Length": String(imageData.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Product image retrieval failed:", error);
    return NextResponse.json(
      { message: "Không thể tải ảnh sản phẩm lúc này." },
      { status: 500 },
    );
  }
}
