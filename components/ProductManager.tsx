"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Check,
  Image as ImageIcon,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import type { ProductType } from "@/lib/db";
import type { EnergyView } from "@/lib/energies";
import type { ProductInput, ProductView } from "@/lib/products";
import type { RarityView } from "@/lib/rarities";
import type { RoleView } from "@/lib/roles";

interface ProductManagerProps {
  initialProducts: ProductView[];
  energies: EnergyView[];
  rarities: RarityView[];
  roles: RoleView[];
}

const emptyProduct: ProductInput = {
  name: "",
  type: "box",
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
  energies,
  rarities,
  roles,
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
  const editingProduct = products.find((product) => product.id === editingId);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

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

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.energyIds.length < 1 || form.energyIds.length > 2) {
      setErrorMessage("Mỗi sản phẩm cần chọn tối thiểu 1 và tối đa 2 năng lượng.");
      return;
    }
    if (energies.length === 0) {
      setErrorMessage("Hãy thêm năng lượng trước khi tạo sản phẩm.");
      return;
    }
    if (!form.roleId || roles.length === 0) {
      setErrorMessage(
        roles.length === 0
          ? "Hãy thêm role trước khi tạo sản phẩm."
          : "Vui lòng chọn một role cho sản phẩm.",
      );
      return;
    }
    if (form.featured && !imageFile && !editingProduct?.imageUrl) {
      setErrorMessage(
        "Vui lòng tải ảnh sản phẩm lên trước khi bật hiển thị nổi bật.",
      );
      return;
    }
    if (form.type === "card" && !form.rarityId) {
      setErrorMessage("Vui lòng chọn độ hiếm cho thẻ bài.");
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

        <label className="space-y-1.5 text-xs text-zinc-400">
          Giá bán (VNĐ)
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

        <fieldset className="space-y-2 sm:col-span-2">
          <legend className="text-xs text-zinc-400">
            Năng lượng <span className="text-red-300">*</span>
            <span className="ml-2 text-zinc-600">
              Chọn tối thiểu 1, tối đa 2
            </span>
          </legend>
          {energies.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/[0.1] px-3 py-4 text-xs text-zinc-500">
              Chưa có năng lượng. Hãy tạo năng lượng ở mục quản lý năng lượng phía trên.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {energies.map((energy) => {
                const selected = form.energyIds.includes(energy.id);
                const selectionLimitReached = form.energyIds.length >= 2;
                return (
                  <label
                    key={energy.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 transition ${
                      selected
                        ? "border-[#d4a537]/50 bg-[#d4a537]/[0.06]"
                        : "border-white/[0.08] bg-[#090b0c] hover:border-white/[0.16]"
                    } ${
                      !selected && selectionLimitReached
                        ? "cursor-not-allowed opacity-45"
                        : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={!selected && selectionLimitReached}
                      onChange={() =>
                        updateField(
                          "energyIds",
                          selected
                            ? form.energyIds.filter((id) => id !== energy.id)
                            : [...form.energyIds, energy.id],
                        )
                      }
                      className="h-4 w-4 accent-[#d4a537]"
                    />
                    <span
                      aria-hidden="true"
                      className="h-10 w-10 shrink-0 rounded-lg bg-cover bg-center"
                      style={{ backgroundImage: `url("${energy.imageUrl}")` }}
                    />
                    <span className="text-sm text-zinc-200">{energy.name}</span>
                  </label>
                );
              })}
            </div>
          )}
          <p className="text-[11px] text-zinc-600">
            Đã chọn {form.energyIds.length}/2 năng lượng.
          </p>
        </fieldset>

        <fieldset className="space-y-2 sm:col-span-2">
          <legend className="text-xs text-zinc-400">
            Role <span className="text-red-300">*</span>
            <span className="ml-2 text-zinc-600">Chọn 1 role</span>
          </legend>
          {roles.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/[0.1] px-3 py-4 text-xs text-zinc-500">
              Chưa có role. Hãy tạo role ở mục quản lý role trước.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {roles.map((role) => (
                <label
                  key={role.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 transition ${
                    form.roleId === role.id
                      ? "border-[#d4a537]/50 bg-[#d4a537]/[0.06]"
                      : "border-white/[0.08] bg-[#090b0c] hover:border-white/[0.16]"
                  }`}
                >
                  <input
                    type="radio"
                    name="product-role"
                    required
                    checked={form.roleId === role.id}
                    onChange={() => updateField("roleId", role.id)}
                    className="h-4 w-4 accent-[#d4a537]"
                  />
                  <span
                    aria-hidden="true"
                    className="h-10 w-10 shrink-0 rounded-full bg-cover bg-center"
                    style={{ backgroundImage: `url("${role.imageUrl}")` }}
                  />
                  <span className="text-sm text-zinc-200">{role.name}</span>
                </label>
              ))}
            </div>
          )}
        </fieldset>

        <label className="space-y-1.5 text-xs text-zinc-400">
          Độ hiếm của thẻ
          {form.type === "card" && <span className="text-red-300"> *</span>}
          <select
            required={form.type === "card"}
            disabled={form.type !== "card" || rarities.length === 0}
            value={form.rarityId ?? ""}
            onChange={(event) =>
              updateField("rarityId", event.target.value || null)
            }
            className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#090b0c] px-3 text-sm text-white outline-none focus:border-[#d4a537]/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">
              {rarities.length === 0
                ? "Chưa có độ hiếm"
                : form.type === "card"
                  ? "Chọn độ hiếm"
                  : "Chỉ áp dụng cho thẻ bài"}
            </option>
            {rarities.map((rarity) => (
              <option key={rarity.id} value={rarity.id}>
                {rarity.name}
              </option>
            ))}
          </select>
          {rarities.length === 0 && (
            <span className="block text-[11px] text-amber-300">
              Hãy thêm độ hiếm ở mục quản lý độ hiếm phía trên.
            </span>
          )}
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
          const rarity = rarities.find(
            (item) => item.id === product.rarityId,
          );
          const role = roles.find((item) => item.id === product.roleId);
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
                {formatPrice(product.price)}
                <span className="ml-2 text-[10px] font-normal text-zinc-500">
                  {typeLabels[product.type]}
                </span>
              </p>
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
                  {role && (
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] py-1 pl-1 pr-2 text-[10px] text-zinc-300">
                      <span
                        aria-hidden="true"
                        className="h-5 w-5 shrink-0 rounded-full bg-cover bg-center"
                        style={{ backgroundImage: `url("${role.imageUrl}")` }}
                      />
                      <span className="max-w-20 truncate">{role.name}</span>
                    </span>
                  )}
                  {rarity && (
                    <span className="inline-flex h-7 items-center rounded-full bg-amber-300/[0.08] px-2 text-[10px] text-amber-200">
                      {rarity.name}
                    </span>
                  )}
                  {product.energyIds.map(
                    (energyId) =>
                      energies.find((energy) => energy.id === energyId) && (
                        <span
                          key={energyId}
                          className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-2 py-1 text-[10px] text-cyan-200"
                        >
                          {energies.find((energy) => energy.id === energyId)?.name}
                        </span>
                      ),
                  )}
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
