import { revalidatePath } from "next/cache";
import { Binary, ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getAdminUserForApi } from "@/lib/auth";
import { getEnergiesCollection, getProductsCollection } from "@/lib/db";
import { parseEnergyName, serializeEnergy } from "@/lib/energies";
import { MAX_IMAGE_UPLOAD_BYTES, parseUploadedImage } from "@/lib/image-upload";

interface EnergyRouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: EnergyRouteContext) {
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Mã năng lượng không hợp lệ." },
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

    const name = parseEnergyName(formData.get("name"));
    if ("error" in name) {
      return NextResponse.json({ message: name.error }, { status: 400 });
    }
    const parsedImage = await parseUploadedImage(formData);
    if ("error" in parsedImage) {
      return NextResponse.json(
        { message: parsedImage.error },
        { status: 400 },
      );
    }

    const $set = {
      name: name.name,
      updatedAt: new Date(),
      ...(parsedImage.image
        ? {
            imageData: new Binary(parsedImage.image.data),
            imageContentType: parsedImage.image.contentType,
          }
        : {}),
    };
    const energies = await getEnergiesCollection();
    const energy = await energies.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set },
      { returnDocument: "after" },
    );
    if (!energy) {
      return NextResponse.json(
        { message: "Không tìm thấy năng lượng." },
        { status: 404 },
      );
    }

    revalidatePath("/", "page");
    revalidatePath("/admin", "page");
    return NextResponse.json({ energy: serializeEnergy(energy) });
  } catch (error) {
    console.error("Energy update failed:", error);
    return NextResponse.json(
      { message: "Không thể cập nhật năng lượng lúc này. Vui lòng thử lại." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: EnergyRouteContext) {
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Mã năng lượng không hợp lệ." },
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
    if (await products.countDocuments({ energyIds: id })) {
      return NextResponse.json(
        {
          message:
            "Năng lượng đang được gán cho sản phẩm. Hãy gỡ khỏi sản phẩm trước khi xóa.",
        },
        { status: 409 },
      );
    }

    const energies = await getEnergiesCollection();
    const result = await energies.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Không tìm thấy năng lượng." },
        { status: 404 },
      );
    }

    revalidatePath("/", "page");
    revalidatePath("/admin", "page");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Energy deletion failed:", error);
    return NextResponse.json(
      { message: "Không thể xóa năng lượng lúc này. Vui lòng thử lại." },
      { status: 500 },
    );
  }
}
