# Analisis REA: `https://desainpakeai.com/`

Dokumen ini mengonsolidasikan bukti REA, inspeksi CSS/HTML publik, dan ekstraksi statis 85 bundle JavaScript publik menjadi satu peta frontend/backend untuk rekonstruksi lokal.

**Penting:** dokumen ini sengaja memisahkan mana yang **terobservasi**, mana yang **inferensi**, dan mana yang **tidak diketahui**. Tidak ada klaim “99% sama” atau “pixel perfect”. Kesetaraan penuh tidak dapat dibuktikan tanpa source server, prompt server, model, template internal, dan akses masuk ke aplikasi referensi.

---

## 1. Ringkasan eksekutif

Referensi bukan sekadar “website + AI yang menulis HTML”. Bukti shipped bundle menunjukkan sistem yang jauh lebih terstruktur:

1. Marketing shell dan dashboard dibangun dari React route bundle dengan Tailwind-like `dpai-*` classes dan token CSS.
2. Composer homepage tidak merender desain. Ia menyimpan handoff di `sessionStorage`, membuat project lewat `/api/projects`, lalu navigasi ke `/project/:id/prototype`.
3. Canvas prototype adalah runtime besar dengan page plan, revisioned edits, token editing, asset management, publish/domain, agent links, dan AI chat.
4. Generator memakai **DESIGN.md + layout system + component/page templates** penuh dengan `data-node-id`, `data-route-link`, `<!-- agent:page-sections -->`, dan CSS scoped `@scope ([data-page-content="..."])`.
5. Referensi visual diperlakukan sebagai pola struktur/hierarki/urutan section, bukan salinan visual. Guard persisnya ada di bundle.
6. Pipeline AI menampilkan fase-fase tetap (`preparing`, `planning`, `context`, `components`, `layout`, `generating`, `verifying`, `responding`, ...), termasuk label untuk tool AI.

Rekonstruksi lokal mengikuti arsitektur konseptual itu lewat **design compiler**: AI dibatasi menghasilkan JSON terstruktur, renderer lokal yang memiliki semua HTML/CSS, preset/pattern milik lokal, dan layout token mengikuti bentuk yang terobservasi. Ini berfungsi secara nyata dengan Gemini server-side, tetapi bukan salinan source atau model referensi.

---

## 2. Kelas bukti dan status

### 2.1 Observed (langsung dari artifact publik)

- HTML publik untuk `/`, `/pricing`, `/galeri`, `/updates`, `/projects`, `/login`, `/templates`, `/onboarding`, `/maintenance`, `/handoff/ngoding`, `/laporkan-situs`, `/admin`, `/t/:id`, `/project/:id/prototype`.
- CSS publik `assets/styles-D45BL9Lh.css` (disalin ke `/tmp/opencode/ref-styles.css`).
- 85 JavaScript bundle publik di `/tmp/opencode/refassets/all/`.
- DOM, accessibility tree, screenshot, dan network capture homepage pada 1440px serta 390px (lihat `docs/RESEARCH.md`).
- Bundle kecil `starter-prompt-handoff-CWiAWe0A.js`, `projects-client-DBy_2yX9.js`, `hero-prompt-form-ovFXgDQd.js`.
- Bundle besar `live-code-canvas-CVlTHD6C.js` (2.680.482 byte total direktori; file utama ~2,68 MB).

### 2.2 REA Evidence IDs yang dipakai

| ID | Fungsi | Status |
|---|---|---|
| `ev_10dc647256f0bc4182058b8987049f84c63897f93faaaf018ea34271113e51d6` | Parent `analyze_javascript_application` untuk direktori 85 bundle, source `live-code-canvas-CVlTHD6C.js` | derived / shipped-artifact |
| `ev_a82be950bf92226216bec920624c52ddc9668e1b3c21ffe4aa04bc2b97aba019` | Summary view dari parent di atas | derived / shipped-artifact |
| `ev_92441c2143d91e1fdd0554a835bb349c1f60216e1c0a7817ab4a63586d79a8c6` | `javascript-routes` view; 4 route string statis | derived / shipped-artifact |
| `ev_c5a6c9425747de636a9fb29734d6e5d9fd3809c76e9d497d4e27e91178b5ade1` | `javascript-facts` page pertama untuk parent `ev_10dc...` | derived / shipped-artifact |
| `ev_accf27f43c26279b73f6f60ff7e1773a06ca71e3577fe242dfa6b102004ac2d3` | Semantics trace untuk `Menyiapkan konteks` | inferred / partial |
| `ev_116e02fce9ad360c9d85fe537a36987209fd8f83600d31361f00058db42c542d` | Semantics trace untuk `Membaca referensi` | inferred / partial |
| `ev_653c30863d30ce0c18f53af1f57484f100dc349ae0cc00fdee3ee60fb53e6cb0` | Semantics trace untuk `Membuat layout bersama` | inferred / partial |
| `ev_665af99d297f5b5f477632976b57d3935f44c846f74381a4fd1630d746e33260` | Semantics trace untuk `verify_preview` | inferred / partial |
| `ev_d5f7a66507f9260fe0b2221ae6b557d9617c04b7e59407bb0dbd3d8603656899` | Semantics trace untuk `finish_pages` | inferred / partial |
| `ev_dfdf85d856f3a20a6c5e86b227e5133c5f9824b6e6d3c5ebe1d63bbb53a08309` | Semantics trace untuk `capture_preview` | inferred / partial |
| `ev_1c9ae354a9c4635945bbab617dea877a343ae5de1fc26786ac20b1ea48c2c9b8` | Semantics trace untuk `get_project_context` | inferred / partial |
| `ev_e93e2a8bfe6aacdfdd9000f048a1347c834b75f70439ceac459f8eb10e5e2763` | Semantics trace untuk `data-page-plan` | inferred / partial |

Catatan penting: semantics trace untuk string-string di atas mengembalikan `status: "partial"` dan `seed_matches: 0`. Artinya REA menyimpan penyelidikan, tetapi **tidak membuktikan ownership runtime**. Bukti lebih kuat untuk label/fase adalah source range langsung di bundle, yang dicantumkan di bawah.

### 2.3 Cakupan REA

Dari summary `ev_a82...`:

```text
input_path                /tmp/opencode/refassets/all
root_artifact_sha256      79a3165e5718a6361329ae941d3d22154a185da4bf6fc7c235e5b9b581031b84
source_selection          live-code-canvas-CVlTHD6C.js (84 file lain tidak dipilih)
relevant_files            85
text_bytes_read           2.680.482
parsed_javascript_files   1
parse_failures            0
visited_ast_nodes         377.268
findings                  1.685
```

Cakupan **tidak penuh**: 1 source diperiksa syntax-nya, 84 source tidak; analisis semantic `partial/truncated`, dengan batas `max_semantic_nodes=12000`, `max_semantic_unknowns=8000`, dan 84 `application_unknowns`. Jadi ini adalah bukti static yang kuat untuk file yang dipilih, bukan inventarisasi seluruh aplikasi.

Facts view menghasilkan 1.516 baris:

```text
javascript-module 1271
javascript-asset    93
endpoint            45
storage             22
artifact             1
unknown             84
```

`javascript-routes` hanya mengembalikan 4 path dengan confidence `low`:

```text
/brand/mark.svg
/brand/ngodingpakeai-mark.svg
/pricing
/projects
```

Route table yang lebih luas di `docs/RESEARCH.md` berasal dari ekstraksi route bundle statis, bukan dari REA route view ini.

### 2.4 Lifecycle bukti

- Analisis gabungan seluruh direktori + file besar pernah gagal dengan `resource_constraint` (`retained representation exhausted`). Tidak diulang tanpa perubahan.
- Analisis isolated `live-code-canvas-CVlTHD6C.js` berhasil, lalu evidence diekspor ke `/tmp/opencode/rea-live-canvas-bundle.json` (19 records, 32.597.038 byte).
- Checkpoint lain diekspor ke `/tmp/opencode/rea-current-final-bundle.json` (50 records, 66.367.552 byte) sebelum reset.
- Investigasi REA saat penulisan docs ini mempertahankan 29 records, 0 unknown revisions, dengan retained representation sekitar 322 MB dari batas 511 MB; persistence `memory`, bukan disk otomatis.
- ID lama `ev_7316f0352f4bba03b1095b983e8f261cbf5d2ae270a2bb98921c6e164e4dfe7e` dan `ev_d4ea8f6a608aedb8af441d4ac828ff26ab764b8a073d7ed5e7fd39967c97046e` tidak lagi dipakai karena reset/evidence mismatch. Semua ID dalam tabel di atas adalah ID yang masih retained pada sesi ini.

---

## 3. Arsitektur frontend yang terobservasi

### 3.1 Shell publik dan token

HTML publik:

- `lang="id"`.
- Title: `DesainPakeAI — Rancang UI dan alur bersama coding agent`.
- Theme color: `#ffffff`.
- Preload: `/images/announcement-megaphone.png`, `/brand/mark.svg`, `/brand/ngodingpakeai-mark.svg`.

Token CSS publik:

```css
--color-dpai-chrome:#fff;
--color-dpai-paper:#f8f6fc;
--color-dpai-desk:#f0ecf6;
--color-dpai-line:#e3ddeb;
--color-dpai-ink:#241b32;
--color-dpai-muted:#71647e;
--color-dpai-violet:#7438d0;
--color-dpai-violet-hover:#6026b5;
--color-dpai-violet-dark:#4c1d95;
--color-dpai-signal:#46d695;
--color-dpai-danger:#ba343e;
```

Font yang terobservasi: Geist Variable, Geist Mono, Inter Variable, Inter Tight Variable, Newsreader Variable. File woff2 publik sudah disalin ke rekonstruksi.

### 3.2 Route publik

Dari bundle router dan HTML publik (lihat `docs/RESEARCH.md`):

| Route | Observasi |
|---|---|
| `/` | Hero composer, reference marquee, 3-step story, feature cards, CTA `/projects?create=true` |
| `/pricing` | Gratis, Pro Rp99k/30 hari, Pro + Hosting Rp179k, Bundle Rp199k |
| `/galeri` | Galeri published site dengan opt-in |
| `/updates` | 10 release notes, terbaru 23 September 2026 |
| `/templates` | 22 referensi landing page, 19 fondasi sistem, filter industri |
| `/login` | Copy Google sign-in, session check |
| `/projects` | Dashboard project, composer, search, “Project baru” |
| `/project/$projectId/prototype` | Canvas prototype |
| `/t/$templateId` | Handoff “Membuka template…” |
| `/handoff/ngoding` | Import dari NgodingPakeAI |
| `/laporkan-situs` | Form laporan |
| `/maintenance` | Maintenance state |
| `/admin`, `/cli/login`, `/cli/open` | Hadir di router; butuh auth/internal |

Route string tambahan dari asset statis: `/admin_/ai-cache`, `/admin_/ai-settings`, `/admin_/feedback`, `/admin_/journey`, `/admin_/monitoring`, `/admin_/onboarding`, `/admin_/orders`, `/admin_/payouts`, `/admin_/published-sites`, `/admin_/users`, `/project/prototype`.

Route seperti `/fondasi`, `/tagihan`, `/ruang-kerja`, `/dashboard`, `/pelanggan` muncul di dalam template page generation (`live-code-canvas...`, source line ~7955). Ini adalah **route string di dalam HTML template yang dihasilkan**, bukan bukti bahwa router situs memakai path tersebut.

### 3.3 Hero composer → project handoff

File `starter-prompt-handoff-CWiAWe0A.js` menyimpan:

```js
dpai.starter-prompt
dpai.starter-prd
dpai.starter-look
dpai.starter-references
dpai.starter-draft
```

Fakta persis:

```js
const TTL = 1800 * 1e3;        // 30 menit
const PROMPT_CAP = 1e4;        // 10.000 karakter
```

Prefix viewport:

```text
[Tampilan: Desktop 1440 × 960 px]
[Tampilan: Mobile 390 × 844 px]
```

Parser viewport mengembalikan `desktop` sebagai default bila prefix tidak cocok. Referensi ID divalidasi sebagai:

```js
/^[a-z0-9-]{1,80}$/
```

lalu di-dedup dan dipotong menjadi maksimal 4 ID.

`hero-prompt-form-ovFXgDQd.js` menunjukkan alur:

1. Validasi prompt minimal 20 karakter.
2. Simpan handoff.
3. `await createProject(starter)`.
4. Navigasi ke `/project/$projectId/prototype`.
5. Jika 401 → `/login?redirect=...`.
6. Jika `PROJECT_LIMIT_REACHED` → tampilkan modal limit.

`projects-client-DBy_2yX9.js` menunjukkan:

```js
GET  /api/projects?page=...&query=...
POST /api/projects            body { name, starter }
GET  /api/projects/:id/prototype/preview
```

Preview di-cache dalam `Map` lokal per project. Tidak ada render desain di homepage; homepage hanya menyiapkan state dan project.

**Status lokal:** rekonstruksi memakai `dpai:starter-prompt` (titik dua), bukan `dpai.starter-prompt` (titik), tidak punya TTL 30 menit, tidak menyimpan kelima key, dan tidak mengirim prefix viewport. Ini gap parity yang nyata, bukan sekadar perbedaan kosmetik.

### 3.4 Canvas prototype

Dari `live-code-canvas-CVlTHD6C.js`:

- Base helper:

```js
dS(id) = `/api/projects/${encodeURIComponent(id)}/prototype`
```

- Chat:

```text
GET  /api/projects/:id/prototype/ai-chat
GET  /api/projects/:id/prototype/ai-chat?before=<id>
GET  /api/projects/:id/prototype/ai-chat?runId=<id>&view=summary
POST /api/projects/:id/prototype/ai-chat
```

- Page plans:

```js
wS(id) = `/api/projects/:id/prototype/page-plans`
GET  wS(id) -> { plans }
POST wS(id) -> { plan }
```

- Tokens:

```js
OZ(id) = `/api/projects/:id/prototype/tokens`
GET   OZ(id)
PATCH OZ(id) body { expectedRevision, tokens }
```

- Assets:

```js
ZF(id, asset?) = `/api/projects/:id/assets[/:asset]`
GET / POST / PATCH / DELETE
```

- Publish/domain/agent links/MCP:

```text
GET/POST/DELETE    /api/projects/:id/agent-links
GET                /api/projects/:id/publish
GET                /api/projects/:id/publish?slug=...
POST               /api/projects/:id/publish  { expectedRevision, shareInGallery, slug }
GET/PUT/DELETE     /api/projects/:id/publish-domain
GET                /api/projects/:id/mcp-active
GET/POST/DELETE    /api/mcp/keys, /api/mcp/keys/:id
GET                /api/projects/:id/prototype/play...
```

- AI settings/models/billing:

```text
GET/PUT/DELETE  /api/ai/own-key?provider=...
GET             /api/ai/models?provider=...&q=...
GET             /api/ai/thinking?...
GET             /api/billing/ai-credits?...
```

Facts REA mencatat 22 storage occurrence. Nama eksplisit:

```text
localStorage : dpai-canvas-page-actions-hint-v1
localStorage : dpai:canvas:agent-card:v1
sessionStorage: dpai:top-up-credits
sessionStorage: dpai:top-up-order
```

Sisanya adalah `getItem`/`setItem` dengan nama dinamis (tidak resolve sebagai literal).

Page-plan UI mengirim aksi:

```js
{ action: "approve", planId, pageIds }
```

Aksi lain yang terobservasi: `cancel`, `plan`, `respond`, `retry`, `save-ui`, `submit`. Telemetri UI yang terobservasi:

```text
page_plan_shown       { pages_proposed }
page_plan_confirmed   { pages_proposed, pages_selected }
page_limit_reached    { source:"page_plan", limit, usage }
```

Ada konsep `pageQuota`, `planSlug !== "pro"`, dan `ui.draftSelectedIds`, sehingga pembatasan halaman bagian dari product logic referensi, bukan sekadar UI.

---

## 4. Sistem desain dan generation contract

### 4.1 Template penuh, bukan JSON generik

`live-code-canvas-CVlTHD6C.js` berisi template HTML/CSS lengkap, misalnya `p-landing-aurora`, `p-landing-neobrutal`, `p-landing-terminal`, serta template admin/storefront. Marker yang terobservasi:

```html
data-node-id="..."
data-route-link
<!-- agent:page-sections -->
```

Source range contoh:

- `data-node-id` pada template footwear: offset ~1.183.324.
- `<!-- agent:page-sections -->`: offset ~2.321.398.
- `data-route-link` pada template storefront: offset ~2.300.096.

Ini menjelaskan mengapa model tidak boleh mengarang struktur bebas: agent mengisi/menyusun bagian dari template yang sudah dikompilasi.

### 4.2 CSS scoped dan larangan global

Fungsi pembungkus page CSS:

```js
function m9(css, pageId) {
  if (/@(?:import|font-face|property|namespace)\b/i.test(css))
    throw Error("Page CSS cannot define global resources; use the shared stylesheet for imports, fonts, properties and namespaces.");
  return `@scope ([data-page-content="${pageId}"]) {\n${css}\n[hidden]:not([hidden="until-found"]), dialog:not([open]) { display: none !important; }\n}`;
}
```

Fakta penting:

- Page CSS diskop ke `[data-page-content="..."]`.
- `@import`, `@font-face`, `@property`, `@namespace` ditolak di page CSS.
- Shared stylesheet/fonts menjadi milik sistem, bukan milik model.

**Status lokal:** `server/render.js` memakai `[data-page-content]` sebagai selector untuk pattern CSS, tetapi tidak mengimplementasikan `@scope` atau compiler CSS agent. AI lokal dilarang menghasilkan CSS sama sekali, sehingga risiko global CSS tidak ada, tetapi mekanismenya bukan identik.

### 4.3 Layout token schema

Dari source range ~2.591.446:

```js
const length = z.string().max(120).regex(
  /^(?:\d+(?:\.\d+)?(?:px|rem)|var\(--[a-z][a-z0-9-]*,\s*\d+(?:\.\d+)?(?:px|rem)\))$/,
  "Use a non-negative px/rem length or var(--token, 24px) with a fallback."
);

const layout = z.object({
  contentMax:     length.default("1200px"),
  padding:        length.default("var(--space-6, 24px)"),
  mobilePadding:  length.default("var(--space-4, 16px)"),
  gutter:         length.default("var(--space-6, 24px)"),
  sectionGap:     length.default("var(--space-8, 32px)"),
  itemGap:        length.default("var(--space-3, 12px)"),
  columns: z.object({
    mobile:  z.number().int().min(1).max(12).default(4),
    tablet:  z.number().int().min(1).max(12).default(8),
    desktop: z.number().int().min(1).max(12).default(12)
  }).strict().prefault({}),
  breakpoints: z.object({
    tablet:  z.number().int().min(320).max(1600).default(640),
    desktop: z.number().int().min(321).max(2400).default(1024)
  }).strict().prefault({})
}).strict().superRefine(...)
```

Aturan tambahan yang terobservasi: `desktop > tablet`, dan kolom tidak boleh menurun dari mobile → tablet → desktop.

Geometry dirender dengan atribut:

```text
[data-layout-system]
[data-layout-container]
[data-layout-stack]
[data-layout-cluster]
[data-layout-grid]
data-layout-span-mobile
data-layout-span-tablet
data-layout-span
```

Column switching melalui `@container` query; mobile padding melalui media query.

**Status lokal:** `server/design.js` dan `server/render.js` mengikuti bentuk ini: panjang `px`/`rem` atau `var(--token, fallback)`, `columns {mobile,tablet,desktop}` 1–12 non-decreasing, `breakpoints {tablet,desktop}` dengan desktop > tablet, serta markup `[data-layout-*]` dan `@container`. Default lokal memakai angka px konkret, bukan semua default `var(--space-*, ...)`. Ini mengikuti bentuk, bukan salinan nilai persis.

### 4.4 DESIGN.md dan guard referensi

Guard persis yang terobservasi:

```text
Gunakan referensi ini sebagai pola struktur, hierarki, dan urutan section, bukan salinan visual. Pertahankan design system, token, dan identitas visual project.
```

String ini juga dipakai di prompt generasi lokal (`server/model.js`). Makna operasionalnya:

- referensi boleh menentukan urutan section, proporsi, dan hierarchy;
- warna, font, radius, logo, copy, dan token tetap milik project/design system;
- referensi tidak boleh disalin sebagai visual identity.

Ini selaras dengan catatan di RESEARCH.md bahwa referensi seperti Ramp, Intercom, Duolingo, Cal.com, dll. dikurasi menjadi struktur, bukan disalin.

### 4.5 Validasi template katalog

Dari ekstraksi statis sebelumnya:

- ID template: kebab-case lowercase dan unik.
- Canvas width: `320–960`.
- Canvas height: `220–720`.
- `previewHtml` harus dokumen lengkap berawalan `<!doctype html>`.
- `previewHeight` `320–8000`, hanya jika `previewHtml` ada.

Ini menunjukkan katalog bersifat curated dan tervalidasi, bukan hasil bebas model.

---

## 5. Pipeline AI dan label UI

Map fase persis dari `live-code-canvas-CVlTHD6C.js` source range ~285.978:

```js
{
  waiting_for_credit: "Menunggu panggilan lain selesai agar kredit sementara tersedia",
  preparing:          "Menyiapkan konteks",
  planning:           "Menyusun rencana",
  context:            "Membaca referensi",
  components:         "Membuat komponen bersama",
  layout:             "Membuat layout bersama",
  generating:         "Membuat halaman",
  verifying:          "Menyimpan dan memeriksa hasil",
  responding:         "Menyusun jawaban",
  completed:          "Proses selesai",
  needs_clarification:"Berhenti untuk meminta penjelasan",
  failed:             "Proses gagal",
  cancelled:          "Proses dihentikan",
  interrupted:        "Proses terputus"
}
```

Label status tambahan:

```js
completed:        "Selesai"
failed:           "Generasi gagal"
cancelled:        "Dihentikan"
interrupted:      "Proses terputus"
waiting_for_input:"Menunggu jawabanmu"
cancel_requested: "Menghentikan proses…"
queued:           "Menyiapkan desain…"
```

Outcome yang memengaruhi tampilan:

- `incomplete` → “Perlu konteks tambahan” / “Belum selesai — perlu konteks tambahan”.
- `saved_unverified` → “Perubahan tersimpan, belum terverifikasi”.
- `recovered` → “Selesai dengan pemulihan”.

Label tool saat phase `tool_input`/`tool_running`:

```text
/^(get_|read_|list_|search_|gather_)/  -> "Memahami konteks desain…"
verify_preview / finish_pages          -> "Memeriksa hasil desain…"
capture_preview                        -> "Melihat tampilan halaman…"
```

Tool name yang muncul dalam bundle: `get_project_context`, `verify_preview`, `finish_pages`, `capture_preview`. REA semantics trace untuk beberapa string ini tetap `partial`, jadi hubungan runtime-nya tidak dinyatakan sebagai fakta.

**Status lokal:** rekonstruksi tidak memiliki UI pipeline berfase ini. AI call lokal bersifat request/response dengan fallback deterministik. Ini gap parity fungsional/visual pada canvas.

---

## 6. Inventaris endpoint dan aksi

### 6.1 Endpoint referensi (static evidence)

| Endpoint | Method / shape | Bukti | Status lokal |
|---|---|---|---|
| `/api/projects?page=&query=` | GET | `projects-client-DBy_2yX9.js` | ⚠ lokal hanya `query`, tidak `page` eksplisit |
| `/api/projects` | POST `{name, starter}` | `projects-client-DBy_2yX9.js` | ✅ ada, shape starter |
| `/api/projects/:id/prototype/preview` | GET `?page=` | helper + REA endpoint facts | ✅ sama |
| `/api/projects/:id/prototype/ai-chat` | GET/POST, `before`, `runId`, `view=summary` | `live-code-canvas...` | ⚠ POST ada; GET history/summary tidak |
| `/api/projects/:id/prototype/page-plans` | GET `{plans}`, POST `{plan}` | source range ~310.402 | ⚠ GET ada dengan shape `{pages}`; POST tidak |
| `/api/projects/:id/prototype/tokens` | GET, PATCH `{expectedRevision, tokens}` | source range ~1.790.441 | ⚠ GET ada; PATCH tidak |
| `/api/projects/:id/assets` | GET/POST/PATCH/DELETE | source range ~1.495.178 | — tidak ada |
| `/api/projects/:id/agent-links` | GET/POST/DELETE | source range ~2.238.025 | — tidak ada |
| `/api/projects/:id/publish` | GET `?slug=`, POST `{expectedRevision, shareInGallery, slug}` | source range ~2.267.361 | ⚠ POST ada; GET status/check tidak |
| `/api/projects/:id/publish-domain` | GET/PUT/DELETE | source range ~2.259.065 | — tidak ada |
| `/api/projects/:id/mcp-active` | GET | REA endpoint facts | — tidak ada |
| `/api/ai/own-key` | GET/PUT/DELETE `?provider=` | source range ~349.766 | ⚠ fungsi mirip lewat `/api/settings/ai`, path/shape beda |
| `/api/ai/models?provider=&q=` | GET | source range ~349.766 | ⚠ verifikasi model ada di server, bukan endpoint publik ini |
| `/api/ai/thinking?...` | GET | REA endpoint facts | — tidak ada |
| `/api/billing/ai-credits?...` | GET | REA endpoint facts | — tidak ada |
| `/api/mcp/keys`, `/api/mcp/keys/:id` | GET/POST/DELETE | REA endpoint facts | — tidak ada |
| `/api/projects/:id/prototype/play...` | GET | REA endpoint facts | — tidak ada |
| `/api/chat`, `/api/prototype/mirage-chat` | strings dari bundle sebelumnya | RESEARCH.md | — tidak ada |
| `/api/project-templates`, `/api/project-templates/:id/preview` | strings dari bundle sebelumnya | RESEARCH.md | ⚠ katalog lokal memakai `/api/templates` |
| `/api/handoff/ngoding/redeem`, `/imports/:id/apply` | strings dari bundle sebelumnya | RESEARCH.md | — tidak ada |
| `/api/plan/*`, `/api/workspaces/*`, `/api/admin/*`, `/api/billing/subscription` | strings dari bundle sebelumnya | RESEARCH.md | — tidak ada |

Keterangan: ✅ = sama atau setara; ⚠ = sebagian; — = tidak diimplementasikan.

### 6.2 Endpoint lokal tambahan

Rekonstruksi menambahkan endpoint agar aplikasi benar-benar berjalan single-user:

```text
/api/auth/session, /register, /login, /logout, /google (501)
/api/settings/ai GET/PUT/DELETE
/api/templates/:id/use
/api/projects/:id/generate
/api/projects/:id/messages
/api/projects/:id/chat
/api/projects/:id/pages CRUD
/api/projects/:id/versions, /versions/:versionId/restore
/api/projects/:id/design.md
/api/projects/:id/publish, /unpublish, /export
/api/sites/:slug
/api/catalog/templates/:id/thumbnail
/api/checkout/intent
/api/reports
/api/health
/sites/:slug, /sites/:slug/:page
```

Ini bukan klaim bahwa reference memiliki endpoint tersebut dengan bentuk yang sama. `/api/google` sengaja 501 karena OAuth tidak direkonstruksi.

---

## 7. Inference backend

Berikut adalah **inferensi**, bukan fakta source server:

1. Ada persistence project dengan revision/version. Bukti: `expectedRevision` untuk page edits, token PATCH, publish, dan undo operation `operation:"undo"`.
2. Ada orchestration AI stateful. Bukti: `runId`, `view=summary`, phase pipeline, `waiting_for_credit`, tool names.
3. Ada sistem kredit/plan. Bukti: `pageQuota`, `planSlug !== "pro"`, `/api/billing/ai-credits`, `dpai:top-up-*`.
4. Ada asset storage per project. Bukti: `/api/projects/:id/assets` CRUD.
5. Ada publishing dengan slug dan custom domain. Bukti: `/api/projects/:id/publish` dan `/publish-domain`.
6. Ada handoff ke coding agent. Bukti: `/api/projects/:id/agent-links`, `/handoff/ngoding/redeem`, `/imports/:id/apply`.
7. Ada workspace/admin/MCP surface. Bukti: endpoint strings `/api/workspaces/*`, `/api/admin/*`, `/api/mcp/keys`.
8. Model server-side kemungkinan besar menerima DESIGN.md + templates + reference summary + layout tokens, bukan prompt “buat website” bebas. Ini didukung oleh artifact generation dan prompt guard, tetapi prompt persisnya tidak publik.

**Tidak diketahui:**

- provider/model AI referensi dan parameter sampling;
- prompt/system message server;
- schema database dan MULTI-tenant model;
- implementasi auth/session dan role admin;
- payment provider/status webhook;
- DNS/custom-domain provisioning;
- prompt token budget dan strategi retry;
- apakah template yang terlihat di bundle masih dipakai produksi saat pengambilan data.

---

## 8. Pemetaan ke rekonstruksi lokal

### 8.1 Yang sudah mengikuti referensi

| Area | Implementasi lokal | Bukti |
|---|---|---|
| Marketing markup/token | HTML publik, font, SVG, thumbnail, copy Indonesia | `src/marketing.js`, `public/` |
| Control marketing berfungsi | pricing intent, filter katalog, template/reference cards, starter prompt | `src/Marketing.jsx`, `server/index.js` |
| Project creation | POST `/api/projects`, navigasi ke canvas | `src/HeroComposer.jsx`, `src/Projects.jsx` |
| Design compiler | 7 preset + 10 pattern, JSON terstruktur, renderer owns HTML/CSS | `server/design.js`, `server/model.js`, `server/render.js` |
| Layout geometry | `px/rem`/`var(--token, fallback)`, columns 1–12, breakpoints, `@container` | `server/design.js`, `server/render.js` |
| Node/route markers | `data-node-id`, `data-route-link`, `data-layout-*` | `server/render.js` |
| Reference guard | string persis dipakai di prompt | `server/model.js` |
| Preview/publish | HTML standalone, root `index.html`, `/sites/:slug` | `server/render.js`, `server/index.js` |
| AI nyata | Gemini server-side default + fallback lokal | `server/ai.js`, README |
| Persistence | SQLite projects/versions/messages/published/reports | `server/db.js` |

### 8.2 Gap parity konkret

1. **Handoff keys**: lokal memakai `dpai:starter-prompt`; referensi `dpai.starter-*`, TTL 30 menit, 5 key, viewport prefix, cap 10.000 char, max 4 reference ID tervalidasi.
2. **AI pipeline UI**: tidak ada fase `preparing/planning/context/components/layout/generating/verifying/responding`, label tool, atau status `saved_unverified/recovered`.
3. **Page plans**: referensi punya proposal/approve/quota; lokal hanya mengubah model lewat chat dan endpoint GET page-plans sederhana.
4. **Token editing**: referensi PATCH dengan `expectedRevision`; lokal GET saja dan perubahan token lewat chat.
5. **Assets**: tidak ada CRUD `/projects/:id/assets`.
6. **Publish**: tidak ada GET status/slug check atau custom domain; lokal `/sites/<slug>`.
7. **Agent links / MCP / handoff redeem**: tidak ada.
8. **Billing kredit**: checkout hanya intent; tidak ada `/billing/ai-credits`, top-up session keys, atau payment provider.
9. **Admin/workspace/CLI**: tidak direkonstruksi, dan tidak dapat diverifikasi publik.
10. **Template runtime**: lokal tidak menyalin template penuh referensi dan tidak mengompilasi CSS `@scope`; AI tidak menghasilkan HTML/CSS sama sekali.
11. **Visual identity**: logo, copy, foto, dan brand asset referensi tidak disisipkan ke hasil generasi. Ini keputusan etis/desain, bukan bug.
12. **Akun**: `/login` dan `/admin` sengaja redirect ke `/projects` sesuai permintaan single-user.
13. **Pixel parity**: tidak diukur dengan screenshot diff terhadap reference generated pages. Tidak diklaim.

### 8.3 Mengapa tidak bisa klaim 99%

Untuk membuktikan 99% diperlukan minimal salah satu:

- source server referensi atau akses authenticated dengan kontrol penuh;
- kumpulan prompt + model + parameter + template yang sama;
- perbandingan screenshot terukur pada banyak viewport dan banyak prompt;
- akses ke database/published site hasil referensi untuk kasus uji yang sama.

Semua itu tidak tersedia. Yang dapat dikatakan dengan jujur: **struktur yang terobservasi sudah diadopsi secara substansial, aplikasi lokal berfungsi end-to-end, tetapi kesetaraan penuh tidak terbukti.**

---

## 9. Reproduksi bukti

Perintah yang dipakai untuk ekstraksi statis:

```bash
# grep string kunci
grep -o 'dpai\.starter-[a-z-]*' /tmp/opencode/refassets/all/starter-prompt-handoff-CWiAWe0A.js
grep -o '/api/[A-Za-z0-9_/?=${}.:-]*' /tmp/opencode/refassets/all/*.js

# contoh pembacaan source range
python3 - <<'PY'
p = '/tmp/opencode/refassets/all/live-code-canvas-CVlTHD6C.js'
s = open(p).read()
i = s.find('preparing:`Menyiapkan konteks`')
print(s[i-500:i+1800])
PY
```

REA workflow ringkas:

```text
analyze_javascript_application(input_path=/tmp/opencode/refassets/all,
  source_paths=["live-code-canvas-CVlTHD6C.js"], detail="summary")
  -> ev_10dc... / summary ev_a82...

inspect_analysis_view(source=ev_10dc..., view={kind:"javascript-routes",...})
  -> ev_924...

inspect_analysis_view(source=ev_10dc..., view={kind:"javascript-facts",...})
  -> facts pages, 1516 rows

trace_javascript_semantics(seed=<literal>, direction="ownership")
  -> partial traces; tidak dijadikan bukti runtime

export_evidence_bundle(path=/tmp/opencode/rea-live-canvas-bundle.json)
reset_investigation(save_path=/tmp/opencode/rea-current-final-bundle.json)
```

Validasi lokal yang dijalankan sebelum commit:

```bash
python3 tests/flow.py
npm run check
npm run build
```

---

## 10. Kesimpulan

Referensi memakai arsitektur generator berbasis template, DESIGN.md, layout token, scoped CSS, page plan, revision, dan pipeline AI yang kaya. Rekonstruksi lokal menangkap prinsip-prinsip itu dengan design compiler milik sendiri dan API yang cukup untuk aplikasi nyata: project dibuat, model dihasilkan Gemini, halaman dirender, diedit, diverifikasi, diekspor, dan dipublish.

Namun, banyak endpoint dan state machine referensi belum hadir secara lokal, dan source server/prompt/model tidak tersedia. Oleh karena itu dokumen ini berhenti pada **parity struktural dan fungsional yang dapat dibuktikan**, bukan klaim kemiripan 99% atau pixel-perfect.

Lihat juga `docs/RESEARCH.md` untuk observasi route, token, komponen, dan interaksi publik yang lebih ringkas.
