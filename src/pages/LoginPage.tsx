import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../App";

const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || "504369620008-sa70jccb91mga9ug551i8954pr6ee3e0.apps.googleusercontent.com";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError("");
    setLoading(true);
    try {
      const data = await api.login(demoEmail, demoPass);
      api.setAuth(data.token, data.user);
      setUser(data.user);
      if (data.user.role === "SYSTEM_ADMIN" || data.user.role === "MANAGER") {
        navigate("/dashboard");
      } else if (data.user.role === "PUBLISHER") {
        navigate("/publisher/comics");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login(email, password);
      api.setAuth(data.token, data.user);
      setUser(data.user);
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    const initGsi = () => {
      if (!(window as any).google?.accounts?.id) return;
      try {
        (window as any).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: any) => {
            try {
              setLoading(true);
              setError("");
              const data = await api.googleLogin(response.credential);
              api.setAuth(data.token, data.user);
              setUser(data.user);
              navigate("/");
            } catch (err: any) {
              setError(err.message || "Đăng nhập Google thất bại");
            } finally {
              setLoading(false);
            }
          },
        });

        const btnContainer = document.getElementById("googleBtnDiv");
        if (btnContainer) {
          btnContainer.innerHTML = "";
          (window as any).google.accounts.id.renderButton(btnContainer, {
            theme: "outline",
            size: "large",
            width: btnContainer.offsetWidth || 340,
            text: "signin_with",
            locale: "vi",
          });
        }
        setGoogleReady(true);
      } catch (e) {
        console.warn("Google init error:", e);
      }
    };

    if (!(window as any).google?.accounts?.id) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.body.appendChild(script);
      return () => {
        try { document.body.removeChild(script); } catch {}
      };
    } else {
      initGsi();
    }
  }, []);

  const handleManualGoogle = () => {
    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.prompt();
    } else {
      alert("Đang tải thư viện Google, vui lòng thử lại sau vài giây hoặc dùng tài khoản 1 chạm.");
    }
  };

  return (
    <div className="min-h-screen bg-[#111] flex items-center justify-center px-5">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="font-display text-4xl font-black tracking-[-.04em] text-white">
            PANEL<span className="text-[#e51c2a]">.</span>
          </Link>
          <p className="text-white/50 mt-2 text-sm">Đăng nhập để tiếp tục</p>
        </div>

        <div className="bg-[#f4f0e7] p-8 shadow-xl">
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-black/20 bg-white px-4 py-3 text-sm outline-none focus:border-[#e51c2a] transition"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-black/20 bg-white px-4 py-3 text-sm outline-none focus:border-[#e51c2a] transition"
                placeholder="••••••••"
              />
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs font-bold text-[#e51c2a] hover:underline">Quên mật khẩu?</Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#e51c2a] py-3.5 text-sm font-black tracking-wider text-white uppercase hover:bg-black transition disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-black/15" />
            <span className="text-xs text-black/40 font-bold">HOẶC</span>
            <div className="h-px flex-1 bg-black/15" />
          </div>

          <div className="w-full flex flex-col items-center">
            <div id="googleBtnDiv" className="w-full flex justify-center min-h-[44px]"></div>
            {!googleReady && (
              <button
                type="button"
                onClick={handleManualGoogle}
                className="w-full flex items-center justify-center gap-3 border border-black/20 py-3 text-sm font-bold hover:bg-white/70 transition bg-white"
              >
                <svg className="size-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Đăng nhập với Google
              </button>
            )}
          </div>

          {/* 1-Click Demo Accounts for Professor/Grader */}
          <div className="mt-6 pt-5 border-t border-black/15">
            <p className="text-[11px] font-black uppercase tracking-wider text-black/60 mb-2.5 text-center">
              Tài khoản Demo 1 chạm (Dành cho Giảng viên / Chấm bài)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@comicstore.vn", "admin123")}
                className="bg-black text-white hover:bg-[#e51c2a] py-2 px-2 text-xs font-bold transition text-left flex flex-col"
              >
                <span>👑 Admin</span>
                <span className="text-[9px] text-white/60 font-normal truncate">Toàn quyền hệ thống</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("manager@comicstore.vn", "manager123")}
                className="bg-black text-white hover:bg-[#e51c2a] py-2 px-2 text-xs font-bold transition text-left flex flex-col"
              >
                <span>📦 Quản Lý</span>
                <span className="text-[9px] text-white/60 font-normal truncate">Duyệt đơn, doanh thu</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("publisher@comicstore.vn", "publisher123")}
                className="bg-black text-white hover:bg-[#e51c2a] py-2 px-2 text-xs font-bold transition text-left flex flex-col"
              >
                <span>✍️ Nhà Xuất Bản</span>
                <span className="text-[9px] text-white/60 font-normal truncate">Tạo truyện, đề xuất tag</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("buyer@comicstore.vn", "buyer123")}
                className="bg-black text-white hover:bg-[#e51c2a] py-2 px-2 text-xs font-bold transition text-left flex flex-col"
              >
                <span>🛒 Khách Hàng</span>
                <span className="text-[9px] text-white/60 font-normal truncate">Mua & nhận đơn hàng</span>
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-black/50">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="font-bold text-[#e51c2a] hover:underline">Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
