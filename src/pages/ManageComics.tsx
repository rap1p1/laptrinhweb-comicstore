import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../App";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const statusLabels: Record<string, { text: string; color: string }> = {
  PENDING: { text: "Chờ thanh toán", color: "bg-yellow-100 text-yellow-800" },
  PAID: { text: "Đã thanh toán", color: "bg-blue-100 text-blue-800" },
  CONFIRMED: { text: "Đã xác nhận", color: "bg-green-100 text-green-800" },
  SHIPPED: { text: "Đang giao", color: "bg-purple-100 text-purple-800" },
  DELIVERED: { text: "Đã giao", color: "bg-green-100 text-green-800" },
  CANCELLED: { text: "Đã hủy", color: "bg-red-100 text-red-800" },
};

export default function ManageComics() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || (user.role !== "MANAGER" && user.role !== "SYSTEM_ADMIN")) {
      navigate("/");
      return;
    }
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    try {
      const data = await api.getAllOrders();
      setOrders(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.updateOrderStatus(id, status);
      loadOrders();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="py-20 text-center"><div className="inline-block size-8 border-3 border-black/20 border-t-[#e51c2a] rounded-full animate-spin" /></div>;

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-12 lg:px-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl font-black tracking-[-.03em] uppercase">Quản lý đơn hàng</h1>
        <button onClick={() => navigate("/dashboard")} className="text-sm font-bold text-[#e51c2a] hover:underline">← Dashboard</button>
      </div>

      {orders.length === 0 ? (
        <p className="text-center py-20 text-black/50">Chưa có đơn hàng nào</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusLabels[order.status] || { text: order.status, color: "bg-gray-100" };
            return (
              <div key={order.id} className="bg-white border border-black/10 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-lg font-black">Đơn #{order.id}</span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${status.color}`}>{status.text}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="border border-black/20 px-3 py-1.5 text-xs font-bold outline-none focus:border-[#e51c2a]"
                    >
                      <option value="PENDING">Chờ thanh toán</option>
                      <option value="PAID">Đã thanh toán</option>
                      <option value="CONFIRMED">Đã xác nhận</option>
                      <option value="SHIPPED">Đang giao</option>
                      <option value="DELIVERED">Đã giao</option>
                      <option value="CANCELLED">Đã hủy</option>
                    </select>
                  </div>
                </div>
                <div className="text-sm text-black/60 mb-3">
                  <span className="font-bold text-black">{order.customer_name}</span> · {order.customer_email} · {new Date(order.created_at).toLocaleDateString("vi-VN")}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-black/10">
                  <span className="text-xs text-black/50">{order.items?.length || 0} sản phẩm · {order.payment_method}</span>
                  <span className="font-display text-lg font-black text-[#e51c2a]">{money.format(order.total)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
