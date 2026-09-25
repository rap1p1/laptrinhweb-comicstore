import { Link } from "react-router-dom";

export default function PaymentFailed() {
  return (
    <div className="mx-auto max-w-lg px-5 py-20 text-center">
      <div className="text-7xl mb-6">😔</div>
      <h1 className="font-display text-4xl font-black tracking-[-.03em] uppercase mb-4">Thanh toán thất bại</h1>
      <p className="text-sm text-black/50 mb-8">Thanh toán không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.</p>
      <div className="flex gap-4 justify-center">
        <Link to="/cart" className="bg-[#e51c2a] px-6 py-3 text-sm font-bold text-white uppercase hover:bg-black transition">Quay lại giỏ hàng</Link>
        <Link to="/" className="border border-black px-6 py-3 text-sm font-bold uppercase hover:bg-black hover:text-white transition">Trang chủ</Link>
      </div>
    </div>
  );
}
