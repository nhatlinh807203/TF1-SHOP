import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAdminUserForApi } from "@/lib/auth";
import { getRaritiesCollection } from "@/lib/db";
import { parseRarityName, serializeRarity } from "@/lib/rarities";

export async function POST(request: Request) {
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
    const now = new Date();
    const result = await rarities.insertOne({
      name: parsed.name,
      createdAt: now,
      updatedAt: now,
    });
    const rarity = await rarities.findOne({ _id: result.insertedId });
    if (!rarity) {
      throw new Error("Created rarity could not be read back.");
    }

    revalidatePath("/admin", "page");
    return NextResponse.json(
      { rarity: serializeRarity(rarity) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Rarity creation failed:", error);
    return NextResponse.json(
      { message: "Không thể tạo độ hiếm lúc này. Vui lòng thử lại." },
      { status: 500 },
    );
  }
}
