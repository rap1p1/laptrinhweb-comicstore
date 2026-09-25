import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import pool from "./db.js";
import { initDB } from "./schema.js";

dotenv.config();

const comics = [
  {
    title: "One Piece",
    issue: "Tập #1 — Romance Dawn",
    price: 30000,
    old_price: null,
    description: "Monkey D. Luffy khởi đầu hành trình trở thành Vua Hải Tặc. Cậu bé với khả năng co giãn cơ thể nhờ trái Gomu Gomu no Mi bắt đầu tập hợp thủy thủ đoàn và ra khơi.",
    preview: "\"Tôi sẽ trở thành Vua Hải Tặc!\" — Luffy tuyên bố với cả thế giới, bắt đầu cuộc phiêu lưu vĩ đại nhất trên biển cả. Từ ngôi làng nhỏ Foosha, cậu bé 17 tuổi đội chiếc mũ rơm ra khơi.",
    image_url: "https://m.media-amazon.com/images/I/71LBFxpVfNL._SL1000_.jpg",
    color: "#d4181f",
    accent: "#f5c518",
    mark: "ONE PIECE",
    badge: "Bán chạy",
    stock: 50,
    characters: ["Luffy", "Zoro", "Nami"]
  },
  {
    title: "Naruto",
    issue: "Tập #1 — Uzumaki Naruto",
    price: 25000,
    old_price: null,
    description: "Uzumaki Naruto, cậu bé ninja với con Cửu Vĩ bị phong ấn bên trong, quyết tâm trở thành Hokage — thủ lĩnh mạnh nhất của làng Lá.",
    preview: "Naruto bị cả làng xa lánh vì mang trong mình Cửu Vĩ Hồ Ly. Nhưng cậu không bao giờ từ bỏ ước mơ trở thành Hokage, người được cả làng công nhận và tôn trọng.",
    image_url: "https://m.media-amazon.com/images/I/71QYLrc-IGL._SL1000_.jpg",
    color: "#ff6319",
    accent: "#1a1a2e",
    mark: "NARUTO",
    badge: "Kinh điển",
    stock: 40,
    characters: ["Naruto", "Sasuke", "Sakura"]
  },
  {
    title: "Dragon Ball",
    issue: "Tập #1 — Son Goku và những người bạn",
    price: 28000,
    old_price: 35000,
    description: "Câu chuyện về Son Goku — cậu bé có đuôi khỉ với sức mạnh phi thường, cùng Bulma thu thập 7 viên ngọc rồng có thể triệu hồi rồng thần Shenron.",
    preview: "Trên núi Paozu, một cậu bé sống một mình với cây gậy Nyoibou và viên ngọc rồng 4 sao — kỷ vật của ông nội. Khi Bulma xuất hiện, cuộc phiêu lưu vĩ đại bắt đầu.",
    image_url: "https://m.media-amazon.com/images/I/91M9VaZWxOL._SL1500_.jpg",
    color: "#f39c12",
    accent: "#e74c3c",
    mark: "DRAGON BALL",
    badge: "Huyền thoại",
    stock: 35,
    characters: ["Goku", "Vegeta", "Bulma"]
  },
  {
    title: "Doraemon",
    issue: "Tập #1 — Chú mèo máy đến từ tương lai",
    price: 20000,
    old_price: null,
    description: "Doraemon — chú mèo máy đến từ thế kỷ 22 được cháu trai của Nobita gửi về quá khứ để giúp đỡ Nobita thay đổi tương lai.",
    preview: "Từ ngăn kéo bàn học, chú mèo máy màu xanh xuất hiện với chiếc túi thần kỳ chứa đầy bảo bối. Doraemon sẽ thay đổi cuộc đời Nobita mãi mãi.",
    image_url: "https://m.media-amazon.com/images/I/81sN1in-d1L._SL1500_.jpg",
    color: "#0099ff",
    accent: "#ffffff",
    mark: "DORAEMON",
    badge: "Tuổi thơ",
    stock: 60,
    characters: ["Doraemon", "Nobita", "Shizuka"]
  },
  {
    title: "Attack on Titan",
    issue: "Tập #1 — Gửi Bạn, 2000 Năm Trước",
    price: 35000,
    old_price: null,
    description: "Nhân loại sống trong những bức tường khổng lồ để tránh Titan — những sinh vật khổng lồ ăn thịt người. Eren Yeager thề sẽ tiêu diệt tất cả Titan.",
    preview: "Ngày hôm đó, nhân loại nhớ lại nỗi sợ hãi bị thống trị bởi chúng. Bức tường mà 100 năm không Titan nào phá nổi — đã bị phá vỡ.",
    image_url: "https://m.media-amazon.com/images/I/91M9VaZWxOL._SL1500_.jpg",
    color: "#2c3e50",
    accent: "#c0392b",
    mark: "AOT",
    badge: "Mới",
    stock: 30,
    characters: ["Eren", "Mikasa", "Levi"]
  },
  {
    title: "Demon Slayer",
    issue: "Tập #1 — Tàn Khốc",
    price: 32000,
    old_price: null,
    description: "Tanjiro Kamado trở thành thợ săn quỷ sau khi gia đình bị tàn sát và em gái Nezuko bị biến thành quỷ. Cậu quyết tâm tìm cách cứu em.",
    preview: "Tuyết trắng nhuốm đỏ máu. Trở về nhà, Tanjiro thấy cả gia đình đã bị sát hại. Chỉ còn Nezuko — nhưng cô đã không còn là con người.",
    image_url: "https://m.media-amazon.com/images/I/81KPbFjnVPL._SL1500_.jpg",
    color: "#1a472a",
    accent: "#e74c3c",
    mark: "KIMETSU",
    badge: "Hot",
    stock: 45,
    characters: ["Tanjiro", "Nezuko", "Zenitsu"]
  },
  {
    title: "Conan - Thám Tử Lừng Danh",
    issue: "Tập #1 — Thám tử tí hon",
    price: 22000,
    old_price: null,
    description: "Shinichi Kudo, thám tử cao trung tài giỏi, bị Tổ chức Áo Đen cho uống thuốc độc và teo nhỏ thành cậu bé Conan Edogawa.",
    preview: "Một viên thuốc bí ẩn biến thám tử thiên tài Shinichi Kudo thành cậu bé lớp 1. Dưới vỏ bọc Conan Edogawa, cậu tiếp tục phá án và truy tìm Tổ chức Áo Đen.",
    image_url: "https://m.media-amazon.com/images/I/71p-GGHNG7L._SL1000_.jpg",
    color: "#1a1a8c",
    accent: "#dc143c",
    mark: "CONAN",
    badge: null,
    stock: 55,
    characters: ["Conan", "Ran", "Heiji"]
  },
  {
    title: "Slam Dunk",
    issue: "Tập #1 — Sakuragi Hanamichi",
    price: 30000,
    old_price: 38000,
    description: "Sakuragi Hanamichi — anh chàng tóc đỏ nóng tính tham gia đội bóng rổ để lấy lòng Haruko, nhưng dần yêu thích môn thể thao này thật sự.",
    preview: "Bị 50 cô gái từ chối liên tiếp, Sakuragi gặp Haruko — cô gái đầu tiên khen anh cao. Chỉ vì một câu 'Em thích bóng rổ', anh bước vào sân đấu.",
    image_url: "https://m.media-amazon.com/images/I/91Q0dqRVkZL._SL1500_.jpg",
    color: "#e74c3c",
    accent: "#f39c12",
    mark: "SLAM DUNK",
    badge: "Đặc biệt",
    stock: 25,
    characters: ["Sakuragi", "Rukawa", "Haruko"]
  },
  {
    title: "My Hero Academia",
    issue: "Tập #1 — Izuku Midoriya: Origin",
    price: 30000,
    old_price: null,
    description: "Trong thế giới nơi 80% dân số có siêu năng lực (Quirk), Izuku Midoriya sinh ra không có Quirk nhưng vẫn mơ trở thành anh hùng.",
    preview: "Midoriya nhìn lên All Might với đôi mắt đầy nước mắt: 'Liệu người không có Quirk có thể trở thành anh hùng không?' All Might mỉm cười.",
    image_url: "https://m.media-amazon.com/images/I/71WqJPq-YhL._SL1000_.jpg",
    color: "#2ecc71",
    accent: "#3498db",
    mark: "MHA",
    badge: null,
    stock: 38,
    characters: ["Deku", "Bakugo", "All Might"]
  },
  {
    title: "Jujutsu Kaisen",
    issue: "Tập #1 — Ryomen Sukuna",
    price: 33000,
    old_price: null,
    description: "Itadori Yuji nuốt ngón tay của Vua Chú Thuật Sukuna để cứu bạn, trở thành vật chứa của sinh vật nguy hiểm nhất thế giới chú thuật.",
    preview: "Ngón tay bị phong ấn bung ra, Itadori không do dự nuốt nó vào. Sức mạnh chú thuật bùng nổ — và Sukuna mỉm cười bên trong cậu.",
    image_url: "https://m.media-amazon.com/images/I/81TDJEal3lL._SL1500_.jpg",
    color: "#1a1a2e",
    accent: "#e94560",
    mark: "JJK",
    badge: "Trending",
    stock: 42,
    characters: ["Itadori", "Gojo", "Megumi"]
  },
];

async function seed() {
  try {
    await initDB();
    console.log("Seeding database...");

    // Create admin user
    const adminHash = await bcrypt.hash("admin123", 10);
    const adminResult = await pool.query(
      `INSERT INTO users (email, name, password_hash, role, is_verified) 
       VALUES ('admin@comicstore.vn', 'System Admin', $1, 'SYSTEM_ADMIN', TRUE)
       ON CONFLICT (email) DO NOTHING RETURNING id`,
      [adminHash]
    );

    // Create manager
    const managerHash = await bcrypt.hash("manager123", 10);
    await pool.query(
      `INSERT INTO users (email, name, password_hash, role, is_verified) 
       VALUES ('manager@comicstore.vn', 'Quản lý cửa hàng', $1, 'MANAGER', TRUE)
       ON CONFLICT (email) DO NOTHING`,
      [managerHash]
    );

    // Create publisher
    const publisherHash = await bcrypt.hash("publisher123", 10);
    const publisherResult = await pool.query(
      `INSERT INTO users (email, name, password_hash, role, is_verified) 
       VALUES ('publisher@comicstore.vn', 'Nhà xuất bản', $1, 'PUBLISHER', TRUE)
       ON CONFLICT (email) DO NOTHING RETURNING id`,
      [publisherHash]
    );

    // Create buyer
    const buyerHash = await bcrypt.hash("buyer123", 10);
    await pool.query(
      `INSERT INTO users (email, name, password_hash, role, is_verified) 
       VALUES ('buyer@comicstore.vn', 'Người mua', $1, 'BUYER', TRUE)
       ON CONFLICT (email) DO NOTHING`,
      [buyerHash]
    );

    const publisherId = publisherResult.rows[0]?.id || 3;
    const adminId = adminResult.rows[0]?.id || 1;

    // Check if comics already exist
    const existingComics = await pool.query("SELECT COUNT(*) FROM comics");
    if (parseInt(existingComics.rows[0].count) > 0) {
      console.log("Comics already seeded, skipping...");
      process.exit(0);
    }

    // Seed comics
    for (const comic of comics) {
      const result = await pool.query(
        `INSERT INTO comics (title, issue, price, old_price, description, preview, image_url, color, accent, mark, badge, stock, status, created_by, approved_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'APPROVED', $13, $14) RETURNING id`,
        [comic.title, comic.issue, comic.price, comic.old_price, comic.description, comic.preview, comic.image_url, comic.color, comic.accent, comic.mark, comic.badge, comic.stock, publisherId, adminId]
      );

      for (const char of comic.characters) {
        await pool.query("INSERT INTO comic_characters (comic_id, character_name) VALUES ($1, $2)", [result.rows[0].id, char]);
      }
    }

    console.log(`✅ Seeded ${comics.length} comics and 4 users`);
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
