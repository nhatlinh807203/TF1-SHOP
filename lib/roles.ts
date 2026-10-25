import type { RoleDocument } from "@/lib/db";

export interface RoleView {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export function serializeRole(
  role: RoleDocument & { _id: { toString(): string } },
): RoleView {
  const id = role._id.toString();
  return {
    id,
    name: role.name,
    imageUrl: `/api/roles/${id}/image?v=${role.updatedAt.getTime()}`,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  };
}

export function parseRoleName(value: FormDataEntryValue | null):
  | { name: string }
  | { error: string } {
  if (typeof value !== "string") {
    return { error: "Vui lòng nhập tên role." };
  }
  const name = value.trim();
  if (name.length < 1 || name.length > 60) {
    return { error: "Tên role cần có từ 1 đến 60 ký tự." };
  }
  return { name };
}
