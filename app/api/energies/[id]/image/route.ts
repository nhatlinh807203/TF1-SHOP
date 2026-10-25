import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getEnergiesCollection } from "@/lib/db";

interface EnergyImageRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  context: EnergyImageRouteContext,
) {
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Mã năng lượng không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    const energies = await getEnergiesCollection();
    const energy = await energies.findOne(
      { _id: new ObjectId(id) },
      { projection: { imageData: 1, imageContentType: 1 } },
    );
    if (!energy) {
      return NextResponse.json(
        { message: "Không tìm thấy ảnh năng lượng." },
        { status: 404 },
      );
    }

    const imageData = energy.imageData.value();
    return new NextResponse(new Uint8Array(imageData), {
      headers: {
        "Content-Type": energy.imageContentType,
        "Content-Length": String(imageData.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Energy image retrieval failed:", error);
    return NextResponse.json(
      { message: "Không thể tải ảnh năng lượng lúc này." },
      { status: 500 },
    );
  }
}
