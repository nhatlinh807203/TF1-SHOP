import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import { ArrowLeft, Gem } from "lucide-react";
import ProductPurchaseActions from "@/components/ProductPurchaseActions";
import RiftboundCardMetadata from "@/components/RiftboundCardMetadata";
import { getProductsCollection } from "@/lib/db";
import { getTcgplayerReferencePrice } from "@/lib/tcgplayer-pricing";

interface ProductDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailsPage({
  params,
}: ProductDetailsPageProps) {
  return (
    <Suspense
      fallback={
        <main className="min-h-[60vh] bg-[#090b0c] px-4 py-16 text-center text-sm text-zinc-400">
          Đang tải thông tin sản phẩm...
        </main>
      }
    >
      <ProductDetailsContent params={params} />
    </Suspense>
  );
}

async function ProductDetailsContent({
  params,
}: ProductDetailsPageProps) {
  await connection();
  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    notFound();
  }

  const product = await (
    await getProductsCollection()
  ).findOne(
    { _id: new ObjectId(id), active: true, type: "card" },
    { projection: { imageData: 0 } },
  );
  if (!product) {
    notFound();
  }

  const productId = product._id.toString();
  const imageUrl = product.imageContentType
    ? `/api/products/${productId}/image?v=${product.updatedAt.getTime()}`
    : (product.imageUrl ?? "");
  const referencePrice = product.riftbound
    ? (getTcgplayerReferencePrice(
        product.riftbound.tcgplayerPriceUsd ?? NaN,
      ) ?? product.price)
    : product.price;
  return (
    <main className="min-h-[60vh] bg-[#090b0c] px-4 py-10 text-white sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/#danh-muc"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-[#efd486]"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại cửa hàng
        </Link>

        <article className="mt-6 grid overflow-hidden rounded-3xl border border-white/[0.08] bg-[#101314] lg:grid-cols-2">
          <div className="relative flex min-h-[420px] items-center justify-center bg-[#151413] p-5 sm:min-h-[600px] sm:p-8">
            {imageUrl ? (
              <div
                role="img"
                aria-label={product.name}
                className="absolute inset-5 bg-contain bg-center bg-no-repeat sm:inset-8"
                style={{ backgroundImage: `url("${imageUrl}")` }}
              />
            ) : (
              <Gem className="h-16 w-16 text-[#d9b754]/50" />
            )}
          </div>

          <div className="flex flex-col p-5 sm:p-8 lg:p-10">
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">
              {product.name}
            </h1>
            <div className="mt-5 rounded-xl border border-cyan-100/15 bg-cyan-100/[0.04] p-4">
              <p className="text-sm font-medium text-cyan-100">
                Giá tham khảo{product.riftbound ? " TCGplayer" : ""}:{" "}
                <span className="text-lg font-semibold">
                  {typeof product.riftbound?.tcgplayerPriceUsd === "number"
                    ? `$${product.riftbound.tcgplayerPriceUsd.toFixed(2)} USD`
                    : `${new Intl.NumberFormat("vi-VN").format(referencePrice)} đ`}
                </span>
              </p>
              <p className="mt-1 text-sm leading-6 text-zinc-400">
                Giá cuối cùng sẽ được cửa hàng xác nhận khi trao đổi.
              </p>
            </div>
            <RiftboundCardMetadata
              stock={product.stock}
              riftbound={product.riftbound}
            />
            <div className="mt-5">
              <ProductPurchaseActions
                product={{
                  id: productId,
                  name: product.name,
                  imageUrl,
                  price: referencePrice,
                  stock: product.stock,
                }}
              />
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
