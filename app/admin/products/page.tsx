import { Suspense } from "react";
import AdminManagementShell from "@/components/AdminManagementShell";
import ProductManager from "@/components/ProductManager";
import { requireAdmin } from "@/lib/auth";
import { getProductsCollection } from "@/lib/db";
import { serializeProduct } from "@/lib/products";

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<AdminSectionLoading />}>
      <AdminProductsContent />
    </Suspense>
  );
}

async function AdminProductsContent() {
  const admin = await requireAdmin();
  const productsCollection = await getProductsCollection();
  const products = await productsCollection
    .find({}, { projection: { imageData: 0 } })
    .sort({ updatedAt: -1 })
    .limit(200)
    .toArray();

  return (
    <AdminManagementShell
      admin={{ name: admin.name, email: admin.email }}
      title="Quản lý sản phẩm"
    >
      <ProductManager initialProducts={products.map(serializeProduct)} />
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
