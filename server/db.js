import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(path.join(dataDir, "app.sqlite"));
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    prompt TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'web',
    look TEXT NOT NULL DEFAULT 'auto',
    model TEXT NOT NULL,
    design_system TEXT NOT NULL,
    published_slug TEXT,
    gallery INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS versions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    label TEXT NOT NULL,
    model TEXT NOT NULL,
    design_system TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    role TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS published_sites (
    slug TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    version_id TEXT,
    html TEXT NOT NULL,
    title TEXT NOT NULL,
    visits INTEGER NOT NULL DEFAULT 0,
    gallery INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS catalog (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    extra TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS updates (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    bullets TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    issue TEXT NOT NULL,
    detail TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS checkout_intents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    plan TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS user_ai_settings (
    user_id TEXT PRIMARY KEY,
    gemini_api_key TEXT NOT NULL,
    gemini_model TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

const seed = JSON.parse(fs.readFileSync(path.join(here, "seed.json"), "utf8"));
{
  const insert = db.prepare("INSERT OR IGNORE INTO catalog (id, kind, category, title, description, image, extra) VALUES (?,?,?,?,?,?,?)");
  for (const item of [...seed.references, ...seed.foundations, ...seed.templates]) {
    insert.run(item.id, item.kind, item.category, item.title, item.description || "", item.image || "", JSON.stringify(item));
  }
  const insUpdate = db.prepare("INSERT OR IGNORE INTO updates (id, date, category, status, title, description, bullets) VALUES (?,?,?,?,?,?,?)");
  seed.updates.forEach((u, i) => insUpdate.run(`u${i}`, u.date, u.category, u.status, u.title, u.description, JSON.stringify(u.bullets)));
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(":");
  if (!salt || !hash) return false;
  const actual = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function now() {
  return new Date().toISOString();
}

export function newId() {
  return crypto.randomUUID();
}

export function getUserFromToken(token) {
  if (!token) return null;
  const row = db.prepare("SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > ?").get(token, now());
  return row || null;
}

export function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?,?,?,?)")
    .run(token, userId, now(), new Date(Date.now() + 30 * 86400000).toISOString());
  return token;
}

export function deleteSession(token) {
  if (token) db.prepare("DELETE FROM sessions WHERE id = ?").run(token);
}

export function parseCookies(header = "") {
  const out = {};
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function publicUser(user) {
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name };
}
