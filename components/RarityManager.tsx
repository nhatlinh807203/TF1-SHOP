"use client";

import { useState, type FormEvent } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import type { RarityView } from "@/lib/rarities";

interface RarityManagerProps {
  initialRarities: RarityView[];
}

export default function RarityManager({
  initialRarities,
}: RarityManagerProps) {
  const [rarities, setRarities] = useState(initialRarities);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function clearForm() {
    setName("");
    setEditingId(null);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function editRarity(rarity: RarityView) {
    setName(rarity.name);
    setEditingId(rarity.id);
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function saveRarity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const formData = new FormData();
    formData.set("name", name);
    try {
      const response = await fetch(
        editingId
          ? `/api/admin/rarities/${encodeURIComponent(editingId)}`
          : "/api/admin/rarities",
        {
          method: editingId ? "PATCH" : "POST",
          body: formData,
        },
      );
      const result = (await response.json()) as {
        message?: string;
        rarity?: RarityView;
      };
      if (!response.ok || !result.rarity) {
        setErrorMessage(result.message ?? "Không thể lưu độ hiếm.");
        return;
      }

      const savedRarity = result.rarity;
      setRarities([
        savedRarity,
        ...rarities.filter((rarity) => rarity.id !== savedRarity.id),
      ]);
      clearForm();
      setSuccessMessage(
        editingId ? "Đã cập nhật độ hiếm." : "Đã thêm độ hiếm.",
      );
    } catch {
      setErrorMessage("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteRarity(rarity: RarityView) {
    if (!window.confirm(`Bạn có chắc muốn xóa độ hiếm "${rarity.name}"?`)) {
      return;
    }

    setDeletingId(rarity.id);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await fetch(
        `/api/admin/rarities/${encodeURIComponent(rarity.id)}`,
        { method: "DELETE" },
      );
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setErrorMessage(result.message ?? "Không thể xóa độ hiếm.");
        return;
      }

      setRarities(rarities.filter((item) => item.id !== rarity.id));
      if (editingId === rarity.id) {
        clearForm();
      }
      setSuccessMessage("Đã xóa độ hiếm.");
    } catch {
      setErrorMessage("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section
      id="rarities"
      className="scroll-mt-24 space-y-5 rounded-2xl border border-white/[0.07] bg-[#101314] p-5 sm:p-6"
    >
      <div>
        <h2 className="font-semibold">Quản lý độ hiếm</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Tạo các mức độ hiếm để lựa chọn khi thêm hoặc sửa sản phẩm thẻ bài.
        </p>
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
        onSubmit={saveRarity}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-white/[0.07] bg-[#0c0e0f] p-4 sm:p-5"
      >
        <label className="min-w-56 flex-1 space-y-1.5 text-xs text-zinc-400">
          Tên độ hiếm
          <input
            required
            maxLength={60}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ví dụ: Common, Rare, Ultra Rare..."
            className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#090b0c] px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#d4a537]/50"
          />
        </label>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#d4a537] px-4 text-sm font-semibold text-[#211805] transition hover:bg-[#e4bd5d] disabled:opacity-60"
        >
          {editingId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isSaving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm độ hiếm"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={clearForm}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/[0.1] px-3 text-sm text-zinc-400 hover:text-white"
          >
            <X className="h-4 w-4" />
            Hủy
          </button>
        )}
      </form>

      <div className="flex flex-wrap gap-2">
        {rarities.map((rarity) => (
          <article
            key={rarity.id}
            className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#0c0e0f] py-1.5 pl-3 pr-1.5"
          >
            <span className="text-sm text-zinc-200">{rarity.name}</span>
            <button
              type="button"
              onClick={() => editRarity(rarity)}
              aria-label={`Sửa độ hiếm ${rarity.name}`}
              className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-white/[0.06] hover:text-white"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => void deleteRarity(rarity)}
              disabled={deletingId === rarity.id}
              aria-label={`Xóa độ hiếm ${rarity.name}`}
              className="flex h-7 w-7 items-center justify-center rounded-full text-red-300 hover:bg-red-400/[0.08] disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </article>
        ))}
        {rarities.length === 0 && (
          <p className="w-full rounded-xl border border-dashed border-white/[0.1] px-4 py-8 text-center text-sm text-zinc-500">
            Chưa có độ hiếm. Thêm các mức tại đây trước khi nhập thẻ bài.
          </p>
        )}
      </div>
    </section>
  );
}
