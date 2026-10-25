import { Suspense } from "react";
import AdminDashboard from "@/components/AdminDashboard";
import { requireAdmin } from "@/lib/auth";
import { getProductsCollection, getUsersCollection } from "@/lib/db";

export default async function AdminPage() {
  return (
    <Suspense fallback={<AdminDashboardLoading />}>
      <AdminDashboardContent />
    </Suspense>
  );
}

async function AdminDashboardContent() {
  const admin = await requireAdmin();
  const [users, productsCollection] = await Promise.all([
    getUsersCollection(),
    getProductsCollection(),
  ]);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    totalAccounts,
    customerCount,
    adminCount,
    newAccountsThisMonth,
    customers,
    productCount,
  ] = await Promise.all([
    users.countDocuments(),
    users.countDocuments({ role: "user" }),
    users.countDocuments({ role: "admin" }),
    users.countDocuments({ createdAt: { $gte: monthStart } }),
    users
      .find(
        {},
        {
          projection: {
            passwordHash: 0,
          },
        },
      )
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray(),
    productsCollection.countDocuments(),
  ]);

  return (
    <AdminDashboard
      admin={{
        name: admin.name,
        email: admin.email,
      }}
      stats={{
        totalAccounts,
        customerCount,
        adminCount,
        newAccountsThisMonth,
      }}
      monthLabel={new Intl.DateTimeFormat("vi-VN", {
        month: "long",
        year: "numeric",
      }).format(new Date())}
      customers={customers.map((customer) => ({
        id: customer._id.toString(),
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        role: customer.role,
        createdAt: customer.createdAt.toISOString(),
      }))}
      productCount={productCount}
    />
  );
}

function AdminDashboardLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090b0c] text-sm text-zinc-400">
      Đang tải trang quản trị...
    </main>
  );
}
