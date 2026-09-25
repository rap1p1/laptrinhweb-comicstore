import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../App";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

export default function CartPage() {
  const { user, refreshCart } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    loadCart();
  }, [user]);

  const loadCart = async () => {
    try {
      const data = await api.getCart();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (id: number, quantity: number) => {
    try {
      await api.updateCartItem(id, quantity);
      loadCart();
      refreshCart();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const removeItem = async (id: number) => {
    try {
      await api.removeFromCart(id);
      loadCart();
      refreshCart();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (loading) return <div className="py-20 text-center"><div className="inline-block size-8 border-3 border-black/20 border-t-[#e51c2a] rounded-full animate-spin" /></div>;

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-12 lg:px-12">
      <h1 className="font-display text-4xl font-black tracking-[-.03em] uppercase mb-8">Giỏ hàng</h1>

      {items.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-black/20">
          <p className="text-5xl mb-4">🛒</p>
          <p className="font-display text-2xl font-bold mb-2">Giỏ hàng trống</p>
          <p className="text-sm text-black/50 mb-6">Hãy thêm truyện vào giỏ hàng để tiếp tục</p>
          <Link to="/" className="bg-[#e51c2a] px-6 py-3 text-sm font-bold text-white uppercase hover:bg-black transition">Khám phá truyện</Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-5 border border-black/10 bg-white p-4">
                <div className="shrink-0 w-20 h-28 overflow-hidden" style={{ backgroundColor: item.color }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-display text-xs font-black text-white/80">{item.mark}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg font-bold truncate">{item.title}</h3>
                  <p className="text-xs text-black/50">{item.issue}</p>
                  <p className="text-sm font-bold mt-1">{money.format(item.price)}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className="size-8 border border-black/20 grid place-items-center hover:bg-black hover:text-white transition text-sm font-bold">−</button>
                    <span className="text-sm font-bold w-8 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="size-8 border border-black/20 grid place-items-center hover:bg-black hover:text-white transition text-sm font-bold">+</button>
                    <button onClick={() => removeItem(item.id)} className="ml-auto text-xs text-red-500 font-bold hover:underline">Xóa</button>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-lg font-black">{money.format(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border border-black/10 bg-white p-6 h-fit sticky top-[90px]">
            <h3 className="font-display text-xl font-black mb-4">Tóm tắt đơn hàng</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-black/60">Tạm tính ({items.length} sản phẩm)</span><span className="font-bold">{money.format(total)}</span></div>
              <div className="flex justify-between"><span className="text-black/60">Phí vận chuyển</span><span className="font-bold text-green-600">{total >= 499000 ? "Miễn phí" : money.format(30000)}</span></div>
            </div>
            <div className="border-t border-black/10 mt-4 pt-4 flex justify-between items-center">
              <span className="font-display text-lg font-black">Tổng cộng</span>
              <span className="font-display text-2xl font-black text-[#e51c2a]">{money.format(total + (total >= 499000 ? 0 : 30000))}</span>
            </div>
            <button onClick={() => navigate("/checkout")} className="w-full mt-4 bg-[#e51c2a] py-3.5 text-sm font-black tracking-wider text-white uppercase hover:bg-black transition">
              Thanh toán
            </button>
            <Link to="/" className="block text-center mt-3 text-xs text-black/50 font-bold hover:text-[#e51c2a]">← Tiếp tục mua sắm</Link>
          </div>
        </div>
      )}
    </div>
  );
}
