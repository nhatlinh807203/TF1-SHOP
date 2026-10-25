import type { EnergyDocument } from "@/lib/db";

export interface EnergyView {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export function serializeEnergy(
  energy: EnergyDocument & { _id: { toString(): string } },
): EnergyView {
  const id = energy._id.toString();
  return {
    id,
    name: energy.name,
    imageUrl: `/api/energies/${id}/image?v=${energy.updatedAt.getTime()}`,
    createdAt: energy.createdAt.toISOString(),
    updatedAt: energy.updatedAt.toISOString(),
  };
}

export function parseEnergyName(value: FormDataEntryValue | null):
  | { name: string }
  | { error: string } {
  if (typeof value !== "string") {
    return { error: "Vui lòng nhập tên năng lượng." };
  }
  const name = value.trim();
  if (name.length < 1 || name.length > 60) {
    return { error: "Tên năng lượng cần có từ 1 đến 60 ký tự." };
  }
  return { name };
}
