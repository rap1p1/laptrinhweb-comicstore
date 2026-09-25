import { Link, useSearchParams } from "react-router-dom";

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get("orderId");
  const notice = params.get("notice");

  return (
    <div className="mx-auto max-w-lg px-5 py-20 text-center">
      <div className="text-7xl mb-6">🎉</div>
      <h1 className="font-display text-4xl font-black tracking-[-.03em] uppercase mb-4">Đặt hàng thành công!</h1>
      {orderId && <p className="text-lg text-black/60 mb-2">Mã đơn hàng: <span className="font-bold text-black">#{orderId}</span></p>}
      {notice === "vnpay_fallback" && (
        <div className="my-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-2.5 rounded font-medium text-left">
          Cổng VNPay chưa thiết lập khóa trên môi trường này. Đơn hàng của bạn đã được ghi nhận tự động dưới hình thức <strong>Thanh toán khi nhận hàng (COD)</strong> và chuyển sang trạng thái <strong>Chờ vận chuyển</strong>.
        </div>
      )}
      <p className="text-sm text-black/50 mb-8">Cảm ơn bạn đã mua hàng tại PANEL. Đơn hàng của bạn đang được xử lý.</p>
      <div className="flex gap-4 justify-center">
        <Link to="/my-orders" className="bg-[#e51c2a] px-6 py-3 text-sm font-bold text-white uppercase hover:bg-black transition">Xem đơn hàng</Link>
        <Link to="/" className="border border-black px-6 py-3 text-sm font-bold uppercase hover:bg-black hover:text-white transition">Tiếp tục mua</Link>
      </div>
    </div>
  );
}
