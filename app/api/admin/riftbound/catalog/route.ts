import { revalidatePath } from "next/cache";
import { Binary } from "mongodb";
import { getAdminUserForApi } from "@/lib/auth";
import { getProductsCollection } from "@/lib/db";
import {
  MAX_IMAGE_UPLOAD_BYTES,
  parseUploadedImage,
  type UploadedImage,
} from "@/lib/image-upload";
import { serializeProduct } from "@/lib/products";
import { getRiftboundCatalog } from "@/lib/riftbound-catalog";

export async function GET() {
  try {
    const admin = await getAdminUserForApi();
    if (!admin) {
      return Response.json(
        { message: "Bạn cần đăng nhập bằng tài khoản quản trị." },
        { status: 401 },
      );
    }

    const catalog = await getRiftboundCatalog();
    const products = await getProductsCollection();
    const importedProducts = await products
      .find(
        {
          "riftbound.printingId": {
            $in: catalog.cards.map((card) => card.printingId),
          },
        },
        {
          projection: {
            price: 1,
            stock: 1,
            "riftbound.printingId": 1,
            imageUrl: 1,
            imageContentType: 1,
            updatedAt: 1,
          },
        },
      )
      .toArray();
    const inventoryByPrintingId = new Map(
      importedProducts.flatMap((product) =>
        product.riftbound
          ? [
              [
                product.riftbound.printingId,
                {
                  id: product._id.toString(),
                  price: product.price,
                  stock: product.stock,
                  imageUrl: product.imageContentType
                    ? `/api/products/${product._id.toString()}/image?v=${product.updatedAt.getTime()}`
                    : (product.imageUrl || ""),
                },
              ] as const,
            ]
          : [],
      ),
    );
    return Response.json({
      ...catalog,
      cards: catalog.cards.map((card) => ({
        ...card,
        existingProduct: inventoryByPrintingId.get(card.printingId) ?? null,
      })),
    });
  } catch (error) {
    console.error("Riftbound catalog fetch failed:", error);
    return Response.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Không thể tải catalog Riftbound lúc này.",
      },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAdminUserForApi();
    if (!admin) {
      return Response.json(
        { message: "Bạn cần đăng nhập bằng tài khoản quản trị." },
        { status: 401 },
      );
    }

    const contentLength = Number(request.headers.get("content-length"));
    if (contentLength > MAX_IMAGE_UPLOAD_BYTES + 64 * 1024) {
      return Response.json(
        { message: "Tệp tải lên không được vượt quá 5 MB." },
        { status: 413 },
      );
    }

    let printingId: unknown;
    let stock: unknown;
    let image: UploadedImage | undefined;
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      let formData: FormData;
      try {
        formData = await request.formData();
      } catch {
        return Response.json(
          { message: "Dữ liệu gửi lên không hợp lệ." },
          { status: 400 },
        );
      }
      const parsedImage = await parseUploadedImage(formData);
      if ("error" in parsedImage) {
        return Response.json({ message: parsedImage.error }, { status: 400 });
      }
      printingId = formData.get("printingId");
      const stockValue = formData.get("stock");
      stock = typeof stockValue === "string" ? Number(stockValue) : NaN;
      image = parsedImage.image;
    } else {
      const body: unknown = await request.json().catch(() => null);
      if (typeof body !== "object" || body === null || Array.isArray(body)) {
        return Response.json(
          { message: "Dữ liệu sản phẩm không hợp lệ." },
          { status: 400 },
        );
      }
      const data = body as Record<string, unknown>;
      printingId = data.printingId;
      stock = data.stock;
    }
    if (
      typeof printingId !== "string" ||
      printingId.length < 1 ||
      printingId.length > 120 ||
      typeof stock !== "number" ||
      !Number.isSafeInteger(stock) ||
      stock < 0
    ) {
      return Response.json(
        { message: "Số lượng tồn kho phải là số nguyên không âm." },
        { status: 400 },
      );
    }

    const catalog = await getRiftboundCatalog();
    const card = catalog.cards.find(
      (candidate) => candidate.printingId === printingId,
    );
    if (!card) {
      return Response.json(
        { message: "Không tìm thấy phiên bản thẻ trong các set 1–5." },
        { status: 404 },
      );
    }

    const products = await getProductsCollection();
    await products.createIndex(
      { "riftbound.printingId": 1 },
      { unique: true, sparse: true },
    );
    const existing = await products.findOne(
      { "riftbound.printingId": card.printingId },
      { projection: { price: 1 } },
    );
    const convertedPrice = card.sellingPriceVnd;
    const sellingPrice = convertedPrice ?? existing?.price;
    if (sellingPrice === undefined || sellingPrice === null) {
      return Response.json(
        {
          message:
            card.tcgplayerPriceUsd === null
              ? "OpenRift chưa có giá TCGplayer cho lá này nên chưa thể tạo giá bán."
              : "Không thể lấy tỷ giá USD/VND hiện tại để tính giá bán. Vui lòng thử lại sau.",
        },
        { status: 422 },
      );
    }

    const now = new Date();
    const product = await products.findOneAndUpdate(
      { "riftbound.printingId": card.printingId },
      {
        $set: {
          name: `${card.cardName} (${card.collectorNumber})`,
          type: "card",
          game: "riftbound",
          description: card.description,
          energyIds: [],
          roleId: null,
          rarityId: null,
          hashtags: ["#Riftbound", `#${card.setSlug}`],
          price: sellingPrice,
          stock,
          imageUrl: card.imageUrl || existing?.imageUrl || "",
          riftbound: {
            printingId: card.printingId,
            cardId: card.cardId,
            cardName: card.cardName,
            setSlug: card.setSlug,
            setId: card.setId,
            setName: card.setName,
            collectorNumber: card.collectorNumber,
            rarity: card.rarity,
            faction: card.faction,
            tcgplayerPriceUsd: card.tcgplayerPriceUsd,
            marketPriceUpdatedAt: now,
          },
          ...(image
            ? {
                imageData: new Binary(image.data),
                imageContentType: image.contentType,
              }
            : {}),
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now, featured: false, active: true },
      },
      { upsert: true, returnDocument: "after" },
    );
    if (!product) {
      throw new Error("Imported Riftbound product could not be read back.");
    }

    revalidatePath("/", "page");
    revalidatePath("/admin/products", "page");
    return Response.json({ product: serializeProduct(product) });
  } catch (error) {
    console.error("Riftbound product import failed:", error);
    return Response.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Không thể nhập sản phẩm Riftbound lúc này.",
      },
      { status: 502 },
    );
  }
}
