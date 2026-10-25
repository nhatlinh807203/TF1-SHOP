import { Suspense } from "react";
import AdminManagementShell from "@/components/AdminManagementShell";
import EnergyManager from "@/components/EnergyManager";
import { requireAdmin } from "@/lib/auth";
import { getEnergiesCollection } from "@/lib/db";
import { serializeEnergy } from "@/lib/energies";

export default function AdminEnergiesPage() {
  return (
    <Suspense fallback={<AdminSectionLoading />}>
      <AdminEnergiesContent />
    </Suspense>
  );
}

async function AdminEnergiesContent() {
  const admin = await requireAdmin();
  const energies = await (
    await getEnergiesCollection()
  )
    .find({}, { projection: { imageData: 0 } })
    .sort({ name: 1 })
    .toArray();

  return (
    <AdminManagementShell
      admin={{ name: admin.name, email: admin.email }}
      title="Quản lý năng lượng"
    >
      <EnergyManager initialEnergies={energies.map(serializeEnergy)} />
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
