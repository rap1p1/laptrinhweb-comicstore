import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../App";

type Comic = {
  id: number;
  title: string;
  issue: string;
  price: number;
  old_price?: number;
  characters: string[];
  description: string;
  preview: string;
  image_url: string;
  color: string;
  accent: string;
  mark: string;
  badge?: string;
  stock: number;
};

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

function ComicCover({ comic }: { comic: Comic }) {
  return (
    <div className="comic-cover relative aspect-[3/4.35] overflow-hidden" style={{ backgroundColor: comic.color, "--accent": comic.accent } as React.CSSProperties}>
      {comic.image_url ? (
        <img src={comic.image_url} alt={comic.title} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <>
          <div className="cover-rays absolute inset-0 opacity-55" />
          <div className="absolute -right-8 top-[24%] size-36 rotate-12 rounded-full border-[22px] border-[var(--accent)] opacity-70" />
          <div className="absolute inset-x-0 top-[18%] -rotate-3 border-y-4 border-black bg-[var(--accent)] py-2 text-center text-black">
            <span className="font-display text-4xl leading-none font-black tracking-[-.04em]">{comic.mark}</span>
          </div>
          <div className="halftone absolute right-4 bottom-5 size-24 rounded-full bg-black/75" />
        </>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
    </div>
  );
}

export default function HomePage() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComic, setSelectedComic] = useState<Comic | null>(null);
  const [searchParams] = useSearchParams();
  const [selectedTag, setSelectedTag] = useState("Tất cả");
  const [query, setQuery] = useState(searchParams.get("search") || "");
  const { user, refreshCart } = useAuth();
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const [toast, setToast] = useState("");

  const tags = useMemo(() => {
    const allChars = comics.flatMap((c) => c.characters);
    return ["Tất cả", ...Array.from(new Set(allChars))];
  }, [comics]);

  useEffect(() => {
    loadComics();
  }, []);

  const loadComics = async () => {
    try {
      setLoading(true);
      const data = await api.getComics();
      setComics(data.comics);
    } catch (err) {
      console.error("Failed to load comics:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return comics.filter((comic) => {
      const matchesTag = selectedTag === "Tất cả" || comic.characters.includes(selectedTag);
      const term = query.trim().toLowerCase();
      const matchesQuery = !term || `${comic.title} ${comic.characters.join(" ")} ${comic.description}`.toLowerCase().includes(term);
      return matchesTag && matchesQuery;
    });
  }, [comics, selectedTag, query]);

  const addToCart = async (comicId: number) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    try {
      setAddingToCart(comicId);
      await api.addToCart(comicId);
      await refreshCart();
      setToast("Đã thêm vào giỏ hàng!");
      setTimeout(() => setToast(""), 2000);
    } catch (err: any) {
      setToast(err.message);
      setTimeout(() => setToast(""), 3000);
    } finally {
      setAddingToCart(null);
    }
  };

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-5 z-50 bg-black text-white px-5 py-3 text-sm font-bold shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* Hero */}
      <section className="relative min-h-[590px] overflow-hidden bg-[#111] text-white">
        <img
          src="https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&w=1800&q=85"
          alt="Kệ truyện tranh"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,.96)_0%,rgba(10,10,10,.7)_47%,rgba(10,10,10,.1)_100%)]" />
        <div className="relative mx-auto flex min-h-[590px] max-w-[1440px] items-center px-5 py-20 lg:px-12">
          <div className="max-w-[720px]">
            <div className="mb-6 flex items-center gap-3 text-xs font-bold tracking-[.2em] text-[#ff4050] uppercase">
              <span className="h-px w-9 bg-[#ff4050]" /> Bộ sưu tập mới
            </div>
            <h1 className="font-display text-[62px] leading-[.86] font-black tracking-[-.045em] uppercase sm:text-[82px] lg:text-[106px]">
              Những trang<br /><span className="text-[#e6202f]">huyền thoại</span>
            </h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-white/75 sm:text-lg">
              Sưu tầm những đầu truyện kinh điển. Từ One Piece, Naruto đến Dragon Ball — tất cả có tại PANEL.
            </p>
            <a href="#catalog" className="mt-9 inline-flex items-center gap-5 bg-[#e51c2a] px-7 py-4 text-sm font-extrabold tracking-[.08em] uppercase transition hover:bg-white hover:text-black">
              Khám phá ngay <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></svg>
            </a>
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section id="catalog" className="mx-auto max-w-[1440px] px-5 py-20 lg:px-12 lg:py-28">
        <div className="flex flex-col justify-between gap-5 border-b border-black/25 pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-xs font-extrabold tracking-[.18em] text-[#e51c2a] uppercase">Danh mục</p>
            <h2 className="font-display text-5xl leading-none font-black tracking-[-.03em] uppercase sm:text-6xl">Tủ truyện nổi bật</h2>
          </div>
          <div className="flex items-center gap-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm..."
              className="border border-black/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#e51c2a] w-48 sm:w-56"
            />
            <p className="text-sm font-semibold text-black/55 whitespace-nowrap">{filtered.length.toString().padStart(2, "0")} truyện</p>
          </div>
        </div>

        <div className="scrollbar-none flex gap-2 overflow-x-auto py-7">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`shrink-0 border px-4 py-2.5 text-xs font-bold transition ${selectedTag === tag ? "border-black bg-black text-white" : "border-black/25 hover:border-black"}`}
            >
              {tag}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block size-8 border-3 border-black/20 border-t-[#e51c2a] rounded-full animate-spin" />
            <p className="mt-4 text-sm text-black/50">Đang tải...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 lg:gap-x-7 lg:gap-y-16">
            {filtered.map((comic) => (
              <article key={comic.id} className="group">
                <button className="block w-full text-left" onClick={() => setSelectedComic(comic)}>
                  <div className="relative overflow-hidden bg-black shadow-[5px_6px_0_rgba(0,0,0,.14)] transition duration-300 group-hover:-translate-y-2 group-hover:shadow-[9px_13px_0_rgba(229,28,42,.25)]">
                    <ComicCover comic={comic} />
                    {comic.badge && <span className="absolute top-3 left-0 bg-[#f4f0e7] px-3 py-1.5 text-[9px] font-black tracking-[.12em] uppercase">{comic.badge}</span>}
                    {comic.stock <= 0 && <span className="absolute top-3 right-0 bg-red-600 text-white px-3 py-1.5 text-[9px] font-black tracking-[.12em] uppercase">Hết hàng</span>}
                    <span className="absolute inset-x-0 bottom-0 translate-y-full bg-black/92 px-4 py-3 text-center text-xs font-bold tracking-wider text-white uppercase transition-transform duration-300 group-hover:translate-y-0">Xem chi tiết</span>
                  </div>
                  <div className="mt-5">
                    <p className="text-[10px] font-bold tracking-[.12em] text-[#e51c2a] uppercase">{comic.characters.slice(0, 3).join(" · ")}</p>
                    <h3 className="font-display mt-1 text-[22px] leading-tight font-extrabold tracking-[-.02em]">{comic.title}</h3>
                    <p className="mt-1 text-xs text-black/50">{comic.issue}</p>
                  </div>
                </button>
                <div className="mt-3 flex items-center justify-between border-t border-black/15 pt-3">
                  <div>
                    <span className="font-display text-lg font-extrabold">{money.format(comic.price)}</span>
                    {comic.old_price && <span className="ml-2 text-xs text-black/40 line-through">{money.format(comic.old_price)}</span>}
                  </div>
                  <button
                    onClick={() => addToCart(comic.id)}
                    disabled={addingToCart === comic.id || comic.stock <= 0}
                    className="grid size-9 place-items-center border border-black transition hover:bg-[#e51c2a] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {addingToCart === comic.id ? (
                      <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8h14l-1 13H6L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-black/30 py-20 text-center">
            <p className="font-display text-2xl font-bold">Không tìm thấy truyện phù hợp</p>
            <button onClick={() => { setQuery(""); setSelectedTag("Tất cả"); }} className="mt-3 text-sm font-bold text-[#e51c2a] underline">Xóa bộ lọc</button>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-[#e51c2a] px-5 py-16 text-white lg:px-12">
        <div className="mx-auto flex max-w-[1344px] flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <p className="font-display max-w-3xl text-4xl leading-[.95] font-black tracking-[-.03em] uppercase sm:text-6xl">Một thế giới.<br />Vô vàn câu chuyện.</p>
          <div className="max-w-sm">
            <p className="text-sm leading-6 text-white/80">Truyện chính hãng, đóng gói cẩn thận và giao hàng toàn quốc. Miễn phí vận chuyển cho đơn từ 499.000đ.</p>
            <a href="#catalog" className="mt-5 inline-flex items-center gap-3 border-b border-white pb-1 text-sm font-bold uppercase">Chọn truyện của bạn <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></svg></a>
          </div>
        </div>
      </section>

      {/* Comic Detail Modal */}
      {selectedComic && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && setSelectedComic(null)}>
          <div className="relative max-h-[94vh] w-full max-w-4xl overflow-y-auto bg-[#f4f0e7] shadow-2xl">
            <button onClick={() => setSelectedComic(null)} className="absolute top-4 right-4 z-10 grid size-10 place-items-center bg-black text-white transition hover:bg-[#e51c2a]" aria-label="Đóng">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
            <div className="grid md:grid-cols-[42%_58%]">
              <div className="bg-[#262626] p-8 md:p-12"><ComicCover comic={selectedComic} /></div>
              <div className="p-7 sm:p-10 md:p-12">
                <p className="text-[10px] font-black tracking-[.15em] text-[#e51c2a] uppercase">{selectedComic.characters.join(" · ")}</p>
                <h2 className="font-display mt-3 text-4xl leading-[.95] font-black tracking-[-.03em] uppercase sm:text-5xl">{selectedComic.title}</h2>
                <p className="mt-3 text-sm text-black/50">{selectedComic.issue}</p>
                <p className="mt-7 text-base leading-7">{selectedComic.description}</p>
                <div className="mt-7 border-l-4 border-[#e51c2a] bg-white/65 p-5">
                  <p className="mb-2 text-[10px] font-black tracking-[.16em] uppercase">Đọc thử</p>
                  <p className="font-serif text-[17px] leading-7 italic text-black/75">&ldquo;{selectedComic.preview}&rdquo;</p>
                </div>
                <p className="mt-4 text-xs text-black/40">Kho: {selectedComic.stock > 0 ? `Còn ${selectedComic.stock} cuốn` : "Hết hàng"}</p>
                <div className="mt-6 flex items-center justify-between gap-5 border-t border-black/20 pt-6">
                  <p className="font-display text-2xl font-black">{money.format(selectedComic.price)}</p>
                  <button
                    onClick={() => { addToCart(selectedComic.id); setSelectedComic(null); }}
                    disabled={selectedComic.stock <= 0}
                    className="flex items-center gap-3 bg-[#e51c2a] px-6 py-3.5 text-xs font-black tracking-wider text-white uppercase hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 8h14l-1 13H6L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
                    Thêm vào giỏ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
