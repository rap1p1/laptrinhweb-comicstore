import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../App";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
      const data = await api.register(email, name, password);
      api.setAuth(data.token, data.user);
      setUser(data.user);
      navigate("/");
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
          <p className="text-white/50 mt-2 text-sm">Tạo tài khoản mới</p>
        </div>

        <div className="bg-[#f4f0e7] p-8 shadow-xl">
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 font-medium">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">Họ tên</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full border border-black/20 bg-white px-4 py-3 text-sm outline-none focus:border-[#e51c2a]" placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border border-black/20 bg-white px-4 py-3 text-sm outline-none focus:border-[#e51c2a]" placeholder="email@example.com" />
            </div>
            <div>
              <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">Mật khẩu</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full border border-black/20 bg-white px-4 py-3 text-sm outline-none focus:border-[#e51c2a]" placeholder="Tối thiểu 6 ký tự" />
            </div>
            <div>
              <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">Xác nhận mật khẩu</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="w-full border border-black/20 bg-white px-4 py-3 text-sm outline-none focus:border-[#e51c2a]" placeholder="Nhập lại mật khẩu" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[#e51c2a] py-3.5 text-sm font-black tracking-wider text-white uppercase hover:bg-black transition disabled:opacity-50">
              {loading ? "Đang xử lý..." : "Đăng ký"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-black/50">
            Đã có tài khoản?{" "}
            <Link to="/login" className="font-bold text-[#e51c2a] hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
