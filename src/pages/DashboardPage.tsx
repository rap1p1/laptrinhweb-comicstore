import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../App";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "TAGS">("OVERVIEW");

  // New tag form state
  const [newTagName, setNewTagName] = useState("");
  const [newTagWiki, setNewTagWiki] = useState("");
  const [newTagAvatar, setNewTagAvatar] = useState("");
  const [tagSubmitting, setTagSubmitting] = useState(false);
  const [tagError, setTagError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (!user || (user.role !== "MANAGER" && user.role !== "SYSTEM_ADMIN")) {
      navigate("/");
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [statsData, tagsData] = await Promise.all([
        api.getStats(),
        api.getTags(),
      ]);
      setStats(statsData);
      setTags(tagsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    setTagSubmitting(true);
    setTagError("");
    try {
      await api.createTag({
        name: newTagName.trim(),
        wiki_link: newTagWiki.trim() || undefined,
        avatar_url: newTagAvatar.trim() || undefined,
      });
      setNewTagName("");
      setNewTagWiki("");
      setNewTagAvatar("");
      const updatedTags = await api.getTags();
      setTags(updatedTags);
    } catch (err: any) {
      setTagError(err.message || "Lỗi tạo nhân vật");
    } finally {
      setTagSubmitting(false);
    }
  };

  const handleReviewTag = async (id: number, status: "APPROVED" | "REJECTED") => {
    try {
      await api.reviewTag(id, status);
      const updatedTags = await api.getTags();
      setTags(updatedTags);
    } catch (err: any) {
      alert(err.message || "Lỗi duyệt tag");
    }
  };

  const handleDeleteTag = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa tag nhân vật này?")) return;
    try {
      await api.deleteTag(id);
      const updatedTags = await api.getTags();
      setTags(updatedTags);
    } catch (err: any) {
      alert(err.message || "Lỗi xóa tag");
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block size-9 border-3 border-black/20 border-t-[#e51c2a] rounded-full animate-spin" />
      </div>
    );
  }

  const pendingTagsCount = tags.filter((t) => t.status === "PENDING").length;

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-12 lg:px-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-4xl font-black tracking-[-.03em] uppercase">Dashboard</h1>
            <span className="text-xs bg-[#e51c2a] text-white px-2.5 py-1 font-bold rounded">
              {user?.role === "SYSTEM_ADMIN" ? "Admin Hệ Thống" : "Quản Lý Cửa Hàng"}
            </span>
          </div>
          <p className="text-black/50 text-sm mt-1">Báo cáo doanh thu, tiến độ đơn hàng và danh mục nhân vật Marvel</p>
        </div>

        {/* Tab switch */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("OVERVIEW")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "OVERVIEW"
                ? "bg-black text-white"
                : "bg-white border border-black/15 text-black/70 hover:border-black"
            }`}
          >
            Tổng quan & Doanh thu
          </button>
          <button
            onClick={() => setActiveTab("TAGS")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition relative ${
              activeTab === "TAGS"
                ? "bg-black text-white"
                : "bg-white border border-black/15 text-black/70 hover:border-black"
            }`}
          >
            Tag Nhân Vật
            {pendingTagsCount > 0 && (
              <span className="ml-2 bg-yellow-400 text-black px-1.5 py-0.5 rounded-full text-[10px] font-black">
                {pendingTagsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === "OVERVIEW" && (
        <div className="space-y-10">
          {/* Revenue Breakdown */}
          <div>
            <h2 className="text-xs font-black tracking-wider uppercase text-black/40 mb-3">Doanh thu & Tài chính</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-black/10 p-6 shadow-xs">
                <span className="text-xs text-black/50 uppercase tracking-wider font-bold">Tổng doanh thu</span>
                <p className="font-display text-3xl font-black text-[#e51c2a] mt-2">
                  {money.format(stats?.totalRevenue || 0)}
                </p>
                <span className="text-xs text-black/40 mt-1 block">Bao gồm toàn bộ đơn hàng hợp lệ</span>
              </div>

              <div className="bg-white border border-emerald-200 bg-emerald-50/20 p-6 shadow-xs">
                <span className="text-xs text-emerald-800 uppercase tracking-wider font-bold">Doanh thu đã nhận</span>
                <p className="font-display text-3xl font-black text-emerald-700 mt-2">
                  {money.format(stats?.deliveredRevenue || 0)}
                </p>
                <span className="text-xs text-emerald-600 mt-1 block">Khách hàng đã nhận đơn thành công</span>
              </div>

              <div className="bg-white border border-orange-200 bg-orange-50/20 p-6 shadow-xs">
                <span className="text-xs text-orange-800 uppercase tracking-wider font-bold">Doanh thu đang giao</span>
                <p className="font-display text-3xl font-black text-orange-700 mt-2">
                  {money.format(stats?.shippingRevenue || 0)}
                </p>
                <span className="text-xs text-orange-600 mt-1 block">Kiện hàng đang trên đường vận chuyển</span>
              </div>
            </div>
          </div>

          {/* Operational Metrics */}
          <div>
            <h2 className="text-xs font-black tracking-wider uppercase text-black/40 mb-3">Chỉ số vận hành</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-black/10 p-5">
                <span className="text-2xl">📦</span>
                <p className="font-display text-2xl font-black mt-2">{stats?.totalOrders || 0}</p>
                <p className="text-xs text-black/50 mt-0.5">Tổng số đơn hàng</p>
              </div>

              <div className="bg-white border border-black/10 p-5">
                <span className="text-2xl">📚</span>
                <p className="font-display text-2xl font-black mt-2">{stats?.totalComics || 0}</p>
                <p className="text-xs text-black/50 mt-0.5">Truyện đang bán</p>
              </div>

              <div className="bg-white border border-black/10 p-5">
                <span className="text-2xl">⏳</span>
                <p className="font-display text-2xl font-black mt-2">{stats?.pendingComics || 0}</p>
                <p className="text-xs text-black/50 mt-0.5">Truyện chờ duyệt</p>
              </div>

              <div className="bg-white border border-black/10 p-5">
                <span className="text-2xl">👥</span>
                <p className="font-display text-2xl font-black mt-2">{stats?.totalUsers || 0}</p>
                <p className="text-xs text-black/50 mt-0.5">Tài khoản thành viên</p>
              </div>
            </div>
          </div>

          {/* Quick Nav Actions */}
          <div className="grid md:grid-cols-3 gap-5">
            <Link
              to="/manage/comics"
              className="group border border-black/10 bg-white p-6 hover:border-[#e51c2a] transition shadow-xs"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🚚</span>
                <h3 className="font-display text-xl font-black group-hover:text-[#e51c2a] transition">
                  Quản lý đơn hàng
                </h3>
              </div>
              <p className="text-sm text-black/50">Duyệt vận chuyển, đổi trạng thái đơn, và xử lý hoàn hàng.</p>
              <span className="inline-block mt-4 text-xs font-black uppercase text-[#e51c2a]">Truy cập đơn hàng →</span>
            </Link>

            <Link
              to="/manage/pending"
              className="group border border-black/10 bg-white p-6 hover:border-[#e51c2a] transition shadow-xs"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">📋</span>
                <h3 className="font-display text-xl font-black group-hover:text-[#e51c2a] transition">
                  Duyệt truyện mới
                </h3>
              </div>
              <p className="text-sm text-black/50">Kiểm tra thông tin truyện từ Nhà xuất bản trước khi mở bán.</p>
              {stats?.pendingComics > 0 && (
                <span className="inline-block mt-3 bg-yellow-100 text-yellow-800 px-3 py-1 text-xs font-bold rounded-full">
                  {stats.pendingComics} truyện chờ duyệt
                </span>
              )}
            </Link>

            {user?.role === "SYSTEM_ADMIN" ? (
              <Link
                to="/manage/users"
                className="group border border-black/10 bg-white p-6 hover:border-[#e51c2a] transition shadow-xs"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">👥</span>
                  <h3 className="font-display text-xl font-black group-hover:text-[#e51c2a] transition">
                    Quản lý người dùng
                  </h3>
                </div>
                <p className="text-sm text-black/50">Quản lý tài khoản, nâng quyền Quản lý hoặc Nhà xuất bản.</p>
                <span className="inline-block mt-4 text-xs font-black uppercase text-[#e51c2a]">Phân quyền user →</span>
              </Link>
            ) : (
              <div
                onClick={() => setActiveTab("TAGS")}
                className="group border border-black/10 bg-white p-6 hover:border-[#e51c2a] transition shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🏷️</span>
                  <h3 className="font-display text-xl font-black group-hover:text-[#e51c2a] transition">
                    Tag Nhân Vật Comic
                  </h3>
                </div>
                <p className="text-sm text-black/50">Quản lý wiki nhân vật Marvel và duyệt đề xuất từ NXB.</p>
                <span className="inline-block mt-4 text-xs font-black uppercase text-[#e51c2a]">Quản lý tags →</span>
              </div>
            )}
          </div>

          {/* Top Selling Comics */}
          {stats?.topSelling && stats.topSelling.length > 0 && (
            <div className="bg-white border border-black/10 p-6">
              <h3 className="font-display text-lg font-black uppercase mb-4">Truyện Bán Chạy Nhất</h3>
              <div className="divide-y divide-black/10">
                {stats.topSelling.map((comic: any, idx: number) => (
                  <div key={comic.id} className="py-3 flex items-center justify-between gap-4 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-display font-black text-black/40 w-5">#{idx + 1}</span>
                      <span className="font-bold">{comic.title}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-xs text-black/50">{comic.total_sold} cuốn đã bán</span>
                      <span className="font-bold text-[#e51c2a]">{money.format(comic.total_revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "TAGS" && (
        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          {/* Tag List */}
          <div className="bg-white border border-black/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-black uppercase">
                Danh sách nhân vật Marvel ({tags.length})
              </h2>
              <span className="text-xs text-black/50">Nhấp link wiki để tra cứu tiểu sử</span>
            </div>

            <div className="divide-y divide-black/10">
              {tags.map((tag) => (
                <div key={tag.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {tag.avatar_url ? (
                      <img src={tag.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-black/10" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center font-bold text-xs text-black/60">
                        {tag.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-black">{tag.name}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tag.status === "APPROVED"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {tag.status === "APPROVED" ? "Đã duyệt" : "Chờ duyệt"}
                        </span>
                      </div>
                      {tag.wiki_link ? (
                        <a
                          href={tag.wiki_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#e51c2a] hover:underline flex items-center gap-1 mt-0.5"
                        >
                          Marvel Wiki ↗
                        </a>
                      ) : (
                        <span className="text-xs text-black/40">Chưa có wiki link</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {tag.status === "PENDING" && (
                      <button
                        onClick={() => handleReviewTag(tag.id, "APPROVED")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 text-xs font-bold uppercase rounded-sm"
                      >
                        Duyệt
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="border border-rose-200 text-rose-700 hover:bg-rose-50 px-3 py-1 text-xs font-bold uppercase rounded-sm"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Tag Form */}
          <div className="bg-white border border-black/10 p-6 h-fit">
            <h3 className="font-display text-lg font-black uppercase mb-4">Thêm nhân vật mới</h3>
            {tagError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs p-3">
                {tagError}
              </div>
            )}
            <form onSubmit={handleCreateTag} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-black/60 block mb-1.5">
                  Tên nhân vật *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thor, Black Panther"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="w-full border border-black/20 px-3 py-2 text-sm outline-none focus:border-[#e51c2a]"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-black/60 block mb-1.5">
                  Đường dẫn Marvel Wiki
                </label>
                <input
                  type="url"
                  placeholder="https://marvel.fandom.com/wiki/..."
                  value={newTagWiki}
                  onChange={(e) => setNewTagWiki(e.target.value)}
                  className="w-full border border-black/20 px-3 py-2 text-sm outline-none focus:border-[#e51c2a]"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-black/60 block mb-1.5">
                  Ảnh đại diện (URL)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newTagAvatar}
                  onChange={(e) => setNewTagAvatar(e.target.value)}
                  className="w-full border border-black/20 px-3 py-2 text-sm outline-none focus:border-[#e51c2a]"
                />
              </div>

              <button
                type="submit"
                disabled={tagSubmitting}
                className="w-full bg-[#e51c2a] text-white py-2.5 text-xs font-black uppercase tracking-wider hover:bg-black transition disabled:opacity-50"
              >
                {tagSubmitting ? "Đang thêm..." : "Tạo & Phê duyệt tag"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
