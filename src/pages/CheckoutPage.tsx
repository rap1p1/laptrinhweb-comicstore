import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../App";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

export default function CheckoutPage() {
  const { user, refreshCart } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (user.name && !name) setName(user.name);
    if (user.phone && !phone) setPhone(user.phone);
    if (user.address && !address) setAddress(user.address);
    loadCart();
  }, [user]);

  const loadCart = async () => {
    try {
      const data = await api.getCart();
      if (data.length === 0) { navigate("/cart"); return; }
      setItems(data);
    } catch { navigate("/cart"); }
    finally { setLoading(false); }
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = total >= 499000 ? 0 : 30000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name || !phone || !address) {
      setError("Vui lòng điền đầy đủ thông tin giao hàng");
      return;
    }
    setSubmitting(true);
    try {
      const order = await api.createOrder({
        payment_method: paymentMethod,
        shipping_name: name,
        shipping_phone: phone,
        shipping_address: address,
      });
      await refreshCart();

      if (paymentMethod === "VNPAY") {
        try {
          const res = await api.createPayment(order.id);
          if (res?.paymentUrl) {
            window.location.href = res.paymentUrl;
            return;
          }
          // If fallbackCod returned or no URL
          navigate(`/payment/success?orderId=${order.id}&notice=vnpay_fallback`);
        } catch (vnpErr: any) {
          console.warn("VNPay error, fallback to COD:", vnpErr);
          navigate(`/payment/success?orderId=${order.id}&notice=vnpay_fallback`);
        }
      } else {
        navigate(`/payment/success?orderId=${order.id}`);
      }
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) return <div className="py-20 text-center"><div className="inline-block size-8 border-3 border-black/20 border-t-[#e51c2a] rounded-full animate-spin" /></div>;

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-12 lg:px-12">
      <h1 className="font-display text-4xl font-black tracking-[-.03em] uppercase mb-8">Thanh toán</h1>

      {error && <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 font-medium">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="border border-black/10 bg-white p-6">
              <h3 className="font-display text-xl font-black mb-4">Thông tin giao hàng</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">Họ tên người nhận</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full border border-black/20 bg-white px-4 py-3 text-sm outline-none focus:border-[#e51c2a]" />
                </div>
                <div>
                  <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">Số điện thoại</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full border border-black/20 bg-white px-4 py-3 text-sm outline-none focus:border-[#e51c2a]" placeholder="0123456789" />
                </div>
                <div>
                  <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">Địa chỉ giao hàng</label>
                  <textarea value={address} onChange={(e) => setAddress(e.target.value)} required rows={3} className="w-full border border-black/20 bg-white px-4 py-3 text-sm outline-none focus:border-[#e51c2a] resize-none" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" />
                </div>
              </div>
            </div>

            <div className="border border-black/10 bg-white p-6">
              <h3 className="font-display text-xl font-black mb-4">Phương thức thanh toán</h3>
              <div className="space-y-3">
                <label className={`flex items-center gap-4 border p-4 cursor-pointer transition ${paymentMethod === "COD" ? "border-[#e51c2a] bg-red-50/50" : "border-black/10 hover:border-black/30"}`}>
                  <input type="radio" name="payment" value="COD" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} className="accent-[#e51c2a]" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold">Thanh toán khi nhận hàng (COD)</p>
                      <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded">Khuyên dùng demo</span>
                    </div>
                    <p className="text-xs text-black/50">Thanh toán bằng tiền mặt khi nhận được hàng</p>
                  </div>
                </label>
                <label className={`flex items-center gap-4 border p-4 cursor-pointer transition ${paymentMethod === "VNPAY" ? "border-[#e51c2a] bg-red-50/50" : "border-black/10 hover:border-black/30"}`}>
                  <input type="radio" name="payment" value="VNPAY" checked={paymentMethod === "VNPAY"} onChange={() => setPaymentMethod("VNPAY")} className="accent-[#e51c2a]" />
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-bold">VNPay</p>
                      <p className="text-xs text-black/50">Thanh toán qua ví VNPay, thẻ ATM, Visa/Mastercard</p>
                    </div>
                    <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR-1.png" alt="VNPay" className="h-8 ml-auto" />
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="border border-black/10 bg-white p-6 h-fit sticky top-[90px]">
            <h3 className="font-display text-xl font-black mb-4">Đơn hàng ({items.length} sản phẩm)</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 text-sm">
                  <div className="shrink-0 w-12 h-16 overflow-hidden" style={{ backgroundColor: item.color }}>
                    {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span className="font-display text-[8px] font-black text-white/80">{item.mark}</span></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{item.title}</p>
                    <p className="text-black/50">x{item.quantity}</p>
                  </div>
                  <p className="font-bold shrink-0">{money.format(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-black/10 mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-black/60">Tạm tính</span><span>{money.format(total)}</span></div>
              <div className="flex justify-between"><span className="text-black/60">Vận chuyển</span><span className={shipping === 0 ? "text-green-600" : ""}>{shipping === 0 ? "Miễn phí" : money.format(shipping)}</span></div>
              <div className="border-t border-black/10 pt-3 flex justify-between">
                <span className="font-display text-lg font-black">Tổng</span>
                <span className="font-display text-2xl font-black text-[#e51c2a]">{money.format(total + shipping)}</span>
              </div>
            </div>
            <button type="submit" disabled={submitting} className="w-full mt-4 bg-[#e51c2a] py-3.5 text-sm font-black tracking-wider text-white uppercase hover:bg-black transition disabled:opacity-50">
              {submitting ? "Đang xử lý..." : paymentMethod === "VNPAY" ? "Thanh toán qua VNPay" : "Đặt hàng"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
