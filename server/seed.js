import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import pool from "./db.js";
import { initDB } from "./schema.js";

dotenv.config();

const characterTags = [
  { name: "Iron Man", wiki_url: "https://en.wikipedia.org/wiki/Iron_Man" },
  { name: "Captain America", wiki_url: "https://en.wikipedia.org/wiki/Captain_America" },
  { name: "Spider-Man", wiki_url: "https://en.wikipedia.org/wiki/Spider-Man" },
  { name: "Thor", wiki_url: "https://en.wikipedia.org/wiki/Thor_(Marvel_Comics)" },
  { name: "Wolverine", wiki_url: "https://en.wikipedia.org/wiki/Wolverine_(character)" },
  { name: "Hulk", wiki_url: "https://en.wikipedia.org/wiki/Hulk" },
  { name: "Cyclops", wiki_url: "https://en.wikipedia.org/wiki/Cyclops_(Marvel_Comics)" },
  { name: "Thanos", wiki_url: "https://en.wikipedia.org/wiki/Thanos" }
];

const comics = [
  {
    title: "Civil War",
    issue: "Tập #1 — Cuộc Chiến Nội Bộ",
    price: 85000,
    old_price: 110000,
    publish_year: 2006,
    description: "Một thảm kịch kinh hoàng tại Stamford khiến chính phủ Mỹ thông qua Đạo luật Đăng ký Siêu anh hùng. Bất đồng sâu sắc khiến cộng đồng siêu anh hùng chia làm hai phe: Iron Man ủng hộ đạo luật và Captain America lãnh đạo phe kháng chiến ngầm.",
    preview: "Anh đứng về phía nào? Khi những người anh em từng chung một chiến hào quay lưng lại với nhau, sự thật và tự do trở thành ranh giới mong manh giữa sự sống và cái chết.",
    image_url: "https://images-na.ssl-images-amazon.com/images/P/078512179X.01.LZZZZZZZ.jpg",
    color: "#1c1d24",
    accent: "#e51c2a",
    mark: "CIVIL WAR",
    badge: "Bán chạy",
    stock: 45,
    characters: [
      { name: "Iron Man", wiki_url: "https://en.wikipedia.org/wiki/Iron_Man" },
      { name: "Captain America", wiki_url: "https://en.wikipedia.org/wiki/Captain_America" },
      { name: "Spider-Man", wiki_url: "https://en.wikipedia.org/wiki/Spider-Man" }
    ]
  },
  {
    title: "The Infinity Gauntlet",
    issue: "Tập #1 — Găng Tay Vô Cực",
    price: 95000,
    old_price: 125000,
    publish_year: 1991,
    description: "Thanos — Gã Titan Điên cuồng đã thu thập đủ sáu Viên đá Vô cực gắn lên chiếc Găng tay Vô cực. Để lấy lòng Nữ Thần Chết, hắn chỉ cần một cái búng tay để xóa sổ một nửa sinh linh trong toàn cõi vũ trụ.",
    preview: "Chỉ một cái búng tay nhẹ nhàng... một nửa vũ trụ hóa thành hư vô. Các siêu anh hùng vĩ đại nhất Trái Đất cùng các thực thể vũ trụ phải liên minh trong trận chiến sinh tồn tuyệt vọng.",
    image_url: "https://images-na.ssl-images-amazon.com/images/P/0785156593.01.LZZZZZZZ.jpg",
    color: "#2d1344",
    accent: "#f1c40f",
    mark: "THANOS",
    badge: "Kinh điển",
    stock: 30,
    characters: [
      { name: "Thanos", wiki_url: "https://en.wikipedia.org/wiki/Thanos" },
      { name: "Iron Man", wiki_url: "https://en.wikipedia.org/wiki/Iron_Man" },
      { name: "Thor", wiki_url: "https://en.wikipedia.org/wiki/Thor_(Marvel_Comics)" }
    ]
  },
  {
    title: "Spider-Man: Kraven's Last Hunt",
    issue: "Tập #1 — Cuộc Săn Cuối Cùng",
    price: 75000,
    old_price: null,
    publish_year: 1987,
    description: "Kraven the Hunter thề sẽ chứng minh mình vượt trội hơn Người Nhện trước khi nhắm mắt. Hắn bắn hạ Spider-Man, chôn sống anh và khoác lên mình bộ trang phục Người Nhện để đi trừng phạt tội phạm khắp New York.",
    preview: "Chúng nghĩ ta đã chết dưới hai mét đất lạnh... Nhưng linh hồn của Người Nhện không bao giờ gục ngã. Ta trỗi dậy từ nấm mồ để giành lại danh dự của chính mình!",
    image_url: "https://images-na.ssl-images-amazon.com/images/P/0785134506.01.LZZZZZZZ.jpg",
    color: "#191919",
    accent: "#b11313",
    mark: "SPIDER-MAN",
    badge: "Kinh điển",
    stock: 35,
    characters: [
      { name: "Spider-Man", wiki_url: "https://en.wikipedia.org/wiki/Spider-Man" }
    ]
  },
  {
    title: "Astonishing X-Men",
    issue: "Tập #1 — Dị Nhân Tái Xuất",
    price: 79000,
    old_price: null,
    publish_year: 2004,
    description: "Cyclops và Emma Frost cải tổ lại nhóm X-Men với mục tiêu hòa nhập cùng thế giới. Thế nhưng, thông tin về một liều thuốc giải chữa khỏi đột biến gen xuất hiện khiến mâu thuẫn giữa dị nhân và loài người bùng nổ dữ dội.",
    preview: "Chúng ta không phải căn bệnh cần chữa lành. Chúng ta là bước tiến hóa tiếp theo của nhân loại, và chúng ta sẽ bảo vệ thế giới dù họ có thù ghét chúng ta đến đâu.",
    image_url: "https://images-na.ssl-images-amazon.com/images/P/0785115315.01.LZZZZZZZ.jpg",
    color: "#0c2461",
    accent: "#f6b93b",
    mark: "X-MEN",
    badge: null,
    stock: 40,
    characters: [
      { name: "Cyclops", wiki_url: "https://en.wikipedia.org/wiki/Cyclops_(Marvel_Comics)" },
      { name: "Wolverine", wiki_url: "https://en.wikipedia.org/wiki/Wolverine_(character)" }
    ]
  },
  {
    title: "Iron Man: Extremis",
    issue: "Tập #1 — Tái Sinh Công Nghệ",
    price: 82000,
    old_price: 99000,
    publish_year: 2005,
    description: "Một loại huyết thanh công nghệ sinh học nguy hiểm mang tên Extremis rơi vào tay những kẻ khủng bố. Sau khi bị trọng thương suýt chết, Tony Stark quyết định tiêm Extremis vào chính cơ thể mình để biến thành cỗ máy chiến đấu tối thượng.",
    preview: "Bộ giáp không còn là vỏ bọc bên ngoài nữa. Giờ đây, công nghệ và cơ thể ta là một. Tôi là Người Sắt, và đây là bình minh của kỷ nguyên mới.",
    image_url: "https://images-na.ssl-images-amazon.com/images/P/0785183787.01.LZZZZZZZ.jpg",
    color: "#540000",
    accent: "#e67e22",
    mark: "IRON MAN",
    badge: "Bán chạy",
    stock: 50,
    characters: [
      { name: "Iron Man", wiki_url: "https://en.wikipedia.org/wiki/Iron_Man" }
    ]
  },
  {
    title: "Captain America: Winter Soldier",
    issue: "Tập #1 — Chiến Binh Mùa Đông",
    price: 86000,
    old_price: 105000,
    publish_year: 2005,
    description: "Red Skull bị ám sát bởi một sát thủ huyền thoại thời Chiến tranh Lạnh mang mật danh Chiến Binh Mùa Đông. Khi Steve Rogers điều tra tung tích kẻ sát nhân, anh bàng hoàng phát hiện ra danh tính thật sự của hắn chính là Bucky Barnes - người bạn thân tưởng như đã hy sinh từ Thế chiến II.",
    preview: "Bucky? Cậu còn sống? - Hắn nhìn thẳng vào mắt tôi với cánh tay kim loại lạnh buốt và hỏi: Bucky là ai? Cơn ác mộng tồi tệ nhất bắt đầu.",
    image_url: "https://images-na.ssl-images-amazon.com/images/P/0785143416.01.LZZZZZZZ.jpg",
    color: "#112233",
    accent: "#2980b9",
    mark: "CAPTAIN AMERICA",
    badge: "Bán chạy",
    stock: 50,
    characters: [
      { name: "Captain America", wiki_url: "https://en.wikipedia.org/wiki/Captain_America" }
    ]
  },
  {
    title: "Thor: God of Thunder",
    issue: "Tập #1 — Kẻ Sát Thần",
    price: 88000,
    old_price: null,
    publish_year: 2012,
    description: "Suốt nhiều thiên niên kỷ, các vị thần trên khắp vũ trụ đang lần lượt biến mất và bị tàn sát man rợ. Thor phát hiện ra sự tồn tại của Gorr — kẻ ôm mối hận thù diệt chủng thần thánh bằng thanh kiếm Hắc Kiếm All-Black.",
    preview: "Ngươi hỏi thần linh ở đâu khi thế giới của ngươi sụp đổ? Ta ở ngay đây! Và sấm sét của ta sẽ phán quyết tội ác của ngươi, hỡi Kẻ Sát Thần!",
    image_url: "https://images-na.ssl-images-amazon.com/images/P/0785168427.01.LZZZZZZZ.jpg",
    color: "#13253b",
    accent: "#00d2d3",
    mark: "THOR",
    badge: null,
    stock: 35,
    characters: [
      { name: "Thor", wiki_url: "https://en.wikipedia.org/wiki/Thor_(Marvel_Comics)" }
    ]
  },
  {
    title: "Wolverine: Old Man Logan",
    issue: "Tập #1 — Miền Đất Cằn Cỗi",
    price: 89000,
    old_price: 110000,
    publish_year: 2008,
    description: "50 năm sau khi các phản diện liên minh tiêu diệt toàn bộ siêu anh hùng và chia cắt nước Mỹ. Logan giờ đây già nua, từ bỏ móng vuốt và thề không dùng bạo lực để sống bình yên bên gia đình. Nhưng khoản nợ băng đảng Hulk buộc anh phải bước vào trận chiến cuối cùng.",
    preview: "Họ nghĩ Wolverine đã chết 50 năm trước. Họ đúng. Nhưng con quái vật bên trong ta chỉ đang ngủ say... và các ngươi vừa mới đánh thức nó!",
    image_url: "https://images-na.ssl-images-amazon.com/images/P/0785131590.01.LZZZZZZZ.jpg",
    color: "#2b1c11",
    accent: "#d35400",
    mark: "X-MEN",
    badge: "Kinh điển",
    stock: 35,
    characters: [
      { name: "Wolverine", wiki_url: "https://en.wikipedia.org/wiki/Wolverine_(character)" },
      { name: "Hulk", wiki_url: "https://en.wikipedia.org/wiki/Hulk" }
    ]
  },
  {
    title: "Avengers: Earth's Mightiest",
    issue: "Tập #1 — Biệt Đội Siêu Anh Hùng",
    price: 92000,
    old_price: 115000,
    publish_year: 2004,
    description: "Các siêu anh hùng vĩ đại nhất Trái Đất cùng đứng chung một chiến tuyến. Iron Man, Captain America, Thor và Hulk kết hợp sức mạnh phi thường để chống lại các thế lực đe dọa sự tồn vong của toàn nhân loại.",
    preview: "Và đến một ngày, khi những người hùng đơn độc nhận ra mối hiểm họa vượt qua giới hạn của từng người... Họ hợp nhất thành Avengers — Biệt Đội Siêu Anh Hùng!",
    image_url: "https://images-na.ssl-images-amazon.com/images/P/078514286X.01.LZZZZZZZ.jpg",
    color: "#22201d",
    accent: "#e67e22",
    mark: "AVENGERS",
    badge: "Bán chạy",
    stock: 45,
    characters: [
      { name: "Iron Man", wiki_url: "https://en.wikipedia.org/wiki/Iron_Man" },
      { name: "Captain America", wiki_url: "https://en.wikipedia.org/wiki/Captain_America" },
      { name: "Thor", wiki_url: "https://en.wikipedia.org/wiki/Thor_(Marvel_Comics)" },
      { name: "Hulk", wiki_url: "https://en.wikipedia.org/wiki/Hulk" }
    ]
  },
  {
    title: "X-Men: Days of Future Past",
    issue: "Tập #1 — Ngày Cũ Của Tương Lai",
    price: 88000,
    old_price: null,
    publish_year: 1981,
    description: "Trong một tương lai tăm tối nơi người máy Sentinels thống trị và săn lùng dị nhân đến bờ vực diệt chủng, những thành viên X-Men còn sót lại gửi ý thức về quá khứ để ngăn chặn sự kiện châm ngòi cho thảm họa.",
    preview: "Tương lai không phải điều bất biến. Dù hy vọng mong manh đến đâu, chúng ta sẽ chiến đấu vì ngày mai của loài dị nhân!",
    image_url: "https://images-na.ssl-images-amazon.com/images/P/0785198849.01.LZZZZZZZ.jpg",
    color: "#141416",
    accent: "#2ecc71",
    mark: "X-MEN",
    badge: "Kinh điển",
    stock: 35,
    characters: [
      { name: "Wolverine", wiki_url: "https://en.wikipedia.org/wiki/Wolverine_(character)" },
      { name: "Cyclops", wiki_url: "https://en.wikipedia.org/wiki/Cyclops_(Marvel_Comics)" }
    ]
  }
];

async function seed() {
  try {
    console.log("🌱 Initializing database schema...");
    await initDB();

    console.log("🌱 Seeding users...");
    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash("admin123", salt);
    const managerHash = await bcrypt.hash("manager123", salt);
    const publisherHash = await bcrypt.hash("publisher123", salt);
    const buyerHash = await bcrypt.hash("buyer123", salt);

    const adminResult = await pool.query(
      `INSERT INTO users (email, name, password_hash, role, is_verified) 
       VALUES ('admin@comicstore.vn', 'Quản trị viên', $1, 'SYSTEM_ADMIN', TRUE)
       ON CONFLICT (email) DO UPDATE SET password_hash = $1
       RETURNING id`,
      [adminHash]
    );

    await pool.query(
      `INSERT INTO users (email, name, password_hash, role, is_verified) 
       VALUES ('manager@comicstore.vn', 'Quản lý duyệt truyện', $1, 'MANAGER', TRUE)
       ON CONFLICT (email) DO UPDATE SET password_hash = $1`,
      [managerHash]
    );

    const publisherResult = await pool.query(
      `INSERT INTO users (email, name, password_hash, role, is_verified) 
       VALUES ('publisher@comicstore.vn', 'Người đăng truyện', $1, 'PUBLISHER', TRUE)
       ON CONFLICT (email) DO UPDATE SET password_hash = $1
       RETURNING id`,
      [publisherHash]
    );

    await pool.query(
      `INSERT INTO users (email, name, password_hash, role, is_verified) 
       VALUES ('buyer@comicstore.vn', 'Người mua', $1, 'BUYER', TRUE)
       ON CONFLICT (email) DO UPDATE SET password_hash = $1`,
      [buyerHash]
    );

    const publisherId = publisherResult.rows[0]?.id || 3;
    const adminId = adminResult.rows[0]?.id || 1;

    // Seed approved character tags
    console.log("🌱 Seeding character tags...");
    for (const tag of characterTags) {
      await pool.query(
        `INSERT INTO character_tags (name, wiki_url, status, created_by)
         VALUES ($1, $2, 'APPROVED', $3)
         ON CONFLICT (name) DO UPDATE SET wiki_url = EXCLUDED.wiki_url`,
        [tag.name, tag.wiki_url, adminId]
      );
    }

    // Reset comics and character tables for clean Avengers & X-Men collection
    console.log("🌱 Clearing old comics and characters...");
    await pool.query("DELETE FROM cart_items");
    await pool.query("DELETE FROM order_items");
    await pool.query("DELETE FROM comic_characters");
    await pool.query("DELETE FROM comics");

    // Seed comics
    console.log("🌱 Seeding Marvel comics...");
    for (const comic of comics) {
      const result = await pool.query(
        `INSERT INTO comics (title, issue, price, old_price, publish_year, description, preview, image_url, color, accent, mark, badge, stock, status, created_by, approved_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'APPROVED', $14, $15) RETURNING id`,
        [comic.title, comic.issue, comic.price, comic.old_price, comic.publish_year, comic.description, comic.preview, comic.image_url, comic.color, comic.accent, comic.mark, comic.badge, comic.stock, publisherId, adminId]
      );

      const comicId = result.rows[0].id;
      for (const char of comic.characters) {
        await pool.query(
          "INSERT INTO comic_characters (comic_id, character_name, wiki_url) VALUES ($1, $2, $3)",
          [comicId, char.name, char.wiki_url]
        );
      }
    }

    console.log(`✅ Successfully seeded ${comics.length} Marvel comics, ${characterTags.length} character tags and 4 users!`);
    console.log("\n📋 Test accounts:");
    console.log("  Admin:     admin@comicstore.vn / admin123");
    console.log("  Manager:   manager@comicstore.vn / manager123");
    console.log("  Publisher: publisher@comicstore.vn / publisher123");
    console.log("  Buyer:     buyer@comicstore.vn / buyer123");

    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seed();
