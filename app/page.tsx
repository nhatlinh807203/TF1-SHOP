import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Boxes,
  Gem,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import ProductPurchaseActions from "@/components/ProductPurchaseActions";
import RiftboundCardMetadata from "@/components/RiftboundCardMetadata";
import { getProductsCollection } from "@/lib/db";
import { productGames } from "@/lib/product-games";
import { getTcgplayerReferencePrice } from "@/lib/tcgplayer-pricing";

const collections = [
  {
    id: "the-bai-don",
    href: "#danh-muc",
    number: "01",
    title: "Thẻ bài đơn",
    description: "Tìm lá bài bạn đang thiếu, chọn đúng phiên bản và tình trạng.",
    label: "SINGLE CARDS",
    icon: Gem,
    style: "from-[#193238] via-[#152327] to-[#101619]",
    glow: "bg-cyan-300/20",
  },
  {
    id: "bo-suu-tap",
    href: "#danh-muc",
    number: "02",
    title: "Bộ sưu tập",
    description: "Khám phá những lá bài hiếm dành cho góc trưng bày của bạn.",
    label: "COLLECTOR",
    icon: Sparkles,
    style: "from-[#302b1d] via-[#24231e] to-[#121715]",
    glow: "bg-[#e2bb52]/20",
  },
  {
    id: "bo-bai",
    href: "/decks",
    number: "03",
    title: "Bộ bài",
    description: "Chuẩn bị bộ bài của bạn và sẵn sàng cho ván đấu tiếp theo.",
    label: "READY TO PLAY",
    icon: Boxes,
    style: "from-[#202d31] via-[#192226] to-[#101619]",
    glow: "bg-cyan-300/15",
  },
];

const assurances = [
  {
    icon: ShieldCheck,
    title: "Chọn lọc cẩn thận",
    text: "Thông tin sản phẩm rõ ràng",
    accent: "text-cyan-200",
  },
  {
    icon: PackageCheck,
    title: "Đóng gói an toàn",
    text: "Nâng niu từng lá bài",
    accent: "text-[#e2bb52]",
  },
  {
    icon: Truck,
    title: "Giao hàng toàn quốc",
    text: "Đồng hành đến tận tay",
    accent: "text-cyan-200",
  },
  {
    icon: BadgeCheck,
    title: "Hỗ trợ tận tâm",
    text: "Luôn sẵn sàng giải đáp",
    accent: "text-[#e2bb52]",
  },
];

async function FeaturedArtwork() {
  await connection();
  const products = await (
    await getProductsCollection()
  )
    .find(
      {
        featured: true,
        active: true,
        type: "card",
        stock: { $gt: 0 },
        $or: [
          { imageContentType: { $exists: true, $ne: "" } },
          { imageUrl: { $exists: true, $ne: "" } },
        ],
      },
      { projection: { imageData: 0 } },
    )
    .sort({ updatedAt: -1 })
    .limit(7)
    .toArray();
  const artworkPositions = [
    { right: "9%", top: "36%", rotate: 12 },
    { right: "22%", top: "24%", rotate: -12 },
    { right: "35%", top: "42%", rotate: 7 },
    { right: "48%", top: "29%", rotate: -7 },
    { right: "61%", top: "43%", rotate: 11 },
    { right: "31%", top: "68%", rotate: -8 },
    { right: "53%", top: "68%", rotate: 6 },
  ];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute -right-64 top-1/2 h-[42rem] w-[42rem] -translate-y-1/2 rounded-full border border-cyan-100/[0.08] sm:-right-40 lg:right-[-5rem]">
        <div className="hv-orbit absolute inset-9 rounded-full border border-cyan-100/[0.08]">
          <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-[#12c6df] shadow-[0_0_22px_5px_rgba(18,198,223,0.38)]" />
        </div>
        <div className="absolute inset-20 rounded-full border border-orange-200/[0.08]" />
        <div className="absolute inset-32 rounded-full bg-cyan-400/[0.08] blur-3xl" />
      </div>
      <div className="pointer-events-none absolute right-[5%] top-1/2 z-[2] hidden h-[min(36rem,92%)] w-[min(29rem,45vw)] -translate-y-1/2 sm:block lg:w-[min(40rem,48vw)]">
        <Image
          src="/images/yasuo-final.png"
          alt=""
          width={735}
          height={509}
          sizes="(max-width: 640px) 0px, (max-width: 1024px) 45vw, 29rem"
          className="hv-yasuo-art h-full w-full object-contain"
        />
      </div>
      {products.map((product, index) => {
        const productId = product._id.toString();
        const imageUrl = product.imageContentType
          ? `/api/products/${productId}/image?v=${product.updatedAt.getTime()}`
          : (product.imageUrl ?? "");
          const position = artworkPositions[index];

        return (
          <div
            key={productId}
            role="img"
            aria-label={product.name}
            className="hv-card-float absolute hidden aspect-[5/7] w-28 overflow-hidden rounded-xl border border-white/20 bg-[#202020] bg-contain bg-center bg-no-repeat shadow-[0_32px_70px_-24px_rgba(0,0,0,0.95)] transition duration-500 sm:block sm:w-36 lg:w-44"
            style={{
              backgroundImage: `url("${imageUrl}")`,
              right: position.right,
              top: position.top,
              transform: `rotate(${position.rotate}deg)`,
              animationDelay: `${index * -0.65}s`,
              zIndex: products.length - index,
            }}
          />
        );
      })}
      <div className="absolute right-[8%] top-[20%] h-2 w-2 rounded-full bg-[#e2bb52] shadow-[0_0_20px_5px_rgba(226,187,82,0.4)]" />
      <div className="absolute right-[37%] top-[67%] h-1.5 w-1.5 rounded-full bg-cyan-200/80 shadow-[0_0_18px_4px_rgba(165,236,231,0.35)]" />
    </div>
  );
}

async function HomeFeaturedProducts() {
  await connection();
  const products = await (
    await getProductsCollection()
  )
    .find(
      {
        featured: true,
        active: true,
        type: "card",
        stock: { $gt: 0 },
        $or: [
          { imageContentType: { $exists: true, $ne: "" } },
          { imageUrl: { $exists: true, $ne: "" } },
        ],
      },
      { projection: { imageData: 0 } },
    )
    .sort({ updatedAt: -1 })
    .limit(7)
    .toArray();

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 w-full max-w-2xl">
      <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] text-cyan-200">
        <Sparkles className="h-3.5 w-3.5" />
        SẢN PHẨM NỔI BẬT
      </p>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {products.map((product) => {
          const productId = product._id.toString();
          const imageUrl = product.imageContentType
            ? `/api/products/${productId}/image?v=${product.updatedAt.getTime()}`
            : (product.imageUrl ?? "");

          return (
            <Link
              key={productId}
              href={`/products/${productId}`}
              title={product.name}
              className="group w-[76px] shrink-0 sm:w-[84px]"
            >
              <div className="relative aspect-[5/7] overflow-hidden rounded-lg border border-white/[0.12] bg-[#202020] p-1 transition group-hover:border-cyan-300/60 group-hover:shadow-[0_0_24px_rgba(18,198,223,0.12)]">
                {imageUrl ? (
                  <div
                    role="img"
                    aria-label={product.name}
                    className="absolute inset-1 bg-contain bg-center bg-no-repeat transition duration-300 group-hover:scale-[1.03]"
                    style={{ backgroundImage: `url("${imageUrl}")` }}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-1 text-cyan-200/70">
                    <Gem className="h-5 w-5" />
                    <span className="text-center text-[8px]">
                      Chưa có ảnh
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-1.5 min-w-0">
                <p className="truncate text-[9px] font-medium text-zinc-100">
                  {product.name}
                </p>
                <p className="mt-0.5 truncate text-[8px] text-cyan-100">
                  Giá tham khảo{product.riftbound ? " TCGplayer" : ""}:{" "}
                  {typeof product.riftbound?.tcgplayerPriceUsd === "number"
                    ? `$${product.riftbound.tcgplayerPriceUsd.toFixed(2)} USD`
                    : `${new Intl.NumberFormat("vi-VN").format(product.price)} đ`}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

async function HomeProductCatalog() {
  await connection();
  const products = await (
    await getProductsCollection()
  )
    .find(
      { active: true, type: "card", stock: { $gt: 0 } },
      { projection: { imageData: 0 } },
    )
    .sort({ updatedAt: -1 })
    .toArray();

  if (products.length === 0) {
    return (
      <div className="mt-9 rounded-2xl border border-dashed border-white/[0.1] bg-[#202020] px-6 py-12 text-center">
        <Gem className="mx-auto h-8 w-8 text-cyan-200/60" />
        <p className="mt-4 font-medium text-zinc-200">
          Sản phẩm đang được cập nhật
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Các sản phẩm mới sẽ xuất hiện tại đây.
        </p>
      </div>
    );
  }

  const gameGroups = productGames.flatMap((game) => {
    const gameProducts = products.filter(
      (product) =>
        (product.game ?? (product.riftbound ? "riftbound" : null)) === game.id,
    );
    return gameProducts.length
      ? [{ id: game.id, name: game.name, products: gameProducts }]
      : [];
  });
  const otherProducts = products.filter(
    (product) =>
      !productGames.some(
        (game) =>
          (product.game ?? (product.riftbound ? "riftbound" : null)) ===
          game.id,
      ),
  );
  const productGroups = [
    ...gameGroups,
    ...(otherProducts.length
      ? [{ id: "other", name: "Sản phẩm khác", products: otherProducts }]
      : []),
  ];

  return (
    <div className="mt-9 space-y-10">
      {productGroups.map((group) => (
        <section key={group.id} id={`game-${group.id}`}>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-white sm:text-2xl">
                {group.name}
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                {group.products.length} sản phẩm đang có hàng
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {group.products.map((product) => {
        const productId = product._id.toString();
        const imageUrl = product.imageContentType
          ? `/api/products/${productId}/image?v=${product.updatedAt.getTime()}`
          : (product.imageUrl ?? "");
        return (
          <article
            key={productId}
            className="hv-interactive-card flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#151d21] shadow-[0_14px_50px_-30px_rgba(0,0,0,0.8)] sm:rounded-2xl"
          >
            <Link
              href={`/products/${productId}`}
              className="relative block aspect-[5/7] overflow-hidden border border-white/[0.04] bg-[#1c1c1c] p-2"
              aria-label={`Xem chi tiết ${product.name}`}
            >
              {imageUrl ? (
                <div
                  role="img"
                  aria-label={product.name}
                  className="absolute inset-2 bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: `url("${imageUrl}")` }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-cyan-100/50">
                  <Gem className="h-10 w-10" />
                </div>
              )}
            </Link>

            <div className="flex flex-1 flex-col p-2.5 sm:p-3 lg:p-4">
              <div className="min-w-0">
                <h3 className="line-clamp-2 min-h-9 break-words text-xs font-medium text-zinc-100 sm:min-h-10 sm:text-sm">
                  <Link
                    href={`/products/${productId}`}
                    className="transition hover:text-cyan-100"
                  >
                  {product.name}
                  </Link>
                </h3>
              </div>
              <p className="mt-2 text-xs leading-5 text-cyan-100/80">
                Giá tham khảo{product.riftbound ? " TCGplayer" : ""}:{" "}
                {typeof product.riftbound?.tcgplayerPriceUsd === "number"
                  ? `$${product.riftbound.tcgplayerPriceUsd.toFixed(2)} USD`
                  : `${new Intl.NumberFormat("vi-VN").format(product.price)} đ`}
              </p>
              <RiftboundCardMetadata
                compact
                stock={product.stock}
                riftbound={product.riftbound}
              />
              <div className="mt-auto pt-3">
                <ProductPurchaseActions
                  compact
                  accent="holovault"
                  product={{
                    id: productId,
                    name: product.name,
                    imageUrl,
                    price: product.riftbound
                      ? (getTcgplayerReferencePrice(
                          product.riftbound.tcgplayerPriceUsd ?? NaN,
                        ) ?? product.price)
                      : product.price,
                    stock: product.stock,
                  }}
                />
              </div>
            </div>
          </article>
        );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="overflow-hidden bg-[#0b0f12] text-white">
      <section className="relative isolate min-h-[620px] border-b border-white/[0.08] sm:min-h-[680px] lg:min-h-[740px]">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_78%_48%,rgba(18,198,223,0.16),transparent_31%),radial-gradient(ellipse_at_89%_72%,rgba(226,187,82,0.08),transparent_25%),linear-gradient(115deg,#0b0f12_0%,#10171a_52%,#111619_100%)]" />
        <div className="home-grid absolute inset-0 -z-10 opacity-20" />
        <Suspense fallback={null}>
          <FeaturedArtwork />
        </Suspense>
        <div className="relative mx-auto flex min-h-[620px] max-w-7xl items-center px-5 py-14 sm:min-h-[680px] sm:px-8 sm:py-16 lg:min-h-[740px] lg:px-10">
          <div className="hv-rise-in relative z-10 max-w-2xl lg:max-w-[52%]">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-cyan-100/15 bg-white/[0.04] px-3.5 py-2 text-[10px] font-semibold tracking-[0.2em] text-zinc-200 shadow-[0_8px_30px_rgba(0,0,0,0.16)] sm:text-xs">
              <span className="h-2 w-2 rounded-full bg-[#12c6df] shadow-[0_0_12px_3px_rgba(18,198,223,0.35)]" />
              HOLOVAULT <span className="text-zinc-600">/</span> TCG SHOP
            </div>
            <h1 className="mt-7 max-w-2xl font-sans text-[clamp(2.25rem,8vw,3.8rem)] font-black leading-[0.98] tracking-[-0.065em] text-white sm:mt-8 lg:text-6xl xl:text-7xl 2xl:text-[5rem]">
              Tìm lá bài.
              <br />
              Xây chiến thuật.
              <span className="mt-1 block bg-gradient-to-r from-[#64e6f4] via-[#36cde0] to-[#e2bb52] bg-clip-text text-transparent">
                Sưu tầm đam mê.
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-7 text-zinc-300/75 sm:mt-7 sm:text-base sm:leading-8">
              Lá bài phù hợp để hoàn thiện deck, mảnh ghép hiếm cho bộ sưu tập —
              bắt đầu hành trình của bạn tại Holovault.
            </p>
            <Suspense fallback={null}>
              <HomeFeaturedProducts />
            </Suspense>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent" />
      </section>

      <section aria-label="Cam kết của Holovault" className="border-b border-white/[0.07] bg-[#10171a]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-5 py-5 sm:px-8 lg:grid-cols-4 lg:px-10">
          {assurances.map(({ icon: Icon, title, text, accent }) => (
            <div key={title} className="group flex items-center gap-3 px-2 py-3 sm:px-5">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] ${accent} transition duration-300 group-hover:-translate-y-0.5 group-hover:border-white/20`}>
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
              </span>
              <div>
                <p className="text-xs font-semibold text-zinc-200 sm:text-sm">{title}</p>
                <p className="mt-1 text-[10px] text-zinc-500 sm:text-xs">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="bo-suu-tap" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.24em] text-cyan-200 sm:text-xs">
                CHO NGƯỜI CHƠI & NHÀ SƯU TẦM
              </p>
              <h2 className="mt-3 font-sans text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Chọn cách chơi của bạn
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
                Tìm lá bài còn thiếu để hoàn thiện deck hoặc khám phá thêm lựa
                chọn cho bộ sưu tập của bạn.
              </p>
            </div>
            <span className="hidden items-center gap-2 text-xs text-zinc-500 sm:flex">
              CHỌN DANH MỤC
              <ArrowDown className="h-3.5 w-3.5" />
            </span>
          </div>

          <div className="mt-9 grid grid-cols-3 gap-2 sm:gap-4">
            {collections.map(({ id, href, number, title, description, label, icon: Icon, style, glow }) => (
              <Link
                key={id}
                href={href}
                className={`hv-interactive-card group relative isolate min-h-[170px] scroll-mt-28 overflow-hidden rounded-xl border border-white/[0.09] bg-gradient-to-br ${style} p-3 shadow-[0_16px_50px_-28px_rgba(0,0,0,0.85)] sm:min-h-[300px] sm:rounded-2xl sm:p-7`}
              >
                <div className={`absolute -right-12 -top-12 -z-10 h-44 w-44 rounded-full ${glow} blur-3xl transition duration-500 group-hover:scale-150`} />
                <div className="flex items-start justify-between">
                          <span className="whitespace-nowrap text-[8px] tracking-[0.04em] text-white/50 sm:text-[10px] sm:tracking-[0.2em]">{label}</span>
                  <span className="font-serif text-[10px] text-white/30 sm:text-sm">{number}</span>
                </div>
                <span className={`mt-5 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/20 sm:mt-9 sm:h-12 sm:w-12 sm:rounded-xl ${id === "bo-suu-tap" ? "text-[#e2bb52]" : "text-cyan-200"}`}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.5} />
                </span>
                <div className="mt-4 flex items-end justify-between gap-1 sm:mt-6 sm:gap-4">
                  <div>
                    <h3 className="font-sans text-xs font-bold text-white sm:text-2xl">{title}</h3>
                    <p className="mt-2 hidden max-w-xs text-xs leading-5 text-zinc-400 sm:block sm:text-sm sm:leading-6">
                      {description}
                    </p>
                  </div>
                  <span className="mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 text-zinc-300 transition group-hover:border-cyan-100/30 group-hover:bg-cyan-100/[0.06] group-hover:text-cyan-100 sm:mb-1 sm:h-9 sm:w-9">
                    <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="danh-muc" className="scroll-mt-20 border-y border-white/[0.07] bg-[#10171a] px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.24em] text-cyan-200 sm:text-xs">
              CỬA HÀNG HOLOVAULT
            </p>
            <h2 className="mt-3 font-sans text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Sản phẩm dành cho bạn
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-500">
              Khám phá các sản phẩm đang kinh doanh tại Holovault. Những sản phẩm
              được đánh dấu nổi bật sẽ xuất hiện thêm trên banner đầu trang.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-7xl">
          <Suspense
            fallback={
              <div className="mt-9 rounded-2xl border border-white/[0.08] bg-[#151d21] px-6 py-12 text-center text-sm text-zinc-400">
                Đang tải sản phẩm...
              </div>
            }
          >
            <HomeProductCatalog />
          </Suspense>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="hv-glass relative mx-auto flex max-w-7xl flex-col items-center overflow-hidden rounded-3xl border-cyan-100/[0.12] bg-[radial-gradient(ellipse_at_50%_0%,rgba(18,198,223,0.12),transparent_60%),linear-gradient(135deg,#172327,#101619_60%,#1d211a)] px-6 py-12 text-center shadow-[0_30px_90px_-50px_rgba(18,198,223,0.3)] sm:px-12 sm:py-16">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-100/15 bg-cyan-100/[0.06] text-cyan-100">
            <Sparkles className="h-5 w-5" />
          </span>
          <p className="mt-5 text-[10px] font-semibold tracking-[0.24em] text-cyan-200 sm:text-xs">
            BẮT ĐẦU HÀNH TRÌNH SƯU TẦM
          </p>
          <h2 className="mt-3 max-w-xl font-sans text-3xl font-bold leading-tight text-white sm:text-4xl">
            Lá bài tiếp theo trong bộ sưu tập của bạn đang chờ.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-zinc-300/70">
            Tham gia Holovault để lưu lại thông tin tài khoản và sẵn sàng khám
            phá cửa hàng.
          </p>
          <Link
            href="/register"
            className="mt-7 inline-flex h-12 items-center gap-3 rounded-full bg-gradient-to-r from-[#12c6df] to-[#64e6f4] px-6 text-sm font-bold text-[#07191c] shadow-[0_8px_32px_-12px_rgba(18,198,223,0.65)] transition hover:-translate-y-0.5 hover:brightness-110"
          >
            Tham gia Holovault
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
