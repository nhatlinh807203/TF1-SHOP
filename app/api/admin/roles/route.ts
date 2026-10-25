import { revalidatePath } from "next/cache";
import { Binary } from "mongodb";
import { NextResponse } from "next/server";
import { getAdminUserForApi } from "@/lib/auth";
import { getRolesCollection } from "@/lib/db";
import { MAX_IMAGE_UPLOAD_BYTES, parseUploadedImage } from "@/lib/image-upload";
import { parseRoleName, serializeRole } from "@/lib/roles";

export async function POST(request: Request) {
  try {
    if (!(await getAdminUserForApi())) {
      return NextResponse.json(
        { message: "Bạn cần đăng nhập bằng tài khoản quản trị." },
        { status: 401 },
      );
    }
    if (
      Number(request.headers.get("content-length")) >
      MAX_IMAGE_UPLOAD_BYTES + 64 * 1024
    ) {
      return NextResponse.json(
        { message: "Tệp tải lên không được vượt quá 5 MB." },
        { status: 413 },
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { message: "Dữ liệu gửi lên không hợp lệ." },
        { status: 400 },
      );
    }

    const name = parseRoleName(formData.get("name"));
    if ("error" in name) {
      return NextResponse.json({ message: name.error }, { status: 400 });
    }
    const parsedImage = await parseUploadedImage(formData);
    if ("error" in parsedImage) {
      return NextResponse.json({ message: parsedImage.error }, { status: 400 });
    }
    if (!parsedImage.image) {
      return NextResponse.json(
        { message: "Vui lòng chọn ảnh cho role." },
        { status: 400 },
      );
    }

    const roles = await getRolesCollection();
    const now = new Date();
    const result = await roles.insertOne({
      name: name.name,
      imageData: new Binary(parsedImage.image.data),
      imageContentType: parsedImage.image.contentType,
      createdAt: now,
      updatedAt: now,
    });
    const role = await roles.findOne({ _id: result.insertedId });
    if (!role) {
      throw new Error("Created role could not be read back.");
    }

    revalidatePath("/", "page");
    revalidatePath("/admin/roles", "page");
    revalidatePath("/admin/products", "page");
    return NextResponse.json({ role: serializeRole(role) }, { status: 201 });
  } catch (error) {
    console.error("Role creation failed:", error);
    return NextResponse.json(
      { message: "Không thể tạo role lúc này. Vui lòng thử lại." },
      { status: 500 },
    );
  }
}
