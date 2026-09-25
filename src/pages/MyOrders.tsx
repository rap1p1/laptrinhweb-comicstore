import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../App";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

const statusConfig: Record<string, { text: string; bg: string; textCol: string; border: string }> = {
  PENDING: { text: "Chờ xác nhận", bg: "bg-amber-50", textCol: "text-amber-800", border: "border-amber-200" },
  CONFIRMED: { text: "Chờ vận chuyển", bg: "bg-blue-50", textCol: "text-blue-800", border: "border-blue-200" },
  SHIPPING: { text: "Đang giao hàng", bg: "bg-orange-50", textCol: "text-orange-800", border: "border-orange-200" },
  DELIVERED: { text: "Đã nhận hàng", bg: "bg-emerald-50", textCol: "text-emerald-800", border: "border-emerald-200" },
  RETURN_REQUESTED: { text: "Yêu cầu hoàn đơn", bg: "bg-purple-50", textCol: "text-purple-800", border: "border-purple-200" },
  RETURNED: { text: "Đã hoàn đơn", bg: "bg-neutral-100", textCol: "text-neutral-700", border: "border-neutral-300" },
  REJECTED: { text: "Từ chối nhận", bg: "bg-rose-50", textCol: "text-rose-800", border: "border-rose-200" },
  CANCELLED: { text: "Đã hủy", bg: "bg-neutral-100", textCol: "text-neutral-500", border: "border-neutral-200" },
};

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [returnModalOrderId, setReturnModalOrderId] = useState<number | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (user.role !== "BUYER") {
      navigate(user.role === "PUBLISHER" ? "/publisher/comics" : "/dashboard");
      return;
    }
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    try {
      const data = await api.getMyOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (orderId: number, action: string, reason?: string) => {
    if (action === "CANCEL" && !window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;
    if (action === "REJECT_DELIVERY" && !window.confirm("Xác nhận từ chối nhận kiện hàng này?")) return;

    setActionLoading(orderId);
    try {
      await api.customerOrderAction(orderId, action, reason);
      await loadOrders();
      if (returnModalOrderId) {
        setReturnModalOrderId(null);
        setReturnReason("");
      }
    } catch (err: any) {
      alert(err.message || "Không thể thực hiện thao tác");
    } finally {
      setActionLoading(null);
    }
  };

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
          <h1 className="font-display text-4xl font-black tracking-[-.03em] uppercase">Đơn hàng của tôi</h1>
          <p className="text-black/50 text-sm mt-1">Theo dõi tiến trình vận chuyển và quản lý trạng thái kiện hàng</p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="self-start sm:self-auto border border-black px-5 py-2.5 text-xs font-black uppercase tracking-wider hover:bg-black hover:text-white transition"
        >
          Tiếp tục mua hàng
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-black/20 bg-white">
          <p className="text-5xl mb-4">📦</p>
          <p className="font-display text-2xl font-bold mb-2">Chưa có đơn hàng nào</p>
          <p className="text-sm text-black/50 mb-6">Bạn chưa có đơn hàng nào được tạo.</p>
          <button onClick={() => navigate("/")} className="bg-[#e51c2a] px-6 py-3 text-sm font-bold text-white uppercase hover:bg-black transition">
            Khám phá truyện Comic
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const status = statusConfig[order.status] || {
              text: order.status,
              bg: "bg-gray-100",
              textCol: "text-gray-800",
              border: "border-gray-200"
            };
            const isProcessing = actionLoading === order.id;

            return (
              <div key={order.id} className="border border-black/10 bg-white shadow-sm transition hover:border-black/25">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-black/10 bg-neutral-50/50">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-lg font-black tracking-tight">Đơn #{order.id}</span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${status.bg} ${status.textCol} ${status.border}`}>
                      {status.text}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-black/50">
                    Đặt lúc: {new Date(order.created_at).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                {/* Items */}
                <div className="p-5 space-y-4">
                  <div className="space-y-3">
                    {order.items?.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 text-sm">
                        <div
                          className="w-12 h-16 shrink-0 overflow-hidden border border-black/10 rounded-sm"
                          style={{ backgroundColor: item.color || "#111" }}
                        >
                          {item.image_url ? (
                            <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="font-display text-[8px] font-black text-white/70">{item.mark}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate text-black">{item.title}</p>
                          <p className="text-xs text-black/50">Số lượng: x{item.quantity}</p>
                        </div>
                        <span className="font-bold shrink-0">{money.format(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Return Reason Notice if any */}
                  {order.return_reason && (
                    <div className="mt-3 p-3 bg-purple-50/60 border border-purple-200 text-xs text-purple-900 rounded">
                      <strong>Lý do hoàn đơn:</strong> {order.return_reason}
                    </div>
                  )}

                  {/* Shipping Info */}
                  <div className="pt-3 border-t border-black/5 flex flex-wrap gap-x-6 gap-y-1 text-xs text-black/60">
                    <span><strong>Người nhận:</strong> {order.shipping_name} ({order.shipping_phone})</span>
                    <span><strong>Địa chỉ:</strong> {order.shipping_address}</span>
                  </div>
                </div>

                {/* Footer and Interactive Actions */}
                <div className="p-5 border-t border-black/10 bg-neutral-50/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-black/50 uppercase tracking-wider font-bold">Phương thức:</span>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-black/5 rounded">
                      {order.payment_method === "VNPAY" ? "VNPay" : "Thanh toán khi nhận hàng (COD)"}
                    </span>
                    <span className="text-xs text-black/30">|</span>
                    <span className="text-xs text-black/50 uppercase tracking-wider font-bold">Tổng tiền:</span>
                    <span className="font-display text-xl font-black text-[#e51c2a]">{money.format(order.total)}</span>
                  </div>

                  {/* Actions for Buyer */}
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    {/* If SHIPPING: user can confirm received or reject */}
                    {order.status === "SHIPPING" && (
                      <>
                        <button
                          disabled={isProcessing}
                          onClick={() => handleAction(order.id, "CONFIRM_RECEIVED")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
                        >
                          {isProcessing ? "Đang xử lý..." : "Đã nhận hàng"}
                        </button>
                        <button
                          disabled={isProcessing}
                          onClick={() => handleAction(order.id, "REJECT_DELIVERY")}
                          className="border border-rose-400 text-rose-700 hover:bg-rose-50 px-4 py-2 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
                        >
                          Từ chối nhận
                        </button>
                      </>
                    )}

                    {/* If DELIVERED: user can request return */}
                    {order.status === "DELIVERED" && (
                      <button
                        disabled={isProcessing}
                        onClick={() => {
                          setReturnModalOrderId(order.id);
                          setReturnReason("");
                        }}
                        className="border border-purple-400 text-purple-700 hover:bg-purple-50 px-4 py-2 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
                      >
                        Yêu cầu hoàn đơn
                      </button>
                    )}

                    {/* If PENDING or CONFIRMED: user can cancel order */}
                    {["PENDING", "CONFIRMED"].includes(order.status) && (
                      <button
                        disabled={isProcessing}
                        onClick={() => handleAction(order.id, "CANCEL")}
                        className="border border-black/30 text-black/70 hover:border-black hover:text-black px-4 py-2 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
                      >
                        Hủy đơn hàng
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Return Request Modal */}
      {returnModalOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white max-w-md w-full p-6 shadow-2xl border border-black/20">
            <h3 className="font-display text-xl font-black mb-2">Yêu cầu hoàn đơn #{returnModalOrderId}</h3>
            <p className="text-xs text-black/60 mb-4">
              Vui lòng cho chúng tôi biết lý do bạn muốn hoàn đơn (sản phẩm hư hỏng, giao sai truyện, thiếu ấn phẩm...).
            </p>
            <textarea
              rows={4}
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Nhập lý do hoàn trả..."
              className="w-full border border-black/20 p-3 text-sm outline-none focus:border-[#e51c2a] resize-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReturnModalOrderId(null)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider border border-black/20 hover:bg-black/5"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={actionLoading !== null || !returnReason.trim()}
                onClick={() => handleAction(returnModalOrderId, "REQUEST_RETURN", returnReason)}
                className="bg-purple-700 hover:bg-purple-800 text-white px-5 py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
              >
                Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
