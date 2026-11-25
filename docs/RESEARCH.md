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

## Unobservable limitations

- Authenticated canvas state, AI prompts/responses, billing, admin screens, and CLI token flows cannot be observed from public requests.
- The exact AI provider/model and prompt templates used by the reference are not public.
- Payment providers and OAuth client credentials are not public.
- Custom published domains require DNS/platform configuration that is not observable locally.

## Reconstruction addition: user Gemini key menu

The reference settings screen is not publicly observable. To make AI generation usable locally, the reconstruction adds an “AI Gemini” menu on `/projects` and the canvas. It stores the workspace key in `user_ai_settings`, verifies key/model access with a lightweight Google API metadata request, and prioritizes that key over environment variables. Only a masked key is returned to the client. No reference behavior is claimed for this menu.

## Single-user override

At the owner's request, account login was removed from the reconstruction even though `/login` was observed in the reference. A local workspace user is created automatically, `/login` and `/admin` redirect to `/projects`, and logout/account UI was removed. The observed reference route table above is kept for research accuracy; it does not describe this deliberate local override.
