import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getRolesCollection } from "@/lib/db";

interface RoleImageRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RoleImageRouteContext) {
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Mã role không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    const roles = await getRolesCollection();
    const role = await roles.findOne(
      { _id: new ObjectId(id) },
      { projection: { imageData: 1, imageContentType: 1 } },
    );
    if (!role) {
      return NextResponse.json(
        { message: "Không tìm thấy ảnh role." },
        { status: 404 },
      );
    }

    const imageData = role.imageData.value();
    return new NextResponse(new Uint8Array(imageData), {
      headers: {
        "Content-Type": role.imageContentType,
        "Content-Length": String(imageData.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Role image retrieval failed:", error);
    return NextResponse.json(
      { message: "Không thể tải ảnh role lúc này." },
      { status: 500 },
    );
  }
}
