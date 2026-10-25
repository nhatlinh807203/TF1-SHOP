import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ObjectId } from "mongodb";
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
import {
  getEnergiesCollection,
  getProductsCollection,
  getRaritiesCollection,
  getRolesCollection,
  type ProductType,
} from "@/lib/db";

const collections = [
  {
    id: "the-bai-don",
    href: "#danh-muc",
    number: "01",
    title: "Thẻ bài đơn",
    description: "Tìm lá bài bạn đang thiếu, chọn đúng phiên bản và tình trạng.",
    label: "SINGLE CARDS",
    icon: Gem,
    style: "from-[#163238] via-[#101b1c] to-[#111211]",
    glow: "bg-cyan-300/15",
  },
  {
    id: "bo-suu-tap",
    href: "#danh-muc",
    number: "02",
    title: "Bộ sưu tập",
    description: "Khám phá những lá bài hiếm dành cho góc trưng bày của bạn.",
    label: "COLLECTOR",
    icon: Sparkles,
    style: "from-[#352914] via-[#1d1911] to-[#111211]",
    glow: "bg-amber-300/15",
  },
  {
    id: "bo-bai",
    href: "/decks",
    number: "03",
    title: "Bộ bài",
    description: "Chuẩn bị bộ bài của bạn và sẵn sàng cho ván đấu tiếp theo.",
    label: "READY TO PLAY",
    icon: Boxes,
    style: "from-[#302039] via-[#1b1720] to-[#111211]",
    glow: "bg-violet-300/15",
  },
];

const assurances = [
  {
    icon: ShieldCheck,
    title: "Chọn lọc cẩn thận",
    text: "Thông tin sản phẩm rõ ràng",
  },
  {
    icon: PackageCheck,
    title: "Đóng gói an toàn",
    text: "Nâng niu từng lá bài",
  },
  {
    icon: Truck,
    title: "Giao hàng toàn quốc",
    text: "Đồng hành đến tận tay",
  },
  {
    icon: BadgeCheck,
    title: "Hỗ trợ tận tâm",
    text: "Luôn sẵn sàng giải đáp",
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
      <div className="absolute -right-44 top-1/2 h-[42rem] w-[42rem] -translate-y-1/2 rounded-full border border-[#e0b957]/[0.08] sm:-right-20 lg:right-[-6rem]">
        <div className="absolute inset-9 rounded-full border border-[#e0b957]/[0.08]" />
        <div className="absolute inset-20 rounded-full border border-[#e0b957]/[0.08]" />
        <div className="absolute inset-32 rounded-full bg-[#d4a537]/[0.07] blur-3xl" />
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
            className="absolute hidden aspect-[5/7] w-28 overflow-hidden rounded-xl border border-[#e0c36e]/35 bg-[#151413] bg-contain bg-center bg-no-repeat shadow-[0_25px_65px_-20px_rgba(0,0,0,0.95)] transition-transform duration-500 sm:block sm:w-36 lg:w-44"
            style={{
              backgroundImage: `url("${imageUrl}")`,
              right: position.right,
              top: position.top,
              transform: `rotate(${position.rotate}deg)`,
              zIndex: products.length - index,
            }}
          />
        );
      })}
      <div className="absolute right-[8%] top-[20%] h-2 w-2 rounded-full bg-[#e8ca74] shadow-[0_0_20px_5px_rgba(232,202,116,0.5)]" />
      <div className="absolute right-[37%] top-[67%] h-1.5 w-1.5 rounded-full bg-cyan-200/80 shadow-[0_0_18px_4px_rgba(165,236,231,0.35)]" />
    </div>
  );
}

const productTypeLabels: Record<ProductType, string> = {
  box: "BOX",
  pack: "PACK",
  card: "THẺ BÀI",
};

async function HomeFeaturedProducts() {
  await connection();
  const products = await (
    await getProductsCollection()
  )
    .find(
      {
        featured: true,
        active: true,
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

  const rarityIds = [
    ...new Set(
      products
        .map((product) => product.rarityId)
        .filter(
          (id): id is string => typeof id === "string" && ObjectId.isValid(id),
        ),
    ),
  ];
  const rarities = rarityIds.length
    ? await (
        await getRaritiesCollection()
      )
        .find({ _id: { $in: rarityIds.map((id) => new ObjectId(id)) } })
        .toArray()
    : [];
  const rarityById = new Map(
    rarities.map((rarity) => [rarity._id.toString(), rarity.name]),
  );
  const roleIds = [
    ...new Set(
      products
        .map((product) => product.roleId)
        .filter(
          (id): id is string => typeof id === "string" && ObjectId.isValid(id),
        ),
    ),
  ];
  const roles = roleIds.length
    ? await (
        await getRolesCollection()
      )
        .find(
          { _id: { $in: roleIds.map((id) => new ObjectId(id)) } },
          { projection: { imageData: 0 } },
        )
        .toArray()
    : [];
  const roleById = new Map(
    roles.map((role) => [
      role._id.toString(),
      {
        name: role.name,
        imageUrl: `/api/roles/${role._id.toString()}/image?v=${role.updatedAt.getTime()}`,
      },
    ]),
  );

  return (
    <div className="mt-8 w-full max-w-2xl">
      <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] text-[#e5cb83]">
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
              <div className="relative aspect-[5/7] overflow-hidden rounded-lg border border-white/[0.12] bg-[#151413] p-1 transition group-hover:border-[#d4a537]/50">
                {imageUrl ? (
                  <div
                    role="img"
                    aria-label={product.name}
                    className="absolute inset-1 bg-contain bg-center bg-no-repeat transition duration-300 group-hover:scale-[1.03]"
                    style={{ backgroundImage: `url("${imageUrl}")` }}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-1 text-[#e5cb83]/70">
                    <Gem className="h-5 w-5" />
                    <span className="text-center text-[8px]">
                      Chưa có ảnh
                    </span>
                  </div>
                )}
                <span className="absolute bottom-1 left-1 rounded bg-black/75 px-1 py-0.5 text-[7px] font-semibold text-[#e5cb83]">
                  NỔI BẬT
                </span>
              </div>
              <div className="mt-1.5 min-w-0">
                <p className="truncate text-[9px] font-medium text-zinc-100">
                  {product.name}
                </p>
                <p className="mt-0.5 truncate text-[8px] text-zinc-400">
                  {new Intl.NumberFormat("vi-VN").format(product.price)} đ
                </p>
                {product.rarityId && rarityById.get(product.rarityId) && (
                  <p className="mt-0.5 truncate text-[8px] text-amber-200">
                    {rarityById.get(product.rarityId)}
                  </p>
                )}
                {product.roleId && roleById.get(product.roleId) && (
                  <p className="mt-0.5 truncate text-[8px] text-zinc-400">
                    {roleById.get(product.roleId)?.name}
                  </p>
                )}
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
    .find({ active: true }, { projection: { imageData: 0 } })
    .sort({ updatedAt: -1 })
    .toArray();

  if (products.length === 0) {
    return (
      <div className="mt-9 rounded-2xl border border-dashed border-white/[0.1] bg-[#0c0f10] px-6 py-12 text-center">
        <Gem className="mx-auto h-8 w-8 text-[#d9b754]/60" />
        <p className="mt-4 font-medium text-zinc-200">
          Sản phẩm đang được cập nhật
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Các sản phẩm mới sẽ xuất hiện tại đây.
        </p>
      </div>
    );
  }

  const energyIds = [
    ...new Set(
      products
        .flatMap((product) => product.energyIds ?? [])
        .filter((id) => ObjectId.isValid(id)),
    ),
  ];
  const roleIds = [
    ...new Set(
      products
        .map((product) => product.roleId)
        .filter(
          (id): id is string => typeof id === "string" && ObjectId.isValid(id),
        ),
    ),
  ];
  const rarityIds = [
    ...new Set(
      products
        .map((product) => product.rarityId)
        .filter(
          (id): id is string => typeof id === "string" && ObjectId.isValid(id),
        ),
    ),
  ];

  const [energies, roles, rarities] = await Promise.all([
    energyIds.length
      ? (
          await getEnergiesCollection()
        )
          .find(
            { _id: { $in: energyIds.map((id) => new ObjectId(id)) } },
            { projection: { imageData: 0 } },
          )
          .toArray()
      : [],
    roleIds.length
      ? (
          await getRolesCollection()
        )
          .find(
            { _id: { $in: roleIds.map((id) => new ObjectId(id)) } },
            { projection: { imageData: 0 } },
          )
          .toArray()
      : [],
    rarityIds.length
      ? (
          await getRaritiesCollection()
        )
          .find({ _id: { $in: rarityIds.map((id) => new ObjectId(id)) } })
          .toArray()
      : [],
  ]);
  const energyById = new Map(
    energies.map((energy) => [
      energy._id.toString(),
      {
        name: energy.name,
        imageUrl: `/api/energies/${energy._id.toString()}/image?v=${energy.updatedAt.getTime()}`,
      },
    ]),
  );
  const roleById = new Map(
    roles.map((role) => [
      role._id.toString(),
      {
        name: role.name,
        imageUrl: `/api/roles/${role._id.toString()}/image?v=${role.updatedAt.getTime()}`,
      },
    ]),
  );
  const rarityById = new Map(
    rarities.map((rarity) => [rarity._id.toString(), rarity.name]),
  );

  return (
    <div className="mt-9 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {products.map((product) => {
        const productId = product._id.toString();
        const imageUrl = product.imageContentType
          ? `/api/products/${productId}/image?v=${product.updatedAt.getTime()}`
          : (product.imageUrl ?? "");
        const role = product.roleId ? roleById.get(product.roleId) : undefined;
        const rarity = product.rarityId
          ? rarityById.get(product.rarityId)
          : undefined;

        return (
          <article
            key={productId}
            className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-[#101314] transition hover:-translate-y-1 hover:border-[#d4a537]/25 sm:rounded-2xl"
          >
            <Link
              href={`/products/${productId}`}
              className="relative block aspect-[5/7] overflow-hidden border border-white/[0.04] bg-[#151413] p-2"
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
                <div className="flex h-full items-center justify-center text-[#d9b754]/50">
                  <Gem className="h-10 w-10" />
                </div>
              )}
              <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/65 px-2.5 py-1 text-[10px] font-medium tracking-wide text-zinc-200 backdrop-blur">
                {productTypeLabels[product.type]}
              </span>
              {product.featured && (
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#d4a537] px-2.5 py-1 text-[10px] font-semibold text-[#211805]">
                  <Sparkles className="h-3 w-3" />
                  Nổi bật
                </span>
              )}
            </Link>

            <div className="flex flex-1 flex-col p-2.5 sm:p-3 lg:p-4">
              <div className="min-w-0">
                <h3 className="line-clamp-2 min-h-9 break-words text-xs font-medium text-zinc-100 sm:min-h-10 sm:text-sm">
                  <Link
                    href={`/products/${productId}`}
                    className="transition hover:text-[#efd486]"
                  >
                  {product.name}
                  </Link>
                </h3>
                <span
                  className={`mt-1 inline-block max-w-full truncate rounded-full px-2 py-1 text-[9px] sm:text-[10px] ${
                    product.stock > 0
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-white/[0.06] text-zinc-500"
                  }`}
                >
                  {product.stock > 0
                    ? `Còn ${product.stock} thẻ`
                    : "Hết hàng"}
                </span>
              </div>
              <p className="mt-2 min-h-6 truncate text-sm font-semibold text-[#e5bf62] sm:text-base lg:text-lg">
                {new Intl.NumberFormat("vi-VN").format(product.price)} đ
              </p>
              <p
                className={`mt-2 hidden min-h-10 line-clamp-2 text-xs leading-5 text-zinc-500 sm:block ${
                  product.description ? "" : "invisible"
                }`}
              >
                  {product.description}
              </p>
              <div className="mt-2 flex min-h-8 flex-wrap content-start items-center gap-1.5 border-t border-white/[0.06] pt-2 sm:mt-3 sm:min-h-10 sm:gap-2">
                  {role && (
                    <span                     className="inline-flex max-w-full items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] py-1 pl-1 pr-1.5 text-[9px] text-zinc-300 sm:gap-1.5 sm:pr-2 sm:text-[10px]">
                      <span
                        aria-hidden="true"
                      className="h-4 w-4 shrink-0 rounded-full bg-cover bg-center sm:h-5 sm:w-5"
                        style={{ backgroundImage: `url("${role.imageUrl}")` }}
                      />
                    <span className="truncate">{role.name}</span>
                    </span>
                  )}
                  {rarity && (
                    <span className="max-w-full truncate rounded-full bg-amber-300/[0.08] px-1.5 py-1 text-[9px] text-amber-200 sm:px-2 sm:text-[10px]">
                      {rarity}
                    </span>
                  )}
                  {(product.energyIds ?? []).map((energyId) => {
                    const energy = energyById.get(energyId);
                    if (!energy) {
                      return null;
                    }
                    return (
                      <span
                        key={energyId}
                        title={energy.name}
                        role="img"
                        aria-label={energy.name}
                        className="h-5 w-5 rounded-full border border-white/15 bg-cover bg-center sm:h-6 sm:w-6"
                        style={{ backgroundImage: `url("${energy.imageUrl}")` }}
                      />
                    );
                  })}
              </div>
              <p
                className={`mt-2 hidden min-h-4 truncate text-[10px] text-zinc-500 sm:block ${
                  (product.hashtags ?? []).length > 0 ? "" : "invisible"
                }`}
              >
                  {(product.hashtags ?? []).join(" · ")}
              </p>
              <div className="mt-auto pt-2 sm:pt-3">
                <ProductPurchaseActions
                  compact
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
        );
      })}
    </div>
  );
}

export default function Home() {
  return (
    <div className="overflow-hidden bg-[#090b0c] text-white">
      <section className="relative isolate min-h-[600px] border-b border-white/[0.06] sm:min-h-[660px] lg:min-h-[690px]">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_18%_46%,rgba(14,72,76,0.2),transparent_43%),linear-gradient(105deg,#090b0c_8%,#0a0d0e_54%,#11100c_100%)]" />
        <Suspense fallback={null}>
          <FeaturedArtwork />
        </Suspense>
        <div className="relative mx-auto flex min-h-[600px] max-w-7xl items-center px-5 py-16 sm:min-h-[660px] sm:px-8 lg:min-h-[690px] lg:px-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a537]/20 bg-[#d4a537]/[0.06] px-3.5 py-2 text-[10px] font-medium tracking-[0.2em] text-[#e5cb83] sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e5cb83] shadow-[0_0_10px_rgba(229,203,131,0.8)]" />
              DÀNH CHO NGƯỜI CHƠI & NHÀ SƯU TẦM
            </div>
            <h1 className="mt-7 max-w-xl font-serif text-[3.25rem] font-medium leading-[1.03] tracking-[-0.045em] text-[#f5f1e7] sm:text-6xl lg:text-[5.25rem]">
              Hoàn thiện bộ bài
              <br />
              <span className="bg-gradient-to-r from-[#f3dfa0] via-[#d9b552] to-[#a77b27] bg-clip-text italic text-transparent">
                nâng tầm sưu tập.
              </span>
            </h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-zinc-400 sm:text-base sm:leading-8">
              Khám phá những lá bài giúp bạn xây dựng deck ưng ý và bổ sung
              những điểm nhấn giá trị cho bộ sưu tập. Chọn quân bài tiếp theo,
              sẵn sàng cho ván đấu và hành trình sưu tầm của bạn cùng TF1SHOP.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="#bo-suu-tap"
                className="group inline-flex h-12 items-center gap-3 rounded-full bg-gradient-to-b from-[#f0d783] to-[#c79732] px-6 text-sm font-semibold text-[#211805] shadow-[0_8px_28px_-10px_rgba(212,165,55,0.55)] transition hover:brightness-110"
              >
                Khám phá cửa hàng
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/register"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/[0.12] px-5 text-sm font-medium text-zinc-200 transition hover:border-white/25 hover:bg-white/[0.04]"
              >
                Tham gia cộng đồng
                <ArrowUpRight className="h-4 w-4 text-zinc-400" />
              </Link>
            </div>
            <Suspense fallback={null}>
              <HomeFeaturedProducts />
            </Suspense>
            <a
              href="#bo-suu-tap"
              className="mt-12 inline-flex items-center gap-2 text-xs tracking-wide text-zinc-500 transition hover:text-zinc-300"
            >
              Cuộn để khám phá
              <ArrowDown className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4a537]/30 to-transparent" />
      </section>

      <section aria-label="Cam kết của TF1SHOP" className="border-b border-white/[0.06] bg-[#0c0f10]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-5 py-5 sm:px-8 lg:grid-cols-4 lg:px-10">
          {assurances.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3 px-2 py-3 sm:px-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d4a537]/15 bg-[#d4a537]/[0.05] text-[#d9b754]">
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

      <section id="bo-suu-tap" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.24em] text-[#d9b754] sm:text-xs">
                CHO NGƯỜI CHƠI & NHÀ SƯU TẦM
              </p>
              <h2 className="mt-3 font-serif text-3xl tracking-tight text-[#f2eee4] sm:text-4xl">
                Bạn đang tìm gì?
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
                className={`group relative isolate min-h-[170px] scroll-mt-28 overflow-hidden rounded-xl border border-white/[0.07] bg-gradient-to-br ${style} p-3 transition duration-300 hover:-translate-y-1 hover:border-white/[0.15] sm:min-h-[300px] sm:rounded-2xl sm:p-7`}
              >
                <div className={`absolute -right-12 -top-12 -z-10 h-44 w-44 rounded-full ${glow} blur-3xl transition duration-500 group-hover:scale-150`} />
                <div className="flex items-start justify-between">
                  <span className="whitespace-nowrap text-[7px] tracking-[0.08em] text-white/40 sm:text-[10px] sm:tracking-[0.2em]">{label}</span>
                  <span className="font-serif text-[10px] text-white/30 sm:text-sm">{number}</span>
                </div>
                <span className="mt-5 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/15 text-[#e3c66f] sm:mt-9 sm:h-12 sm:w-12 sm:rounded-xl">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.5} />
                </span>
                <div className="mt-4 flex items-end justify-between gap-1 sm:mt-6 sm:gap-4">
                  <div>
                    <h3 className="font-serif text-xs text-[#f1eee5] sm:text-2xl">{title}</h3>
                    <p className="mt-2 hidden max-w-xs text-xs leading-5 text-zinc-400 sm:block sm:text-sm sm:leading-6">
                      {description}
                    </p>
                  </div>
                  <span className="mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 text-zinc-300 transition group-hover:border-[#d4a537]/50 group-hover:bg-[#d4a537]/10 group-hover:text-[#efd486] sm:mb-1 sm:h-9 sm:w-9">
                    <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="danh-muc" className="scroll-mt-20 border-y border-white/[0.06] bg-[#0c0f10] px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.24em] text-[#d9b754] sm:text-xs">
              CỬA HÀNG TF1SHOP
            </p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight text-[#f2eee4] sm:text-4xl">
              Sản phẩm dành cho bạn
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-500">
              Khám phá các sản phẩm đang kinh doanh tại TF1SHOP. Những sản phẩm
              được đánh dấu nổi bật sẽ xuất hiện thêm trên banner đầu trang.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-7xl">
          <Suspense
            fallback={
              <div className="mt-9 rounded-2xl border border-white/[0.07] bg-[#101314] px-6 py-12 text-center text-sm text-zinc-500">
                Đang tải sản phẩm...
              </div>
            }
          >
            <HomeProductCatalog />
          </Suspense>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center rounded-3xl border border-[#d4a537]/15 bg-[radial-gradient(ellipse_at_50%_0%,rgba(212,165,55,0.09),transparent_65%),#0d1011] px-6 py-12 text-center sm:px-12 sm:py-16">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#d4a537]/20 bg-[#d4a537]/[0.06] text-[#e2c36b]">
            <Sparkles className="h-5 w-5" />
          </span>
          <p className="mt-5 text-[10px] font-semibold tracking-[0.24em] text-[#d9b754] sm:text-xs">
            BẮT ĐẦU HÀNH TRÌNH SƯU TẦM
          </p>
          <h2 className="mt-3 max-w-xl font-serif text-3xl leading-tight text-[#f2eee4] sm:text-4xl">
            Lá bài tiếp theo trong bộ sưu tập của bạn đang chờ.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-zinc-500">
            Tham gia TF1SHOP để lưu lại thông tin tài khoản và sẵn sàng khám
            phá cửa hàng.
          </p>
          <Link
            href="/register"
            className="mt-7 inline-flex h-12 items-center gap-3 rounded-full bg-gradient-to-b from-[#f0d783] to-[#c79732] px-6 text-sm font-semibold text-[#211805] transition hover:brightness-110"
          >
            Tham gia TF1SHOP
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
