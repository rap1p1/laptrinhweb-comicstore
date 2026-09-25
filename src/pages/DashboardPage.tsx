import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../App";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || (user.role !== "MANAGER" && user.role !== "SYSTEM_ADMIN")) {
      navigate("/");
      return;
    }
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="py-20 text-center"><div className="inline-block size-8 border-3 border-black/20 border-t-[#e51c2a] rounded-full animate-spin" /></div>;

  const cards = [
    { label: "Người dùng", value: stats?.totalUsers || 0, icon: "👥", color: "bg-blue-500" },
    { label: "Truyện đã duyệt", value: stats?.totalComics || 0, icon: "📚", color: "bg-green-500" },
    { label: "Chờ duyệt", value: stats?.pendingComics || 0, icon: "⏳", color: "bg-yellow-500" },
    { label: "Đơn hàng", value: stats?.totalOrders || 0, icon: "📦", color: "bg-purple-500" },
    { label: "Doanh thu", value: money.format(stats?.totalRevenue || 0), icon: "💰", color: "bg-red-500" },
  ];

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-12 lg:px-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl font-black tracking-[-.03em] uppercase">Dashboard</h1>
        <span className="text-xs font-bold tracking-wider uppercase text-black/40">{user?.role === "SYSTEM_ADMIN" ? "Quản trị viên" : "Quản lý"}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        {cards.map((card) => (
          <div key={card.label} className="bg-white border border-black/10 p-5">
            <div className="text-2xl mb-2">{card.icon}</div>
            <p className="font-display text-2xl font-black">{card.value}</p>
            <p className="text-xs text-black/50 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/manage/pending" className="group border border-black/10 bg-white p-6 hover:border-[#e51c2a] transition">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📋</span>
            <h3 className="font-display text-xl font-black group-hover:text-[#e51c2a] transition">Duyệt truyện</h3>
          </div>
          <p className="text-sm text-black/50">Xem và duyệt các truyện đang chờ phê duyệt</p>
          {stats?.pendingComics > 0 && <span className="inline-block mt-3 bg-yellow-100 text-yellow-800 px-3 py-1 text-xs font-bold rounded-full">{stats.pendingComics} đang chờ</span>}
        </Link>

        <Link to="/manage/comics" className="group border border-black/10 bg-white p-6 hover:border-[#e51c2a] transition">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📚</span>
            <h3 className="font-display text-xl font-black group-hover:text-[#e51c2a] transition">Quản lý đơn hàng</h3>
          </div>
          <p className="text-sm text-black/50">Xem và quản lý tất cả đơn hàng</p>
        </Link>

        {user?.role === "SYSTEM_ADMIN" && (
          <Link to="/manage/users" className="group border border-black/10 bg-white p-6 hover:border-[#e51c2a] transition">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">👥</span>
              <h3 className="font-display text-xl font-black group-hover:text-[#e51c2a] transition">Quản lý người dùng</h3>
            </div>
            <p className="text-sm text-black/50">Quản lý tài khoản và phân quyền</p>
          </Link>
        )}
      </div>
    </div>
  );
}
