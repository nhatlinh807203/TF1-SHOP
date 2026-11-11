import type { ProductProfile, ProductType } from "@/lib/db";
import { parseUploadedImage, type UploadedImage } from "@/lib/image-upload";
import { isProductGame, type ProductGame } from "@/lib/product-games";
import { getTcgplayerReferencePrice } from "@/lib/tcgplayer-pricing";

export interface ProductInput {
  name: string;
  type: ProductType;
  game: ProductGame | null;
  description: string;
  energyIds: string[];
  roleId: string;
  rarityId: string | null;
  hashtags: string[];
  price: number;
  stock: number;
  featured: boolean;
  active: boolean;
}

export interface ProductView extends ProductInput {
  id: string;
  imageUrl: string;
  riftbound?: {
    printingId: string;
    cardId: string;
    cardName: string;
    setSlug: string;
    setName: string;
    collectorNumber: string;
    rarity: string;
    faction: string;
    tcgplayerPriceUsd: number | null;
    marketPriceUpdatedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function serializeProduct(product: ProductProfile): ProductView {
  const id = product._id.toString();
  return {
    id,
    name: product.name,
    type: product.type,
    game:
      product.game ??
      (product.riftbound ? "riftbound" : null),
    description: product.description,
    energyIds: product.energyIds ?? [],
    roleId: product.roleId ?? "",
    rarityId: product.rarityId ?? null,
    hashtags: product.hashtags ?? [],
    price:
      typeof product.riftbound?.tcgplayerPriceUsd === "number"
        ? (getTcgplayerReferencePrice(product.riftbound.tcgplayerPriceUsd) ??
          product.price)
        : product.price,
    stock: product.stock,
    imageUrl: product.imageContentType
      ? `/api/products/${id}/image?v=${product.updatedAt.getTime()}`
      : (product.imageUrl ?? ""),
    ...(product.riftbound
      ? {
          riftbound: {
            ...product.riftbound,
            marketPriceUpdatedAt:
              product.riftbound.marketPriceUpdatedAt.toISOString(),
          },
        }
      : {}),
    featured: product.featured,
    active: product.active,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export async function parseProductFormData(
  formData: FormData,
): Promise<{ data: ProductInput; image?: ProductImage } | { error: string }> {
  const priceValue = formData.get("price");
  const stockValue = formData.get("stock");
  const hashtagsValue = formData.get("hashtags");
  const parsed = parseProductInput({
    name: formData.get("name"),
    type: formData.get("type"),
    game: formData.get("game") || null,
    description: formData.get("description"),
    energyIds: parseEnergyIds(formData.get("energyIds")),
    roleId: formData.get("roleId") ?? "",
    rarityId:
      formData.get("rarityId") === ""
        ? null
        : formData.get("rarityId"),
    hashtags:
      typeof hashtagsValue === "string"
        ? hashtagsValue
            .split(",")
            .map((hashtag) => hashtag.trim())
            .filter(Boolean)
        : [],
    price: typeof priceValue === "string" ? Number(priceValue) : NaN,
    stock: typeof stockValue === "string" ? Number(stockValue) : NaN,
    featured: formData.get("featured") === "true",
    active: formData.get("active") === "true",
  });
  if ("error" in parsed) {
    return parsed;
  }

  const parsedImage = await parseUploadedImage(formData);
  if ("error" in parsedImage) {
    return parsedImage;
  }

  return {
    data: parsed.data,
    image: parsedImage.image,
  };
}

function parseEnergyIds(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

type ProductImage = UploadedImage;

function isProductType(value: unknown): value is ProductType {
  return value === "box" || value === "pack" || value === "card";
}

export function parseProductInput(
  value: unknown,
): { data: ProductInput } | { error: string } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { error: "Dữ liệu sản phẩm không hợp lệ." };
  }

  const body = value as Record<string, unknown>;
  if (
    typeof body.name !== "string" ||
    !isProductType(body.type) ||
    (body.game !== undefined &&
      body.game !== null &&
      !isProductGame(body.game)) ||
    typeof body.description !== "string" ||
    (body.energyIds !== undefined && !Array.isArray(body.energyIds)) ||
    (Array.isArray(body.energyIds) &&
    !body.energyIds.every(
      (energyId) => typeof energyId === "string" && /^[a-f\d]{24}$/i.test(energyId),
    )) ||
    (body.roleId !== undefined &&
      (typeof body.roleId !== "string" ||
        (body.roleId !== "" && !/^[a-f\d]{24}$/i.test(body.roleId)))) ||
    (body.rarityId !== undefined &&
      body.rarityId !== null &&
      (typeof body.rarityId !== "string" ||
        !/^[a-f\d]{24}$/i.test(body.rarityId))) ||
    !Array.isArray(body.hashtags) ||
    !body.hashtags.every((hashtag) => typeof hashtag === "string") ||
    typeof body.price !== "number" ||
    !Number.isSafeInteger(body.price) ||
    body.price < 1 ||
    typeof body.stock !== "number" ||
    !Number.isSafeInteger(body.stock) ||
    body.stock < 0 ||
    typeof body.featured !== "boolean" ||
    typeof body.active !== "boolean"
  ) {
    return { error: "Vui lòng kiểm tra lại thông tin sản phẩm." };
  }

  const name = body.name.trim();
  const description = body.description.trim();
  const energyIds = [
    ...new Set(Array.isArray(body.energyIds) ? (body.energyIds as string[]) : []),
  ];
  const roleId = typeof body.roleId === "string" ? body.roleId : "";
  const rarityId =
    body.type === "card" && typeof body.rarityId === "string"
      ? body.rarityId
      : null;
  const rawHashtags = (body.hashtags as string[])
    .map((hashtag) => hashtag.trim().replace(/^#+/, ""))
    .filter(Boolean);
  if (name.length < 2 || name.length > 120) {
    return { error: "Tên sản phẩm cần có từ 2 đến 120 ký tự." };
  }
  if (description.length > 1200) {
    return { error: "Mô tả sản phẩm không được vượt quá 1.200 ký tự." };
  }
  if (energyIds.length > 2) {
    return { error: "Mỗi sản phẩm chỉ được gắn tối đa 2 năng lượng." };
  }
  if (rawHashtags.length > 10) {
    return { error: "Mỗi sản phẩm có thể có tối đa 10 hashtag." };
  }
  if (
    rawHashtags.some(
      (hashtag) =>
        hashtag.length > 30 || !/^[\p{L}\p{N}_-]+$/u.test(hashtag),
    )
  ) {
    return {
      error: "Hashtag chỉ được chứa chữ cái, số, dấu gạch ngang hoặc gạch dưới (tối đa 30 ký tự).",
    };
  }
  const hashtags = [
    ...new Map(
      rawHashtags.map((hashtag) => [`#${hashtag.toLocaleLowerCase("vi")}`, `#${hashtag}`]),
    ).values(),
  ];
  return {
    data: {
      name,
      type: body.type,
      game: body.type === "card" && isProductGame(body.game) ? body.game : null,
      description,
      energyIds,
      roleId,
      rarityId,
      hashtags,
      price: body.price,
      stock: body.stock,
      featured: body.featured,
      active: body.active,
    },
  };
}
