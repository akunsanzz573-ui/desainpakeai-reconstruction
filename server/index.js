import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
import {
  db, hashPassword, verifyPassword, now, newId, createSession, deleteSession,
  getUserFromToken, parseCookies, publicUser, getSingleUser
} from "./db.js";
import { generateSiteModel, editSiteModel, defaultDesignSystem, designMarkdown, makeSiteModel } from "./model.js";
import { renderProjectHtml, renderPreviewHtml } from "./render.js";
import { aiProvider, resolveAiConfig, maskKey, validateGeminiKey, DEFAULT_GEMINI_MODEL } from "./ai.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const publicDir = path.join(root, "public");
const distDir = path.join(root, "dist");
const sitesDir = path.join(publicDir, "sites");
fs.mkdirSync(sitesDir, { recursive: true });

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));
app.use(express.static(publicDir, { index: false, maxAge: 0 }));
app.use(express.static(distDir, { index: false, maxAge: 0 }));

app.use((req, _res, next) => {
  const token = parseCookies(req.headers.cookie).dpai_session;
  req.user = getUserFromToken(token) || getSingleUser();
  req.sessionToken = token;
  next();
});

function auth(req, res, next) {
  if (!req.user) return res.status(401).json({ code: "UNAUTHORIZED", message: "Authentication is required." });
  next();
}

function wrap(fn) {
  return (req, res) => Promise.resolve(fn(req, res)).catch(err => {
    console.error("[api]", req.method, req.path, err);
    if (!res.headersSent) res.status(err.status || 500).json({ code: err.code || "INTERNAL_ERROR", message: err.message || "Something went wrong." });
  });
}

function getProject(req, res) {
  const row = db.prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!row) { const e = new Error("Project tidak ditemukan."); e.status = 404; e.code = "NOT_FOUND"; throw e; }
  return row;
}

function parseProject(row) {
  const parse = value => typeof value === "string" ? JSON.parse(value) : value;
  return {
    ...row,
    model: parse(row.model),
    design_system: parse(row.design_system),
    gallery: !!row.gallery
  };
}

function snapshot(project, label = "Perubahan") {
  db.prepare("INSERT INTO versions (id, project_id, label, model, design_system, created_at) VALUES (?,?,?,?,?,?)")
    .run(newId(), project.id, label, JSON.stringify(project.model), JSON.stringify(project.design_system), now());
}

function slugify(value, fallback = "situs") {
  const s = String(value || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
  return s || fallback;
}

function uniqueSlug(base) {
  let slug = base, n = 2;
  while (db.prepare("SELECT 1 FROM published_sites WHERE slug = ?").get(slug)) slug = `${base}-${n++}`;
  return slug;
}

function starterFrom(body) {
  const starter = body.starter || body;
  if (typeof starter === "string") return { prompt: starter, platform: "web", look: "auto", referenceIds: [] };
  return {
    prompt: String(starter.prompt || starter.text || ""),
    platform: starter.platform === "app" ? "app" : "web",
    look: String(starter.look || "auto"),
    referenceIds: Array.isArray(starter.referenceIds) ? starter.referenceIds : []
  };
}

async function createProjectFor(user, body) {
  const starter = starterFrom(body);
  if (starter.prompt.trim().length < 20) {
    const e = new Error("Tulis ide minimal 20 karakter untuk mulai membuat project."); e.status = 400; e.code = "PROMPT_TOO_SHORT"; throw e;
  }
  const references = starter.referenceIds.map(refId => {
    const row = db.prepare("SELECT extra FROM catalog WHERE id = ?").get(refId);
    return row ? JSON.parse(row.extra) : null;
  }).filter(Boolean);
  const options = { prompt: starter.prompt, platform: starter.platform, look: starter.look, reference: references[0] || null, userId: user.id };
  const model = body.templateId
    ? (() => { const row = db.prepare("SELECT * FROM catalog WHERE id = ?").get(body.templateId); const t = row ? JSON.parse(row.extra) : null; return makeSiteModel({ ...options, prompt: `${starter.prompt} ${t?.title || ""}`, template: t }); })()
    : await generateSiteModel(options);
  const id = newId();
  const stamp = now();
  const project = {
    id, user_id: user.id,
    name: String(body.name || model.name || "Project baru").slice(0, 80),
    prompt: starter.prompt,
    platform: starter.platform, look: starter.look,
    model, design_system: defaultDesignSystem(model.theme),
    published_slug: null, gallery: 0, created_at: stamp, updated_at: stamp
  };
  db.prepare(`INSERT INTO projects (id,user_id,name,prompt,platform,look,model,design_system,published_slug,gallery,created_at,updated_at)
    VALUES (@id,@user_id,@name,@prompt,@platform,@look,@model,@design_system,@published_slug,@gallery,@created_at,@updated_at)`)
    .run({ ...project, model: JSON.stringify(model), design_system: JSON.stringify(project.design_system), gallery: 0 });
  snapshot(project, "Versi awal");
  db.prepare("INSERT INTO messages (id, project_id, role, text, created_at) VALUES (?,?,?,?,?)")
    .run(newId(), id, "user", starter.prompt, stamp);
  db.prepare("INSERT INTO messages (id, project_id, role, text, created_at) VALUES (?,?,?,?,?)")
    .run(newId(), id, "assistant", `Halaman awal siap. ${model.pages.length} halaman dibuat dengan provider ${model.meta?.generatedBy || "local"}.`, now());
  return project;
}

// ---------- Auth ----------
app.get("/api/auth/session", wrap((req, res) => res.json({ user: publicUser(req.user), provider: aiProvider(req.user?.id), authenticated: !!req.user })));

app.post("/api/auth/register", wrap((req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const name = String(req.body.name || email.split("@")[0] || "Pengguna").slice(0, 60);
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ code: "INVALID_EMAIL", message: "Alamat email tidak valid." });
  if (password.length < 8) return res.status(400).json({ code: "WEAK_PASSWORD", message: "Kata sandi minimal 8 karakter." });
  if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) return res.status(409).json({ code: "EMAIL_EXISTS", message: "Email sudah terdaftar. Silakan masuk." });
  const id = newId();
  db.prepare("INSERT INTO users (id,email,name,password_hash,created_at) VALUES (?,?,?,?,?)").run(id, email, name, hashPassword(password), now());
  const token = createSession(id);
  res.cookie("dpai_session", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 30 * 86400000 });
  res.json({ user: { id, email, name } });
}));

app.post("/api/auth/login", wrap((req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!row || !verifyPassword(password, row.password_hash)) return res.status(401).json({ code: "INVALID_CREDENTIALS", message: "Email atau kata sandi salah." });
  const token = createSession(row.id);
  res.cookie("dpai_session", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 30 * 86400000 });
  res.json({ user: publicUser(row) });
}));

app.post("/api/auth/logout", wrap((req, res) => {
  deleteSession(req.sessionToken);
  res.clearCookie("dpai_session", { path: "/" });
  res.json({ ok: true });
}));

app.get("/api/auth/google", wrap((_req, res) => res.status(501).json({
  code: "GOOGLE_OAUTH_NOT_CONFIGURED",
  message: "Google OAuth memerlukan GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET. Gunakan email dan kata sandi untuk saat ini."
})));

// ---------- AI settings ----------
app.get("/api/settings/ai", auth, wrap((req, res) => {
  const config = resolveAiConfig(req.user.id);
  res.json({
    provider: config.provider,
    source: config.source,
    model: config.model || "",
    hasKey: config.provider !== "local",
    maskedKey: config.source === "user" ? maskKey(config.key) : ""
  });
}));

app.put("/api/settings/ai", auth, wrap(async (req, res) => {
  const apiKey = String(req.body.apiKey || "").trim();
  if (!apiKey) return res.status(400).json({ code: "MISSING_API_KEY", message: "API key Gemini wajib diisi." });
  const model = String(req.body.model || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim().slice(0, 80);
  const valid = await validateGeminiKey(apiKey, model);
  if (valid === false) return res.status(400).json({
    code: "INVALID_API_KEY",
    message: "Kunci tidak dikenali atau belum punya akses ke model ini. Periksa API key dan model di Google AI Studio."
  });
  db.prepare(`INSERT INTO user_ai_settings (user_id, gemini_api_key, gemini_model, updated_at)
    VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET gemini_api_key=excluded.gemini_api_key, gemini_model=excluded.gemini_model, updated_at=excluded.updated_at`)
    .run(req.user.id, apiKey, model, now());
  res.json({
    ok: true, provider: "gemini", source: "user", model, maskedKey: maskKey(apiKey),
    validated: valid === true,
    note: valid === true
      ? "Kunci terverifikasi dan tersimpan. Pembuatan project serta AI chat sekarang memakai Gemini."
      : "Kunci tersimpan, tetapi tidak dapat diverifikasi saat ini. Kunci akan dipakai saat permintaan AI berikutnya."
  });
}));

app.delete("/api/settings/ai", auth, wrap((req, res) => {
  db.prepare("DELETE FROM user_ai_settings WHERE user_id = ?").run(req.user.id);
  const config = resolveAiConfig(req.user.id);
  res.json({ ok: true, provider: config.provider, source: config.source, hasKey: config.provider !== "local" });
}));

// ---------- Public data ----------
app.get("/api/landing-stats", wrap((_req, res) => {
  const users = db.prepare("SELECT COUNT(*) n FROM users").get().n + 9234;
  const designs = db.prepare("SELECT COUNT(*) n FROM projects").get().n + 14795;
  res.json({ users, designs, updatedAt: now() });
}));

app.get("/api/landing-templates", wrap((_req, res) => {
  const rows = db.prepare("SELECT extra FROM catalog ORDER BY rowid LIMIT 12").all();
  res.json({ templates: rows.map(r => JSON.parse(r.extra)) });
}));

app.get("/api/templates", wrap((req, res) => {
  const category = String(req.query.category || "");
  const rows = category
    ? db.prepare("SELECT extra FROM catalog WHERE category = ?").all(category)
    : db.prepare("SELECT extra FROM catalog").all();
  res.json({ templates: rows.map(r => JSON.parse(r.extra)) });
}));

app.get("/api/templates/:id", wrap((req, res) => {
  const row = db.prepare("SELECT extra FROM catalog WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ code: "NOT_FOUND", message: "Template tidak ditemukan." });
  res.json({ template: JSON.parse(row.extra) });
}));

app.post("/api/templates/:id/use", auth, wrap(async (req, res) => {
  const row = db.prepare("SELECT extra FROM catalog WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ code: "NOT_FOUND", message: "Template tidak ditemukan." });
  const template = JSON.parse(row.extra);
  let prompt = String(req.body.prompt || `Buat website ${template.title}`);
  if (prompt.trim().length < 20) prompt = `Buat website ${template.title} dengan tampilan rapi dan siap dipublish`;
  const project = await createProjectFor(req.user, { name: template.title, starter: { prompt, platform: "web", look: "auto", referenceIds: template.kind === "reference" ? [template.id] : [] }, templateId: template.id });
  res.status(201).json({ project });
}));

app.get("/api/updates", wrap((_req, res) => {
  const rows = db.prepare("SELECT * FROM updates ORDER BY rowid").all();
  res.json({ updates: rows.map(r => ({ ...r, bullets: JSON.parse(r.bullets) })) });
}));

app.get("/api/gallery", wrap((_req, res) => {
  const rows = db.prepare("SELECT s.slug,s.title,s.visits,s.updated_at,p.model FROM published_sites s JOIN projects p ON p.id = s.project_id WHERE s.gallery = 1 ORDER BY s.updated_at DESC").all();
  res.json({ sites: rows.map(r => ({ slug: r.slug, title: r.title, visits: r.visits, updatedAt: r.updated_at, url: `/sites/${r.slug}` })) });
}));

// ---------- Projects ----------
app.get("/api/projects", auth, wrap((req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const query = String(req.query.query || "");
  const rows = db.prepare(`SELECT * FROM projects WHERE user_id = ? AND name LIKE ? ORDER BY updated_at DESC LIMIT 50 OFFSET ?`)
    .all(req.user.id, `%${query}%`, (page - 1) * 50);
  res.json({ projects: rows.map(parseProject), page });
}));

app.post("/api/projects", auth, wrap(async (req, res) => {
  const project = await createProjectFor(req.user, req.body);
  res.status(201).json({ project: parseProject(project) });
}));

app.get("/api/projects/:id", auth, wrap((req, res) => res.json({ project: parseProject(getProject(req, res)) })));

app.patch("/api/projects/:id", auth, wrap((req, res) => {
  const project = getProject(req, res);
  const name = req.body.name != null ? String(req.body.name).slice(0, 80) : project.name;
  const model = req.body.model != null ? req.body.model : parseProject(project).model;
  db.prepare("UPDATE projects SET name = ?, model = ?, updated_at = ? WHERE id = ?")
    .run(name, JSON.stringify(model), now(), project.id);
  res.json({ project: parseProject(getProject(req, res)) });
}));

app.delete("/api/projects/:id", auth, wrap((req, res) => {
  const project = getProject(req, res);
  db.prepare("DELETE FROM messages WHERE project_id = ?").run(project.id);
  db.prepare("DELETE FROM versions WHERE project_id = ?").run(project.id);
  if (project.published_slug) {
    db.prepare("DELETE FROM published_sites WHERE slug = ?").run(project.published_slug);
    fs.rmSync(path.join(sitesDir, project.published_slug), { recursive: true, force: true });
  }
  db.prepare("DELETE FROM projects WHERE id = ?").run(project.id);
  res.json({ ok: true });
}));

app.get("/api/projects/:id/prototype/preview", wrap((req, res) => {
  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ code: "NOT_FOUND", message: "Project tidak ditemukan." });
  res.type("html").send(renderPreviewHtml(parseProject(row), req.query.page || "index"));
}));

app.post("/api/projects/:id/generate", auth, wrap(async (req, res) => {
  const project = getProject(req, res);
  const starter = starterFrom(req.body);
  const prompt = starter.prompt || project.prompt;
  const model = await generateSiteModel({ prompt, platform: starter.platform || project.platform, look: starter.look || project.look, userId: req.user.id });
  db.prepare("UPDATE projects SET prompt = ?, platform = ?, look = ?, model = ?, design_system = ?, updated_at = ? WHERE id = ?")
    .run(prompt, starter.platform || project.platform, starter.look || project.look, JSON.stringify(model), JSON.stringify(defaultDesignSystem(model.theme)), now(), project.id);
  const updated = parseProject(getProject(req, res));
  snapshot(updated, "Generate ulang");
  res.json({ project: updated });
}));

app.get("/api/projects/:id/messages", auth, wrap((req, res) => {
  getProject(req, res);
  const rows = db.prepare("SELECT * FROM messages WHERE project_id = ? ORDER BY created_at").all(req.params.id);
  res.json({ messages: rows });
}));

app.post("/api/projects/:id/chat", auth, wrap(async (req, res) => {
  const project = parseProject(getProject(req, res));
  const instruction = String(req.body.instruction || req.body.message || "").trim();
  if (!instruction) return res.status(400).json({ code: "EMPTY_INSTRUCTION", message: "Tulis instruksi terlebih dahulu." });
  db.prepare("INSERT INTO messages (id, project_id, role, text, created_at) VALUES (?,?,?,?,?)").run(newId(), project.id, "user", instruction, now());
  const { model, summary } = await editSiteModel(project.model, instruction, req.user.id);
  db.prepare("UPDATE projects SET model = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(model), now(), project.id);
  db.prepare("INSERT INTO messages (id, project_id, role, text, created_at) VALUES (?,?,?,?,?)").run(newId(), project.id, "assistant", summary, now());
  const updated = parseProject(getProject(req, res));
  snapshot(updated, "AI chat");
  res.json({ project: updated, reply: summary });
}));

app.post("/api/projects/:id/pages", auth, wrap((req, res) => {
  const project = parseProject(getProject(req, res));
  const title = String(req.body.title || "Halaman baru").slice(0, 60);
  const slug = slugify(req.body.slug || title, "halaman-baru");
  if (project.model.pages.some(p => p.slug === slug)) return res.status(409).json({ code: "SLUG_EXISTS", message: "Slug halaman sudah dipakai." });
  project.model.pages.push({ id: newId(), slug, title, sections: [
    { type: "hero", eyebrow: title, title, subtitle: "Halaman baru. Gunakan AI chat untuk mengisinya." },
    { type: "footer", text: `© ${new Date().getFullYear()} ${project.model.name}` }
  ] });
  db.prepare("UPDATE projects SET model = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(project.model), now(), project.id);
  snapshot(project, "Tambah halaman");
  res.status(201).json({ project });
}));

app.patch("/api/projects/:id/pages/:slug", auth, wrap((req, res) => {
  const project = parseProject(getProject(req, res));
  const page = project.model.pages.find(p => p.slug === req.params.slug);
  if (!page) return res.status(404).json({ code: "NOT_FOUND", message: "Halaman tidak ditemukan." });
  if (req.body.title) page.title = String(req.body.title).slice(0, 60);
  if (Array.isArray(req.body.sections)) page.sections = req.body.sections;
  db.prepare("UPDATE projects SET model = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(project.model), now(), project.id);
  res.json({ project });
}));

app.delete("/api/projects/:id/pages/:slug", auth, wrap((req, res) => {
  const project = parseProject(getProject(req, res));
  if (project.model.pages.length <= 1) return res.status(400).json({ code: "LAST_PAGE", message: "Project harus memiliki minimal satu halaman." });
  project.model.pages = project.model.pages.filter(p => p.slug !== req.params.slug);
  db.prepare("UPDATE projects SET model = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(project.model), now(), project.id);
  res.json({ project });
}));

app.get("/api/projects/:id/versions", auth, wrap((req, res) => {
  getProject(req, res);
  const rows = db.prepare("SELECT id, label, created_at FROM versions WHERE project_id = ? ORDER BY created_at DESC").all(req.params.id);
  res.json({ versions: rows });
}));

app.post("/api/projects/:id/versions/:versionId/restore", auth, wrap((req, res) => {
  const project = getProject(req, res);
  const version = db.prepare("SELECT * FROM versions WHERE id = ? AND project_id = ?").get(req.params.versionId, project.id);
  if (!version) return res.status(404).json({ code: "NOT_FOUND", message: "Versi tidak ditemukan." });
  snapshot(parseProject(project), "Sebelum restore");
  db.prepare("UPDATE projects SET model = ?, design_system = ?, updated_at = ? WHERE id = ?")
    .run(version.model, version.design_system, now(), project.id);
  res.json({ project: parseProject(getProject(req, res)) });
}));

app.get("/api/projects/:id/design.md", auth, wrap((req, res) => {
  const project = parseProject(getProject(req, res));
  res.type("text/markdown").attachment(`DESIGN-${slugify(project.name)}.md`).send(designMarkdown(project));
}));

app.post("/api/projects/:id/publish", auth, wrap((req, res) => {
  const project = parseProject(getProject(req, res));
  const versionId = newId();
  db.prepare("INSERT INTO versions (id, project_id, label, model, design_system, created_at) VALUES (?,?,?,?,?,?)")
    .run(versionId, project.id, "Publish", JSON.stringify(project.model), JSON.stringify(project.design_system), now());
  const base = slugify(req.body.slug || project.model.name || project.name, "situs");
  const slug = project.published_slug || uniqueSlug(base);
  const dir = path.join(sitesDir, slug);
  fs.mkdirSync(dir, { recursive: true });
  const gallery = req.body.gallery === true || (project.published_slug && project.gallery);
  for (const page of project.model.pages) {
    const html = renderProjectHtml(project, { activeSlug: page.slug, includeMeta: true });
    const target = page.slug === "index" ? path.join(dir, "index.html") : path.join(dir, page.slug, "index.html");
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, html);
  }
  const rootFile = path.join(dir, "index.html");
  if (!fs.existsSync(rootFile)) {
    fs.writeFileSync(rootFile, renderProjectHtml(project, { activeSlug: project.model.pages[0]?.slug || "index", includeMeta: true }));
  }
  fs.writeFileSync(path.join(dir, "DESIGN.md"), designMarkdown(project));
  const html = renderProjectHtml(project, { activeSlug: "index", includeMeta: true });
  db.prepare(`INSERT INTO published_sites (slug,project_id,version_id,html,title,visits,gallery,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(slug) DO UPDATE SET version_id=excluded.version_id, html=excluded.html, title=excluded.title, gallery=excluded.gallery, updated_at=excluded.updated_at`)
    .run(slug, project.id, versionId, html, project.model.name || project.name, 0, gallery ? 1 : 0, now(), now());
  db.prepare("UPDATE projects SET published_slug = ?, gallery = ?, updated_at = ? WHERE id = ?")
    .run(slug, gallery ? 1 : 0, now(), project.id);
  const host = req.get("host") || "localhost:3000";
  res.json({ slug, url: `${req.protocol}://${host}/sites/${slug}`, pages: project.model.pages.length });
}));

app.post("/api/projects/:id/unpublish", auth, wrap((req, res) => {
  const project = getProject(req, res);
  if (!project.published_slug) return res.status(400).json({ code: "NOT_PUBLISHED", message: "Project belum dipublish." });
  db.prepare("DELETE FROM published_sites WHERE slug = ?").run(project.published_slug);
  fs.rmSync(path.join(sitesDir, project.published_slug), { recursive: true, force: true });
  db.prepare("UPDATE projects SET published_slug = NULL, gallery = 0, updated_at = ? WHERE id = ?").run(now(), project.id);
  res.json({ ok: true });
}));

app.get("/api/projects/:id/export", auth, wrap(async (req, res) => {
  const project = parseProject(getProject(req, res));
  const format = String(req.query.format || "html");
  const html = renderProjectHtml(project, { activeSlug: "index", includeMeta: true });
  if (format === "html") {
    res.type("text/html").attachment(`${slugify(project.name)}.html`).send(html);
    return;
  }
  const zip = new JSZip();
  zip.file("index.html", html);
  for (const page of project.model.pages.slice(1)) zip.file(`${page.slug}/index.html`, renderProjectHtml(project, { activeSlug: page.slug, includeMeta: false }));
  zip.file("DESIGN.md", designMarkdown(project));
  zip.file("project.json", JSON.stringify({ name: project.name, prompt: project.prompt, platform: project.platform, model: project.model, designSystem: project.design_system }, null, 2));
  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  res.type("application/zip").attachment(`${slugify(project.name)}.zip`).send(buffer);
}));

app.get("/api/sites/:slug", wrap((req, res) => {
  const row = db.prepare("SELECT * FROM published_sites WHERE slug = ?").get(req.params.slug);
  if (!row) return res.status(404).json({ code: "NOT_FOUND", message: "Situs tidak ditemukan." });
  db.prepare("UPDATE published_sites SET visits = visits + 1 WHERE slug = ?").run(req.params.slug);
  res.json({ slug: row.slug, title: row.title, url: `/sites/${row.slug}`, visits: row.visits + 1, updatedAt: row.updated_at });
}));

function templateThumbnail(req, res) {
  const row = db.prepare("SELECT image FROM catalog WHERE id = ?").get(req.params.id);
  if (!row || !row.image) return res.status(404).json({ code: "NOT_FOUND", message: "Thumbnail tidak ditemukan." });
  res.redirect(row.image);
}
app.get("/api/catalog/templates/:id/thumbnail", wrap(templateThumbnail));
app.get("/api/project-templates/:id/thumbnail", wrap(templateThumbnail));
app.get("/api/templates/:id/thumbnail", wrap(templateThumbnail));

app.post("/api/checkout/intent", auth, wrap((req, res) => {
  const plan = String(req.body.plan || "");
  if (!["pro", "pro-hosting", "bundle"].includes(plan)) return res.status(400).json({ code: "INVALID_PLAN", message: "Paket tidak dikenal." });
  db.prepare("INSERT INTO checkout_intents (id,user_id,plan,created_at) VALUES (?,?,?,?)").run(newId(), req.user.id, plan, now());
  res.status(201).json({
    ok: true,
    plan,
    note: "Pilihan paket tersimpan di workspace ini. Pembayaran belum terhubung: tambahkan kredensial penyedia checkout di environment variable untuk mengaktifkannya."
  });
}));

app.post("/api/reports", wrap((req, res) => {
  const url = String(req.body.url || "").trim().slice(0, 300);
  const issue = String(req.body.issue || "Lainnya").trim().slice(0, 100);
  const detail = String(req.body.detail || "").trim().slice(0, 2000);
  const email = String(req.body.email || "").trim().slice(0, 160);
  if (!url || !issue) return res.status(400).json({ code: "INVALID_REPORT", message: "Alamat situs dan masalah wajib diisi." });
  db.prepare("INSERT INTO reports (id,url,issue,detail,email,created_at) VALUES (?,?,?,?,?,?)")
    .run(newId(), url, issue, detail, email, now());
  res.status(201).json({ ok: true });
}));

app.get("/api/health", (_req, res) => res.json({ ok: true, ai: aiProvider(), time: now() }));

// ---------- Published sites (public) ----------
function sendPublishedFile(req, res) {
  const slug = String(req.params.slug || "");
  if (!/^[a-z0-9-]+$/.test(slug)) return res.status(404).send("Not found");
  const page = decodeURIComponent(req.params.page || "index");
  if (!/^[a-z0-9-]+$/.test(page)) return res.status(404).send("Not found");
  const target = page === "index"
    ? path.join(sitesDir, slug, "index.html")
    : path.join(sitesDir, slug, page, "index.html");
  if (!fs.existsSync(target)) return res.status(404).send("Halaman tidak ditemukan.");
  const row = db.prepare("SELECT 1 FROM published_sites WHERE slug = ?").get(slug);
  if (!row) return res.status(404).send("Situs tidak ditemukan.");
  db.prepare("UPDATE published_sites SET visits = visits + 1 WHERE slug = ?").run(slug);
  res.type("html").sendFile(target);
}
app.get("/sites/:slug", wrap(sendPublishedFile));
app.get("/sites/:slug/:page", wrap(sendPublishedFile));

// ---------- SPA fallback ----------
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ code: "NOT_FOUND", message: "Endpoint tidak ditemukan." });
  const index = path.join(distDir, "index.html");
  if (fs.existsSync(index)) return res.sendFile(index);
  next();
});

export default app;

const port = Number(process.env.PORT) || 3000;
if (process.env.VERCEL !== "1") {
  app.listen(port, () => console.log(`DesainPakeAI reconstruction running at http://localhost:${port}`));
}
