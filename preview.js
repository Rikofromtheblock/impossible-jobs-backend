import Database from "better-sqlite3";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || join(__dirname, "../data/impossible-jobs.db");

let db;

export function initDb() {
  // Ensure data directory exists
  import("fs").then(({ mkdirSync }) => {
    mkdirSync(join(__dirname, "../data"), { recursive: true });
  });

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    -- Missions posted by companies
    CREATE TABLE IF NOT EXISTS missions (
      id          TEXT PRIMARY KEY,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      title       TEXT NOT NULL,
      company     TEXT,
      planet      TEXT,
      mission_raw TEXT NOT NULL,
      mind_raw    TEXT NOT NULL,
      horizon     TEXT,
      brief_ai    TEXT,
      tags        TEXT,
      active      INTEGER NOT NULL DEFAULT 1
    );

    -- Candidate match sessions (anonymised — no PII stored)
    CREATE TABLE IF NOT EXISTS matches (
      id          TEXT PRIMARY KEY,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      spark_hash  TEXT,
      fuels       TEXT,
      leap        INTEGER,
      results     TEXT
    );
  `);

  console.log("DB initialised at", DB_PATH);
}

export function getDb() {
  if (!db) throw new Error("DB not initialised — call initDb() first");
  return db;
}
