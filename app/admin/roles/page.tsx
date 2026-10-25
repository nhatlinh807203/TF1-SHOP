import { Suspense } from "react";
import AdminManagementShell from "@/components/AdminManagementShell";
import RoleManager from "@/components/RoleManager";
import { requireAdmin } from "@/lib/auth";
import { getRolesCollection } from "@/lib/db";
import { serializeRole } from "@/lib/roles";

export default function AdminRolesPage() {
  return (
    <Suspense fallback={<AdminSectionLoading />}>
      <AdminRolesContent />
    </Suspense>
  );
}

async function AdminRolesContent() {
  const admin = await requireAdmin();
  const roles = await (
    await getRolesCollection()
  )
    .find({}, { projection: { imageData: 0 } })
    .sort({ name: 1 })
    .toArray();

  return (
    <AdminManagementShell
      admin={{ name: admin.name, email: admin.email }}
      title="Quản lý role"
    >
      <RoleManager initialRoles={roles.map(serializeRole)} />
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
