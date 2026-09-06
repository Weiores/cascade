import { DatabaseSync } from "node:sqlite";
import path from "path";

const DB_PATH = path.join(__dirname, "..", "..", "capo.db");

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    location TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    deadline TEXT NOT NULL,
    priority_score INTEGER NOT NULL,
    trust_score INTEGER NOT NULL,
    final_priority INTEGER NOT NULL,
    required_skills TEXT NOT NULL DEFAULT '[]',
    required_equipment TEXT NOT NULL DEFAULT '[]',
    manpower_count INTEGER NOT NULL DEFAULT 1,
    work_compatibility_tags TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'pending',
    scheduled_start TEXT,
    scheduled_end TEXT,
    assigned_crew_id INTEGER,
    conflict_reason TEXT
  );

  CREATE TABLE IF NOT EXISTS crews (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    skills TEXT NOT NULL DEFAULT '[]',
    available_start TEXT NOT NULL,
    available_end TEXT NOT NULL,
    max_concurrent_jobs INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS equipment (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    available INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS sectors (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    exclusion_zone TEXT NOT NULL DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS schedule_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    bottleneck TEXT NOT NULL,
    bottleneck_breakdown TEXT NOT NULL,
    utilisation_rate INTEGER NOT NULL,
    ran_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export default db;
