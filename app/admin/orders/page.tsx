import { Suspense } from "react";
import AdminManagementShell from "@/components/AdminManagementShell";
import OrderManager from "@/components/OrderManager";
import { requireAdmin } from "@/lib/auth";
import { getOrdersCollection } from "@/lib/db";

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<AdminSectionLoading />}>
      <AdminOrdersContent />
    </Suspense>
  );
}

async function AdminOrdersContent() {
  const admin = await requireAdmin();
  const orders = await (
    await getOrdersCollection()
  )
    .find({})
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  return (
    <AdminManagementShell
      admin={{ name: admin.name, email: admin.email }}
      title="Quản lý đơn hàng"
    >
      <OrderManager
        initialOrders={orders.map((order) => ({
          id: order._id.toString(),
          customer: order.customer,
          items: order.items,
          total: order.total,
          paymentStatus: order.paymentStatus ?? "pending",
          paymentNotificationStatus: order.paymentNotificationStatus ?? null,
          paymentConfirmationEmailStatus:
            order.paymentConfirmationEmailStatus ?? null,
          paymentReportedAt: order.paymentReportedAt?.toISOString() ?? null,
          createdAt: order.createdAt.toISOString(),
        }))}
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
