import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../App";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const statusLabels: Record<string, { text: string; color: string }> = {
  DRAFT: { text: "Nháp", color: "bg-gray-100 text-gray-700" },
  PENDING: { text: "Chờ duyệt", color: "bg-yellow-100 text-yellow-800" },
  APPROVED: { text: "Đã duyệt", color: "bg-green-100 text-green-800" },
  REJECTED: { text: "Bị từ chối", color: "bg-red-100 text-red-800" },
};

export default function PublisherComics() {
  const { user } = useAuth();
  const [comics, setComics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || (user.role !== "PUBLISHER" && user.role !== "SYSTEM_ADMIN")) {
      navigate("/");
      return;
    }
    loadComics();
  }, [user]);

  const loadComics = async () => {
    try {
      const data = await api.getMyComics();
      setComics(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const deleteComic = async (id: number, title: string) => {
    if (!confirm(`Xóa truyện "${title}"?`)) return;
    try {
      await api.deleteComic(id);
      loadComics();
    } catch (err: any) { alert(err.message); }
  };

  const updateStock = async (id: number, currentStock: number) => {
    const newStock = prompt("Nhập số lượng kho mới:", currentStock.toString());
    if (newStock === null) return;
    try {
      await api.updateStock(id, parseInt(newStock));
      loadComics();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="py-20 text-center"><div className="inline-block size-8 border-3 border-black/20 border-t-[#e51c2a] rounded-full animate-spin" /></div>;

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-12 lg:px-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl font-black tracking-[-.03em] uppercase">Truyện của tôi</h1>
        <Link to="/publisher/comics/new" className="bg-[#e51c2a] text-white px-5 py-2.5 text-xs font-bold uppercase hover:bg-black transition">+ Đăng truyện mới</Link>
      </div>

      {comics.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-black/20">
          <p className="text-5xl mb-4">📝</p>
          <p className="font-display text-2xl font-bold mb-2">Chưa có truyện nào</p>
          <Link to="/publisher/comics/new" className="inline-block mt-4 bg-[#e51c2a] px-6 py-3 text-sm font-bold text-white uppercase hover:bg-black transition">Đăng truyện đầu tiên</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {comics.map((comic) => {
            const status = statusLabels[comic.status] || { text: comic.status, color: "bg-gray-100" };
            return (
              <div key={comic.id} className="bg-white border border-black/10 p-5">
                <div className="flex gap-5">
                  <div className="shrink-0 w-20 h-28 overflow-hidden" style={{ backgroundColor: comic.color }}>
                    {comic.image_url ? <img src={comic.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span className="font-display text-xs font-black text-white/80">{comic.mark}</span></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-lg font-black">{comic.title}</h3>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${status.color}`}>{status.text}</span>
                        </div>
                        <p className="text-xs text-black/50">{comic.issue}</p>
                      </div>
                      <span className="font-display text-lg font-black">{money.format(comic.price)}</span>
                    </div>
                    {comic.reject_reason && (
                      <div className="mt-2 bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                        <span className="font-bold">Lý do từ chối:</span> {comic.reject_reason}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      <button onClick={() => updateStock(comic.id, comic.stock)} className="text-xs font-bold text-blue-600 hover:underline">Kho: {comic.stock}</button>
                      <Link to={`/publisher/comics/${comic.id}/edit`} className="text-xs font-bold text-[#e51c2a] hover:underline">Sửa</Link>
                      <button onClick={() => deleteComic(comic.id, comic.title)} className="text-xs font-bold text-red-500 hover:underline">Xóa</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
