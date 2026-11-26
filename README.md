# DesainPakeAI — Reconstruction

A working local reconstruction of the publicly observable DesainPakeAI product. It combines the reference site's public marketing markup and assets with a self-contained React app, Express API, SQLite persistence, a design-model editor, AI chat, exports, and public publishing.

## Run

```bash
npm install
npm run build
PORT=3000 npm start
```

`npm start` loads a local `.env` file when present (`node --env-file-if-exists=.env`). The workspace is already configured with a server-side Gemini key and `GEMINI_MODEL=gemini-3.6-flash`; the key is ignored by Git via `.gitignore` and is never returned to the browser.

Open <http://localhost:3000>. The SQLite database is created automatically at `data/app.sqlite`.

Environment variables:

```bash
GEMINI_API_KEY=...      # enables server-side Gemini JSON generation/editing
GEMINI_MODEL=gemini-3.6-flash
OPENAI_API_KEY=...      # alternative provider (Gemini takes precedence)
OPENAI_MODEL=gpt-4o-mini
PORT=3000
```

The key can be replaced or removed from the “AI Gemini” menu; a saved workspace key takes precedence over environment variables. Keys are read only by the Node server and are never sent back to the browser. With no key configured, the app falls back to the deterministic local design engine.

## What works

- Marketing routes `/`, `/pricing`, `/galeri`, `/updates`, `/templates` with the observed public markup, fonts, icons, thumbnails, layout references, and Indonesian copy.
- Marketing controls are wired, not decorative: pricing CTAs record a checkout intent and show a note; catalog tabs and industry filters work; reference/template/foundation cards and starter prompts create real projects. Template and foundation opens use the deterministic local generator to preserve the reference structure, while the hero composer and AI chat use Gemini when configured.
- Generation now follows a reference-derived **design compiler** instead of asking for a generic website: the brief is classified into one of seven layout presets (`editorial`, `finance`, `command`, `schedule`, `brutal`, `catalog`, `dashboard`) plus one locally owned visual pattern (`aurora`, `neobrutal`, `terminal`, `grid-editorial`, `sunlit`, `utility`, `editorial`, `finance`, `schedule`, `dashboard`), constrained to explicit layout tokens, and rendered through full section/component templates with stable `data-node-id` and `data-route-link` attributes.
- Layout geometry mirrors the observed reference schema: length tokens are `px`/`rem` strings, `columns` is `{mobile, tablet, desktop}` (1–12, non-decreasing), and `breakpoints` is `{tablet, desktop}` (desktop > tablet). The renderer emits a local `[data-layout-system]` / `[data-layout-container]` / `[data-layout-grid]` implementation with container-query spans and mobile padding, plus page-scoped pattern rules via `[data-page-content]`.
- The AI system prompt forbids gradient/glassmorphism/emoji/lorem ipsum/fake logos/testimonials/numbers, requires one H1, Indonesian copy, 8–12 sections on the first page, and reuse of the selected preset's DESIGN.md. References are folded in as **structure/hierarchy/section-order only** — the prompt explicitly says not to copy visual identity, colors, fonts, or tokens. The edit prompt preserves `design.preset`, `design.pattern`, layout tokens, and all copy not mentioned in the instruction.
- Prototype APIs mirror the observed reference shape: `/api/projects/:id/prototype/preview`, `/tokens`, `/page-plans`, and `/ai-chat` (alias of the local chat handler).
- Hero composer: prompt validation, App/Web toggle, PRD handoff menu, style menu, starter prompts, template/reference attachment, sign-in handoff, project creation.
- **Single-user mode:** no sign-in screen. A local workspace user is created automatically on first request; `/login` redirects to `/projects` and the logout/account buttons are removed.
- “AI Gemini” menu in `/projects` and the canvas: save, verify, replace, or delete the workspace Gemini API key. The key is stored server-side in SQLite and is never returned to the browser; generation and AI chat use it automatically. Default model is `gemini-3.6-flash`, the best model verified with the supplied key; Gemini 4 and 3.1 Pro return zero free-tier quota for that key and 3.8 Flash was frequently unavailable.
- `/projects`: searchable project list, creation modal, delete, publish, ZIP/HTML export links.
- `/project/<id>/prototype`: canvas with page list, section outline, device/zoom controls, live iframe preview, AI chat, design tokens, version history/restore, DESIGN.md, exports, and publish dialog.
- Real SQLite persistence for users, sessions, projects, versions, chat messages, published sites, catalog, updates, reports, and checkout intents.
- Public publishing at `/sites/<slug>` and `/sites/<slug>/<page>`, plus `/api/gallery` when “Tampilkan di galeri” is enabled.
- Report form at `/laporkan-situs`, handoff form at `/handoff/ngoding`, and maintenance page at `/maintenance`.

## Architecture

- `public/` — copied public reference assets (fonts, SVG marks, layout reference images, template thumbnails) and generated published sites.
- `src/marketing.js` — public marketing HTML captured from the reference pages.
- `src/*.jsx` — React views for marketing interactions, projects, and canvas.
- `server/db.js` — SQLite schema and seeding.
- `server/design.js` — reference-derived presets/patterns, layout geometry tokens (px/rem, per-breakpoint columns), preset detection, and normalization.
- `server/model.js` — design model generation and editing; local rules plus constrained AI prompts.
- `server/ai.js` — server-only Gemini/OpenAI integration.
- `server/render.js` — standalone HTML/CSS component compiler for previews and published pages, with preset/pattern styles, container-query layout geometry, and stable node IDs.
- `server/index.js` — Express API, published-site hosting, and SPA fallback.
- `tests/flow.py` — end-to-end API smoke test.

## Honest limitations

- The reference uses Google sign-in. This reconstruction intentionally removes account login entirely for single-user local use; `/login` redirects to the workspace.
- Checkout is recorded as an intent but no payment provider is configured; no claim of live billing is made.
- Public publishing uses local `/sites/<slug>` paths, not the reference's custom `.desainpakeai.com` domains.
- Admin, CLI, and some internal routes from the JS bundle are not reconstructed; they are not publicly observable without authenticated access.
- Visual comparison was based on captured DOM, CSS, public assets, and page text. The analysis model could not visually inspect screenshots, so pixel-level equality is not claimed.
- Live Gemini generation and editing are exercised against the configured key; provider calls have a short timeout and fall back to the local preset compiler when rate-limited, unavailable, or slow. The reference's server-side prompts, model, and token budget are not public; the prompts and presets here are derived from shipped bundles and public DESIGN.md/layout-token evidence, not copied from the reference backend.
- The visual system follows the reference's component and layout patterns, but it is not pixel-identical: the reference's full template source, images, and brand copy are not reproduced, and no original reference logos/testimonials are inserted into generated pages.

See `docs/RESEARCH.md` for observed routes, tokens, components, interactions, and evidence notes. See `docs/REFERENCE_REA_ANALYSIS.md` for the full REA-backed frontend/backend breakdown, exact strings, Evidence IDs, and the honest parity checklist versus this reconstruction.
