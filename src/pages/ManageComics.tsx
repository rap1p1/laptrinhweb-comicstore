import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../App";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

const statusConfig: Record<string, { text: string; bg: string; textCol: string; border: string }> = {
  PENDING: { text: "Chờ xác nhận", bg: "bg-amber-50", textCol: "text-amber-800", border: "border-amber-200" },
  CONFIRMED: { text: "Chờ vận chuyển", bg: "bg-blue-50", textCol: "text-blue-800", border: "border-blue-200" },
  SHIPPING: { text: "Đang giao hàng", bg: "bg-orange-50", textCol: "text-orange-800", border: "border-orange-200" },
  DELIVERED: { text: "Đã giao / nhận", bg: "bg-emerald-50", textCol: "text-emerald-800", border: "border-emerald-200" },
  RETURN_REQUESTED: { text: "Yêu cầu hoàn đơn", bg: "bg-purple-50", textCol: "text-purple-800", border: "border-purple-200" },
  RETURNED: { text: "Đã hoàn đơn", bg: "bg-neutral-100", textCol: "text-neutral-700", border: "border-neutral-300" },
  REJECTED: { text: "Từ chối nhận", bg: "bg-rose-50", textCol: "text-rose-800", border: "border-rose-200" },
  CANCELLED: { text: "Đã hủy", bg: "bg-neutral-100", textCol: "text-neutral-500", border: "border-neutral-200" },
};

export default function ManageComics() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [filterTab, setFilterTab] = useState<string>("ALL");
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      await api.updateOrderStatus(id, status);
      await loadOrders();
    } catch (err: any) {
      alert(err.message || "Lỗi khi cập nhật trạng thái đơn");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filterTab === "ALL") return true;
    if (filterTab === "WAIT_SHIP") return ["PENDING", "CONFIRMED"].includes(order.status);
    if (filterTab === "SHIPPING") return order.status === "SHIPPING";
    if (filterTab === "DELIVERED") return order.status === "DELIVERED";
    if (filterTab === "RETURN_REQUESTED") return order.status === "RETURN_REQUESTED";
    if (filterTab === "CLOSED") return ["RETURNED", "REJECTED", "CANCELLED"].includes(order.status);
    return true;
  });

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block size-9 border-3 border-black/20 border-t-[#e51c2a] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-12 lg:px-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-4xl font-black tracking-[-.03em] uppercase">Quản lý đơn hàng</h1>
            <span className="text-xs bg-black text-white px-2.5 py-1 font-bold rounded">
              {orders.length} đơn
            </span>
          </div>
          <p className="text-black/50 text-sm mt-1">Duyệt vận chuyển, theo dõi tiến trình giao hàng và xử lý yêu cầu hoàn đơn</p>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="self-start sm:self-auto text-xs font-black uppercase tracking-wider text-[#e51c2a] hover:underline"
        >
          ← Quay lại Dashboard
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-black/10 pb-4">
        {[
          { key: "ALL", label: "Tất cả" },
          { key: "WAIT_SHIP", label: "Chờ vận chuyển" },
          { key: "SHIPPING", label: "Đang giao" },
          { key: "DELIVERED", label: "Đã nhận / giao" },
          { key: "RETURN_REQUESTED", label: "Yêu cầu hoàn đơn" },
          { key: "CLOSED", label: "Đã hủy / Từ chối / Hoàn" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
              filterTab === tab.key
                ? "bg-black text-white"
                : "bg-white border border-black/15 text-black/70 hover:border-black"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white border border-dashed border-black/20">
          <p className="text-black/40 text-sm">Không có đơn hàng nào trong mục này</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const status = statusConfig[order.status] || {
              text: order.status,
              bg: "bg-gray-100",
              textCol: "text-gray-800",
              border: "border-gray-200"
            };
            const isProcessing = updatingId === order.id;

            return (
              <div key={order.id} className="bg-white border border-black/10 p-5 shadow-xs transition hover:border-black/30">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-black/10">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-lg font-black">Đơn #{order.id}</span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${status.bg} ${status.textCol} ${status.border}`}>
                      {status.text}
                    </span>
                    <span className="text-xs text-black/50">
                      {order.payment_method === "VNPAY" ? "VNPay" : "COD"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-black/50 font-bold uppercase">Trạng thái:</span>
                    <select
                      disabled={isProcessing}
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="border border-black/20 bg-white px-3 py-1.5 text-xs font-bold outline-none focus:border-[#e51c2a] cursor-pointer"
                    >
                      <option value="PENDING">Chờ xác nhận</option>
                      <option value="CONFIRMED">Chờ vận chuyển</option>
                      <option value="SHIPPING">Đang giao hàng</option>
                      <option value="DELIVERED">Đã giao / nhận</option>
                      <option value="RETURN_REQUESTED">Yêu cầu hoàn đơn</option>
                      <option value="RETURNED">Đã hoàn đơn</option>
                      <option value="REJECTED">Từ chối nhận</option>
                      <option value="CANCELLED">Đã hủy</option>
                    </select>
                  </div>
                </div>

                {/* Customer & Shipping Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-black/70 mb-4 bg-neutral-50/70 p-3 rounded">
                  <div>
                    <p><strong>Khách hàng:</strong> {order.customer_name} ({order.customer_email})</p>
                    <p><strong>Người nhận:</strong> {order.shipping_name} - {order.shipping_phone}</p>
                  </div>
                  <div>
                    <p><strong>Địa chỉ giao:</strong> {order.shipping_address}</p>
                    <p><strong>Thời gian đặt:</strong> {new Date(order.created_at).toLocaleDateString("vi-VN", {
                      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
                    })}</p>
                  </div>
                </div>

                {/* Return Reason Warning */}
                {order.return_reason && (
                  <div className="mb-4 p-3 bg-purple-50 border border-purple-200 text-xs text-purple-900 rounded font-medium">
                    ⚠️ <strong>Lý do khách yêu cầu hoàn hàng:</strong> {order.return_reason}
                  </div>
                )}

                {/* Items */}
                <div className="space-y-1.5 mb-4 text-xs text-black/80">
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center py-1 border-b border-black/5">
                      <span>{item.title} <strong className="text-black/50">x{item.quantity}</strong></span>
                      <span className="font-bold">{money.format(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Action Toolbar for Manager Demo */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/10">
                  <div className="text-sm">
                    <span className="text-black/50">Tổng thanh toán: </span>
                    <span className="font-display text-lg font-black text-[#e51c2a]">{money.format(order.total)}</span>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {["PENDING", "CONFIRMED"].includes(order.status) && (
                      <button
                        disabled={isProcessing}
                        onClick={() => updateStatus(order.id, "SHIPPING")}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
                      >
                        Bắt đầu giao hàng
                      </button>
                    )}

                    {order.status === "SHIPPING" && (
                      <button
                        disabled={isProcessing}
                        onClick={() => updateStatus(order.id, "DELIVERED")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
                      >
                        Xác nhận đã giao
                      </button>
                    )}

                    {order.status === "RETURN_REQUESTED" && (
                      <>
                        <button
                          disabled={isProcessing}
                          onClick={() => updateStatus(order.id, "RETURNED")}
                          className="bg-purple-700 hover:bg-purple-800 text-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
                        >
                          Chấp thuận hoàn đơn
                        </button>
                        <button
                          disabled={isProcessing}
                          onClick={() => updateStatus(order.id, "DELIVERED")}
                          className="border border-black/30 hover:border-black text-black px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
                        >
                          Từ chối hoàn đơn
                        </button>
                      </>
                    )}

                    {!["CANCELLED", "RETURNED", "REJECTED", "DELIVERED"].includes(order.status) && (
                      <button
                        disabled={isProcessing}
                        onClick={() => updateStatus(order.id, "CANCELLED")}
                        className="border border-rose-300 text-rose-700 hover:bg-rose-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
                      >
                        Hủy đơn
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
