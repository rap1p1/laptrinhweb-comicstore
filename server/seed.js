import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import pool from "./db.js";
import { initDB } from "./schema.js";

dotenv.config();

const comics = [
  {
    title: "Civil War",
    issue: "Tập #1 — Cuộc Chiến Nội Bộ",
    price: 85000,
    old_price: 110000,
    description: "Một thảm kịch kinh hoàng tại Stamford khiến chính phủ Mỹ thông qua Đạo luật Đăng ký Siêu anh hùng. Bất đồng sâu sắc khiến cộng đồng siêu anh hùng chia làm hai phe: Iron Man ủng hộ đạo luật và Captain America lãnh đạo phe kháng chiến ngầm.",
    preview: "Anh đứng về phía nào? Khi những người anh em từng chung một chiến hào quay lưng lại với nhau, sự thật và tự do trở thành ranh giới mong manh giữa sự sống và cái chết.",
    image_url: "https://images-na.ssl-images-amazon.com/images/P/078512179X.01.LZZZZZZZ.jpg",
    color: "#1c1d24",
    accent: "#e51c2a",
    mark: "CIVIL WAR",
    badge: "Bán chạy",
    stock: 45,
    characters: [
      { name: "Captain America", wiki_url: "https://en.wikipedia.org/wiki/Captain_America" },
      { name: "Iron Man", wiki_url: "https://en.wikipedia.org/wiki/Iron_Man" },
      { name: "Spider-Man", wiki_url: "https://en.wikipedia.org/wiki/Spider-Man" }
    ]
  },
  {
    title: "The Infinity Gauntlet",
    issue: "Tập #1 — Găng Tay Vô Cực",
    price: 95000,
    old_price: 125000,
    description: "Thanos — Gã Titan Điên cuồng đã thu thập đủ sáu Viên đá Vô cực gắn lên chiếc Găng tay Vô cực. Để lấy lòng Nữ Thần Chết (Death), hắn chỉ cần một cái búng tay để xóa sổ một nửa sinh linh trong toàn cõi vũ trụ.",
    preview: "Chỉ một cái búng tay nhẹ nhàng... một nửa vũ trụ hóa thành hư vô. Các siêu anh hùng vĩ đại nhất Trái Đất cùng các thực thể vũ trụ phải liên minh trong trận chiến sinh tồn tuyệt vọng.",
    image_url: "https://images-na.ssl-images-amazon.com/images/P/0785156593.01.LZZZZZZZ.jpg",
    color: "#2d1344",
    accent: "#f1c40f",
    mark: "THANOS",
    badge: "Huyền thoại",
    stock: 30,
    characters: [
      { name: "Thanos", wiki_url: "https://en.wikipedia.org/wiki/Thanos" },
      { name: "Silver Surfer", wiki_url: "https://en.wikipedia.org/wiki/Silver_Surfer" },
      { name: "Adam Warlock", wiki_url: "https://en.wikipedia.org/wiki/Adam_Warlock" }
    ]
  },
  {
    title: "Spider-Man: Kraven's Last Hunt",
    issue: "Tập #1 — Cuộc Săn Cuối Cùng",
    price: 75000,
    old_price: null,
    description: "Kraven the Hunter thề sẽ chứng minh mình vượt trội hơn Người Nhện trước khi nhắm mắt. Hắn bắn hạ Spider-Man, chôn sống anh và khoác lên mình bộ trang phục Người Nhện để đi trừng phạt tội phạm khắp New York.",
    preview: "Chúng nghĩ ta đã chết dưới hai mét đất lạnh... Nhưng linh hồn của Người Nhện không bao giờ gục ngã. Ta trỗi dậy từ nấm mồ để giành lại danh dự của chính mình!",
    image_url: "https://images-na.ssl-images-amazon.com/images/P/0785134506.01.LZZZZZZZ.jpg",
    color: "#191919",
    accent: "#b11313",
    mark: "SPIDER-MAN",
    badge: "Kinh điển",
    stock: 35,
    characters: [
      { name: "Spider-Man", wiki_url: "https://en.wikipedia.org/wiki/Spider-Man" },
      { name: "Kraven the Hunter", wiki_url: "https://en.wikipedia.org/wiki/Kraven_the_Hunter" },
      { name: "Mary Jane", wiki_url: "https://en.wikipedia.org/wiki/Mary_Jane_Watson" }
    ]
  },
  {
    title: "Astonishing X-Men",
    issue: "Tập #1 — Dị Nhân Tái Xuất",
    price: 79000,
    old_price: null,
    description: "Cyclops và Emma Frost cải tổ lại nhóm X-Men với mục tiêu hòa nhập cùng thế giới. Thế nhưng, thông tin về một 'liều thuốc giải' chữa khỏi đột biến gen xuất hiện khiến mâu thuẫn giữa dị nhân và loài người bùng nổ dữ dội.",
    preview: "Chúng ta không phải căn bệnh cần chữa lành. Chúng ta là bước tiến hóa tiếp theo của nhân loại, và chúng ta sẽ bảo vệ thế giới dù họ có thù ghét chúng ta đến đâu.",
    image_url: "https://images-na.ssl-images-amazon.com/images/P/0785115315.01.LZZZZZZZ.jpg",
    color: "#0c2461",
    accent: "#f6b93b",
    mark: "X-MEN",
    badge: "Đặc sắc",
    stock: 40,
    characters: [
      { name: "Cyclops", wiki_url: "https://en.wikipedia.org/wiki/Cyclops_(Marvel_Comics)" },
      { name: "Wolverine", wiki_url: "https://en.wikipedia.org/wiki/Wolverine_(character)" },
      { name: "Emma Frost", wiki_url: "https://en.wikipedia.org/wiki/Emma_Frost" }
    ]
  },
  {
    title: "Iron Man: Extremis",
    issue: "Tập #1 — Tái Sinh Công Nghệ",
    price: 82000,
    old_price: 99000,
    description: "Một loại huyết thanh công nghệ sinh học nguy hiểm mang tên Extremis rơi vào tay những kẻ khủng bố. Sau khi bị trọng thương suýt chết, Tony Stark quyết định tiêm Extremis vào chính cơ thể mình để biến thành cỗ máy chiến đấu tối thượng.",
    preview: "Bộ giáp không còn là vỏ bọc bên ngoài nữa. Giờ đây, công nghệ và cơ thể ta là một. Tôi là Người Sắt, và đây là bình minh của kỷ nguyên mới.",
    image_url: "https://images-na.ssl-images-amazon.com/images/P/0785183787.01.LZZZZZZZ.jpg",
    color: "#540000",
    accent: "#e67e22",
    mark: "IRON MAN",
    badge: "Hot",
    stock: 50,
    characters: [
      { name: "Iron Man", wiki_url: "https://en.wikipedia.org/wiki/Iron_Man" }
    ]
  },
  {
    title: "Daredevil: Born Again",
    issue: "Tập #1 — Tái Sinh Từ Tro Tàn",
    price: 78000,
    old_price: null,
    description: "Karen Page - người tình cũ của Matt Murdock đã bán bí mật thân phận Daredevil lấy thuốc phiện. Trùm thế giới ngầm Kingpin sử dụng thông tin này để hủy hoại toàn bộ sự nghiệp, nhà cửa và tinh thần của Matt Murdock, đẩy anh xuống tận cùng vực thẳm.",
    preview: "Một kẻ không còn gì để mất là kẻ nguy hiểm nhất trên cõi đời này. Kingpin đã cướp đi tất cả của ta, trừ lòng quả cảm và đức tin không thể lay chuyển!",
    image_url: "https://images-na.ssl-images-amazon.com/images/P/0785134816.01.LZZZZZZZ.jpg",
    color: "#3a0909",
    accent: "#c0392b",
    mark: "DAREDEVIL",
    badge: "Kiệt tác",
    stock: 25,
    characters: [
      { name: "Daredevil", wiki_url: "https://en.wikipedia.org/wiki/Daredevil_(Marvel_Comics_character)" },
      { name: "Kingpin", wiki_url: "https://en.wikipedia.org/wiki/Kingpin_(character)" },
      { name: "Karen Page", wiki_url: "https://en.wikipedia.org/wiki/Karen_Page" }
    ]
  },
  {
    title: "Deadpool Kills the Marvel Universe",
    issue: "Tập #1 — Thảm Sát Vũ Trụ Marvel",
    price: 72000,
    old_price: 90000,
    description: "Sau một buổi điều trị tâm lý bất thành, Deadpool nhận ra tất cả bọn họ chỉ là những nhân vật hư cấu trong trang truyện tranh mua vui cho độc giả. Hắn quyết định 'giải thoát' toàn bộ siêu anh hùng và phản diện của Marvel bằng một cuộc thảm sát đẫm máu.",
    preview: "Bọn mày không hiểu đâu! Chúng ta chỉ là những con rối trên trang giấy! Tao sẽ cắt đứt sợi dây rối đó và giải phóng tất cả bọn mày khỏi cuốn truyện này!",
    image_url: "https://images-na.ssl-images-amazon.com/images/P/0785164030.01.LZZZZZZZ.jpg",
    color: "#400808",
    accent: "#e74c3c",
    mark: "DEADPOOL",
    badge: "Độc lạ",
    stock: 60,
    characters: [
      { name: "Deadpool", wiki_url: "https://en.wikipedia.org/wiki/Deadpool" },
      { name: "Wolverine", wiki_url: "https://en.wikipedia.org/wiki/Wolverine_(character)" },
      { name: "Spider-Man", wiki_url: "https://en.wikipedia.org/wiki/Spider-Man" }
    ]
  },
  {
    title: "Thor: God of Thunder",
    issue: "Tập #1 — Kẻ Sát Thần Gorr",
    price: 88000,
    old_price: null,
    description: "Suốt nhiều thiên niên kỷ, các vị thần trên khắp vũ trụ đang lần lượt biến mất và bị tàn sát man rợ. Thor phát hiện ra sự tồn tại của Gorr — kẻ ôm mối hận thù diệt chủng thần thánh bằng thanh kiếm Hắc Kiếm All-Black.",
    preview: "Ngươi hỏi thần linh ở đâu khi thế giới của ngươi sụp đổ? Ta ở ngay đây! Và sấm sét của ta sẽ phán quyết tội ác của ngươi, hỡi Kẻ Sát Thần!",
    image_url: "https://images-na.ssl-images-amazon.com/images/P/0785168427.01.LZZZZZZZ.jpg",
    color: "#13253b",
    accent: "#00d2d3",
    mark: "THOR",
    badge: "Tuyệt phẩm",
    stock: 35,
    characters: [
      { name: "Thor", wiki_url: "https://en.wikipedia.org/wiki/Thor_(Marvel_Comics)" },
      { name: "Gorr", wiki_url: "https://en.wikipedia.org/wiki/Gorr_the_God_Butcher" },
      { name: "Loki", wiki_url: "https://en.wikipedia.org/wiki/Loki_(Marvel_Comics)" }
    ]
  },
  {
    title: "Black Panther",
    issue: "Tập #1 — Quốc Gia Dưới Chân Ta",
    price: 85000,
    old_price: null,
    description: "Wakanda - quốc gia công nghệ tiên tiến nhất Trái Đất rơi vào tình trạng bất ổn nội bộ chưa từng có. T'Challa (Black Panther) vừa phải đối mặt với các phong trào nổi dậy của nhân dân, vừa phải chứng minh mình xứng đáng là một vị vua lãnh đạo anh minh.",
    preview: "Wakanda muôn năm! Danh dự của tổ tiên và ngọn lửa của loài Báo Đen sẽ dẫn lối cho vương quốc vượt qua cơn bão táp chia rẽ này!",
    image_url: "https://images-na.ssl-images-amazon.com/images/P/1302900536.01.LZZZZZZZ.jpg",
    color: "#111019",
    accent: "#8e44ad",
    mark: "BLACK PANTHER",
    badge: "Đề cử Eisner",
    stock: 40,
    characters: [
      { name: "Black Panther", wiki_url: "https://en.wikipedia.org/wiki/Black_Panther_(character)" },
      { name: "Shuri", wiki_url: "https://en.wikipedia.org/wiki/Shuri_(character)" }
    ]
  },
  {
    title: "Marvels",
    issue: "Tập #1 — Bình Minh Kỷ Nguyên Kỳ Quan",
    price: 92000,
    old_price: 115000,
    description: "Câu chuyện lịch sử của vũ trụ Marvel được nhìn qua ống kính của Phil Sheldon - một nhiếp ảnh gia báo chí bình thường. Chứng kiến sự xuất hiện của các dị nhân, anh hùng và quái vật từ thập niên 1930 đến 1970 với những bức họa sơn dầu kinh điển của Alex Ross.",
    preview: "Khi những vị thần bước đi trên đường phố giữa chúng ta, con người nhỏ bé nhận ra thế giới đã vĩnh viễn thay đổi. Chúng ta gọi họ là... Những Kỳ Quan.",
    image_url: "https://images-na.ssl-images-amazon.com/images/P/078514286X.01.LZZZZZZZ.jpg",
    color: "#22201d",
    accent: "#e67e22",
    mark: "MARVELS",
    badge: "Giải Eisner",
    stock: 25,
    characters: [
      { name: "Human Torch", wiki_url: "https://en.wikipedia.org/wiki/Human_Torch" },
      { name: "Namor", wiki_url: "https://en.wikipedia.org/wiki/Namor" },
      { name: "Captain America", wiki_url: "https://en.wikipedia.org/wiki/Captain_America" }
    ]
  },
  {
    title: "Secret Wars",
    issue: "Tập #1 — Sự Sụp Đổ Của Đa Vũ Trụ",
    price: 98000,
    old_price: 130000,
    description: "Các hiện tượng va chạm (Incursions) đã hủy diệt toàn bộ Đa vũ trụ Marvel, chỉ còn lại Trái Đất-616 và Trái Đất-Ultimate đối đầu nhau trong khoảnh khắc cuối cùng. Từ đống đổ nát, Doctor Doom nắm giữ quyền năng tối thượng và kiến tạo nên hành tinh chắp vá Battleworld.",
    preview: "Mọi thứ đều kết thúc. Mọi vũ trụ đều đã chết. Giờ đây, chỉ còn lại Ý Chí của Doom thống trị tất cả cõi thực tại! Hãy quỳ xuống trước Chúa Tể Doom!",
    image_url: "https://images-na.ssl-images-amazon.com/images/P/0785198849.01.LZZZZZZZ.jpg",
    color: "#141416",
    accent: "#2ecc71",
    mark: "SECRET WARS",
    badge: "Bom tấn",
    stock: 45,
    characters: [
      { name: "Doctor Doom", wiki_url: "https://en.wikipedia.org/wiki/Doctor_Doom" },
      { name: "Mr. Fantastic", wiki_url: "https://en.wikipedia.org/wiki/Mister_Fantastic" },
      { name: "Black Panther", wiki_url: "https://en.wikipedia.org/wiki/Black_Panther_(character)" }
    ]
  },
  {
    title: "Wolverine: Old Man Logan",
    issue: "Tập #1 — Miền Đất Cằn Cỗi",
    price: 89000,
    old_price: 110000,
    description: "50 năm sau khi các phản diện liên minh tiêu diệt toàn bộ siêu anh hùng và chia cắt nước Mỹ. Logan giờ đây già nua, từ bỏ móng vuốt và thề không dùng bạo lực để sống bình yên bên gia đình. Nhưng khoản nợ băng đảng Hulk buộc anh phải cùng Hawkeye mù thực hiện một chuyến hành trình xuyên quốc gia.",
    preview: "Họ nghĩ Wolverine đã chết 50 năm trước. Họ đúng. Nhưng con quái vật bên trong ta chỉ đang ngủ say... và các ngươi vừa mới đánh thức nó!",
    image_url: "https://images-na.ssl-images-amazon.com/images/P/0785131590.01.LZZZZZZZ.jpg",
    color: "#2b1c11",
    accent: "#d35400",
    mark: "OLD MAN LOGAN",
    badge: "Kinh điển",
    stock: 35,
    characters: [
      { name: "Wolverine", wiki_url: "https://en.wikipedia.org/wiki/Wolverine_(character)" },
      { name: "Hawkeye", wiki_url: "https://en.wikipedia.org/wiki/Hawkeye_(Clint_Barton)" },
      { name: "Hulk", wiki_url: "https://en.wikipedia.org/wiki/Hulk" }
    ]
  },
  {
    title: "Hawkeye",
    issue: "Tập #1 — Đời Thường Của Thiện Xạ",
    price: 68000,
    old_price: null,
    description: "Khi Clint Barton (Hawkeye) không làm nhiệm vụ cùng Avengers, anh là một gã đàn ông bình thường giải quyết những rắc rối khu phố, bảo vệ chú chó Lucky và hợp tác cùng cộng sự tài năng Kate Bishop đối đầu băng mafia thể thao Tracksuit.",
    preview: "OK, nhìn này. Tôi là một gã cầm cung tên đi chung chiến trường với những vị thần và tỷ phú giáp sắt. Nhưng hôm nay, việc cứu khu chung cư này là việc của tôi.",
    image_url: "https://images-na.ssl-images-amazon.com/images/P/0785165622.01.LZZZZZZZ.jpg",
    color: "#381a4d",
    accent: "#9b59b6",
    mark: "HAWKEYE",
    badge: "Hài hước",
    stock: 40,
    characters: [
      { name: "Hawkeye", wiki_url: "https://en.wikipedia.org/wiki/Hawkeye_(Clint_Barton)" },
      { name: "Kate Bishop", wiki_url: "https://en.wikipedia.org/wiki/Kate_Bishop" }
    ]
  },
  {
    title: "Captain America",
    issue: "Tập #1 — Chiến Binh Mùa Đông",
    price: 86000,
    old_price: 105000,
    description: "Red Skull bị ám sát bởi một sát thủ huyền thoại thời Chiến tranh Lạnh mang mật danh Chiến Binh Mùa Đông. Khi Steve Rogers điều tra tung tích kẻ sát nhân, anh bàng hoàng phát hiện ra danh tính thật sự của hắn chính là Bucky Barnes - người bạn thân tưởng như đã hy sinh từ Thế chiến II.",
    preview: "Bucky? Cậu còn sống? - Hắn nhìn thẳng vào mắt tôi với cánh tay kim loại lạnh buốt và hỏi: 'Bucky là thằng quái nào?' Cơn ác mộng tồi tệ nhất bắt đầu.",
    image_url: "https://images-na.ssl-images-amazon.com/images/P/0785143416.01.LZZZZZZZ.jpg",
    color: "#112233",
    accent: "#2980b9",
    mark: "CAPTAIN AMERICA",
    badge: "Bán chạy",
    stock: 50,
    characters: [
      { name: "Captain America", wiki_url: "https://en.wikipedia.org/wiki/Captain_America" },
      { name: "Winter Soldier", wiki_url: "https://en.wikipedia.org/wiki/Bucky_Barnes" }
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

    // Reset comics and character tables for fresh Marvel data
    console.log("🌱 Clearing old comics and characters...");
    await pool.query("DELETE FROM cart_items");
    await pool.query("DELETE FROM order_items");
    await pool.query("DELETE FROM comic_characters");
    await pool.query("DELETE FROM comics");

    // Seed Marvel comics
    console.log("🌱 Seeding 14 Marvel comics...");
    for (const comic of comics) {
      const result = await pool.query(
        `INSERT INTO comics (title, issue, price, old_price, description, preview, image_url, color, accent, mark, badge, stock, status, created_by, approved_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'APPROVED', $13, $14) RETURNING id`,
        [comic.title, comic.issue, comic.price, comic.old_price, comic.description, comic.preview, comic.image_url, comic.color, comic.accent, comic.mark, comic.badge, comic.stock, publisherId, adminId]
      );

      const comicId = result.rows[0].id;
      for (const char of comic.characters) {
        await pool.query(
          "INSERT INTO comic_characters (comic_id, character_name, wiki_url) VALUES ($1, $2, $3)",
          [comicId, char.name, char.wiki_url]
        );
      }
    }

    console.log(`✅ Successfully seeded ${comics.length} Marvel comics with characters and Wiki URLs!`);
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
