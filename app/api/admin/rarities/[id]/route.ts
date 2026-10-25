import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getAdminUserForApi } from "@/lib/auth";
import { getProductsCollection, getRaritiesCollection } from "@/lib/db";
import { parseRarityName, serializeRarity } from "@/lib/rarities";

interface RarityRouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RarityRouteContext) {
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Mã độ hiếm không hợp lệ." },
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

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { message: "Dữ liệu gửi lên không hợp lệ." },
        { status: 400 },
      );
    }

    const parsed = parseRarityName(formData.get("name"));
    if ("error" in parsed) {
      return NextResponse.json({ message: parsed.error }, { status: 400 });
    }

    const rarities = await getRaritiesCollection();
    const rarity = await rarities.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { name: parsed.name, updatedAt: new Date() } },
      { returnDocument: "after" },
    );
    if (!rarity) {
      return NextResponse.json(
        { message: "Không tìm thấy độ hiếm." },
        { status: 404 },
      );
    }

    revalidatePath("/admin", "page");
    return NextResponse.json({ rarity: serializeRarity(rarity) });
  } catch (error) {
    console.error("Rarity update failed:", error);
    return NextResponse.json(
      { message: "Không thể cập nhật độ hiếm lúc này. Vui lòng thử lại." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RarityRouteContext) {
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Mã độ hiếm không hợp lệ." },
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
    if (await products.countDocuments({ rarityId: id })) {
      return NextResponse.json(
        {
          message:
            "Độ hiếm đang được gán cho thẻ bài. Hãy gỡ khỏi thẻ trước khi xóa.",
        },
        { status: 409 },
      );
    }

    const rarities = await getRaritiesCollection();
    const result = await rarities.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Không tìm thấy độ hiếm." },
        { status: 404 },
      );
    }

    revalidatePath("/admin", "page");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Rarity deletion failed:", error);
    return NextResponse.json(
      { message: "Không thể xóa độ hiếm lúc này. Vui lòng thử lại." },
      { status: 500 },
    );
  }
}
