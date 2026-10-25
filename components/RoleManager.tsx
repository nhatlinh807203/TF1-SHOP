"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check, Image as ImageIcon, Pencil, Trash2, X } from "lucide-react";
import type { RoleView } from "@/lib/roles";

interface RoleManagerProps {
  initialRoles: RoleView[];
}

export default function RoleManager({ initialRoles }: RoleManagerProps) {
  const [roles, setRoles] = useState(initialRoles);
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

  function editRole(role: RoleView) {
    setName(role.name);
    setImageFile(null);
    setImagePreview(role.imageUrl);
    setEditingId(role.id);
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function saveRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId && !imageFile) {
      setErrorMessage("Vui lòng chọn ảnh cho role.");
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
          ? `/api/admin/roles/${encodeURIComponent(editingId)}`
          : "/api/admin/roles",
        {
          method: editingId ? "PATCH" : "POST",
          body: formData,
        },
      );
      const result = (await response.json()) as {
        message?: string;
        role?: RoleView;
      };
      if (!response.ok || !result.role) {
        setErrorMessage(result.message ?? "Không thể lưu role.");
        return;
      }

      const savedRole = result.role;
      setRoles((current) => [
        savedRole,
        ...current.filter((role) => role.id !== savedRole.id),
      ]);
      const message = editingId ? "Đã cập nhật role." : "Đã thêm role.";
      clearForm();
      setSuccessMessage(message);
    } catch {
      setErrorMessage("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteRole(role: RoleView) {
    if (!window.confirm(`Bạn có chắc muốn xóa role "${role.name}"?`)) {
      return;
    }

    setDeletingId(role.id);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await fetch(
        `/api/admin/roles/${encodeURIComponent(role.id)}`,
        { method: "DELETE" },
      );
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setErrorMessage(result.message ?? "Không thể xóa role.");
        return;
      }

      setRoles((current) => current.filter((item) => item.id !== role.id));
      if (editingId === role.id) {
        clearForm();
      }
      setSuccessMessage("Đã xóa role.");
    } catch {
      setErrorMessage("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="space-y-5 rounded-2xl border border-white/[0.07] bg-[#101314] p-5 sm:p-6">
      <div>
        <h2 className="font-semibold">Quản lý role</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Tạo role kèm ảnh tại đây. Khi thêm hoặc sửa sản phẩm, hãy chọn một role.
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
        onSubmit={saveRole}
        className="grid gap-4 rounded-xl border border-white/[0.07] bg-[#0c0e0f] p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-5"
      >
        <label className="space-y-1.5 text-xs text-zinc-400">
          Tên role
          <input
            required
            maxLength={60}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nhập tên role"
            className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#090b0c] px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#d4a537]/50"
          />
        </label>
        <label className="space-y-1.5 text-xs text-zinc-400">
          Ảnh role {editingId ? "(không bắt buộc nếu giữ ảnh cũ)" : ""}
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
              aria-label="Xem trước ảnh role"
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
        {roles.map((role) => (
          <article
            key={role.id}
            className="flex min-w-52 items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0c0e0f] p-3"
          >
            <span
              role="img"
              aria-label={`Ảnh role ${role.name}`}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-cover bg-center bg-white/[0.06] text-zinc-500"
              style={{ backgroundImage: `url("${role.imageUrl}")` }}
            >
              {!role.imageUrl && <ImageIcon className="h-5 w-5" />}
            </span>
            <span className="flex-1 text-sm text-zinc-200">{role.name}</span>
            <button
              type="button"
              onClick={() => editRole(role)}
              aria-label={`Sửa role ${role.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => void deleteRole(role)}
              disabled={deletingId === role.id}
              aria-label={`Xóa role ${role.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-red-300 hover:bg-red-400/[0.08] disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </article>
        ))}
        {roles.length === 0 && (
          <p className="w-full rounded-xl border border-dashed border-white/[0.1] px-4 py-8 text-center text-sm text-zinc-500">
            Chưa có role. Hãy thêm tên và ảnh trước khi tạo sản phẩm.
          </p>
        )}
      </div>
    </section>
  );
}
