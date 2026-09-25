import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const isCloud = process.env.NODE_ENV === "production" || 
  (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost") && !process.env.DATABASE_URL.includes("127.0.0.1"));

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isCloud ? { rejectUnauthorized: false } : false,
});

export default pool;
