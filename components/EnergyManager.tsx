"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check, Image as ImageIcon, Pencil, Trash2, X } from "lucide-react";
import type { EnergyView } from "@/lib/energies";

interface EnergyManagerProps {
  initialEnergies: EnergyView[];
}

export default function EnergyManager({
  initialEnergies,
}: EnergyManagerProps) {
  const [energies, setEnergies] = useState(initialEnergies);
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  function clearForm() {
    setName("");
    setImageFile(null);
    setImagePreview("");
    setEditingId(null);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function editEnergy(energy: EnergyView) {
    setName(energy.name);
    setImageFile(null);
    setImagePreview(energy.imageUrl);
    setEditingId(energy.id);
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function saveEnergy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId && !imageFile) {
      setErrorMessage("Vui lòng chọn ảnh cho năng lượng.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    if (imageFile) {
      formData.append("image", imageFile);
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await fetch(
        editingId
          ? `/api/admin/energies/${encodeURIComponent(editingId)}`
          : "/api/admin/energies",
        {
          method: editingId ? "PATCH" : "POST",
          body: formData,
        },
      );
      const result = (await response.json()) as {
        message?: string;
        energy?: EnergyView;
      };
      if (!response.ok || !result.energy) {
        setErrorMessage(result.message ?? "Không thể lưu năng lượng.");
        return;
      }

      setEnergies([
        result.energy,
        ...energies.filter((energy) => energy.id !== result.energy?.id),
      ]);
      const message = editingId
        ? "Đã cập nhật năng lượng."
        : "Đã thêm năng lượng.";
      clearForm();
      setSuccessMessage(message);
    } catch {
      setErrorMessage("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteEnergy(energy: EnergyView) {
    if (!window.confirm(`Bạn có chắc muốn xóa năng lượng "${energy.name}"?`)) {
      return;
    }

    setDeletingId(energy.id);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await fetch(
        `/api/admin/energies/${encodeURIComponent(energy.id)}`,
        { method: "DELETE" },
      );
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setErrorMessage(result.message ?? "Không thể xóa năng lượng.");
        return;
      }

      setEnergies(energies.filter((item) => item.id !== energy.id));
      if (editingId === energy.id) {
        clearForm();
      }
      setSuccessMessage("Đã xóa năng lượng.");
    } catch {
      setErrorMessage("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section
      id="energies"
      className="scroll-mt-24 space-y-5 rounded-2xl border border-white/[0.07] bg-[#101314] p-5 sm:p-6"
    >
      <div>
        <h2 className="font-semibold">Quản lý năng lượng</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Tạo năng lượng kèm ảnh tại đây. Sau đó chọn từ danh sách khi thêm sản phẩm.
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
        onSubmit={saveEnergy}
        className="grid gap-4 rounded-xl border border-white/[0.07] bg-[#0c0e0f] p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-5"
      >
        <label className="space-y-1.5 text-xs text-zinc-400">
          Tên năng lượng
          <input
            required
            maxLength={60}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ví dụ: Fire, Water..."
            className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#090b0c] px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#d4a537]/50"
          />
        </label>
        <label className="space-y-1.5 text-xs text-zinc-400">
          Ảnh năng lượng {editingId ? "(không bắt buộc nếu giữ ảnh cũ)" : ""}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            required={!editingId}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setImageFile(file);
              setImagePreview(file ? URL.createObjectURL(file) : "");
            }}
            className="block w-full cursor-pointer rounded-lg border border-white/[0.08] bg-[#090b0c] text-sm text-zinc-300 file:mr-3 file:h-10 file:border-0 file:bg-white/[0.06] file:px-3 file:text-xs file:font-medium file:text-zinc-200"
          />
          {imagePreview && (
            <div
              role="img"
              aria-label="Xem trước ảnh năng lượng"
              className="h-12 w-12 rounded-full bg-cover bg-center"
              style={{ backgroundImage: `url("${imagePreview}")` }}
            />
          )}
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#d4a537] px-4 text-sm font-semibold text-[#211805] transition hover:bg-[#e4bd5d] disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {isSaving ? "Đang lưu..." : editingId ? "Lưu" : "Thêm"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={clearForm}
              aria-label="Hủy chỉnh sửa"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.1] text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      <div className="flex flex-wrap gap-3">
        {energies.map((energy) => (
          <article
            key={energy.id}
            className="flex min-w-52 items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0c0e0f] p-3"
          >
            <span
              role="img"
              aria-label={`Ảnh năng lượng ${energy.name}`}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-cover bg-center bg-white/[0.06] text-zinc-500"
              style={{ backgroundImage: `url("${energy.imageUrl}")` }}
            >
              {!energy.imageUrl && <ImageIcon className="h-5 w-5" />}
            </span>
            <span className="flex-1 text-sm text-zinc-200">{energy.name}</span>
            <button
              type="button"
              onClick={() => editEnergy(energy)}
              aria-label={`Sửa ${energy.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => void deleteEnergy(energy)}
              disabled={deletingId === energy.id}
              aria-label={`Xóa ${energy.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-red-300 hover:bg-red-400/[0.08] disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </article>
        ))}
        {energies.length === 0 && (
          <p className="w-full rounded-xl border border-dashed border-white/[0.1] px-4 py-8 text-center text-sm text-zinc-500">
            Chưa có năng lượng. Hãy thêm tên và ảnh trước khi tạo sản phẩm.
          </p>
        )}
      </div>
    </section>
  );
}
