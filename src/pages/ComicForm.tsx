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
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [selectedChars, setSelectedChars] = useState<string[]>([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagWiki, setNewTagWiki] = useState("");
  const [tagMessage, setTagMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    issue: "",
    price: "",
    old_price: "",
    publish_year: "2024",
    description: "",
    preview: "",
    image_url: "",
    color: "#111111",
    accent: "#e51c2a",
    mark: "MARVEL",
    badge: "",
    stock: "10",
  });

  useEffect(() => {
    if (!user || (user.role !== "PUBLISHER" && user.role !== "SYSTEM_ADMIN")) {
      navigate("/");
      return;
    }
    loadTags();
    if (isEdit) loadComic();
  }, [user, id]);

  const loadTags = async () => {
    try {
      const data = await api.getTags();
      setAvailableTags(data || []);
    } catch (err) {
      console.error("Failed to load tags:", err);
    }
  };

  const loadComic = async () => {
    setLoading(true);
    try {
      const comic = await api.getComic(parseInt(id!));
      setForm({
        title: comic.title || "",
        issue: comic.issue || "",
        price: comic.price?.toString() || "",
        old_price: comic.old_price?.toString() || "",
        publish_year: comic.publish_year?.toString() || "2024",
        description: comic.description || "",
        preview: comic.preview || "",
        image_url: comic.image_url || "",
        color: comic.color || "#111111",
        accent: comic.accent || "#e51c2a",
        mark: comic.mark || "MARVEL",
        badge: comic.badge || "",
        stock: comic.stock?.toString() || "0",
      });
      setSelectedChars(comic.characters || []);
    } catch (err) {
      navigate("/publisher/comics");
    } finally {
      setLoading(false);
    }
  };

  const toggleChar = (charName: string) => {
    if (selectedChars.includes(charName)) {
      setSelectedChars(selectedChars.filter((c) => c !== charName));
    } else {
      setSelectedChars([...selectedChars, charName]);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    try {
      const created = await api.createTag(newTagName.trim(), newTagWiki.trim());
      setNewTagName("");
      setNewTagWiki("");
      if (created.status === "APPROVED") {
        setTagMessage("Đã thêm tag thành công!");
        setSelectedChars([...selectedChars, created.name]);
      } else {
        setTagMessage("Đã gửi yêu cầu tạo tag! Quản lý sẽ phê duyệt sớm.");
      }
      loadTags();
      setTimeout(() => {
        setTagMessage("");
        setShowTagModal(false);
      }, 1800);
    } catch (err: any) {
      setTagMessage(err.message || "Lỗi tạo tag");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (selectedChars.length === 0) {
      setError("Vui lòng chọn ít nhất 1 nhân vật cho truyện");
      return;
    }
    setSaving(true);
    try {
      const data = {
        title: form.title,
        issue: form.issue,
        price: parseInt(form.price),
        old_price: form.old_price ? parseInt(form.old_price) : null,
        publish_year: form.publish_year ? parseInt(form.publish_year) : 2024,
        description: form.description,
        preview: form.preview,
        image_url: form.image_url,
        color: form.color,
        accent: form.accent,
        mark: form.mark,
        badge: form.badge || null,
        stock: parseInt(form.stock) || 0,
        characters: selectedChars,
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

  if (loading)
    return (
      <div className="py-20 text-center">
        <div className="inline-block size-8 border-3 border-black/20 border-t-[#e51c2a] rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 lg:px-12">
      <h1 className="font-display text-4xl font-black tracking-[-.03em] uppercase mb-8">
        {isEdit ? "Chỉnh sửa truyện" : "Đăng truyện mới"}
      </h1>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">
              Tên truyện *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              required
              className="w-full border border-black/20 px-4 py-3 text-sm outline-none focus:border-[#e51c2a]"
              placeholder="Civil War, Spider-Man..."
            />
          </div>
          <div>
            <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">
              Tập / Issue
            </label>
            <input
              type="text"
              value={form.issue}
              onChange={(e) => update("issue", e.target.value)}
              className="w-full border border-black/20 px-4 py-3 text-sm outline-none focus:border-[#e51c2a]"
              placeholder="Tập #1 — Cuộc Chiến Nội Bộ"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">
              Giá bán (VNĐ) *
            </label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              required
              min="0"
              className="w-full border border-black/20 px-4 py-3 text-sm outline-none focus:border-[#e51c2a]"
              placeholder="85000"
            />
          </div>
          <div>
            <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">
              Giá cũ (gạch ngang)
            </label>
            <input
              type="number"
              value={form.old_price}
              onChange={(e) => update("old_price", e.target.value)}
              min="0"
              className="w-full border border-black/20 px-4 py-3 text-sm outline-none focus:border-[#e51c2a]"
              placeholder="110000"
            />
          </div>
          <div>
            <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">
              Năm xuất bản
            </label>
            <input
              type="number"
              value={form.publish_year}
              onChange={(e) => update("publish_year", e.target.value)}
              min="1950"
              max="2030"
              className="w-full border border-black/20 px-4 py-3 text-sm outline-none focus:border-[#e51c2a]"
              placeholder="2006"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">
              Số lượng trong kho *
            </label>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => update("stock", e.target.value)}
              required
              min="0"
              className="w-full border border-black/20 px-4 py-3 text-sm outline-none focus:border-[#e51c2a]"
            />
          </div>
          <div>
            <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">
              Nhãn nổi bật (Badge)
            </label>
            <select
              value={form.badge}
              onChange={(e) => update("badge", e.target.value)}
              className="w-full border border-black/20 bg-white px-4 py-3 text-sm outline-none focus:border-[#e51c2a]"
            >
              <option value="">(Không có badge)</option>
              <option value="Bán chạy">Bán chạy</option>
              <option value="Kinh điển">Kinh điển</option>
              <option value="Mới">Mới</option>
            </select>
          </div>
        </div>

        {/* Character Tags Selection */}
        <div className="border border-black/10 bg-[#faf8f5] p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="text-xs font-bold tracking-wider uppercase text-black/80 block">
                Chọn Tag Nhân vật *
              </label>
              <p className="text-xs text-black/50">Nhấp vào nhân vật để thêm vào truyện</p>
            </div>
            <button
              type="button"
              onClick={() => setShowTagModal(true)}
              className="text-xs font-bold text-[#e51c2a] border border-[#e51c2a]/40 px-3 py-1.5 hover:bg-[#e51c2a] hover:text-white transition"
            >
              + Đề xuất tag mới
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {availableTags.map((tag) => {
              const isSelected = selectedChars.includes(tag.name);
              return (
                <button
                  type="button"
                  key={tag.name}
                  onClick={() => toggleChar(tag.name)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border transition ${
                    isSelected
                      ? "bg-[#e51c2a] text-white border-[#e51c2a]"
                      : "bg-white text-black/70 border-black/20 hover:border-black"
                  }`}
                >
                  <span>{isSelected ? "✓ " : "+ "}{tag.name}</span>
                </button>
              );
            })}
          </div>

          {selectedChars.length > 0 && (
            <div className="mt-4 pt-3 border-t border-black/10 flex items-center gap-2 text-xs">
              <span className="font-bold text-black/60">Đã chọn:</span>
              <span className="font-semibold text-[#e51c2a]">{selectedChars.join(", ")}</span>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">
            Mô tả truyện
          </label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            className="w-full border border-black/20 px-4 py-3 text-sm outline-none focus:border-[#e51c2a] resize-none"
            placeholder="Tóm tắt nội dung chính..."
          />
        </div>

        <div>
          <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">
            Đoạn trích xem trước (Đọc thử)
          </label>
          <textarea
            value={form.preview}
            onChange={(e) => update("preview", e.target.value)}
            rows={2}
            className="w-full border border-black/20 px-4 py-3 text-sm outline-none focus:border-[#e51c2a] resize-none"
            placeholder="Lời thoại hoặc trích đoạn ấn tượng..."
          />
        </div>

        <div>
          <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">
            URL hình ảnh bìa
          </label>
          <input
            value={form.image_url}
            onChange={(e) => update("image_url", e.target.value)}
            className="w-full border border-black/20 px-4 py-3 text-sm outline-none focus:border-[#e51c2a]"
            placeholder="https://images-na.ssl-images-amazon.com/..."
          />
          {form.image_url && (
            <img src={form.image_url} alt="Preview" className="mt-2 h-36 object-cover border" />
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">
              Ký hiệu bìa
            </label>
            <input
              value={form.mark}
              onChange={(e) => update("mark", e.target.value)}
              className="w-full border border-black/20 px-4 py-3 text-sm outline-none focus:border-[#e51c2a]"
              placeholder="MARVEL, AVENGERS..."
            />
          </div>
          <div>
            <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">
              Màu nền
            </label>
            <input
              type="color"
              value={form.color}
              onChange={(e) => update("color", e.target.value)}
              className="w-full h-[46px] border border-black/20 p-1 cursor-pointer"
            />
          </div>
          <div>
            <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-2">
              Màu nhấn
            </label>
            <input
              type="color"
              value={form.accent}
              onChange={(e) => update("accent", e.target.value)}
              className="w-full h-[46px] border border-black/20 p-1 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-black/10">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#e51c2a] text-white px-8 py-3 text-sm font-black tracking-wider uppercase hover:bg-black transition disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : isEdit ? "Cập nhật" : "Đăng truyện"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/publisher/comics")}
            className="border border-black/20 px-8 py-3 text-sm font-bold uppercase hover:bg-black hover:text-white transition"
          >
            Hủy
          </button>
        </div>

        {!isEdit && (
          <p className="text-xs text-black/40">
            * Truyện sau khi gửi sẽ nằm ở danh sách phê duyệt của Quản lý trước khi được công bố lên website.
          </p>
        )}
      </form>

      {/* Propose Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white p-6 shadow-2xl">
            <h3 className="font-display text-xl font-black mb-4">Đề xuất Tag Nhân vật mới</h3>
            {tagMessage && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-2 font-medium">
                {tagMessage}
              </div>
            )}
            <form onSubmit={handleCreateTag} className="space-y-4">
              <div>
                <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-1">
                  Tên nhân vật *
                </label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  required
                  placeholder="Hawkeye, Black Widow, Loki..."
                  className="w-full border border-black/20 px-3 py-2 text-sm outline-none focus:border-[#e51c2a]"
                />
              </div>
              <div>
                <label className="text-xs font-bold tracking-wider uppercase text-black/60 block mb-1">
                  Đường dẫn Wiki (Tùy chọn)
                </label>
                <input
                  type="url"
                  value={newTagWiki}
                  onChange={(e) => setNewTagWiki(e.target.value)}
                  placeholder="https://en.wikipedia.org/wiki/..."
                  className="w-full border border-black/20 px-3 py-2 text-sm outline-none focus:border-[#e51c2a]"
                />
                <p className="text-[11px] text-black/40 mt-1">
                  Nếu để trống, hệ thống sẽ tự động tạo liên kết tìm kiếm Wikipedia cho nhân vật.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTagModal(false)}
                  className="border border-black/20 px-4 py-2 text-xs font-bold uppercase hover:bg-black hover:text-white transition"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="bg-[#e51c2a] text-white px-5 py-2 text-xs font-bold uppercase hover:bg-black transition"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
