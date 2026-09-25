import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../App";

export default function RegisterPage() {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirm) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu tối thiểu 6 ký tự");
      return;
    }
    setLoading(true);
    try {
      const data = await api.register(email.trim(), name.trim(), password);
      api.setAuth(data.token, data.user);
      setUser(data.user);
      setMessage(`Mã OTP xác thực đã được gửi đến email ${email.trim()}`);
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Đăng ký tài khoản thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!otpCode.trim()) {
      setError("Vui lòng nhập mã OTP 6 số");
      return;
    }
    setLoading(true);
    try {
      await api.verifyEmail(otpCode.trim());
      // Refresh user info
      const freshUser = await api.me();
      api.setAuth(api.getToken() || "", freshUser);
      setUser(freshUser);
      navigate("/profile?verified=true");
    } catch (err: any) {
      setError(err.message || "Mã OTP không hợp lệ hoặc đã hết hạn");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await api.resendOtp("EMAIL_VERIFY");
      setMessage("Đã gửi lại mã OTP mới đến email của bạn");
    } catch (err: any) {
      setError(err.message || "Không thể gửi lại mã OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111] flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="font-display text-4xl font-black tracking-[-.04em] text-white">
            PANEL<span className="text-[#e51c2a]">.</span>
          </Link>
          <p className="text-white/50 mt-2 text-sm">
            {step === "form" ? "Tạo tài khoản mới" : "Xác thực địa chỉ email"}
          </p>
        </div>

        <div className="bg-[#f4f0e7] p-8 shadow-xl">
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 font-medium">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 font-medium">
              {message}
            </div>
          )}

          {step === "form" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-1.5">Họ tên *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full border border-black/20 bg-white px-4 py-3 text-sm outline-none focus:border-[#e51c2a]"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-1.5">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-black/20 bg-white px-4 py-3 text-sm outline-none focus:border-[#e51c2a]"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-1.5">Mật khẩu *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border border-black/20 bg-white px-4 py-3 text-sm outline-none focus:border-[#e51c2a]"
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>
              <div>
                <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-1.5">Xác nhận mật khẩu *</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="w-full border border-black/20 bg-white px-4 py-3 text-sm outline-none focus:border-[#e51c2a]"
                  placeholder="Nhập lại mật khẩu"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#e51c2a] py-3.5 text-sm font-black tracking-wider text-white uppercase hover:bg-black transition disabled:opacity-50 mt-2"
              >
                {loading ? "Đang xử lý..." : "Đăng ký tài khoản"}
              </button>
            </form>
          )}

          {step === "otp" && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="text-4xl mb-2">✉️</div>
                <h3 className="font-display text-lg font-black uppercase mb-1">Nhập mã xác thực OTP</h3>
                <p className="text-xs text-black/60">
                  Mã OTP 6 số đã được gửi đến <strong>{email}</strong>. Vui lòng kiểm tra hộp thư (hoặc mục Spam).
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="000000"
                    className="w-full border-2 border-black/20 bg-white px-4 py-3 text-center text-3xl font-black tracking-[0.4em] outline-none focus:border-[#e51c2a]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.length < 6}
                  className="w-full bg-[#e51c2a] py-3 text-sm font-black tracking-wider text-white uppercase hover:bg-black transition disabled:opacity-50"
                >
                  {loading ? "Đang xác thực..." : "Xác nhận OTP"}
                </button>
              </form>

              <div className="flex flex-col gap-2 pt-2 border-t border-black/10">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleResendOtp}
                  className="text-xs font-bold text-black/60 hover:text-[#e51c2a] transition"
                >
                  Chưa nhận được mã? Gửi lại mã OTP
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="text-xs font-bold text-[#e51c2a] hover:underline"
                >
                  Để sau, vào trang mua sắm ngay →
                </button>
              </div>
            </div>
          )}

          {step === "form" && (
            <p className="mt-6 text-center text-sm text-black/50">
              Đã có tài khoản?{" "}
              <Link to="/login" className="font-bold text-[#e51c2a] hover:underline">Đăng nhập</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
