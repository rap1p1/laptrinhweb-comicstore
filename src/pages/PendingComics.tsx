import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../App";

export default function PendingComics() {
  const { user } = useAuth();
  const [comics, setComics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || (user.role !== "MANAGER" && user.role !== "SYSTEM_ADMIN")) {
      navigate("/");
      return;
    }
    loadComics();
  }, [user]);

  const loadComics = async () => {
    try {
      const data = await api.getPendingComics();
      setComics(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const approve = async (id: number) => {
    try {
      await api.reviewComic(id, "APPROVED");
      loadComics();
    } catch (err: any) { alert(err.message); }
  };

  const reject = async (id: number) => {
    try {
      await api.reviewComic(id, "REJECTED", rejectReason);
      setRejectId(null);
      setRejectReason("");
      loadComics();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="py-20 text-center"><div className="inline-block size-8 border-3 border-black/20 border-t-[#e51c2a] rounded-full animate-spin" /></div>;

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-12 lg:px-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl font-black tracking-[-.03em] uppercase">Duyệt truyện</h1>
        <button onClick={() => navigate("/dashboard")} className="text-sm font-bold text-[#e51c2a] hover:underline">← Dashboard</button>
      </div>

      {comics.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-black/20">
          <p className="text-5xl mb-4">✅</p>
          <p className="font-display text-2xl font-bold">Không có truyện nào chờ duyệt</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comics.map((comic) => (
            <div key={comic.id} className="bg-white border border-black/10 p-5">
              <div className="flex gap-5">
                <div className="shrink-0 w-24 h-32 overflow-hidden" style={{ backgroundColor: comic.color }}>
                  {comic.image_url ? <img src={comic.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span className="font-display text-sm font-black text-white/80">{comic.mark}</span></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl font-black">{comic.title}</h3>
                      <p className="text-xs text-black/50">{comic.issue}</p>
                      <p className="text-xs text-black/40 mt-1">Đăng bởi: <span className="font-bold text-black/60">{comic.creator_name}</span></p>
                    </div>
                    <span className="font-display text-lg font-black text-[#e51c2a]">{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(comic.price)}</span>
                  </div>
                  <p className="text-sm text-black/60 mt-2 line-clamp-2">{comic.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {comic.characters?.map((char: string) => (
                      <span key={char} className="bg-black/5 px-2 py-1 text-xs font-bold">{char}</span>
                    ))}
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 text-xs font-bold">Kho: {comic.stock}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <button onClick={() => approve(comic.id)} className="bg-green-600 text-white px-5 py-2 text-xs font-bold uppercase hover:bg-green-700 transition">✓ Duyệt</button>
                    {rejectId === comic.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Lý do từ chối..." className="flex-1 border border-black/20 px-3 py-2 text-sm outline-none focus:border-red-500" />
                        <button onClick={() => reject(comic.id)} className="bg-red-600 text-white px-4 py-2 text-xs font-bold uppercase">Gửi</button>
                        <button onClick={() => setRejectId(null)} className="text-xs font-bold text-black/50">Hủy</button>
                      </div>
                    ) : (
                      <button onClick={() => setRejectId(comic.id)} className="border border-red-500 text-red-500 px-5 py-2 text-xs font-bold uppercase hover:bg-red-500 hover:text-white transition">✕ Từ chối</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
