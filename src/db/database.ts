import sqlite3 from "sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const databasePath = resolve(
  process.env.DATABASE_PATH ?? "./data/scheduled_messages.sqlite"
);

mkdirSync(dirname(databasePath), { recursive: true });

export const db = new sqlite3.Database(databasePath, (err) => {
  if (err) {
    console.error("Failed to open database:", err);
    process.exit(1);
  }
});

db.serialize(() => {
  db.run("PRAGMA journal_mode = WAL", (err) => {
    if (err) console.error("Failed to set WAL mode:", err);
  });

  db.run("PRAGMA foreign_keys = ON", (err) => {
    if (err) console.error("Failed to enable foreign keys:", err);
  });
});

export function initDatabase() {
  const sql = `
    CREATE TABLE IF NOT EXISTS scheduled_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      sent_at TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      error_message TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_scheduled_messages_status_time
      ON scheduled_messages(status, scheduled_at);
  `;

  db.exec(sql, (err) => {
    if (err) {
      console.error("Database initialization failed:", err);
      throw err;
    }
    console.log("Database initialized");
  });
}