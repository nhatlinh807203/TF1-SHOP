"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Check,
  Image as ImageIcon,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import type { ProductType } from "@/lib/db";
import type { ProductInput, ProductView } from "@/lib/products";
import { productGames } from "@/lib/product-games";

interface RiftboundCatalogCard {
  printingId: string;
  cardId: string;
  cardName: string;
  setId: string;
  setSlug: string;
  setName: string;
  collectorNumber: string;
  description: string;
  faction: string;
  tcgplayerPriceUsd: number | null;
  sellingPriceVnd: number | null;
  imageUrl: string;
  existingProduct: {
    id: string;
    price: number;
    stock: number;
    imageUrl: string;
  } | null;
}

interface RiftboundCatalogResponse {
  message?: string;
  warning?: string;
  cards?: RiftboundCatalogCard[];
  sets?: Array<{ id: string; slug: string; name: string }>;
}

interface ProductManagerProps {
  initialProducts: ProductView[];
}

const emptyProduct: ProductInput = {
  name: "",
  type: "box",
  game: null,
  description: "",
  energyIds: [],
  roleId: "",
  rarityId: null,
  hashtags: [],
  price: 1000,
  stock: 0,
  featured: false,
  active: true,
};

const typeLabels: Record<ProductType, string> = {
  box: "Box",
  pack: "Pack",
  card: "Thẻ bài",
};

function formatPrice(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)} đ`;
}

export default function ProductManager({
  initialProducts,
}: ProductManagerProps) {
  const [products, setProducts] = useState(initialProducts);
  const [form, setForm] = useState<ProductInput>(emptyProduct);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [riftboundCards, setRiftboundCards] = useState<RiftboundCatalogCard[]>([]);
  const [riftboundWarning, setRiftboundWarning] = useState("");
  const [riftboundError, setRiftboundError] = useState("");
  const [riftboundSearch, setRiftboundSearch] = useState("");
  const [riftboundSetId, setRiftboundSetId] = useState("all");
  const [isLoadingRiftbound, setIsLoadingRiftbound] = useState(false);
  const [savingRiftboundId, setSavingRiftboundId] = useState<string | null>(null);
  const [riftboundValues, setRiftboundValues] = useState<
    Record<string, { stock: string }>
  >({});
  const [riftboundImages, setRiftboundImages] = useState<
    Record<string, { file: File; previewUrl: string }>
  >({});
  const [visibleRiftboundCount, setVisibleRiftboundCount] = useState(36);
  const editingProduct = products.find((product) => product.id === editingId);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    const previewUrls = Object.values(riftboundImages).map(
      ({ previewUrl }) => previewUrl,
    );
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [riftboundImages]);

  function startCreate() {
    setForm(emptyProduct);
    setImageFile(null);
    setImagePreview("");
    setEditingId(null);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function startEdit(product: ProductView) {
    setForm({
      name: product.name,
      type: product.type,
      game: product.game,
      description: product.description,
      energyIds: product.energyIds,
      roleId: product.roleId,
      rarityId: product.rarityId,
      hashtags: product.hashtags,
      price: product.price,
      stock: product.stock,
      featured: product.featured,
      active: product.active,
    });
    setImageFile(null);
    setImagePreview(product.imageUrl);
    setEditingId(product.id);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function updateField<K extends keyof ProductInput>(
    field: K,
    value: ProductInput[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function loadRiftboundCatalog() {
    setIsLoadingRiftbound(true);
    setRiftboundError("");
    setSuccessMessage("");
    try {
      const response = await fetch("/api/admin/riftbound/catalog", {
        cache: "no-store",
      });
      const result = (await response.json()) as RiftboundCatalogResponse;
      if (!response.ok || !result.cards) {
        setRiftboundError(
          result.message ?? "Không thể tải catalog Riftbound.",
        );
        return;
      }
      setRiftboundCards(result.cards);
      setRiftboundWarning(result.warning ?? "");
      setVisibleRiftboundCount(36);
      setRiftboundSetId("all");
    } catch {
      setRiftboundError("Không thể kết nối máy chủ để tải catalog Riftbound.");
    } finally {
      setIsLoadingRiftbound(false);
    }
  }

  function getRiftboundValues(card: RiftboundCatalogCard) {
    const savedProduct = products.find(
      (product) => product.riftbound?.printingId === card.printingId,
    ) ?? card.existingProduct;
    const values = riftboundValues[card.printingId];
    return {
      stock: values?.stock ?? String(savedProduct?.stock ?? 0),
      savedProduct,
    };
  }

  async function saveRiftboundCard(card: RiftboundCatalogCard) {
    const values = getRiftboundValues(card);
    const stock = Number(values.stock);
    if (
      !Number.isSafeInteger(stock) ||
      stock < 0
    ) {
      setRiftboundError("Số lượng tồn kho phải là số nguyên không âm.");
      return;
    }

    setSavingRiftboundId(card.printingId);
    setRiftboundError("");
    setSuccessMessage("");
    try {
      const formData = new FormData();
      formData.set("printingId", card.printingId);
      formData.set("stock", String(stock));
      const image = riftboundImages[card.printingId];
      if (image) {
        formData.set("image", image.file);
      }
      const response = await fetch("/api/admin/riftbound/catalog", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as {
        message?: string;
        product?: ProductView;
      };
      if (!response.ok || !result.product) {
        setRiftboundError(
          result.message ?? `Không thể lưu ${card.cardName}.`,
        );
        return;
      }
      const savedProduct = result.product;
      setProducts((current) => [
        savedProduct,
        ...current.filter((product) => product.id !== savedProduct.id),
      ]);
      setRiftboundImages((current) => {
        const updated = { ...current };
        delete updated[card.printingId];
        return updated;
      });
      setSuccessMessage(
        `Đã cập nhật ${savedProduct.name}, tồn kho ${savedProduct.stock}.`,
      );
    } catch {
      setRiftboundError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setSavingRiftboundId(null);
    }
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.featured && !imageFile && !editingProduct?.imageUrl) {
      setErrorMessage(
        "Vui lòng tải ảnh sản phẩm lên trước khi bật hiển thị nổi bật.",
      );
      return;
    }
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "energyIds") {
          formData.append(key, JSON.stringify(value));
          return;
        }
        if (key === "rarityId") {
          formData.append(key, value ?? "");
          return;
        }
        if (key === "roleId") {
          formData.append(key, value);
          return;
        }
        formData.append(key, String(value));
      });
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await fetch(
        editingId
          ? `/api/admin/products/${encodeURIComponent(editingId)}`
          : "/api/admin/products",
        {
          method: editingId ? "PATCH" : "POST",
          body: formData,
        },
      );
      const result = (await response.json()) as {
        message?: string;
        product?: ProductView;
      };

      if (!response.ok || !result.product) {
        setErrorMessage(result.message ?? "Không thể lưu sản phẩm.");
        return;
      }

      const savedProduct = result.product;
      setProducts((current) => {
        const updated = current.filter(
          (product) => product.id !== savedProduct.id,
        );
        return [savedProduct, ...updated];
      });
      setSuccessMessage(
        editingId ? "Đã cập nhật sản phẩm." : "Đã thêm sản phẩm mới.",
      );
      setEditingId(null);
      setForm(emptyProduct);
      setImageFile(null);
      setImagePreview("");
    } catch {
      setErrorMessage("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteProduct(product: ProductView) {
    if (!window.confirm(`Bạn có chắc muốn xóa "${product.name}"?`)) {
      return;
    }

    setDeletingId(product.id);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await fetch(
        `/api/admin/products/${encodeURIComponent(product.id)}`,
        { method: "DELETE" },
      );
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setErrorMessage(result.message ?? "Không thể xóa sản phẩm.");
        return;
      }

      setProducts((current) =>
        current.filter((item) => item.id !== product.id),
      );
      if (editingId === product.id) {
        startCreate();
      }
      setSuccessMessage("Đã xóa sản phẩm.");
    } catch {
      setErrorMessage("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setDeletingId(null);
    }
  }

  const filteredRiftboundCards = riftboundCards.filter((card) =>
    (riftboundSetId === "all" || card.setSlug === riftboundSetId) &&
      `${card.cardName} ${card.setName} ${card.faction} ${card.collectorNumber}`
        .toLocaleLowerCase("vi")
        .includes(riftboundSearch.toLocaleLowerCase("vi").trim()),
  );
  const visibleRiftboundCards = filteredRiftboundCards.slice(
    0,
    visibleRiftboundCount,
  );

  return (
    <section
      id="products"
      className="scroll-mt-24 space-y-5 rounded-2xl border border-white/[0.07] bg-[#101314] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Quản lý sản phẩm</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Thêm và cập nhật Box, Pack, thẻ bài; chọn sản phẩm nổi bật cho banner.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#d4a537] px-4 text-sm font-semibold text-[#211805] transition hover:bg-[#e4bd5d]"
        >
          <Plus className="h-4 w-4" />
          Thêm sản phẩm
        </button>
      </div>

      {(errorMessage || successMessage) && (
        <p
          role={errorMessage ? "alert" : "status"}
          className={`rounded-xl border px-4 py-3 text-sm ${
            errorMessage
              ? "border-red-400/20 bg-red-400/[0.06] text-red-300"
              : "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300"
          }`}
        >
          {errorMessage || successMessage}
        </p>
      )}

      <section className="space-y-4 rounded-xl border border-cyan-100/10 bg-[#0c1011] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-medium text-zinc-100">
              Catalog Riftbound Singles
            </h3>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Catalog và giá tham khảo lấy từ OpenRift. Chỉ cần nhập tồn kho;
              giá tham khảo hiển thị bằng USD; hệ thống quy đổi theo 23.000
              VNĐ/USD để kiểm tra ngưỡng yêu cầu.
            </p>
            <p className="mt-1 text-[11px] leading-5 text-amber-200/75">
              Ảnh tự lấy từ PokéWallet khi đã cấu hình API key. Có thể chọn ảnh
              riêng để thay thế; ảnh lưu khi bấm thêm/cập nhật.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadRiftboundCatalog()}
            disabled={isLoadingRiftbound}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-cyan-100/20 px-3 text-sm text-cyan-100 transition hover:bg-cyan-100/[0.06] disabled:cursor-wait disabled:opacity-60"
          >
            {isLoadingRiftbound ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {isLoadingRiftbound ? "Đang tải catalog..." : "Tải catalog API"}
          </button>
        </div>
        {riftboundWarning && (
          <p className="rounded-lg border border-amber-300/15 bg-amber-300/[0.05] px-3 py-2 text-xs leading-5 text-amber-200">
            {riftboundWarning}
          </p>
        )}
        {riftboundError && (
          <p
            role="alert"
            className="rounded-lg border border-red-400/20 bg-red-400/[0.06] px-3 py-2 text-xs leading-5 text-red-300"
          >
            {riftboundError}
          </p>
        )}
        {riftboundCards.length > 0 && (
          <>
            <label className="block max-w-sm space-y-1.5 text-xs text-zinc-400">
              Bộ thẻ
              <select
                value={riftboundSetId}
                onChange={(event) => {
                  setRiftboundSetId(event.target.value);
                  setVisibleRiftboundCount(36);
                }}
                className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#090b0c] px-3 text-sm text-white outline-none focus:border-cyan-100/30"
              >
                <option value="all">Tất cả 5 set chính</option>
                {[...new Map(
                  riftboundCards.map((card) => [card.setSlug, card.setName]),
                )].map(([setSlug, setName]) => (
                  <option key={setSlug} value={setSlug}>
                    {setName}
                  </option>
                ))}
              </select>
            </label>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={riftboundSearch}
                onChange={(event) => {
                  setRiftboundSearch(event.target.value);
                  setVisibleRiftboundCount(36);
                }}
                placeholder="Tìm tên thẻ, set..."
                className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#090b0c] pl-9 pr-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-100/30"
              />
            </label>
            <p className="text-xs text-zinc-500">
              {filteredRiftboundCards.length} lá bài
              {riftboundSearch ? " phù hợp" : " từ OpenRift"}.
              {riftboundWarning
                ? " Chưa thể tính giá bán cho tất cả thẻ."
                : " Giá tham khảo TCGplayer có thể trống ở một số lá."}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visibleRiftboundCards.map((card) => {
                const values = getRiftboundValues(card);
                const isSavingCard = savingRiftboundId === card.printingId;
                const image = riftboundImages[card.printingId];
                const imageUrl =
                  image?.previewUrl ||
                  values.savedProduct?.imageUrl ||
                  card.imageUrl;
                return (
                  <article
                    key={card.printingId}
                    className="flex min-w-0 flex-col gap-3 rounded-xl border border-white/[0.07] bg-[#090b0c] p-3"
                  >
                    <div className="flex min-w-0 gap-3">
                      <label
                        className="relative flex h-28 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#1a1d1e] text-zinc-600"
                        title="Chọn ảnh thẻ bạn có quyền sử dụng"
                      >
                        {imageUrl ? (
                          <span
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url("${imageUrl}")` }}
                            role="img"
                            aria-label={`Ảnh ${card.cardName}`}
                          />
                        ) : (
                          <ImageIcon className="h-6 w-6" />
                        )}
                        <input
                          className="sr-only"
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            setRiftboundImages((current) => {
                              const updated = { ...current };
                              if (file) {
                                updated[card.printingId] = {
                                  file,
                                  previewUrl: URL.createObjectURL(file),
                                };
                              } else {
                                delete updated[card.printingId];
                              }
                              return updated;
                            });
                          }}
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-black/75 py-1 text-center text-[10px] font-medium text-white">
                          {image ? "Đã chọn" : "Tải ảnh"}
                        </span>
                      </label>
                      <div className="min-w-0 flex-1">
                        <h4 className="line-clamp-2 text-sm font-medium text-white">
                          {card.cardName}
                        </h4>
                        <p className="mt-1 truncate text-xs text-zinc-400">
                          {card.setName} · {card.collectorNumber}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {card.faction}
                        </p>
                        <p className="mt-2 text-xs font-medium text-cyan-100">
                          {card.tcgplayerPriceUsd !== null
                            ? `TCGplayer: $${card.tcgplayerPriceUsd.toFixed(2)} USD`
                            : "Chưa có giá TCGplayer"}
                        </p>
                        <p className="mt-1 text-[11px] text-zinc-500">
                          Giá quy đổi nội bộ:{" "}
                          {card.sellingPriceVnd !== null
                            ? formatPrice(card.sellingPriceVnd)
                            : "Chưa quy đổi"}
                        </p>
                        {values.savedProduct && (
                          <p className="mt-1 text-[11px] text-emerald-300">
                            Đã có trong kho · tồn {values.savedProduct.stock}
                          </p>
                        )}
                      </div>
                    </div>
                    <label className="block max-w-40 space-y-1 text-[11px] text-zinc-500">
                      Tồn kho
                      <input
                        required
                        type="number"
                        min={0}
                        step={1}
                        value={values.stock}
                        onChange={(event) =>
                          setRiftboundValues((current) => ({
                            ...current,
                            [card.printingId]: { stock: event.target.value },
                          }))
                        }
                        className="h-9 w-full rounded-lg border border-white/[0.08] bg-[#101314] px-2 text-sm text-white outline-none focus:border-cyan-100/30"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => void saveRiftboundCard(card)}
                      disabled={isSavingCard}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-cyan-100 px-3 text-xs font-semibold text-[#07191c] transition hover:bg-cyan-50 disabled:cursor-wait disabled:opacity-60"
                    >
                      {isSavingCard && (
                        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                      )}
                      {values.savedProduct
                        ? "Cập nhật tồn kho"
                        : "Thêm vào sản phẩm"}
                    </button>
                  </article>
                );
              })}
            </div>
            {visibleRiftboundCount < filteredRiftboundCards.length && (
              <button
                type="button"
                onClick={() =>
                  setVisibleRiftboundCount((current) => current + 36)
                }
                className="h-9 rounded-lg border border-white/[0.1] px-4 text-xs text-zinc-300 transition hover:bg-white/[0.04]"
              >
                Tải thêm lá bài
              </button>
            )}
          </>
        )}
      </section>

      <form
        onSubmit={saveProduct}
        className="grid gap-4 rounded-xl border border-white/[0.07] bg-[#0c0e0f] p-4 sm:grid-cols-2 sm:p-5"
      >
        <div className="flex items-center justify-between gap-3 sm:col-span-2">
          <h3 className="text-sm font-medium text-zinc-200">
            {editingId ? "Chỉnh sửa sản phẩm" : "Thông tin sản phẩm mới"}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={startCreate}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
              Hủy chỉnh sửa
            </button>
          )}
        </div>

        <label className="space-y-1.5 text-xs text-zinc-400">
          Tên sản phẩm
          <input
            required
            minLength={2}
            maxLength={120}
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#090b0c] px-3 text-sm text-white outline-none focus:border-[#d4a537]/50"
          />
        </label>

        <label className="space-y-1.5 text-xs text-zinc-400">
          Loại sản phẩm
          <select
            value={form.type}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                type: event.target.value as ProductType,
                game:
                  event.target.value === "card"
                    ? current.game
                    : null,
                rarityId: null,
              }))
            }
            className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#090b0c] px-3 text-sm text-white outline-none focus:border-[#d4a537]/50"
          >
            <option value="box">Box</option>
            <option value="pack">Pack</option>
            <option value="card">Thẻ bài</option>
          </select>
        </label>

        {form.type === "card" && (
          <label className="space-y-1.5 text-xs text-zinc-400">
            Game / TCG
            <select
              value={form.game ?? ""}
              onChange={(event) => {
                const selectedGame = productGames.find(
                  (game) => game.id === event.target.value,
                );
                updateField("game", selectedGame?.id ?? null);
              }}
              className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#090b0c] px-3 text-sm text-white outline-none focus:border-[#d4a537]/50"
            >
              <option value="">Chưa phân loại</option>
              {productGames.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="space-y-1.5 text-xs text-zinc-400">
          {form.type === "card" ? "Giá tham khảo (VNĐ)" : "Giá bán (VNĐ)"}
          <input
            required
            type="number"
            min={1}
            step={1}
            value={form.price}
            onChange={(event) =>
              updateField("price", Number(event.target.value))
            }
            className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#090b0c] px-3 text-sm text-white outline-none focus:border-[#d4a537]/50"
          />
        </label>

        <label className="space-y-1.5 text-xs text-zinc-400">
          Số lượng tồn kho
          <input
            required
            type="number"
            min={0}
            step={1}
            value={form.stock}
            onChange={(event) =>
              updateField("stock", Number(event.target.value))
            }
            className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#090b0c] px-3 text-sm text-white outline-none focus:border-[#d4a537]/50"
          />
        </label>

        <label className="space-y-2 text-xs text-zinc-400 sm:col-span-2">
          Ảnh sản phẩm
          {form.featured
            ? " (bắt buộc khi hiển thị nổi bật)"
            : " (không bắt buộc)"}
          , tối đa 5 MB
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setImageFile(file);
              setImagePreview(file ? URL.createObjectURL(file) : "");
            }}
            className="block w-full cursor-pointer rounded-lg border border-white/[0.08] bg-[#090b0c] text-sm text-zinc-300 file:mr-4 file:h-10 file:border-0 file:bg-white/[0.06] file:px-4 file:text-xs file:font-medium file:text-zinc-200 hover:file:bg-white/[0.1]"
          />
          {imagePreview || editingProduct?.imageUrl ? (
            <div
              role="img"
              aria-label="Ảnh xem trước sản phẩm"
              className="h-40 w-32 rounded-xl border border-white/[0.08] bg-cover bg-center"
              style={{
                backgroundImage: `url("${imagePreview || editingProduct?.imageUrl}")`,
              }}
            />
          ) : null}
        </label>

        <label className="space-y-1.5 text-xs text-zinc-400 sm:col-span-2">
          Mô tả
          <textarea
            maxLength={1200}
            rows={3}
            value={form.description}
            onChange={(event) =>
              updateField("description", event.target.value)
            }
            className="w-full resize-y rounded-lg border border-white/[0.08] bg-[#090b0c] px-3 py-2.5 text-sm text-white outline-none focus:border-[#d4a537]/50"
          />
        </label>

        <label className="space-y-1.5 text-xs text-zinc-400">
          Hashtag
          <input
            value={form.hashtags.join(", ")}
            onChange={(event) =>
              updateField(
                "hashtags",
                event.target.value.split(",").map((tag) => tag.trim()),
              )
            }
            placeholder="#pokemon, #tcg, #rare"
            className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#090b0c] px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#d4a537]/50"
          />
          <span className="block text-[11px] text-zinc-600">
            Phân tách hashtag bằng dấu phẩy, tối đa 10 hashtag.
          </span>
        </label>

        <label className="flex items-center gap-2 text-xs text-zinc-300">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(event) =>
              updateField("featured", event.target.checked)
            }
            className="h-4 w-4 accent-[#d4a537]"
          />
          <Star className="h-3.5 w-3.5 text-[#e5bf62]" />
          Hiển thị nổi bật trên banner trang chủ
        </label>

        <label className="flex items-center gap-2 text-xs text-zinc-300">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => updateField("active", event.target.checked)}
            className="h-4 w-4 accent-[#d4a537]"
          />
          Đang kinh doanh
        </label>

        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#d4a537] px-4 text-sm font-semibold text-[#211805] transition hover:bg-[#e4bd5d] disabled:cursor-wait disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {isSaving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Tạo sản phẩm"}
          </button>
        </div>
      </form>

      <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => {
          return (
          <article
            key={product.id}
            className="flex h-full flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-[#0c0e0f]"
          >
            {product.imageUrl ? (
              <div
                role="img"
                aria-label={product.name}
                className="aspect-[4/3] bg-[#151413] bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: `url("${product.imageUrl}")` }}
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-[#29251b] to-[#111416] text-zinc-600">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}
            <div className="flex flex-1 flex-col p-4">
              <div className="flex min-h-12 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-2 min-h-10 font-medium text-zinc-100">
                    {product.name}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[10px] ${
                    product.active
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-white/[0.06] text-zinc-500"
                  }`}
                >
                  {product.active ? "Đang bán" : "Đã ẩn"}
                </span>
              </div>
              <p className="mt-2 min-h-6 text-sm font-semibold text-[#e5bf62]">
                {typeof product.riftbound?.tcgplayerPriceUsd === "number"
                  ? `$${product.riftbound.tcgplayerPriceUsd.toFixed(2)} USD`
                  : formatPrice(product.price)}
                <span className="ml-2 text-[10px] font-normal text-zinc-500">
                  {product.type === "card"
                    ? "Giá tham khảo"
                    : typeLabels[product.type]}
                </span>
              </p>
              {product.game && (
                <p className="mt-1 text-[11px] text-cyan-100/80">
                  {productGames.find((game) => game.id === product.game)?.name}
                </p>
              )}
              {product.riftbound && (
                <div className="mt-1 space-y-0.5 text-[11px] text-zinc-400">
                  <p>
                    {product.riftbound.setName} · {product.riftbound.collectorNumber}
                  </p>
                  <p className="text-cyan-100">
                    Giá tham khảo TCGplayer:{" "}
                    {product.riftbound.tcgplayerPriceUsd !== null
                      ? `$${product.riftbound.tcgplayerPriceUsd.toFixed(2)} USD`
                      : "Chưa có"}
                  </p>
                </div>
              )}
              <div className="mt-2 flex min-h-7 flex-wrap items-center gap-2 text-[11px]">
                <span className="text-zinc-500">Tồn kho: {product.stock}</span>
                {product.featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#d4a537]/10 px-2 py-1 text-[#e5bf62]">
                    <Star className="h-3 w-3" />
                    Nổi bật
                  </span>
                )}
              </div>
              <p
                className={`mt-2 min-h-10 line-clamp-2 text-xs leading-5 text-zinc-500 ${
                  product.description ? "" : "invisible"
                }`}
              >
                  {product.description}
              </p>
              <div className="mt-3 flex min-h-10 flex-wrap content-start gap-1.5 border-t border-white/[0.06] pt-2">
                  {product.hashtags.map((hashtag) => (
                    <span
                      key={hashtag}
                      className="rounded-full bg-white/[0.05] px-2 py-1 text-[10px] text-zinc-400"
                    >
                      {hashtag}
                    </span>
                  ))}
              </div>
              <div className="mt-auto flex gap-2 border-t border-white/[0.06] pt-3">
                <button
                  type="button"
                  onClick={() => startEdit(product)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 text-xs text-zinc-300 transition hover:bg-white/[0.05]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => void deleteProduct(product)}
                  disabled={deletingId === product.id}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-400/15 px-3 text-xs text-red-300 transition hover:bg-red-400/[0.08] disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {deletingId === product.id ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            </div>
          </article>
          );
        })}
        {products.length === 0 && (
          <p className="rounded-xl border border-dashed border-white/[0.1] px-4 py-10 text-center text-sm text-zinc-500 md:col-span-2 xl:col-span-3">
            Chưa có sản phẩm. Thêm sản phẩm đầu tiên để bắt đầu.
          </p>
        )}
      </div>
    </section>
  );
}
