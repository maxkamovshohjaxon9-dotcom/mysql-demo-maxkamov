import mysql from "mysql2/promise";

const REQUIRED_ENV = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"];

let pool;
let tableReady = false;

export class ConfigError extends Error {}

function getPool() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new ConfigError(
      `Database sozlanmagan. Netlify Environment Variables'da yo'q: ${missing.join(", ")}`
    );
  }

  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      // TiDB Cloud requires TLS; its certificate is signed by a public CA
      // that Node.js trusts by default, so full verification stays on.
      ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
      connectionLimit: 2,
      maxIdle: 1,
      idleTimeout: 30000,
      connectTimeout: 10000,
      enableKeepAlive: true,
      charset: "utf8mb4",
    });
  }
  return pool;
}

export async function getDb() {
  const db = getPool();
  if (!tableReady) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS names (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    tableReady = true;
  }
  return db;
}

// Turns low-level driver errors into messages a user can understand.
export function describeDbError(err) {
  if (err instanceof ConfigError) return err.message;
  switch (err?.code) {
    case "ER_ACCESS_DENIED_ERROR":
      return "Database'ga kirish rad etildi: DB_USER yoki DB_PASSWORD noto'g'ri.";
    case "ER_BAD_DB_ERROR":
      return "Database topilmadi: DB_NAME noto'g'ri.";
    case "ENOTFOUND":
    case "EAI_AGAIN":
      return "Database serveri topilmadi: DB_HOST noto'g'ri.";
    case "ECONNREFUSED":
    case "ETIMEDOUT":
    case "PROTOCOL_CONNECTION_LOST":
      return "Database serveriga ulanib bo'lmadi. Host/port va TiDB Cloud ruxsatlarini tekshiring.";
    default:
      return "Database bilan ishlashda xatolik yuz berdi. Keyinroq qayta urinib ko'ring.";
  }
}
