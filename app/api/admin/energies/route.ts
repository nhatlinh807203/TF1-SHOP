import { revalidatePath } from "next/cache";
import { Binary } from "mongodb";
import { NextResponse } from "next/server";
import { getAdminUserForApi } from "@/lib/auth";
import { serializeEnergy, parseEnergyName } from "@/lib/energies";
import { getEnergiesCollection } from "@/lib/db";
import { MAX_IMAGE_UPLOAD_BYTES, parseUploadedImage } from "@/lib/image-upload";

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
    if (!parsedImage.image) {
      return NextResponse.json(
        { message: "Vui lòng chọn ảnh cho năng lượng." },
        { status: 400 },
      );
    }

    const energies = await getEnergiesCollection();
    const now = new Date();
    const result = await energies.insertOne({
      name: name.name,
      imageData: new Binary(parsedImage.image.data),
      imageContentType: parsedImage.image.contentType,
      createdAt: now,
      updatedAt: now,
    });
    const energy = await energies.findOne({ _id: result.insertedId });
    if (!energy) {
      throw new Error("Created energy could not be read back.");
    }

    revalidatePath("/", "page");
    revalidatePath("/admin", "page");
    return NextResponse.json({ energy: serializeEnergy(energy) }, { status: 201 });
  } catch (error) {
    console.error("Energy creation failed:", error);
    return NextResponse.json(
      { message: "Không thể tạo năng lượng lúc này. Vui lòng thử lại." },
      { status: 500 },
    );
  }
}
