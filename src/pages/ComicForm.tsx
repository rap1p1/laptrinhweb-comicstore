import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../App";

export default function ComicForm() {
  const { user } = useAuth();
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    issue: "",
    price: "",
    old_price: "",
    description: "",
    preview: "",
    image_url: "",
    color: "#111111",
    accent: "#e51c2a",
    mark: "",
    badge: "",
    stock: "0",
    characters: "",
  });

  useEffect(() => {
    if (!user || (user.role !== "PUBLISHER" && user.role !== "SYSTEM_ADMIN")) {
      navigate("/");
      return;
    }
    if (isEdit) loadComic();
  }, [user, id]);

  const loadComic = async () => {
    setLoading(true);
    try {
      const comic = await api.getComic(parseInt(id!));
      setForm({
        title: comic.title || "",
        issue: comic.issue || "",
        price: comic.price?.toString() || "",
        old_price: comic.old_price?.toString() || "",
        description: comic.description || "",
        preview: comic.preview || "",
        image_url: comic.image_url || "",
        color: comic.color || "#111111",
        accent: comic.accent || "#e51c2a",
        mark: comic.mark || "",
        badge: comic.badge || "",
        stock: comic.stock?.toString() || "0",
        characters: comic.characters?.join(", ") || "",
      });
    } catch (err) { navigate("/publisher/comics"); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const data = {
        title: form.title,
        issue: form.issue,
        price: parseInt(form.price),
        old_price: form.old_price ? parseInt(form.old_price) : null,
        description: form.description,
        preview: form.preview,
        image_url: form.image_url,
        color: form.color,
        accent: form.accent,
        mark: form.mark,
        badge: form.badge || null,
        stock: parseInt(form.stock) || 0,
        characters: form.characters.split(",").map((c) => c.trim()).filter(Boolean),
      };

      if (isEdit) {
        await api.updateComic(parseInt(id!), data);
      } else {
        await api.createComic(data);
      }
      navigate("/publisher/comics");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  if (loading) return <div className="py-20 text-center"><div className="inline-block size-8 border-3 border-black/20 border-t-[#e51c2a] rounded-full animate-spin" /></div>;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 lg:px-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl font-black tracking-[-.03em] uppercase">{isEdit ? "Sửa truyện" : "Đăng truyện mới"}</h1>
        <button onClick={() => navigate("/publisher/comics")} className="text-sm font-bold text-[#e51c2a] hover:underline">← Quay lại</button>
      </div>

      {error && <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 font-medium">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white border border-black/10 p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">Tên truyện *</label>
            <input value={form.title} onChange={(e) => update("title", e.target.value)} required className="w-full border border-black/20 px-4 py-3 text-sm outline-none focus:border-[#e51c2a]" />
          </div>
          <div>
            <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">Số/Tập</label>
            <input value={form.issue} onChange={(e) => update("issue", e.target.value)} className="w-full border border-black/20 px-4 py-3 text-sm outline-none focus:border-[#e51c2a]" placeholder="Tập #1 — Tiêu đề" />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">Giá (VNĐ) *</label>
            <input type="number" value={form.price} onChange={(e) => update("price", e.target.value)} required className="w-full border border-black/20 px-4 py-3 text-sm outline-none focus:border-[#e51c2a]" />
          </div>
          <div>
            <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">Giá cũ</label>
            <input type="number" value={form.old_price} onChange={(e) => update("old_price", e.target.value)} className="w-full border border-black/20 px-4 py-3 text-sm outline-none focus:border-[#e51c2a]" />
          </div>
          <div>
            <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">Số lượng kho</label>
            <input type="number" value={form.stock} onChange={(e) => update("stock", e.target.value)} className="w-full border border-black/20 px-4 py-3 text-sm outline-none focus:border-[#e51c2a]" />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">Mô tả</label>
          <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} className="w-full border border-black/20 px-4 py-3 text-sm outline-none focus:border-[#e51c2a] resize-none" />
        </div>

        <div>
          <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">Đoạn trích xem trước</label>
          <textarea value={form.preview} onChange={(e) => update("preview", e.target.value)} rows={3} className="w-full border border-black/20 px-4 py-3 text-sm outline-none focus:border-[#e51c2a] resize-none" />
        </div>

        <div>
          <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">URL hình ảnh bìa</label>
          <input value={form.image_url} onChange={(e) => update("image_url", e.target.value)} className="w-full border border-black/20 px-4 py-3 text-sm outline-none focus:border-[#e51c2a]" placeholder="https://..." />
          {form.image_url && <img src={form.image_url} alt="Preview" className="mt-2 h-32 object-cover border" />}
        </div>

        <div>
          <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">Nhân vật (phân tách bằng dấu phẩy)</label>
          <input value={form.characters} onChange={(e) => update("characters", e.target.value)} className="w-full border border-black/20 px-4 py-3 text-sm outline-none focus:border-[#e51c2a]" placeholder="Spider-Man, Iron Man, Captain America" />
        </div>

        <div className="grid sm:grid-cols-4 gap-5">
          <div>
            <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">Ký hiệu bìa</label>
            <input value={form.mark} onChange={(e) => update("mark", e.target.value)} className="w-full border border-black/20 px-4 py-3 text-sm outline-none focus:border-[#e51c2a]" placeholder="MARVEL" />
          </div>
          <div>
            <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">Badge</label>
            <input value={form.badge} onChange={(e) => update("badge", e.target.value)} className="w-full border border-black/20 px-4 py-3 text-sm outline-none focus:border-[#e51c2a]" placeholder="Mới" />
          </div>
          <div>
            <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">Màu nền</label>
            <input type="color" value={form.color} onChange={(e) => update("color", e.target.value)} className="w-full h-[46px] border border-black/20 p-1 cursor-pointer" />
          </div>
          <div>
            <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">Màu nhấn</label>
            <input type="color" value={form.accent} onChange={(e) => update("accent", e.target.value)} className="w-full h-[46px] border border-black/20 p-1 cursor-pointer" />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-black/10">
          <button type="submit" disabled={saving} className="bg-[#e51c2a] text-white px-8 py-3 text-sm font-black tracking-wider uppercase hover:bg-black transition disabled:opacity-50">
            {saving ? "Đang lưu..." : isEdit ? "Cập nhật" : "Đăng truyện"}
          </button>
          <button type="button" onClick={() => navigate("/publisher/comics")} className="border border-black/20 px-8 py-3 text-sm font-bold uppercase hover:bg-black hover:text-white transition">
            Hủy
          </button>
        </div>

        {!isEdit && (
          <p className="text-xs text-black/40">* Truyện sẽ được gửi đến quản lý để duyệt trước khi công bố trên trang web.</p>
        )}
      </form>
    </div>
  );
}
