import type { RarityDocument } from "@/lib/db";

export interface RarityView {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export function serializeRarity(
  rarity: RarityDocument & { _id: { toString(): string } },
): RarityView {
  return {
    id: rarity._id.toString(),
    name: rarity.name,
    createdAt: rarity.createdAt.toISOString(),
    updatedAt: rarity.updatedAt.toISOString(),
  };
}

export function parseRarityName(value: FormDataEntryValue | null):
  | { name: string }
  | { error: string } {
  if (typeof value !== "string") {
    return { error: "Vui lòng nhập tên độ hiếm." };
  }
  const name = value.trim();
  if (name.length < 1 || name.length > 60) {
    return { error: "Tên độ hiếm cần có từ 1 đến 60 ký tự." };
  }
  return { name };
}
