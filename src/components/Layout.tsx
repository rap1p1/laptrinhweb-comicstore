import { Link, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../App";

function Icon({ name, className = "size-5" }: { name: "search" | "bag" | "arrow" | "close" | "menu" | "user" | "logout" | "dashboard" | "order"; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bag: <><path d="M5 8h14l-1 13H6L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 12 0v1" /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>,
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    order: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" /><path d="M14 2v6h6" /><path d="M16 13H8M16 17H8M10 9H8" /></>,
  };
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const roleLabels: Record<string, string> = {
  SYSTEM_ADMIN: "Quản trị viên",
  MANAGER: "Quản lý",
  PUBLISHER: "Nhà xuất bản",
  BUYER: "Người mua",
};

export default function Layout() {
  const { user, cartCount, logout } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/?search=${encodeURIComponent(query.trim())}`);
      setShowSearch(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f0e7] text-[#171717]">
      <header className="sticky top-0 z-40 border-b border-black/15 bg-[#f4f0e7]/95 backdrop-blur">
        <div className="mx-auto flex h-[74px] max-w-[1440px] items-center px-5 lg:px-12">
          <button className="mr-4 lg:hidden" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Mở menu"><Icon name="menu" /></button>
          <Link to="/" className="font-display text-[27px] font-black tracking-[-.04em]">
            PANEL<span className="text-[#e51c2a]">.</span>
          </Link>
          <nav className="ml-14 hidden items-center gap-8 text-[13px] font-bold tracking-[.08em] uppercase lg:flex">
            <Link to="/" className="py-1 hover:text-[#e51c2a] border-b-2 border-transparent hover:border-[#e51c2a] transition-colors">Truyện tranh</Link>
            {user && (user.role === "MANAGER" || user.role === "SYSTEM_ADMIN") && (
              <Link to="/dashboard" className="py-1 hover:text-[#e51c2a]">Quản lý</Link>
            )}
            {user && user.role === "PUBLISHER" && (
              <Link to="/publisher/comics" className="py-1 hover:text-[#e51c2a]">Truyện của tôi</Link>
            )}
            {user && (
              <Link to="/my-orders" className="py-1 hover:text-[#e51c2a]">Đơn hàng</Link>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-5">
            <form onSubmit={handleSearch} className={`hidden overflow-hidden border-b border-black transition-all sm:flex ${showSearch ? "w-56" : "w-0 border-transparent"}`}>
              <input autoFocus={showSearch} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm tên truyện..." className="w-full bg-transparent py-1 text-sm outline-none" />
            </form>
            <button onClick={() => setShowSearch(!showSearch)} aria-label="Tìm kiếm"><Icon name="search" /></button>
            {user ? (
              <>
                <Link to="/cart" className="relative" aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}>
                  <Icon name="bag" />
                  {cartCount > 0 && <span className="absolute -right-2 -top-2 grid size-4 place-items-center rounded-full bg-[#e51c2a] text-[9px] font-bold text-white">{cartCount}</span>}
                </Link>
                <div className="relative">
                  <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="size-8 rounded-full object-cover border-2 border-black/20" />
                    ) : (
                      <div className="size-8 rounded-full bg-[#e51c2a] grid place-items-center text-white text-xs font-bold">{user.name[0]}</div>
                    )}
                  </button>
                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 top-full z-50 mt-2 w-56 bg-white shadow-lg border border-black/10 py-2">
                        <div className="px-4 py-2 border-b border-black/10">
                          <p className="text-sm font-bold truncate">{user.name}</p>
                          <p className="text-xs text-black/50">{roleLabels[user.role]}</p>
                        </div>
                        {(user.role === "MANAGER" || user.role === "SYSTEM_ADMIN") && (
                          <button onClick={() => { navigate("/dashboard"); setShowUserMenu(false); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/5 transition">
                            <Icon name="dashboard" className="size-4" /> Dashboard
                          </button>
                        )}
                        <button onClick={() => { navigate("/my-orders"); setShowUserMenu(false); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/5 transition">
                          <Icon name="order" className="size-4" /> Đơn hàng của tôi
                        </button>
                        <button onClick={() => { logout(); setShowUserMenu(false); navigate("/"); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition">
                          <Icon name="logout" className="size-4" /> Đăng xuất
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <Link to="/login" className="flex items-center gap-2 bg-black text-white px-4 py-2 text-xs font-bold tracking-wider uppercase hover:bg-[#e51c2a] transition">
                <Icon name="user" className="size-4" /> Đăng nhập
              </Link>
            )}
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenu && (
          <div className="border-t border-black/10 bg-[#f4f0e7] px-5 py-4 lg:hidden">
            <Link to="/" onClick={() => setMobileMenu(false)} className="block py-2 text-sm font-bold">Truyện tranh</Link>
            {user && (
              <>
                <Link to="/cart" onClick={() => setMobileMenu(false)} className="block py-2 text-sm font-bold">Giỏ hàng ({cartCount})</Link>
                <Link to="/my-orders" onClick={() => setMobileMenu(false)} className="block py-2 text-sm font-bold">Đơn hàng</Link>
                {user.role === "PUBLISHER" && <Link to="/publisher/comics" onClick={() => setMobileMenu(false)} className="block py-2 text-sm font-bold">Truyện của tôi</Link>}
                {(user.role === "MANAGER" || user.role === "SYSTEM_ADMIN") && <Link to="/dashboard" onClick={() => setMobileMenu(false)} className="block py-2 text-sm font-bold">Dashboard</Link>}
              </>
            )}
          </div>
        )}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="bg-[#111] px-5 py-12 text-white lg:px-12">
        <div className="mx-auto max-w-[1344px]">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="font-display text-2xl font-black tracking-[-.03em] mb-4">PANEL<span className="text-[#e51c2a]">.</span></h3>
              <p className="text-sm text-white/50 leading-6">Cửa hàng truyện tranh Marvel Comics trực tuyến. Sưu tầm những tập truyện Marvel đỉnh cao với giá tốt nhất.</p>
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-[.15em] uppercase text-white/70 mb-4">Thông tin liên hệ</h4>
              <p className="text-sm text-white/50 leading-6">Học viện Công nghệ Bưu chính Viễn thông</p>
              <p className="text-sm text-white/50 leading-6">97 Man Thiện, Tăng Nhơn Phú A, TP. Thủ Đức, TP. Hồ Chí Minh</p>
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-[.15em] uppercase text-white/70 mb-4">Thành viên nhóm</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Nguyễn Quang Chí</span>
                  <span className="text-white/40 font-mono text-xs">N23DCAT009</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Tô Long Đức</span>
                  <span className="text-white/40 font-mono text-xs">N23DCAT013</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Phạm Thái Dương</span>
                  <span className="text-white/40 font-mono text-xs">N23DCAT016</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/30 sm:flex-row">
            <p>© 2025 PANEL. Đồ án môn Lập trình Web — PTIT HCM</p>
            <p>Bộ môn Công nghệ Thông tin</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
