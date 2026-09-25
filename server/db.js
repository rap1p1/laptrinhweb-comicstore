import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const defaultDbUrl = "postgresql://neondb_owner:npg_R3mlo9CrijkX@ep-mute-resonance-b4p5fazu-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const dbUrl = process.env.DATABASE_URL || defaultDbUrl;

const isCloud = process.env.NODE_ENV === "production" || 
  (dbUrl && !dbUrl.includes("localhost") && !dbUrl.includes("127.0.0.1"));

const rawPassword = dbUrl?.match(/:([^@:]+)@/)?.[1];

const pool = new pg.Pool({
  connectionString: dbUrl,
  password: rawPassword ? String(rawPassword) : undefined,
  ssl: isCloud ? { rejectUnauthorized: false } : false,
});

export default pool;
