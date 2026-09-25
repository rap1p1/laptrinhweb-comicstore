import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "otp" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setMessage("Mã OTP đã được gửi đến email của bạn");
      setStep("otp");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(email, code, newPassword);
      setStep("done");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111] flex items-center justify-center px-5">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="font-display text-4xl font-black tracking-[-.04em] text-white">
            PANEL<span className="text-[#e51c2a]">.</span>
          </Link>
          <p className="text-white/50 mt-2 text-sm">Đặt lại mật khẩu</p>
        </div>

        <div className="bg-[#f4f0e7] p-8 shadow-xl">
          {error && <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 font-medium">{error}</div>}
          {message && <div className="mb-5 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 font-medium">{message}</div>}

          {step === "email" && (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div>
                <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">Email đã đăng ký</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border border-black/20 bg-white px-4 py-3 text-sm outline-none focus:border-[#e51c2a]" placeholder="email@example.com" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#e51c2a] py-3.5 text-sm font-black tracking-wider text-white uppercase hover:bg-black transition disabled:opacity-50">
                {loading ? "Đang gửi..." : "Gửi mã OTP"}
              </button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">Mã OTP</label>
                <input type="text" value={code} onChange={(e) => setCode(e.target.value)} required maxLength={6} className="w-full border border-black/20 bg-white px-4 py-3 text-sm outline-none focus:border-[#e51c2a] text-center text-2xl tracking-[.5em] font-bold" placeholder="000000" />
              </div>
              <div>
                <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">Mật khẩu mới</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="w-full border border-black/20 bg-white px-4 py-3 text-sm outline-none focus:border-[#e51c2a]" placeholder="Tối thiểu 6 ký tự" />
              </div>
              <div>
                <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">Xác nhận mật khẩu</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="w-full border border-black/20 bg-white px-4 py-3 text-sm outline-none focus:border-[#e51c2a]" placeholder="Nhập lại" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#e51c2a] py-3.5 text-sm font-black tracking-wider text-white uppercase hover:bg-black transition disabled:opacity-50">
                {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
              </button>
            </form>
          )}

          {step === "done" && (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="font-display text-2xl font-black mb-2">Thành công!</h3>
              <p className="text-sm text-black/60 mb-6">Mật khẩu đã được đặt lại. Bạn có thể đăng nhập với mật khẩu mới.</p>
              <button onClick={() => navigate("/login")} className="bg-[#e51c2a] px-8 py-3 text-sm font-bold text-white uppercase hover:bg-black transition">
                Đăng nhập
              </button>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-black/50">
            <Link to="/login" className="font-bold text-[#e51c2a] hover:underline">← Quay lại đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
