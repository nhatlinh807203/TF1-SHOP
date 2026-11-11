import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getProductsCollection } from "@/lib/db";
import { getTcgplayerReferencePrice } from "@/lib/tcgplayer-pricing";

function isObjectIdString(value: unknown): value is string {
  return typeof value === "string" && ObjectId.isValid(value);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Danh sách sản phẩm không hợp lệ." },
      { status: 400 },
    );
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json(
      { message: "Danh sách sản phẩm không hợp lệ." },
      { status: 400 },
    );
  }

  const submittedIds = (body as Record<string, unknown>).productIds;
  if (
    !Array.isArray(submittedIds) ||
    submittedIds.length > 50 ||
    !submittedIds.every(isObjectIdString)
  ) {
    return NextResponse.json(
      { message: "Danh sách sản phẩm không hợp lệ." },
      { status: 400 },
    );
  }

  const productIds = [...new Set(submittedIds)];
  const quoteOnlyProducts = await (
    await getProductsCollection()
  )
    .find(
      {
        _id: { $in: productIds.map((id) => new ObjectId(id)) },
        type: "card",
      },
      { projection: { _id: 1, price: 1, riftbound: 1 } },
    )
    .toArray();

  return NextResponse.json({
    quoteOnlyProducts: quoteOnlyProducts.map((product) => ({
      productId: product._id.toString(),
      referencePrice: product.riftbound
        ? (getTcgplayerReferencePrice(
            product.riftbound.tcgplayerPriceUsd ?? NaN,
          ) ?? product.price)
        : product.price,
      tcgplayerPriceUsd:
        typeof product.riftbound?.tcgplayerPriceUsd === "number"
          ? product.riftbound.tcgplayerPriceUsd
          : null,
      isTcgplayerPrice:
        typeof product.riftbound?.tcgplayerPriceUsd === "number",
    })),
  });
}
