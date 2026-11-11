import {
  getTcgplayerReferencePrice,
  getTcgplayerUsdVndRate,
} from "@/lib/tcgplayer-pricing";

interface OpenRiftSet {
  id: string;
  slug: string;
  name: string;
  setType: string;
}

interface OpenRiftCard {
  name: string;
  types: string[];
  superTypes: string[];
  domains: string[];
  energy: number | null;
  might: number | null;
  power: number | null;
  keywords: string[];
  tags: string[];
}

interface OpenRiftImage {
  imageId: string;
}

interface OpenRiftPrinting {
  faceId: string;
  shortCode: string;
  setId: string;
  rarity: string;
  artVariant: string;
  isSigned: boolean;
  isOvernumbered: boolean;
  finish: string;
  images: OpenRiftImage[];
  publicCode: string;
  printedRulesText: string | null;
  printedEffectText: string | null;
  flavorText: string | null;
  printedName: string;
  language: string;
  canonicalRank: number;
  cardId: string;
}

interface OpenRiftCatalogResponse {
  sets: OpenRiftSet[];
  cards: Record<string, OpenRiftCard>;
  printings: Record<string, OpenRiftPrinting>;
}

interface OpenRiftPriceResponse {
  prices: Record<string, { tcgplayer?: number }>;
  currencies: { tcgplayer: string };
}

interface PokeWalletSet {
  set_id: string;
  name: string;
}

interface PokeWalletSetsResponse {
  success: boolean;
  data: PokeWalletSet[];
}

interface PokeWalletCard {
  id: string;
  card_info: {
    name: string;
    card_number: string;
    product_type: string | null;
  };
  images: { languages: string[] };
}

interface PokeWalletSetCardsResponse {
  success: boolean;
  cards: PokeWalletCard[];
  pagination: { total_pages: number };
}

interface PokeWalletImageCandidate {
  id: string;
  name: string;
}

export interface RiftboundCatalogCard {
  printingId: string;
  cardId: string;
  cardName: string;
  setId: string;
  setSlug: string;
  setName: string;
  collectorNumber: string;
  description: string;
  rarity: string;
  faction: string;
  tcgplayerPriceUsd: number | null;
  sellingPriceVnd: number | null;
  imageUrl: string;
}

interface RiftboundCatalog {
  source: string;
  sets: Array<{ id: string; slug: string; name: string }>;
  warning: string;
  cards: RiftboundCatalogCard[];
}

const RIFTBOUND_CATALOG_CACHE_MS = 60 * 60 * 1000;
let cachedRiftboundCatalog:
  | { catalog: RiftboundCatalog; expiresAt: number }
  | undefined;
let pendingRiftboundCatalog: Promise<RiftboundCatalog> | undefined;

function getOpenRiftHeaders() {
  return {
    Accept: "application/json",
    "User-Agent":
      "Holovault catalog integration (https://tf-1-shop-ug2f.vercel.app)",
  };
}

async function fetchOpenRift<T>(path: string): Promise<T> {
  const cacheOptions =
    path === "/api/v1/catalog?langs=EN"
      ? { cache: "no-store" as const }
      : { next: { revalidate: 3600 } };
  const response = await fetch(`https://openrift.app${path}`, {
    headers: getOpenRiftHeaders(),
    ...cacheOptions,
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(
      `OpenRift API ${path} trả về HTTP ${response.status}. Vui lòng thử lại sau.`,
    );
  }
  return (await response.json()) as T;
}

function normalizeText(value: string) {
  return value.toLocaleLowerCase("en").replace(/[^a-z0-9]/g, "");
}

function normalizeCardNumber(value: string) {
  const number = value.match(/\d+/)?.[0];
  return number ? String(Number(number)) : "";
}

async function fetchPokeWallet<T>(path: string): Promise<T> {
  const apiKey = process.env.POKEWALLET_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Chưa cấu hình POKEWALLET_API_KEY.");
  }
  const response = await fetch(`https://api.pokewallet.io${path}`, {
    headers: {
      Accept: "application/json",
      "X-API-Key": apiKey,
    },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`PokéWallet API trả về HTTP ${response.status}.`);
  }
  return (await response.json()) as T;
}

async function getPokeWalletImageIds(
  sets: OpenRiftSet[],
  requestedSetSlugs: string[],
) {
  const imageIds = new Map<string, PokeWalletImageCandidate[]>();
  const warningMessages: string[] = [];
  if (!process.env.POKEWALLET_API_KEY?.trim()) {
    return {
      imageIds,
      warning: "Thêm POKEWALLET_API_KEY để tự động tải ảnh từ PokéWallet.",
    };
  }

  try {
    const response =
      await fetchPokeWallet<PokeWalletSetsResponse>("/rft/sets");
    if (!response.success || !Array.isArray(response.data)) {
      throw new Error("PokéWallet sets trả về dữ liệu không hợp lệ.");
    }

    const setNameBySlug = new Map(
      sets
        .filter((set) => requestedSetSlugs.includes(set.slug))
        .map((set) => [set.slug, normalizeText(set.name)]),
    );
    const pokeWalletSets = response.data.flatMap((pokeSet) => {
      const setSlug = [...setNameBySlug].find(
        ([, name]) => normalizeText(pokeSet.name) === name,
      )?.[0];
      return setSlug ? [{ ...pokeSet, setSlug }] : [];
    });

    const cardResults = await Promise.all(
      pokeWalletSets.map(async (pokeSet) => {
        const firstPage =
          await fetchPokeWallet<PokeWalletSetCardsResponse>(
            `/rft/sets/${encodeURIComponent(pokeSet.set_id)}?page=1&limit=200`,
          );
        if (
          !firstPage.success ||
          !Array.isArray(firstPage.cards) ||
          !Number.isSafeInteger(firstPage.pagination?.total_pages) ||
          firstPage.pagination.total_pages < 1 ||
          firstPage.pagination.total_pages > 20
        ) {
          throw new Error(
            `PokéWallet không trả về danh sách thẻ hợp lệ cho set ${pokeSet.name}.`,
          );
        }

        const laterPages = await Promise.all(
          Array.from(
            { length: firstPage.pagination.total_pages - 1 },
            (_, index) => index + 2,
          ).map((page) =>
            fetchPokeWallet<PokeWalletSetCardsResponse>(
              `/rft/sets/${encodeURIComponent(pokeSet.set_id)}?page=${page}&limit=200`,
            ),
          ),
        );
        const allCards = [
          ...firstPage.cards,
          ...laterPages.flatMap((page) => {
            if (!page.success || !Array.isArray(page.cards)) {
              throw new Error(
                `PokéWallet không tải được trang thẻ tiếp theo của set ${pokeSet.name}.`,
              );
            }
            return page.cards;
          }),
        ];
        return allCards
          .filter(
            (card) =>
              card.card_info?.product_type === "card" &&
              card.images?.languages?.includes("en") &&
              typeof card.id === "string" &&
              typeof card.card_info.name === "string" &&
              typeof card.card_info.card_number === "string",
          )
          .map((card) => ({
            setSlug: pokeSet.setSlug,
            image: {
              id: card.id,
              name: normalizeText(card.card_info.name),
            },
            collectorNumber: normalizeCardNumber(card.card_info.card_number),
          }));
      }),
    );

    for (const card of cardResults.flat()) {
      const key = `${card.setSlug}:${card.collectorNumber}`;
      const entries = imageIds.get(key) ?? [];
      entries.push(card.image);
      imageIds.set(key, entries);
    }
    return { imageIds };
  } catch (error) {
    warningMessages.push(
      error instanceof Error
        ? error.message
        : "Không thể tải danh sách ảnh từ PokéWallet.",
    );
    return { imageIds, warning: warningMessages.join(" ") };
  }
}

function formatRarity(rarity: string) {
  return rarity
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((word) => `${word[0].toLocaleUpperCase("en")}${word.slice(1)}`)
    .join(" ");
}

function collectorNumber(code: string) {
  return code.match(/-(\d+)(?:\/\d+)?/)?.[1] ?? code;
}

async function fetchRiftboundCatalog(): Promise<RiftboundCatalog> {
  const [catalog, priceData] = await Promise.all([
    fetchOpenRift<OpenRiftCatalogResponse>("/api/v1/catalog?langs=EN"),
    fetchOpenRift<OpenRiftPriceResponse>("/api/v1/prices"),
  ]);
  const usdVndRate = getTcgplayerUsdVndRate();
  if (
    !Array.isArray(catalog.sets) ||
    typeof catalog.cards !== "object" ||
    catalog.cards === null ||
    typeof catalog.printings !== "object" ||
    catalog.printings === null
  ) {
    throw new Error("OpenRift catalog trả về cấu trúc dữ liệu không hợp lệ.");
  }
  if (
    typeof priceData.prices !== "object" ||
    priceData.prices === null ||
    typeof priceData.currencies?.tcgplayer !== "string"
  ) {
    throw new Error("OpenRift prices trả về cấu trúc dữ liệu không hợp lệ.");
  }
  const setById = new Map(
    catalog.sets.map((set) => [set.id, set]),
  );
  const requestedSetSlugs = ["OGN", "SFD", "UNL", "VEN", "RAD"];
  const availableSets = requestedSetSlugs.flatMap((slug) => {
    const set = catalog.sets.find((candidate) => candidate.slug === slug);
    return set ? [set] : [];
  });
  if (availableSets.length !== requestedSetSlugs.length) {
    const missing = requestedSetSlugs.filter(
      (slug) => !catalog.sets.some((set) => set.slug === slug),
    );
    throw new Error(
      `OpenRift chưa trả về đủ Set 1–5. Đang thiếu: ${missing.join(", ")}.`,
    );
  }

  const chosenPrintings = new Map<
    string,
    { id: string; printing: OpenRiftPrinting }
  >();
  for (const [id, printing] of Object.entries(catalog.printings)) {
    const set = setById.get(printing.setId);
    if (
      !set ||
      !requestedSetSlugs.includes(set.slug) ||
      printing.language !== "EN" ||
      printing.finish !== "normal" ||
      printing.artVariant !== "normal" ||
      printing.isSigned ||
      printing.isOvernumbered ||
      !new RegExp(`^${set.slug}-\\d+`).test(printing.shortCode)
    ) {
      continue;
    }

    const current = chosenPrintings.get(`${set.id}:${printing.cardId}`);
    if (!current || printing.canonicalRank < current.printing.canonicalRank) {
      chosenPrintings.set(`${set.id}:${printing.cardId}`, { id, printing });
    }
  }

  const pokeWalletImages = await getPokeWalletImageIds(
    catalog.sets,
    requestedSetSlugs,
  );
  const cards: RiftboundCatalogCard[] = [];
  for (const { id, printing } of chosenPrintings.values()) {
    const set = setById.get(printing.setId);
    const card = catalog.cards[printing.cardId];
    if (!set || !card) {
      continue;
    }
    const marketCents = priceData.prices[id]?.tcgplayer;
    const tcgplayerPriceUsd =
      typeof marketCents === "number" &&
      Number.isFinite(marketCents) &&
      marketCents >= 0
        ? marketCents / 100
        : null;
    const rules = [
      printing.printedRulesText,
      printing.printedEffectText,
      printing.flavorText,
    ].filter((line): line is string => Boolean(line));
    const cardName = printing.printedName || card.name;
    const candidateImages =
      pokeWalletImages.imageIds.get(
        `${set.slug}:${normalizeCardNumber(collectorNumber(printing.publicCode))}`,
      ) ?? [];
    const matchingImage =
      candidateImages.find(
        (candidate) => candidate.name === normalizeText(cardName),
      ) ?? (candidateImages.length === 1 ? candidateImages[0] : undefined);

    cards.push({
      printingId: id,
      cardId: printing.cardId,
      cardName,
      setId: set.id,
      setSlug: set.slug,
      setName: set.name,
      collectorNumber: collectorNumber(printing.publicCode),
      description: rules.join("\n").slice(0, 1200),
      rarity: formatRarity(printing.rarity),
      faction: card.domains.map(formatRarity).join(", "),
      tcgplayerPriceUsd,
      sellingPriceVnd:
        tcgplayerPriceUsd !== null
          ? getTcgplayerReferencePrice(tcgplayerPriceUsd, usdVndRate)
          : null,
      imageUrl: matchingImage
        ? `/api/riftbound/images/${encodeURIComponent(matchingImage.id)}`
        : "",
    });
  }

  cards.sort((left, right) => {
    const setOrder =
      requestedSetSlugs.indexOf(left.setSlug) -
      requestedSetSlugs.indexOf(right.setSlug);
    if (setOrder !== 0) {
      return setOrder;
    }
    return left.collectorNumber.localeCompare(right.collectorNumber, "en", {
      numeric: true,
    });
  });

  return {
    source: "OpenRift",
    sets: availableSets.map(({ id, slug, name }) => ({ id, slug, name })),
    warning: [
      priceData.currencies.tcgplayer !== "USD"
        ? "OpenRift đang trả giá TCGplayer không phải USD; không thể đổi sang VNĐ."
        : cards.some((card) => card.tcgplayerPriceUsd === null)
          ? "Một số lá chưa có giá TCGplayer; chỉ lá có giá mới có thể nhập."
          : undefined,
      pokeWalletImages.warning,
      cards.some((card) => !card.imageUrl) &&
      !pokeWalletImages.warning?.startsWith("Thêm POKEWALLET_API_KEY")
        ? "PokéWallet chưa có ảnh khớp cho một số thẻ."
        : undefined,
    ]
      .filter(Boolean)
      .join(" "),
    cards,
  };
}

export async function getRiftboundCatalog(): Promise<RiftboundCatalog> {
  if (cachedRiftboundCatalog && cachedRiftboundCatalog.expiresAt > Date.now()) {
    return cachedRiftboundCatalog.catalog;
  }
  if (pendingRiftboundCatalog) {
    return pendingRiftboundCatalog;
  }

  pendingRiftboundCatalog = fetchRiftboundCatalog();
  try {
    const catalog = await pendingRiftboundCatalog;
    cachedRiftboundCatalog = {
      catalog,
      expiresAt: Date.now() + RIFTBOUND_CATALOG_CACHE_MS,
    };
    return catalog;
  } finally {
    pendingRiftboundCatalog = undefined;
  }
}
