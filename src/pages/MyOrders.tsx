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

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    try {
      const data = await api.getMyOrders();
      setOrders(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="py-20 text-center"><div className="inline-block size-8 border-3 border-black/20 border-t-[#e51c2a] rounded-full animate-spin" /></div>;

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-12 lg:px-12">
      <h1 className="font-display text-4xl font-black tracking-[-.03em] uppercase mb-8">Đơn hàng của tôi</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-black/20">
          <p className="text-5xl mb-4">📦</p>
          <p className="font-display text-2xl font-bold mb-2">Chưa có đơn hàng</p>
          <button onClick={() => navigate("/")} className="mt-4 bg-[#e51c2a] px-6 py-3 text-sm font-bold text-white uppercase hover:bg-black transition">Mua sắm ngay</button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusLabels[order.status] || { text: order.status, color: "bg-gray-100" };
            return (
              <div key={order.id} className="border border-black/10 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-black/10">
                  <div className="flex items-center gap-4">
                    <span className="font-display text-lg font-black">Đơn #{order.id}</span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${status.color}`}>{status.text}</span>
                  </div>
                  <div className="text-sm text-black/50">
                    {new Date(order.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <div className="space-y-2">
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="w-10 h-14 shrink-0 overflow-hidden" style={{ backgroundColor: item.color || "#111" }}>
                        {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span className="font-display text-[7px] font-black text-white/70">{item.mark}</span></div>}
                      </div>
                      <span className="flex-1">{item.title}</span>
                      <span className="text-black/50">x{item.quantity}</span>
                      <span className="font-bold">{money.format(item.price)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-black/10 flex justify-between items-center">
                  <span className="text-sm text-black/50">{order.payment_method === "VNPAY" ? "VNPay" : "COD"}</span>
                  <span className="font-display text-xl font-black text-[#e51c2a]">{money.format(order.total)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
