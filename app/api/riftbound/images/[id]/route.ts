interface RiftboundImageRouteContext {
  params: Promise<{ id: string }>;
}

const maxImageBytes = 8 * 1024 * 1024;
const imageIdPattern = /^(?:rft_[a-f0-9]{32,128}|[a-f0-9]{64})$/i;

export async function GET(
  _request: Request,
  context: RiftboundImageRouteContext,
) {
  const { id } = await context.params;
  if (!imageIdPattern.test(id)) {
    return Response.json({ message: "Mã ảnh không hợp lệ." }, { status: 400 });
  }

  const apiKey = process.env.POKEWALLET_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      { message: "Chưa cấu hình POKEWALLET_API_KEY." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(
      `https://api.pokewallet.io/rft/images/${encodeURIComponent(id)}`,
      {
        headers: {
          Accept: "image/*",
          "X-Image-Size": "unsized",
          "X-API-Key": apiKey,
        },
        next: { revalidate: 86_400 },
        signal: AbortSignal.timeout(20_000),
      },
    );
    if (!response.ok) {
      return Response.json(
        { message: `PokéWallet images trả về HTTP ${response.status}.` },
        { status: response.status === 404 ? 404 : 502 },
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      return Response.json(
        { message: "PokéWallet không trả về dữ liệu ảnh hợp lệ." },
        { status: 502 },
      );
    }
    const contentLength = Number(response.headers.get("content-length"));
    if (contentLength > maxImageBytes) {
      return Response.json(
        { message: "Ảnh PokéWallet vượt quá giới hạn kích thước." },
        { status: 413 },
      );
    }

    const image = await response.arrayBuffer();
    if (image.byteLength > maxImageBytes) {
      return Response.json(
        { message: "Ảnh PokéWallet vượt quá giới hạn kích thước." },
        { status: 413 },
      );
    }

    return new Response(image, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(image.byteLength),
        "Cache-Control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Riftbound image proxy failed:", error);
    return Response.json(
      { message: "Không thể tải ảnh Riftbound từ PokéWallet lúc này." },
      { status: 502 },
    );
  }
}
