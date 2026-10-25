import { Suspense } from "react";
import AdminManagementShell from "@/components/AdminManagementShell";
import RarityManager from "@/components/RarityManager";
import { requireAdmin } from "@/lib/auth";
import { getRaritiesCollection } from "@/lib/db";
import { serializeRarity } from "@/lib/rarities";

export default function AdminRaritiesPage() {
  return (
    <Suspense fallback={<AdminSectionLoading />}>
      <AdminRaritiesContent />
    </Suspense>
  );
}

async function AdminRaritiesContent() {
  const admin = await requireAdmin();
  const rarities = await (
    await getRaritiesCollection()
  )
    .find({})
    .sort({ name: 1 })
    .toArray();

  return (
    <AdminManagementShell
      admin={{ name: admin.name, email: admin.email }}
      title="Quản lý độ hiếm"
    >
      <RarityManager initialRarities={rarities.map(serializeRarity)} />
    </AdminManagementShell>
  );
}

function AdminSectionLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090b0c] text-sm text-zinc-400">
      Đang tải trang quản trị...
    </main>
  );
}
