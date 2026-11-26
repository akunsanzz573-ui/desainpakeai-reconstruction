# Public research notes

## Method

Evidence came only from public HTTP responses and a browser capture of `https://desainpakeai.com/`:

- Public HTML for `/`, `/pricing`, `/galeri`, `/updates`, `/projects`, `/login`, `/templates`, `/onboarding`, `/maintenance`, `/handoff/ngoding`, `/laporkan-situs`, `/admin`, `/t/:id`, `/project/:id/prototype`.
- Public stylesheet `assets/styles-D45BL9Lh.css` and JavaScript bundles (`index.js`, `routes.js`, `hero.js`, `projects-client.js`).
- REA browser capture of the homepage DOM, accessibility tree, screenshot, and console/network events at 1440px and 390px.
- Public asset endpoints for fonts, SVG marks, layout references, and template thumbnails.

Screenshots were retained but could not be visually inspected by this model. Visual reconstruction therefore follows the captured DOM/class names, computed token values, and copied public assets rather than subjective image comparison.

## Observed routes

Marketing / public:

| Route | Observed content |
|---|---|
| `/` | Hero composer, reference marquee, 3-step story, feature cards, CTA to `/projects?create=true` |
| `/pricing` | Gratis, Pro Rp99k/30 hari, Pro + Hosting Rp179k, Bundle Rp199k |
| `/galeri` | Published-site gallery with “Tampilkan di galeri” opt-in |
| `/updates` | 10 release notes, newest 23 September 2026 |
| `/templates` | “Pilih titik awal, tulis idenya.”; 22 referensi landing page, 19 fondasi sistem, industry filters |
| `/login` | Google sign-in copy, session check, Terms/Privacy footer |
| `/projects` | Project dashboard with composer, search, “Project baru” |
| `/project/$projectId/prototype` | Canvas prototype route; unauthenticated SSR yields an error shell |
| `/t/$templateId` | “Membuka template…” handoff |
| `/handoff/ngoding` | “Impor dari NgodingPakeAI” |
| `/laporkan-situs` | Report form with issue categories |
| `/maintenance` | Maintenance state, “Perkiraan kembali: Segera kembali” |
| `/admin`, `/cli/login`, `/cli/open` | Present in router bundle; require authenticated/internal access |

Bundled route strings extracted from `index.js`: `/`, `/admin`, `/admin_/ai-cache`, `/admin_/ai-settings`, `/admin_/feedback`, `/admin_/journey`, `/admin_/monitoring`, `/admin_/onboarding`, `/admin_/orders`, `/admin_/payouts`, `/admin_/published-sites`, `/admin_/users`, `/cli/login`, `/cli/open`, `/galeri`, `/handoff/ngoding`, `/laporkan-situs`, `/login`, `/maintenance`, `/onboarding`, `/pricing`, `/project/$projectId/prototype`, `/project/prototype`, `/projects`, `/t/$templateId`, `/templates`, `/updates`.

## Design tokens

From the public stylesheet:

```css
--color-dpai-chrome: #fff;
--color-dpai-paper: #f8f6fc;
--color-dpai-desk: #f0ecf6;
--color-dpai-line: #e3ddeb;
--color-dpai-ink: #241b32;
--color-dpai-muted: #71647e;
--color-dpai-violet: #7438d0;
--color-dpai-violet-hover: #6026b5;
--color-dpai-violet-dark: #4c1d95;
--color-dpai-signal: #46d695;
--color-dpai-danger: #ba343e;
```

Fonts: Geist Variable, Geist Mono, Inter Variable, Inter Tight Variable, Newsreader Variable. Public `/assets/*.woff2` files were copied into the reconstruction.

## Homepage components and interactions

- Navbar: `desainpakeai` mark → `/`; Fitur → `#capabilities`; Harga, Galeri, Update, Project, Masuk, and “Mulai gratis” → `/projects`; mobile menu button at narrow widths.
- Hero: “Bangun UI dengan AI”; rotating reference category (observed “Travel”); “Bebas AI slop, publish jadi link, tanpa perlu ngoding”.
- Composer: textarea placeholder “Mau buat apa hari ini?”, minimum 20 characters, App/Web segmented toggle (Web default), PRD menu with NgodingPakeAI mark, style dropdown “Biar Agent yang menentukan”, disabled arrow submit until valid.
- Starter prompts: “Dashboard penjualan UMKM”, “Landing page produk SaaS”, “Aplikasi absensi karyawan”.
- Reference tiles use `aria-label="Lampirkan <title> ke ide"`; clicking attaches the reference and fills the composer.
- Sections: template marquee with 32 tiles plus “Lihat semua” → `/templates`; “Dari ide sampai online”; “Ini yang akan kamu dapatkan” with anti-AI-slop slider, canvas chat, publishing, foundations/templates/references, design system + DESIGN.md, exports/coding agents; final CTA “Buat project pertama” → `/projects?create=true`.

## Template and catalog evidence

- 22 layout references, including travel, booking, wedding, SaaS, and dashboard categories.
- 19 foundations: Ramp, Harvest, Seline, Dimension, Mintlify, Voiceflow, User Interviews, Programa, Caldera, Calendly, etc., with Indonesian descriptions and “Gunakan fondasi”.
- 10 React dashboard project templates from public thumbnail endpoints, including Sales CRM (React), Nuvio — Operations Dashboard (React), CRM Dashboard (React).

## API strings observed

- `/api/landing-stats`, `/api/landing-templates`
- `/api/auth`, `/api/analytics/attribution`, `/api/journey`, `/api/client-errors`
- `/api/projects`, `/api/projects/:id/prototype/preview`
- `/api/project-templates/:id/thumbnail`

The reconstruction implements these shapes plus the additional endpoints needed for local persistence, chat, versions, publishing, export, reports, and checkout intents.

## Shipped-bundle evidence for the generation pipeline

All 85 JavaScript assets referenced by the public entry bundle were downloaded to `/tmp/opencode/refassets/all/` for local analysis. Relevant observations:

- `live-code-canvas-CVlTHD6C.js` contains complete HTML/CSS page templates (for example `p-landing-aurora`, `p-landing-neobrutal`, `p-landing-terminal`), not just section JSON. Templates contain `data-node-id`, `data-route-link`, and `<!-- agent:page-sections -->` markers.
- The same bundle defines a layout-system schema with `contentMax`, `padding`, `mobilePadding`, `gutter`, `sectionGap`, `itemGap`, `columns`, and `breakpoints`, and a `DESIGN.md` document used as the design contract.
- Length tokens are validated as `px`/`rem` (or `var(--token, fallback)`); `columns` is `{mobile, tablet, desktop}` with integers 1–12 and non-decreasing values; `breakpoints` is `{tablet, desktop}` with `desktop > tablet`.
- Geometry is emitted as `[data-layout-system]`, `[data-layout-container]`, `[data-layout-stack]`, `[data-layout-cluster]`, `[data-layout-grid]`, and span attributes `data-layout-span-mobile` / `data-layout-span-tablet` / `data-layout-span`. Columns change through `@container` queries, and mobile padding is applied under a max-width media query.
- Page CSS is scoped with `@scope ([data-page-content="..."])`; global `@import` / `@font-face` / `@property` / `@namespace` are rejected. Templates use BEM-ish `p-landing-*` classes, stable `data-node-id`, and `data-route-link` for internal links.
- A shared token stylesheet defines colors, fonts, a type scale (`heading-lg/md/sm`, `body-lg/md/sm`, `label-md`, `caption`), spacing, and radii. `DESIGN.md` can be regenerated from the rendered page using actual values.
- Reference entries are curated, not copied: bundles repeatedly state that logos, copy, photography, proprietary fonts, and product screenshots are not copied from Ramp, Intercom, Duolingo, Cal.com, etc. References are converted to structure/hierarchy guidance while project tokens remain authoritative.
- `starter-prompt-handoff-CWiAWe0A.js` stores `dpai.starter-prompt`, `dpai.starter-prd`, `dpai.starter-look`, `dpai.starter-references`, and `dpai.starter-draft` in session storage, and prefixes prompts with `[Tampilan: Desktop 1440 × 960 px]` or `[Tampilan: Mobile 390 × 844 px]`.
- `hero-prompt-form-ovFXgDQd.js` saves the starter handoff, creates a project through `/api/projects`, and navigates to `/project/:id/prototype`; it does not render a design itself.
- `projects-client-DBy_2yX9.js` reads project lists and caches `/api/projects/:id/prototype/preview`.
- Extracted route strings also include `/api/chat`, `/api/projects/:id/prototype/ai-chat`, `/api/projects/:id/prototype/page-plans`, `/api/projects/:id/prototype/tokens`, `/api/project-templates`, and `/api/ai/models`.

**Inference (not observed server behavior):** generation is template/token/agent-driven. The public bundle proves that full templates, layout geometry, node IDs, scoped CSS, and DESIGN.md exist; it does not reveal the server prompt or model. The reconstruction therefore implements a constrained design compiler: classify the brief into one of seven locally owned presets and one of ten locally owned visual patterns, normalize the exact observed layout-token shape, render through full component templates with container-query geometry, and make AI edit only the structured model under DESIGN.md constraints. References are folded into the prompt as section-order/hierarchy rules with an explicit "do not copy visuals" guard. This avoids the earlier failure mode where Gemini invented a generic small JSON model that was rendered with one fixed stylesheet.

**What is deliberately not reproduced:** the bundled template strings (they contain reference-specific copy/art direction), reference brand assets, the 2.6 MB web-component runtime, AI-emitted HTML/CSS, global CSS inside page CSS, and reserved layout props (`content`, `headerActions`, `title`, `pageId`, `route`, `navKey`). The local renderer owns all markup and CSS; the model may only choose constrained tokens/patterns and copy.

## Unobservable limitations

- Authenticated canvas state, AI prompts/responses, billing, admin screens, and CLI token flows cannot be observed from public requests.
- The exact AI provider/model and prompt templates used by the reference are not public.
- Payment providers and OAuth client credentials are not public.
- Custom published domains require DNS/platform configuration that is not observable locally.

## Reconstruction addition: user Gemini key menu

The reference settings screen is not publicly observable. To make AI generation usable locally, the reconstruction adds an “AI Gemini” menu on `/projects` and the canvas. It stores the workspace key in `user_ai_settings`, verifies key/model access with a lightweight Google API metadata request, and prioritizes that key over environment variables. Only a masked key is returned to the client. No reference behavior is claimed for this menu.

The owner supplied a private key as the local default. Model availability was queried from `v1beta/models`: Gemini 4 variants and Gemini 3.1 Pro return `quota=0` on the free tier for this key; Gemini 3.8 Flash and 4 Hydrogen returned 503/high demand; Gemini 2.5 Flash is no longer available to new users. `gemini-3.6-flash` was verified end-to-end and is the configured default, with `gemini-3.5-flash` and `gemini-3.1-flash-lite` as automatic fallbacks. The key is stored in gitignored `.env` and the local SQLite workspace settings; it is not part of the repository.

## Single-user override

At the owner's request, account login was removed from the reconstruction even though `/login` was observed in the reference. A local workspace user is created automatically, `/login` and `/admin` redirect to `/projects`, and logout/account UI was removed. The observed reference route table above is kept for research accuracy; it does not describe this deliberate local override.
