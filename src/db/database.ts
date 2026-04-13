import sqlite3 from "sqlite3";
const dbPath = process.env.DATABASE_PATH || "./data/scheduled_messages.sqlite";
export const db = new sqlite3.Database(dbPath);

export function initDatabase() {
  console.log("Database initialized");
  // init
}