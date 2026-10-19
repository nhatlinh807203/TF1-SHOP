import { requireAdmin } from "@/lib/auth";
import { getUsersCollection } from "@/lib/db";

export default async function AdminPage() {
  await requireAdmin();
  const users = await getUsersCollection();
  const customers = await users
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
    .toArray();

  return (
    <section className="min-h-[60vh] bg-[#07090a] px-4 py-14 text-white sm:py-20">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium text-[#e2bb52]">TF1SHOP</p>
        <h1 className="mt-2 text-2xl font-bold">Quản lý tài khoản</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Hiển thị tối đa 100 tài khoản mới nhất.
        </p>
        <div className="mt-8 overflow-x-auto rounded-2xl border border-white/[0.08]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-white/[0.04] text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Họ tên</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Điện thoại</th>
                <th className="px-4 py-3 font-medium">Vai trò</th>
                <th className="px-4 py-3 font-medium">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {customers.map((customer) => (
                <tr key={customer._id.toString()}>
                  <td className="px-4 py-3 text-zinc-100">{customer.name}</td>
                  <td className="px-4 py-3 text-zinc-300">{customer.email}</td>
                  <td className="px-4 py-3 text-zinc-300">{customer.phone}</td>
                  <td className="px-4 py-3 text-zinc-300">
                    {customer.role === "admin" ? "Admin" : "User"}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {customer.createdAt.toLocaleDateString("vi-VN")}
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    Chưa có tài khoản nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
