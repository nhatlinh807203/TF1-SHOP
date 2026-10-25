import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import { ArrowLeft, Gem, Sparkles } from "lucide-react";
import ProductPurchaseActions from "@/components/ProductPurchaseActions";
import {
  getEnergiesCollection,
  getProductsCollection,
  getRaritiesCollection,
  getRolesCollection,
  type ProductType,
} from "@/lib/db";

const productTypeLabels: Record<ProductType, string> = {
  box: "Box",
  pack: "Pack",
  card: "Thẻ bài",
};

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
    { _id: new ObjectId(id), active: true },
    { projection: { imageData: 0 } },
  );
  if (!product) {
    notFound();
  }

  const energyIds = (product.energyIds ?? []).filter((energyId) =>
    ObjectId.isValid(energyId),
  );
  const [energies, role, rarity] = await Promise.all([
    energyIds.length
      ? (
          await getEnergiesCollection()
        )
          .find(
            { _id: { $in: energyIds.map((energyId) => new ObjectId(energyId)) } },
            { projection: { imageData: 0 } },
          )
          .toArray()
      : [],
    product.roleId && ObjectId.isValid(product.roleId)
      ? (await getRolesCollection()).findOne(
          { _id: new ObjectId(product.roleId) },
          { projection: { imageData: 0 } },
        )
      : null,
    product.rarityId && ObjectId.isValid(product.rarityId)
      ? (await getRaritiesCollection()).findOne({
          _id: new ObjectId(product.rarityId),
        })
      : null,
  ]);
  const productId = product._id.toString();
  const imageUrl = product.imageContentType
    ? `/api/products/${productId}/image?v=${product.updatedAt.getTime()}`
    : (product.imageUrl ?? "");
  const roleImageUrl = role
    ? `/api/roles/${role._id.toString()}/image?v=${role.updatedAt.getTime()}`
    : "";

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
            {product.featured && (
              <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-[#d4a537] px-3 py-1.5 text-xs font-semibold text-[#211805]">
                <Sparkles className="h-3.5 w-3.5" />
                Sản phẩm nổi bật
              </span>
            )}
          </div>

          <div className="flex flex-col p-5 sm:p-8 lg:p-10">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#d9b754]">
              {productTypeLabels[product.type]}
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-5 text-3xl font-semibold text-[#e5bf62]">
              {new Intl.NumberFormat("vi-VN").format(product.price)} đ
            </p>
            <p
              className={`mt-3 text-sm ${
                product.stock > 0 ? "text-emerald-300" : "text-zinc-500"
              }`}
            >
              {product.stock > 0
                ? `Còn ${product.stock} sản phẩm`
                : "Hiện đã hết hàng"}
            </p>

            {product.description && (
              <div className="mt-7 border-t border-white/[0.08] pt-5">
                <h2 className="text-sm font-semibold text-zinc-200">
                  Mô tả sản phẩm
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-zinc-400">
                  {product.description}
                </p>
              </div>
            )}

            {(role || rarity || energies.length > 0) && (
              <dl className="mt-6 space-y-4 border-t border-white/[0.08] pt-5">
                {role && (
                  <div className="flex items-center gap-3">
                    <dt className="w-24 shrink-0 text-xs text-zinc-500">
                      Role
                    </dt>
                    <dd className="flex items-center gap-2 text-sm text-zinc-200">
                      <span
                        aria-hidden="true"
                        className="h-8 w-8 rounded-full bg-cover bg-center"
                        style={{ backgroundImage: `url("${roleImageUrl}")` }}
                      />
                      {role.name}
                    </dd>
                  </div>
                )}
                {rarity && (
                  <div className="flex items-center gap-3">
                    <dt className="w-24 shrink-0 text-xs text-zinc-500">
                      Độ hiếm
                    </dt>
                    <dd className="text-sm text-amber-200">{rarity.name}</dd>
                  </div>
                )}
                {energies.length > 0 && (
                  <div className="flex items-start gap-3">
                    <dt className="w-24 shrink-0 pt-1 text-xs text-zinc-500">
                      Năng lượng
                    </dt>
                    <dd className="flex flex-wrap gap-2">
                      {energies.map((energy) => (
                        <span
                          key={energy._id.toString()}
                          className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] py-1 pl-1 pr-3 text-xs text-zinc-200"
                        >
                          <span
                            aria-hidden="true"
                            className="h-7 w-7 rounded-full bg-cover bg-center"
                            style={{
                              backgroundImage: `url("/api/energies/${energy._id.toString()}/image?v=${energy.updatedAt.getTime()}")`,
                            }}
                          />
                          {energy.name}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            )}

            {(product.hashtags ?? []).length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {product.hashtags?.map((hashtag) => (
                  <span
                    key={hashtag}
                    className="rounded-full bg-white/[0.05] px-3 py-1.5 text-xs text-zinc-400"
                  >
                    {hashtag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-auto pt-8">
              <ProductPurchaseActions
                product={{
                  id: productId,
                  name: product.name,
                  imageUrl,
                  price: product.price,
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
