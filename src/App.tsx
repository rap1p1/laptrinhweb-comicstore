import { useMemo, useState } from "react";

type Comic = {
  id: number;
  title: string;
  issue: string;
  price: number;
  oldPrice?: number;
  characters: string[];
  description: string;
  preview: string;
  color: string;
  accent: string;
  mark: string;
  badge?: string;
};

const comics: Comic[] = [
  {
    id: 1,
    title: "The Amazing Spider-Man",
    issue: "Số #1 — Khởi đầu mới",
    price: 89000,
    oldPrice: 119000,
    characters: ["Spider-Man", "Green Goblin"],
    description: "Peter Parker trở lại New York và đối mặt với một bí ẩn ngay giữa lòng thành phố.",
    preview: "Một đêm mưa tại Queens, giác quan nhện của Peter vang lên dữ dội. Nhưng kẻ đang đợi anh trên mái nhà không phải là một tội phạm bình thường — hắn biết chính xác Peter là ai.",
    color: "#df1f2d",
    accent: "#61bce8",
    mark: "SPIDER",
    badge: "Bán chạy",
  },
  {
    id: 2,
    title: "Invincible Iron Man",
    issue: "Số #7 — Stark Resilient",
    price: 99000,
    characters: ["Iron Man", "War Machine"],
    description: "Tony Stark phải xây dựng lại mọi thứ, từ bộ giáp đến niềm tin của chính mình.",
    preview: "Không còn công ty, không còn phòng thí nghiệm, Tony chỉ có một bộ giáp cũ và bảy mươi hai giờ để ngăn công nghệ Stark rơi vào tay kẻ thù.",
    color: "#f1b91f",
    accent: "#c91c2b",
    mark: "IRON",
    badge: "Mới",
  },
  {
    id: 3,
    title: "Captain America",
    issue: "Số #14 — Sentinel",
    price: 79000,
    characters: ["Captain America", "Winter Soldier"],
    description: "Một âm mưu từ quá khứ buộc Steve Rogers phải lựa chọn giữa biểu tượng và sự thật.",
    preview: "Chiếc khiên có thể chặn một viên đạn, nhưng không thể bảo vệ Steve khỏi bí mật được chôn giấu suốt bảy thập kỷ. Bucky là người duy nhất còn nhớ.",
    color: "#174ea3",
    accent: "#e92d36",
    mark: "CAP",
  },
  {
    id: 4,
    title: "Mighty Thor",
    issue: "Số #3 — Thần Sấm",
    price: 109000,
    characters: ["Thor", "Loki"],
    description: "Asgard rung chuyển khi Loki mang về một lời tiên tri có thể kết thúc Cửu Giới.",
    preview: "Sấm sét xé đôi bầu trời Asgard. Mjolnir không đáp lời triệu gọi, còn Loki mỉm cười — bởi lần đầu tiên, vị thần lừa lọc đang nói sự thật.",
    color: "#5b2b8c",
    accent: "#79d3ef",
    mark: "THOR",
    badge: "Giới hạn",
  },
  {
    id: 5,
    title: "Black Panther",
    issue: "Số #5 — Wakanda Forever",
    price: 95000,
    characters: ["Black Panther", "Shuri"],
    description: "T'Challa và Shuri bảo vệ Wakanda trước một kẻ địch có thể điều khiển Vibranium.",
    preview: "Tại mỏ Vibranium sâu nhất, thứ kim loại bất hoại đang tự chuyển động như có sự sống. Shuri gọi đó là điều không thể. T'Challa gọi đó là chiến tranh.",
    color: "#161619",
    accent: "#9b64dd",
    mark: "WAKANDA",
  },
  {
    id: 6,
    title: "Doctor Strange",
    issue: "Số #9 — Đa vũ trụ",
    price: 99000,
    characters: ["Doctor Strange", "Scarlet Witch"],
    description: "Cánh cửa giữa các thực tại mở ra, mang theo một phiên bản Strange đầy nguy hiểm.",
    preview: "Sanctum Sanctorum có một căn phòng không tồn tại trên bất kỳ bản vẽ nào. Khi Wanda mở cửa, cô nhìn thấy chính mình — và một thế giới không còn Stephen Strange.",
    color: "#17205e",
    accent: "#ef6a37",
    mark: "STRANGE",
  },
  {
    id: 7,
    title: "Deadpool",
    issue: "Số #12 — Maximum Effort",
    price: 85000,
    characters: ["Deadpool", "Wolverine"],
    description: "Một nhiệm vụ đơn giản, một khoản tiền lớn và hai dị nhân hoàn toàn không hợp nhau.",
    preview: "Wade được thuê để lấy một chiếc vali. Logan được thuê để ngăn Wade. Cả hai đều không biết trong vali có gì — và đó là lúc mọi thứ bắt đầu phát nổ.",
    color: "#a20f22",
    accent: "#202124",
    mark: "DEADPOOL",
    badge: "Độc giả chọn",
  },
  {
    id: 8,
    title: "X-Men: Red",
    issue: "Số #4 — Mutantkind",
    price: 92000,
    characters: ["X-Men", "Wolverine"],
    description: "Đội X-Men mới bước vào cuộc đua giải cứu những dị nhân cuối cùng trên sao Hỏa.",
    preview: "Arakko phát tín hiệu cầu cứu rồi im bặt. Jean có thể nghe thấy hàng triệu suy nghĩ biến mất cùng lúc. Cyclops chỉ nói hai từ: lên đường.",
    color: "#f3c52f",
    accent: "#164b9b",
    mark: "X-MEN",
  },
  {
    id: 9,
    title: "Hulk: Titan",
    issue: "Số #6 — Rage Within",
    price: 88000,
    characters: ["Hulk", "Thor"],
    description: "Bruce Banner mất kiểm soát khi một thực thể cổ xưa thức tỉnh bên trong Hulk.",
    preview: "Bruce luôn nghĩ Hulk là thứ đáng sợ nhất bên trong mình. Anh đã nhầm. Một tiếng gầm khác đang lớn dần, và ngay cả Thor cũng không thể ngăn nó.",
    color: "#3f832d",
    accent: "#b97ae0",
    mark: "HULK",
  },
  {
    id: 10,
    title: "Avengers Assemble",
    issue: "Số #25 — Final Host",
    price: 129000,
    oldPrice: 149000,
    characters: ["Iron Man", "Thor", "Captain America"],
    description: "Ba Avengers nguyên bản hội tụ trong trận chiến quyết định vận mệnh Trái Đất.",
    preview: "Tín hiệu Avengers vang lên trên mọi tần số. Từ ba phía của thế giới, ba người hùng cùng nhìn lên bầu trời đỏ rực. Đây có thể là lần tập hợp cuối cùng.",
    color: "#112f62",
    accent: "#ef3b34",
    mark: "AVENGERS",
    badge: "Đặc biệt",
  },
];

const tags = ["Tất cả", "Spider-Man", "Iron Man", "Captain America", "Thor", "Wolverine", "Hulk"];
const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

function Icon({ name, className = "size-5" }: { name: "search" | "bag" | "arrow" | "close" | "menu"; className?: string }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bag: <><path d="M5 8h14l-1 13H6L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  };
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function ComicCover({ comic }: { comic: Comic }) {
  return (
    <div className="comic-cover relative aspect-[3/4.35] overflow-hidden" style={{ backgroundColor: comic.color, "--accent": comic.accent } as React.CSSProperties}>
      <div className="cover-rays absolute inset-0 opacity-55" />
      <div className="absolute -right-8 top-[24%] size-36 rotate-12 rounded-full border-[22px] border-[var(--accent)] opacity-70" />
      <div className="absolute inset-x-3 top-3 flex items-center justify-between text-[8px] font-bold tracking-[.18em] text-white/80">
        <span>MARVEL COMICS</span><span>{comic.issue.split("—")[0]}</span>
      </div>
      <div className="absolute inset-x-0 top-[18%] -rotate-3 border-y-4 border-black bg-[var(--accent)] py-2 text-center text-black">
        <span className="font-display text-4xl leading-none font-black tracking-[-.04em]">{comic.mark}</span>
      </div>
      <div className="halftone absolute right-4 bottom-5 size-24 rounded-full bg-black/75" />
      <div className="absolute bottom-4 left-4 max-w-[62%]">
        <p className="font-display text-[11px] leading-none font-bold tracking-[.12em] text-white uppercase">Heroes are made in the moment</p>
      </div>
    </div>
  );
}

export default function App() {
  const [selectedTag, setSelectedTag] = useState("Tất cả");
  const [query, setQuery] = useState("");
  const [selectedComic, setSelectedComic] = useState<Comic | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [showSearch, setShowSearch] = useState(false);

  const filtered = useMemo(() => comics.filter((comic) => {
    const matchesTag = selectedTag === "Tất cả" || comic.characters.includes(selectedTag);
    const term = query.trim().toLowerCase();
    const matchesQuery = !term || `${comic.title} ${comic.characters.join(" ")}`.toLowerCase().includes(term);
    return matchesTag && matchesQuery;
  }), [selectedTag, query]);

  return (
    <div className="min-h-screen bg-[#f4f0e7] text-[#171717]">
      <header className="sticky top-0 z-40 border-b border-black/15 bg-[#f4f0e7]/95 backdrop-blur">
        <div className="mx-auto flex h-[74px] max-w-[1440px] items-center px-5 lg:px-12">
          <button className="mr-4 lg:hidden" aria-label="Mở menu"><Icon name="menu" /></button>
          <a href="#" className="font-display text-[27px] font-black tracking-[-.04em]">
            PANEL<span className="text-[#e51c2a]">.</span>
          </a>
          <nav className="ml-14 hidden items-center gap-8 text-[13px] font-bold tracking-[.08em] uppercase lg:flex">
            <a href="#catalog" className="border-b-2 border-[#e51c2a] py-1">Truyện tranh</a>
            <a href="#characters" className="py-1 hover:text-[#e51c2a]">Nhân vật</a>
            <a href="#about" className="py-1 hover:text-[#e51c2a]">Về chúng tôi</a>
          </nav>
          <div className="ml-auto flex items-center gap-5">
            <div className={`hidden overflow-hidden border-b border-black transition-all sm:flex ${showSearch ? "w-56" : "w-0 border-transparent"}`}>
              <input autoFocus={showSearch} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm tên truyện..." className="w-full bg-transparent py-1 text-sm outline-none" />
            </div>
            <button onClick={() => setShowSearch(!showSearch)} aria-label="Tìm kiếm"><Icon name="search" /></button>
            <button className="relative" aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}>
              <Icon name="bag" />
              {cartCount > 0 && <span className="absolute -right-2 -top-2 grid size-4 place-items-center rounded-full bg-[#e51c2a] text-[9px] font-bold text-white">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative min-h-[590px] overflow-hidden bg-[#111] text-white">
          <img
            src="https://images.unsplash.com/photo-1689277037704-49a09b66f27f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1800"
            alt="Kệ truyện tranh đầy màu sắc"
            className="absolute inset-0 h-full w-full object-cover opacity-50"
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
                Sưu tầm những đầu truyện Marvel kinh điển. Từ đường phố New York đến những dải ngân hà xa xôi.
              </p>
              <a href="#catalog" className="mt-9 inline-flex items-center gap-5 bg-[#e51c2a] px-7 py-4 text-sm font-extrabold tracking-[.08em] uppercase transition hover:bg-white hover:text-black">
                Khám phá ngay <Icon name="arrow" />
              </a>
            </div>
          </div>
          <p className="absolute right-5 bottom-4 text-[9px] tracking-wider text-white/50">Ảnh: Mick Haupt / Unsplash</p>
        </section>

        <section id="catalog" className="mx-auto max-w-[1440px] px-5 py-20 lg:px-12 lg:py-28">
          <div className="flex flex-col justify-between gap-5 border-b border-black/25 pb-7 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 text-xs font-extrabold tracking-[.18em] text-[#e51c2a] uppercase">Danh mục</p>
              <h2 className="font-display text-5xl leading-none font-black tracking-[-.03em] uppercase sm:text-6xl">Tủ truyện nổi bật</h2>
            </div>
            <p className="text-sm font-semibold text-black/55">{filtered.length.toString().padStart(2, "0")} ấn phẩm</p>
          </div>

          <div id="characters" className="scrollbar-none flex gap-2 overflow-x-auto py-7">
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

          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-7 lg:gap-y-16">
              {filtered.map((comic) => (
                <article key={comic.id} className="group">
                  <button className="block w-full text-left" onClick={() => setSelectedComic(comic)} aria-label={`Xem trước ${comic.title}`}>
                    <div className="relative overflow-hidden bg-black shadow-[5px_6px_0_rgba(0,0,0,.14)] transition duration-300 group-hover:-translate-y-2 group-hover:shadow-[9px_13px_0_rgba(229,28,42,.25)]">
                      <ComicCover comic={comic} />
                      {comic.badge && <span className="absolute top-3 left-0 bg-[#f4f0e7] px-3 py-1.5 text-[9px] font-black tracking-[.12em] uppercase">{comic.badge}</span>}
                      <span className="absolute inset-x-0 bottom-0 translate-y-full bg-black/92 px-4 py-3 text-center text-xs font-bold tracking-wider text-white uppercase transition-transform duration-300 group-hover:translate-y-0">Đọc preview</span>
                    </div>
                    <div className="mt-5">
                      <p className="text-[10px] font-bold tracking-[.12em] text-[#e51c2a] uppercase">{comic.characters.slice(0, 2).join(" · ")}</p>
                      <h3 className="font-display mt-1 text-[22px] leading-tight font-extrabold tracking-[-.02em]">{comic.title}</h3>
                      <p className="mt-1 text-xs text-black/50">{comic.issue}</p>
                    </div>
                  </button>
                  <div className="mt-3 flex items-center justify-between border-t border-black/15 pt-3">
                    <div>
                      <span className="font-display text-lg font-extrabold">{money.format(comic.price)}</span>
                      {comic.oldPrice && <span className="ml-2 text-xs text-black/40 line-through">{money.format(comic.oldPrice)}</span>}
                    </div>
                    <button onClick={() => setCartCount((count) => count + 1)} className="grid size-9 place-items-center border border-black transition hover:bg-[#e51c2a] hover:text-white" aria-label={`Thêm ${comic.title} vào giỏ`}><Icon name="bag" className="size-4" /></button>
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

        <section id="about" className="bg-[#e51c2a] px-5 py-16 text-white lg:px-12">
          <div className="mx-auto flex max-w-[1344px] flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <p className="font-display max-w-3xl text-4xl leading-[.95] font-black tracking-[-.03em] uppercase sm:text-6xl">Một vũ trụ.<br />Vô vàn câu chuyện.</p>
            <div className="max-w-sm">
              <p className="text-sm leading-6 text-white/80">Truyện chính hãng, đóng gói cẩn thận và giao hàng toàn quốc. Miễn phí vận chuyển cho đơn từ 499.000đ.</p>
              <a href="#catalog" className="mt-5 inline-flex items-center gap-3 border-b border-white pb-1 text-sm font-bold uppercase">Chọn truyện của bạn <Icon name="arrow" /></a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#111] px-5 py-8 text-white lg:px-12">
        <div className="mx-auto flex max-w-[1344px] flex-col justify-between gap-3 text-xs text-white/45 sm:flex-row">
          <p>© 2025 PANEL. Cửa hàng truyện tranh tuyển chọn.</p>
          <p>Marvel và các nhân vật liên quan thuộc bản quyền của Marvel.</p>
        </div>
      </footer>

      {selectedComic && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`Preview ${selectedComic.title}`} onMouseDown={(e) => e.target === e.currentTarget && setSelectedComic(null)}>
          <div className="relative max-h-[94vh] w-full max-w-4xl overflow-y-auto bg-[#f4f0e7] shadow-2xl">
            <button onClick={() => setSelectedComic(null)} className="absolute top-4 right-4 z-10 grid size-10 place-items-center bg-black text-white transition hover:bg-[#e51c2a]" aria-label="Đóng"><Icon name="close" /></button>
            <div className="grid md:grid-cols-[42%_58%]">
              <div className="bg-[#262626] p-8 md:p-12"><ComicCover comic={selectedComic} /></div>
              <div className="p-7 sm:p-10 md:p-12">
                <p className="text-[10px] font-black tracking-[.15em] text-[#e51c2a] uppercase">{selectedComic.characters.join(" · ")}</p>
                <h2 className="font-display mt-3 text-4xl leading-[.95] font-black tracking-[-.03em] uppercase sm:text-5xl">{selectedComic.title}</h2>
                <p className="mt-3 text-sm text-black/50">{selectedComic.issue}</p>
                <p className="mt-7 text-base leading-7">{selectedComic.description}</p>
                <div className="mt-7 border-l-4 border-[#e51c2a] bg-white/65 p-5">
                  <p className="mb-2 text-[10px] font-black tracking-[.16em] uppercase">Đọc thử</p>
                  <p className="font-serif text-[17px] leading-7 italic text-black/75">“{selectedComic.preview}”</p>
                </div>
                <div className="mt-8 flex items-center justify-between gap-5 border-t border-black/20 pt-6">
                  <p className="font-display text-2xl font-black">{money.format(selectedComic.price)}</p>
                  <button onClick={() => { setCartCount((count) => count + 1); setSelectedComic(null); }} className="flex items-center gap-3 bg-[#e51c2a] px-6 py-3.5 text-xs font-black tracking-wider text-white uppercase hover:bg-black"><Icon name="bag" className="size-4" /> Thêm vào giỏ</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
