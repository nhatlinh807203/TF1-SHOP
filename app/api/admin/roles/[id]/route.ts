import { revalidatePath } from "next/cache";
import { Binary, ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getAdminUserForApi } from "@/lib/auth";
import { getProductsCollection, getRolesCollection } from "@/lib/db";
import { MAX_IMAGE_UPLOAD_BYTES, parseUploadedImage } from "@/lib/image-upload";
import { parseRoleName, serializeRole } from "@/lib/roles";

interface RoleRouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RoleRouteContext) {
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Mã role không hợp lệ." },
      { status: 400 },
    );
  }

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

    const roles = await getRolesCollection();
    const role = await roles.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          name: name.name,
          updatedAt: new Date(),
          ...(parsedImage.image
            ? {
                imageData: new Binary(parsedImage.image.data),
                imageContentType: parsedImage.image.contentType,
              }
            : {}),
        },
      },
      { returnDocument: "after" },
    );
    if (!role) {
      return NextResponse.json(
        { message: "Không tìm thấy role." },
        { status: 404 },
      );
    }

    revalidatePath("/", "page");
    revalidatePath("/admin/roles", "page");
    revalidatePath("/admin/products", "page");
    return NextResponse.json({ role: serializeRole(role) });
  } catch (error) {
    console.error("Role update failed:", error);
    return NextResponse.json(
      { message: "Không thể cập nhật role lúc này. Vui lòng thử lại." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RoleRouteContext) {
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Mã role không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    if (!(await getAdminUserForApi())) {
      return NextResponse.json(
        { message: "Bạn cần đăng nhập bằng tài khoản quản trị." },
        { status: 401 },
      );
    }

    const products = await getProductsCollection();
    if (await products.countDocuments({ roleId: id })) {
      return NextResponse.json(
        {
          message:
            "Role đang được gán cho sản phẩm. Hãy gỡ khỏi sản phẩm trước khi xóa.",
        },
        { status: 409 },
      );
    }

    const roles = await getRolesCollection();
    const result = await roles.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Không tìm thấy role." },
        { status: 404 },
      );
    }

    revalidatePath("/", "page");
    revalidatePath("/admin/roles", "page");
    revalidatePath("/admin/products", "page");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Role deletion failed:", error);
    return NextResponse.json(
      { message: "Không thể xóa role lúc này. Vui lòng thử lại." },
      { status: 500 },
    );
  }
}
