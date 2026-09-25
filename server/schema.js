import pool from "./db.js";

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(20) NOT NULL DEFAULT 'BUYER' CHECK (role IN ('SYSTEM_ADMIN', 'MANAGER', 'PUBLISHER', 'BUYER')),
  google_id VARCHAR(255) UNIQUE,
  avatar VARCHAR(512),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comics (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  issue VARCHAR(255),
  price INTEGER NOT NULL,
  old_price INTEGER,
  description TEXT,
  preview TEXT,
  image_url VARCHAR(512),
  color VARCHAR(20) DEFAULT '#111111',
  accent VARCHAR(20) DEFAULT '#e51c2a',
  mark VARCHAR(50),
  badge VARCHAR(50),
  stock INTEGER DEFAULT 0,
  publish_year INTEGER,
  status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED')),
  reject_reason TEXT,
  created_by INTEGER REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS character_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  wiki_url VARCHAR(512),
  status VARCHAR(20) DEFAULT 'APPROVED' CHECK (status IN ('APPROVED', 'PENDING', 'REJECTED')),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comic_characters (
  id SERIAL PRIMARY KEY,
  comic_id INTEGER REFERENCES comics(id) ON DELETE CASCADE,
  character_name VARCHAR(100) NOT NULL,
  wiki_url VARCHAR(512)
);

CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  comic_id INTEGER REFERENCES comics(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, comic_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  total INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'RETURN_REQUESTED', 'RETURNED', 'REJECTED', 'CANCELLED')),
  payment_method VARCHAR(20) DEFAULT 'COD',
  payment_ref VARCHAR(255),
  shipping_name VARCHAR(255),
  shipping_phone VARCHAR(20),
  shipping_address TEXT,
  return_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  comic_id INTEGER REFERENCES comics(id),
  quantity INTEGER NOT NULL,
  price INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('PASSWORD_RESET', 'EMAIL_VERIFY')),
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comics_status ON comics(status);
CREATE INDEX IF NOT EXISTS idx_comics_created_by ON comics(created_by);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_user ON otp_codes(user_id);
`;

export async function initDB() {
  try {
    await pool.query(schema);
    await pool.query("ALTER TABLE comic_characters ADD COLUMN IF NOT EXISTS wiki_url VARCHAR(512)");
    await pool.query("ALTER TABLE comics ADD COLUMN IF NOT EXISTS publish_year INTEGER");
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_reason TEXT");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT");
    try {
      await pool.query("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check");
      await pool.query("ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('PENDING', 'PAID', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'RETURN_REQUESTED', 'RETURNED', 'REJECTED', 'CANCELLED'))");
    } catch (e) {
      // constraint alter fallback
    }
    console.log("✅ Database schema initialized");
  } catch (err) {
    console.error("❌ Database init error:", err.message);
    throw err;
  }
}
