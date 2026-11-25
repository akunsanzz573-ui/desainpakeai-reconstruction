# DesainPakeAI — Reconstruction

A working local reconstruction of the publicly observable DesainPakeAI product. It combines the reference site's public marketing markup and assets with a self-contained React app, Express API, SQLite persistence, a design-model editor, AI chat, exports, and public publishing.

## Run

```bash
npm install
npm run build
PORT=3000 npm start
```

Open <http://localhost:3000>. The SQLite database is created automatically at `data/app.sqlite`.

Optional environment variables:

```bash
GEMINI_API_KEY=...      # enables server-side Gemini JSON generation/editing
GEMINI_MODEL=gemini-2.5-flash
OPENAI_API_KEY=...      # alternative provider (Gemini takes precedence)
OPENAI_MODEL=gpt-4o-mini
PORT=3000
```

Keys can also be entered per account through the “AI Gemini” menu after signing in; a user key takes precedence over environment variables. Keys are read only by the Node server and are never sent back to the browser. With no key configured, the app uses the deterministic local design engine; no live AI provider was exercised during reconstruction.

## What works

- Marketing routes `/`, `/pricing`, `/galeri`, `/updates`, `/templates` with the observed public markup, fonts, icons, thumbnails, layout references, and Indonesian copy.
- Hero composer: prompt validation, App/Web toggle, PRD handoff menu, style menu, starter prompts, template/reference attachment, sign-in handoff, project creation.
- Email/password registration, login, logout, server sessions in an HTTP-only cookie.
- “AI Gemini” menu in `/projects` and the canvas: each signed-in user can save, verify, replace, or delete a personal Gemini API key. The key is stored server-side in SQLite and is never returned to the browser; generation and AI chat use it automatically.
- `/projects`: searchable project list, creation modal, delete, publish, ZIP/HTML export links.
- `/project/<id>/prototype`: canvas with page list, section outline, device/zoom controls, live iframe preview, AI chat, design tokens, version history/restore, DESIGN.md, exports, and publish dialog.
- Real SQLite persistence for users, sessions, projects, versions, chat messages, published sites, catalog, updates, reports, and checkout intents.
- Public publishing at `/sites/<slug>` and `/sites/<slug>/<page>`, plus `/api/gallery` when “Tampilkan di galeri” is enabled.
- Report form at `/laporkan-situs`, handoff form at `/handoff/ngoding`, and maintenance page at `/maintenance`.

## Architecture

- `public/` — copied public reference assets (fonts, SVG marks, layout reference images, template thumbnails) and generated published sites.
- `src/marketing.js` — public marketing HTML captured from the reference pages.
- `src/*.jsx` — React views for marketing interactions, auth, projects, and canvas.
- `server/db.js` — SQLite schema and seeding.
- `server/model.js` — design model generation and editing; local rules plus optional AI provider.
- `server/ai.js` — server-only Gemini/OpenAI integration.
- `server/render.js` — standalone HTML renderer for previews and published pages.
- `server/index.js` — Express API, published-site hosting, and SPA fallback.
- `tests/flow.py` — end-to-end API smoke test.

## Honest limitations

- The reference uses Google sign-in. This reconstruction uses email/password because no OAuth client credentials are public. The Google button is visibly disabled and labeled as requiring server credentials.
- Checkout is recorded as an intent but no payment provider is configured; no claim of live billing is made.
- Public publishing uses local `/sites/<slug>` paths, not the reference's custom `.desainpakeai.com` domains.
- Admin, CLI, and some internal routes from the JS bundle are not reconstructed; they are not publicly observable without authenticated access.
- Visual comparison was based on captured DOM, CSS, public assets, and page text. The analysis model could not visually inspect screenshots, so pixel-level equality is not claimed.
- Live AI output depends on provider credentials and was not exercised; the local generator is deterministic and rule-based.

See `docs/RESEARCH.md` for observed routes, tokens, components, interactions, and evidence notes.
