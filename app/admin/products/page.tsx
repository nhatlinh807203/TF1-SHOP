import { Suspense } from "react";
import AdminManagementShell from "@/components/AdminManagementShell";
import ProductManager from "@/components/ProductManager";
import { requireAdmin } from "@/lib/auth";
import {
  getEnergiesCollection,
  getProductsCollection,
  getRaritiesCollection,
  getRolesCollection,
} from "@/lib/db";
import { serializeEnergy } from "@/lib/energies";
import { serializeProduct } from "@/lib/products";
import { serializeRarity } from "@/lib/rarities";
import { serializeRole } from "@/lib/roles";

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<AdminSectionLoading />}>
      <AdminProductsContent />
    </Suspense>
  );
}

async function AdminProductsContent() {
  const admin = await requireAdmin();
  const [productsCollection, energiesCollection, raritiesCollection, rolesCollection] =
    await Promise.all([
      getProductsCollection(),
      getEnergiesCollection(),
      getRaritiesCollection(),
      getRolesCollection(),
    ]);
  const [products, energies, rarities, roles] = await Promise.all([
    productsCollection
      .find({}, { projection: { imageData: 0 } })
      .sort({ updatedAt: -1 })
      .limit(200)
      .toArray(),
    energiesCollection
      .find({}, { projection: { imageData: 0 } })
      .sort({ name: 1 })
      .toArray(),
    raritiesCollection.find({}).sort({ name: 1 }).toArray(),
    rolesCollection
      .find({}, { projection: { imageData: 0 } })
      .sort({ name: 1 })
      .toArray(),
  ]);

  return (
    <AdminManagementShell
      admin={{ name: admin.name, email: admin.email }}
      title="Quản lý sản phẩm"
    >
      <ProductManager
        initialProducts={products.map(serializeProduct)}
        energies={energies.map(serializeEnergy)}
        rarities={rarities.map(serializeRarity)}
        roles={roles.map(serializeRole)}
      />
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
