import { revalidatePath } from "next/cache";
import { Binary, ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getAdminUserForApi } from "@/lib/auth";
import {
  getEnergiesCollection,
  getProductsCollection,
  getRaritiesCollection,
  getRolesCollection,
} from "@/lib/db";
import { MAX_IMAGE_UPLOAD_BYTES } from "@/lib/image-upload";
import {
  parseProductFormData,
  serializeProduct,
} from "@/lib/products";

interface ProductRouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: ProductRouteContext) {
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Mã sản phẩm không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    const admin = await getAdminUserForApi();
    if (!admin) {
      return NextResponse.json(
        { message: "Bạn cần đăng nhập bằng tài khoản quản trị." },
        { status: 401 },
      );
    }

    const contentLength = Number(request.headers.get("content-length"));
    if (contentLength > MAX_IMAGE_UPLOAD_BYTES + 64 * 1024) {
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

    const parsed = await parseProductFormData(formData);
    if ("error" in parsed) {
      return NextResponse.json({ message: parsed.error }, { status: 400 });
    }

    const energies = await getEnergiesCollection();
    const existingEnergyCount = await energies.countDocuments({
      _id: { $in: parsed.data.energyIds.map((energyId) => new ObjectId(energyId)) },
    });
    if (existingEnergyCount !== parsed.data.energyIds.length) {
      return NextResponse.json(
        { message: "Một hoặc nhiều năng lượng đã chọn không còn tồn tại." },
        { status: 400 },
      );
    }
    const roles = await getRolesCollection();
    if (
      parsed.data.roleId &&
      !(await roles.countDocuments({ _id: new ObjectId(parsed.data.roleId) }))
    ) {
      return NextResponse.json(
        { message: "Role đã chọn không còn tồn tại." },
        { status: 400 },
      );
    }
    if (parsed.data.rarityId) {
      const rarities = await getRaritiesCollection();
      if (!(await rarities.countDocuments({ _id: new ObjectId(parsed.data.rarityId) }))) {
        return NextResponse.json(
          { message: "Độ hiếm đã chọn không còn tồn tại." },
          { status: 400 },
        );
      }
    }

    const products = await getProductsCollection();
    const existingProduct = await products.findOne(
      { _id: new ObjectId(id) },
      { projection: { imageContentType: 1, imageUrl: 1 } },
    );
    if (!existingProduct) {
      return NextResponse.json(
        { message: "Không tìm thấy sản phẩm." },
        { status: 404 },
      );
    }
    if (
      parsed.data.featured &&
      !parsed.image &&
      !existingProduct.imageContentType &&
      !existingProduct.imageUrl
    ) {
      return NextResponse.json(
        {
          message:
            "Vui lòng tải ảnh sản phẩm lên trước khi bật hiển thị nổi bật.",
        },
        { status: 400 },
      );
    }
    const result = await products.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...parsed.data,
          ...(parsed.image
            ? {
                imageData: new Binary(parsed.image.data),
                imageContentType: parsed.image.contentType,
                imageUrl: "",
              }
            : {}),
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );
    if (!result) {
      return NextResponse.json(
        { message: "Không tìm thấy sản phẩm." },
        { status: 404 },
      );
    }

    revalidatePath("/", "page");
    revalidatePath("/admin", "page");
    return NextResponse.json({ product: serializeProduct(result) });
  } catch (error) {
    console.error("Product update failed:", error);
    return NextResponse.json(
      { message: "Không thể cập nhật sản phẩm lúc này. Vui lòng thử lại." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: ProductRouteContext) {
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Mã sản phẩm không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    const admin = await getAdminUserForApi();
    if (!admin) {
      return NextResponse.json(
        { message: "Bạn cần đăng nhập bằng tài khoản quản trị." },
        { status: 401 },
      );
    }

    const products = await getProductsCollection();
    const result = await products.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Không tìm thấy sản phẩm." },
        { status: 404 },
      );
    }

    revalidatePath("/", "page");
    revalidatePath("/admin", "page");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Product deletion failed:", error);
    return NextResponse.json(
      { message: "Không thể xóa sản phẩm lúc này. Vui lòng thử lại." },
      { status: 500 },
    );
  }
}
