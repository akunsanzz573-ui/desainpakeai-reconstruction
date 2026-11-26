import crypto from "node:crypto";
import { callAIJson, aiProvider } from "./ai.js";
import { DESIGN_PATTERNS, DESIGN_PRESETS, PRESET_PATTERN, detectPreset, normalizeDesign, normalizeLayout, presetGuidelines, presetsForLook } from "./design.js";

const id = () => crypto.randomUUID();

const COLOR_WORDS = {
  hijau: "#16734f", green: "#16734f", biru: "#2563eb", blue: "#2563eb",
  merah: "#ba343e", red: "#ba343e", kuning: "#946200", yellow: "#946200",
  ungu: "#7438d0", purple: "#7438d0", violet: "#7438d0", oranye: "#c2410c",
  orange: "#c2410c", hitam: "#241b32", black: "#241b32", pink: "#be185d",
  teal: "#2a7779", emas: "#a16207", navy: "#1e3a8a"
};

const INDUSTRIES = [
  { key: "kopi", words: ["kopi", "coffee", "kedai", "kafe", "cafe"], brand: "Kopi Senja", tagline: "Seduh pelan, nikmati sore.", sections: ["menu", "story", "visit", "cta"] },
  { key: "travel", words: ["travel", "resor", "hotel", "wisata", "perjalanan", "villa", "trip"], brand: "Nusantara Travel", tagline: "Perjalanan yang terasa dekat dengan rumah.", sections: ["destinations", "features", "gallery", "cta"] },
  { key: "restaurant", words: ["restoran", "restaurant", "makanan", "bistro", "kuliner", "reservasi"], brand: "Meja Tujuh", tagline: "Rasa yang bikin ingin kembali.", sections: ["menu", "features", "testimonial", "form"] },
  { key: "saas", words: ["saas", "software", "platform", "aplikasi web", "startup", "dashboard"], brand: "Nexora", tagline: "Satu ruang untuk kerja yang lebih rapi.", sections: ["stats", "features", "pricing", "faq", "cta"] },
  { key: "booking", words: ["booking", "reservasi", "jadwal", "salon", "klinik", "fitness", "dokter", "lapangan"], brand: "Ruang Jadwal", tagline: "Pesan lebih cepat, datang lebih tenang.", sections: ["features", "form", "testimonial", "cta"] },
  { key: "wedding", words: ["undangan", "wedding", "pernikahan", "nikah", "resepsi"], brand: "Hari Kita", tagline: "Sebuah hari yang ingin kami bagikan.", sections: ["story", "gallery", "form", "cta"] },
  { key: "education", words: ["sekolah", "kursus", "education", "kampus", "belajar", "course"], brand: "Ruang Belajar", tagline: "Belajar jadi lebih jelas dan terukur.", sections: ["features", "stats", "pricing", "cta"] },
  { key: "general", words: [], brand: "Studio Baru", tagline: "Ide sederhana, hasil yang rapi.", sections: ["features", "stats", "testimonial", "cta"] }
];

function detectIndustry(prompt) {
  const p = prompt.toLowerCase();
  return INDUSTRIES.find(i => i.words.some(w => p.includes(w))) || INDUSTRIES[INDUSTRIES.length - 1];
}

function detectColor(prompt) {
  const p = prompt.toLowerCase();
  const hex = prompt.match(/#([0-9a-f]{6}|[0-9a-f]{3})\b/i);
  if (hex) return `#${hex[1]}`;
  const found = Object.keys(COLOR_WORDS).find(w => p.includes(w));
  return found ? COLOR_WORDS[found] : "#7438d0";
}

function extractBrand(prompt, fallback) {
  const quoted = prompt.match(/["“']([^"”']{2,40})["”']/);
  if (quoted) return quoted[1];
  const named = prompt.match(/(?:nama|brand|toko|kedai|perusahaan|website)\s+([A-Za-z][\w\s-]{1,30})/i);
  if (named) return titleCase(named[1].trim().replace(/\s+/g, " ").split(/\s+(?:yang|dengan|untuk)\b/i)[0]);
  return fallback;
}

function titleCase(s) {
  return String(s).replace(/\b\w/g, c => c.toUpperCase());
}

const FOCUS = {
  kopi: ["Bahan harian", "Ritme sore", "Rasa musiman", "Tempat ngobrol"],
  travel: ["Destinasi", "Itinerary", "Pemandu lokal", "Catatan perjalanan"],
  restaurant: ["Menu", "Reservasi", "Suasana", "Acara"],
  saas: ["Alur kerja", "Data tim", "Otomasi", "Akses cepat"],
  booking: ["Jadwal", "Pilihan layanan", "Konfirmasi", "Pengingat"],
  wedding: ["Acara", "Cerita", "Galeri", "RSVP"],
  education: ["Materi", "Progres", "Mentor", "Praktik"],
  general: ["Ide", "Struktur", "Konten", "Publikasi"]
};

const SECTION_LIBRARY = {
  logos: ctx => ({ type: "logos", title: "Yang jadi fokus", items: FOCUS[ctx.industry.key] || FOCUS.general }),
  menu: () => ({ type: "cards", title: "Pilihan kami", subtitle: "Beberapa favorit yang paling sering dipesan.", items: [
    { title: "Signature", body: "Pilihan utama dengan bahan yang dipilih setiap hari.", meta: "Favorit" },
    { title: "Musiman", body: "Rasa baru yang hadir sesuai musimnya.", meta: "Baru" },
    { title: "Klasik", body: "Resep yang tidak pernah salah untuk semua orang.", meta: "Klasik" }
  ] }),
  story: ctx => ({ type: "text", title: "Cerita kami", body: `Kami percaya desain yang baik dimulai dari hal sederhana. ${ctx.brand} dibuat untuk merawat detail kecil yang membuat setiap kunjungan terasa berbeda.` }),
  visit: () => ({ type: "form", title: "Mampir dan mengobrol", body: "Tinggalkan pesan, kami akan segera membalas.", button: "Kirim pesan" }),
  destinations: () => ({ type: "cards", title: "Destinasi pilihan", subtitle: "Tempat yang layak menjadi bagian dari cerita Anda.", items: [
    { title: "Pulau dan laut", body: "Air jernih, ritme pelan, dan ruang untuk bernapas.", meta: "Pemandangan" },
    { title: "Pegunungan", body: "Jalur hijau dengan udara sejuk setiap pagi.", meta: "Alam" },
    { title: "Kota tua", body: "Arsitektur, kuliner, dan cerita di setiap sudut.", meta: "Budaya" }
  ] }),
  features: () => ({ type: "features", title: "Kenapa memilih kami", subtitle: "Hal-hal kecil yang membuat besar bedanya.", items: [
    { title: "Jelas sejak awal", body: "Informasi tersusun rapi tanpa perlu menebak-nebak.", icon: "check", meta: "01" },
    { title: "Respons cepat", body: "Setiap pertanyaan mendapat jawaban yang nyata.", icon: "bolt", meta: "02" },
    { title: "Detail diperhatikan", body: "Dari tipografi hingga state yang paling kecil.", icon: "spark", meta: "03" }
  ] }),
  showcase: ctx => ({ type: "showcase", title: `Sekilas ${ctx.brand}`, subtitle: "Bagian yang paling sering dipakai, ditampilkan apa adanya.", items: [
    { title: "Ringkasan", body: "Informasi penting langsung terlihat tanpa perlu mencari.", meta: "Utama", visual: "board" },
    { title: "Alur kerja", body: "Langkah dipetakan supaya tim tahu harus mulai dari mana.", meta: "Proses", visual: "flow" },
    { title: "Detail", body: "Catatan kecil tetap terbaca di layar besar maupun kecil.", meta: "Rinci", visual: "list" }
  ] }),
  steps: () => ({ type: "steps", title: "Cara kerjanya", subtitle: "Tiga langkah, tanpa proses yang berbelit.", items: [
    { title: "Ceritakan kebutuhan", body: "Tulis ide Anda dengan bahasa sehari-hari.", meta: "01" },
    { title: "Pilih arah visual", body: "Tentukan gaya, lalu biarkan sistem merapikan strukturnya.", meta: "02" },
    { title: "Publikasikan", body: "Periksa hasilnya dan bagikan tautannya.", meta: "03" }
  ] }),
  gallery: () => ({ type: "gallery", title: "Momen pilihan", items: [
    { caption: "Suasana pagi" }, { caption: "Sudut favorit" }, { caption: "Bersama" }, { caption: "Detail kecil" }
  ] }),
  stats: () => ({ type: "stats", title: "Yang langsung terasa", items: [
    { value: "Jelas", label: "Hierarki informasi" }, { value: "Cepat", label: "Alur membaca" }, { value: "Rapi", label: "Sistem komponen" }
  ] }),
  pricing: () => ({ type: "pricing", title: "Paket yang sederhana", subtitle: "Pilih yang sesuai, tanpa biaya tersembunyi.", plans: [
    { name: "Dasar", price: "Gratis", features: ["1 halaman", "Desain dasar", "Publish ke link"], cta: "Mulai" },
    { name: "Pro", price: "Rp99rb", features: ["Halaman tanpa batas", "DESIGN.md", "Export HTML"], cta: "Pilih Pro", featured: true }
  ] }),
  faq: () => ({ type: "faq", title: "Pertanyaan umum", items: [
    { q: "Bagaimana cara memulai?", a: "Tulis kebutuhan Anda, lalu biarkan sistem menyiapkan halaman awal." },
    { q: "Bisa diubah nanti?", a: "Tentu. Berikan instruksi singkat dan perubahan langsung diterapkan." }
  ] }),
  testimonial: () => ({ type: "testimonial", quote: "Hasilnya rapi, enak dibaca, dan tidak terasa seperti template generik.", author: "Seorang pengguna", role: "Catatan contoh" }),
  form: () => ({ type: "form", title: "Hubungi kami", body: "Ceritakan kebutuhanmu, kami akan menghubungimu kembali.", button: "Kirim" }),
  cta: ctx => ({ type: "cta", title: "Siap untuk mulai?", body: `${ctx.brand} siap ditampilkan dengan struktur yang sudah rapi.`, button: "Lihat halaman", note: "Ubah isi kapan saja lewat chat AI." })
};

function sectionsFor(industry, prompt, brand, tagline, plan = null) {
  const heroVisual = industry.key === "saas" || industry.key === "booking" ? "dashboard" : industry.key === "travel" || industry.key === "wedding" ? "product" : "none";
  const out = [{
    type: "hero", eyebrow: industry.key === "general" ? "Dibuat dengan DesainPakeAI" : `${titleCase(industry.key)} · Versi awal`,
    title: tagline, subtitle: `Selamat datang di ${brand}. ${prompt.length > 90 ? prompt.slice(0, 90).trim() + "…" : prompt}`,
    primaryCta: industry.key === "wedding" ? "Lihat acara" : industry.key === "booking" ? "Buat janji" : "Lihat penawaran",
    secondaryCta: "Tentang kami", visual: heroVisual, note: "Struktur awal siap diedit lewat chat."
  }];
  const ctx = { industry, prompt, brand, tagline };
  const wanted = plan?.length ? plan : [...industry.sections, "showcase", "steps", "faq"];
  const seen = new Set(["hero"]);
  for (const key of wanted) {
    if (key === "hero" || key === "footer" || seen.has(key) || !SECTION_LIBRARY[key]) continue;
    if (key === "testimonial" && !/testimoni|ulasan|review|rating/i.test(prompt)) continue;
    if (key === "pricing" && !/pricing|harga|paket|biaya/i.test(prompt) && industry.key !== "saas" && industry.key !== "education") continue;
    out.push(structuredClone(SECTION_LIBRARY[key](ctx)));
    seen.add(key);
  }
  if (!seen.has("cta")) out.push(structuredClone(SECTION_LIBRARY.cta(ctx)));
  out.push({ type: "footer", text: `© ${new Date().getFullYear()} ${brand}. Dibuat dengan DesainPakeAI.` });
  return out;
}

function newPage(slug, title, sections) {
  return { id: id(), slug, title, sections };
}

export const TYPE_SCALE = {
  "heading-lg": { size: "2rem", weight: 600, leading: "1.15", tracking: "-0.025em" },
  "heading-md": { size: "1.5rem", weight: 600, leading: "1.2", tracking: "-0.02em" },
  "heading-sm": { size: "1.25rem", weight: 600, leading: "1.3", tracking: "-0.01em" },
  "body-lg": { size: "1.125rem", weight: 400, leading: "1.6", tracking: "0em" },
  "body-md": { size: "1rem", weight: 400, leading: "1.5", tracking: "0em" },
  "body-sm": { size: "0.875rem", weight: 400, leading: "1.5", tracking: "0em" },
  "label-md": { size: "0.8125rem", weight: 600, leading: "1.4", tracking: "0em" },
  caption: { size: "0.75rem", weight: 400, leading: "1.5", tracking: "0em" }
};

export function defaultDesignSystem(theme = {}, design = null) {
  const accent = theme.accent || "#7438d0";
  const presetId = design?.preset && DESIGN_PRESETS[design.preset] ? design.preset : "editorial";
  const preset = DESIGN_PRESETS[presetId];
  const layout = normalizeLayout(design?.layout || {}, preset.layout);
  const patternId = design?.pattern && DESIGN_PATTERNS[design.pattern] ? design.pattern : (PRESET_PATTERN[presetId] || "grid-editorial");
  return {
    name: "DESIGN.md",
    preset: presetId,
    label: preset.label,
    pattern: patternId,
    patternDescription: DESIGN_PATTERNS[patternId],
    tokens: {
      "color.accent": accent,
      "color.ink": theme.ink || preset.theme.ink,
      "color.muted": theme.muted || preset.theme.muted,
      "color.paper": theme.paper || preset.theme.paper,
      "color.surface": theme.surface || preset.theme.surface,
      "color.line": theme.line || preset.theme.line,
      "radius": `${theme.radius ?? preset.theme.radius}px`,
      "spacing.base": `${theme.spacing ?? preset.theme.spacing}px`,
      "font.display": theme.font || preset.theme.font,
      "font.body": theme.fontBody || preset.theme.fontBody,
      "layout.contentMax": layout.contentMax,
      "layout.padding": layout.padding,
      "layout.mobilePadding": layout.mobilePadding,
      "layout.gutter": layout.gutter,
      "layout.sectionGap": layout.sectionGap,
      "layout.itemGap": layout.itemGap,
      "layout.columns": `mobile ${layout.columns.mobile} / tablet ${layout.columns.tablet} / desktop ${layout.columns.desktop}`,
      "layout.breakpoint.tablet": `${layout.breakpoints.tablet}px`,
      "layout.breakpoint.desktop": `${layout.breakpoints.desktop}px`
    },
    typeScale: Object.fromEntries(Object.entries(TYPE_SCALE).map(([key, v]) => [key, `${v.size} / ${v.weight} / ${v.leading} / ${v.tracking}`])),
    layoutContract: {
      container: "[data-layout-container]",
      stack: "[data-layout-stack]",
      cluster: "[data-layout-cluster]",
      grid: "[data-layout-grid]",
      spans: ["data-layout-span-mobile", "data-layout-span-tablet", "data-layout-span"],
      rule: "Kolom tidak boleh menurun saat wadah melebar; desktop lebih lebar dari tablet."
    },
    guidelines: [
      ...presetGuidelines(presetId),
      "Gunakan satu aksen warna utama dan pertahankan kontras teks.",
      "Hindari gradient dekoratif, efek kaca, dan ikon emoji.",
      "Gunakan hierarki yang jelas: satu H1 per halaman.",
      "Jaga jarak antar elemen konsisten dengan token layout.",
      "Setiap elemen interaktif harus memiliki state fokus dan hover."
    ],
    componentContracts: [
      "hero: eyebrow, satu H1, subtitle, satu CTA utama, opsional CTA kedua dan panel visual",
      "section: data-node-id stabil, label bernomor, header, dan isi sesuai tipe",
      "card/feature: judul, deskripsi satu sampai dua kalimat, meta opsional",
      "pricing: nama paket, harga, daftar fitur, dan CTA",
      "footer: hak cipta, tautan halaman, dan identitas produk"
    ]
  };
}

export function designMarkdown(project) {
  const model = project.model || {};
  const ds = project.design_system || defaultDesignSystem(model.theme, model.design || {});
  const lines = [`# ${project.name || model.name || "Project"} — DESIGN.md`, "", "## Foundations", ""];
  if (ds.preset) lines.push(`- \`design.preset\`: ${ds.preset}${ds.label ? ` (${ds.label})` : ""}`);
  if (ds.pattern) lines.push(`- \`design.pattern\`: ${ds.pattern}${ds.patternDescription ? ` — ${ds.patternDescription}` : ""}`);
  if (model.design?.rationale) lines.push(`- \`design.rationale\`: ${model.design.rationale}`);
  for (const [key, value] of Object.entries(ds.tokens || {})) lines.push(`- \`${key}\`: ${value}`);
  lines.push("", "## Layout system", "");
  for (const [key, value] of Object.entries(ds.layoutContract || {})) lines.push(`- \`${key}\`: ${Array.isArray(value) ? value.join(", ") : value}`);
  lines.push("", "## Type scale", "");
  for (const [key, value] of Object.entries(ds.typeScale || TYPE_SCALE)) {
    lines.push(`- \`${key}\`: ${typeof value === "string" ? value : `${value.size} / ${value.weight} / ${value.leading} / ${value.tracking}`}`);
  }
  lines.push("", "## Component contracts", "");
  for (const c of ds.componentContracts || []) lines.push(`- ${c}`);
  lines.push("", "## Node conventions", "");
  lines.push("- Section: `<slug>-<type>-<urutan>`, misalnya `index-hero-1`.");
  lines.push("- Tautan internal memakai `data-route-link` agar perpindahan halaman tetap melalui presenter.");
  lines.push("", "## Guidelines", "");
  for (const g of ds.guidelines || []) lines.push(`- ${g}`);
  lines.push("", "## Pages", "");
  for (const p of model.pages || []) lines.push(`- ${p.title} (\`/${p.slug}\`) — ${p.sections.length} section`);
  return lines.join("\n");
}

export function makeSiteModel({ prompt, platform = "web", look = "auto", reference = null, references = [], template = null }) {
  const industry = detectIndustry(prompt);
  const brand = extractBrand(prompt, industry.brand);
  const tagline = industry.tagline;
  const presetId = detectPreset({ prompt, platform, look, reference: reference || references[0], template });
  const preset = DESIGN_PRESETS[presetId];
  const accent = detectColor(prompt);
  const minimal = /minimal|simpel|bersih|simple/i.test(prompt) || look === "minimal";
  const theme = {
    ...preset.theme,
    accent: /#|hijau|biru|merah|kuning|ungu|pink|teal|emas|navy/i.test(prompt) ? accent : preset.theme.accent,
    radius: minimal ? Math.min(4, preset.theme.radius) : preset.theme.radius,
    spacing: minimal ? Math.min(12, preset.theme.spacing) : preset.theme.spacing,
    style: look === "auto" ? presetId : look
  };
  const design = normalizeDesign({
    preset: presetId,
    rationale: preset.hint,
    source: reference || template ? (template ? "template" : "reference") : "brief",
    sectionPlan: preset.sectionPlan
  }, { preset: presetId, layout: preset.layout });
  let sections = sectionsFor(industry, prompt, brand, tagline, design.sectionPlan);
  if (reference) {
    sections.splice(1, 0, { type: "reference", title: reference.title || "Referensi layout", image: reference.image || "", body: "Layout ini dipakai sebagai acuan arah visual, bukan untuk menyalin teks atau identitas referensi." });
  }
  if (template?.kind === "foundation") {
    sections.splice(1, 0, { type: "text", title: template.title, body: template.description || "" });
  }
  if (minimal) sections = sections.filter(s => !["gallery", "faq", "reference"].includes(s.type));

  const pages = [newPage("index", "Beranda", sections)];
  if (industry.key === "kopi" || industry.key === "restaurant") {
    pages.push(newPage("menu", "Menu", [
      { type: "cards", title: "Menu lengkap", subtitle: "Dibuat segar setiap hari.", items: sections.find(s => s.type === "cards")?.items || [] },
      { type: "footer", text: `© ${new Date().getFullYear()} ${brand}` }
    ]));
  }
  if (["booking", "wedding"].includes(industry.key)) {
    pages.push(newPage("jadwal", "Jadwal", [
      { type: "form", title: "Pilih jadwal", body: "Isi detail berikut untuk mengamankan slot.", button: "Kirim permintaan" },
      { type: "footer", text: `© ${new Date().getFullYear()} ${brand}` }
    ]));
  }
  pages.push(newPage("tentang", "Tentang", [
    { type: "text", title: `Tentang ${brand}`, body: tagline },
    { type: "testimonial", quote: "Rapi, jelas, dan nyaman digunakan.", author: "Pengguna" },
    { type: "footer", text: `© ${new Date().getFullYear()} ${brand}` }
  ]));
  if (/pricing|harga|paket/i.test(prompt)) {
    pages.push(newPage("harga", "Harga", [structuredClone(sections.find(s => s.type === "pricing") || { type: "pricing", title: "Harga", plans: [] }), { type: "footer", text: `© ${new Date().getFullYear()} ${brand}` }]));
  }

  return {
    name: brand,
    tagline,
    prompt,
    platform,
    look,
    theme,
    design,
    pages,
    meta: { industry: industry.key, preset: presetId, generatedBy: "local" }
  };
}

function normalizeHex(value) {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return v;
  return null;
}

function sanitizeFont(value, fallbackFont) {
  if (typeof value !== "string") return fallbackFont;
  const clean = value.replace(/[;{}<>]/g, "").replace(/['"`]/g, "").replace(/\s+/g, " ").trim().slice(0, 140);
  return clean || fallbackFont;
}

export function sanitizeModel(input, fallback) {
  if (!input || typeof input !== "object") return fallback;
  const design = normalizeDesign(input.design, fallback.design || {});
  const preset = DESIGN_PRESETS[design.preset] || DESIGN_PRESETS.editorial;
  const theme = { ...preset.theme, ...fallback.theme, ...(input.theme || {}) };
  for (const key of ["accent", "ink", "muted", "paper", "surface", "line"]) {
    theme[key] = normalizeHex(theme[key]) || fallback.theme?.[key] || preset.theme[key];
  }
  theme.radius = Math.min(32, Math.max(0, Number(theme.radius) ?? fallback.theme?.radius ?? preset.theme.radius));
  theme.spacing = Math.min(40, Math.max(8, Number(theme.spacing) ?? fallback.theme?.spacing ?? preset.theme.spacing));
  theme.font = sanitizeFont(theme.font, fallback.theme?.font || preset.theme.font);
  theme.fontBody = sanitizeFont(theme.fontBody, fallback.theme?.fontBody || preset.theme.fontBody);
  theme.style = design.preset;
  const seenSlugs = new Set();
  const pages = Array.isArray(input.pages) && input.pages.length ? input.pages.map((p, i) => {
    let slug = String(p.slug || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "").slice(0, 48) || `page-${i + 1}`;
    if (i === 0) slug = "index";
    let suffix = 2;
    while (seenSlugs.has(slug)) slug = `${slug}-${suffix++}`;
    seenSlugs.add(slug);
    return {
      id: p.id || id(),
      slug,
      title: String(p.title || `Halaman ${i + 1}`).slice(0, 80),
      sections: Array.isArray(p.sections) && p.sections.length ? p.sections.map(s => sanitizeSection(s)).filter(Boolean) : []
    };
  }) : fallback.pages;
  return {
    ...fallback,
    name: String(input.name || fallback.name).slice(0, 80),
    tagline: String(input.tagline || fallback.tagline).slice(0, 160),
    theme,
    design,
    pages,
    meta: { ...(fallback.meta || {}), ...(input.meta || {}), preset: design.preset, generatedBy: input.meta?.generatedBy || fallback.meta?.generatedBy || "local" }
  };
}

function sanitizeSection(s) {
  if (!s || typeof s !== "object" || !s.type) return null;
  const allowed = ["hero", "features", "cards", "stats", "pricing", "testimonial", "cta", "form", "text", "gallery", "faq", "footer", "reference", "logos", "showcase", "steps"];
  if (!allowed.includes(s.type)) return null;
  const out = { type: s.type };
  for (const key of ["eyebrow", "title", "subtitle", "body", "quote", "author", "role", "text", "button", "primaryCta", "secondaryCta", "image", "note", "visual", "kicker"]) {
    if (typeof s[key] === "string") out[key] = s[key].slice(0, 1000);
  }
  for (const key of ["items", "plans"]) {
    if (Array.isArray(s[key])) out[key] = s[key].slice(0, 12).map(entry => {
      if (typeof entry === "string") return entry.slice(0, 200);
      if (!entry || typeof entry !== "object") return null;
      const o = {};
      for (const k of ["title", "body", "meta", "value", "label", "name", "price", "cta", "q", "a", "caption", "icon", "visual", "role"]) {
        if (typeof entry[k] === "string") o[k] = entry[k].slice(0, 300);
      }
      if (Array.isArray(entry.features)) o.features = entry.features.slice(0, 10).map(f => String(f).slice(0, 150));
      o.featured = !!entry.featured;
      return o;
    }).filter(Boolean);
  }
  return out;
}

const GENERATE_SYSTEM = `Kamu adalah "Design Compiler" DesainPakeAI. Tugasmu bukan menulis website generik, tetapi mengompilasi ide pengguna menjadi MODEL TERSTRUKTUR yang akan dirender oleh sistem template, layout system, dan DESIGN.md milik kami.

ATURAN WAJIB:
1. Kembalikan SATU objek JSON saja. Tanpa markdown, tanpa komentar, tanpa CSS/HTML.
2. Pilih hanya salah satu preset ini: ${Object.keys(DESIGN_PRESETS).join(", ")}. Jangan mengarang preset baru.
3. Pilih hanya salah satu visual pattern ini: ${Object.keys(DESIGN_PATTERNS).join(", ")}. Pattern menentukan ritme visual; preset menentukan token dan rencana section.
4. Gunakan Bahasa Indonesia kecuali pengguna memakai bahasa lain. Tulis copy yang konkret untuk produk/usersebutkan, bukan kalimat motivasi umum.
5. Jangan mengarang logo, testimoni, angka, sertifikat, klien, atau klaim yang tidak disebut pengguna. Jika tidak ada data, gunakan label netral seperti "Contoh alur" atau "Catatan internal".
6. Dilarang: gradient, glassmorphism, emoji, lorem ipsum, animation berlebihan, kartu seragam di semua bagian, header/footer yang sama persis dengan template generik.
7. Satu H1 saja, di section hero pertama. Setiap section punya satu tujuan dan urutan membaca yang jelas.
8. Gunakan huruf kapital dengan hemat. Jangan meniru nama produk, warna merek, atau copy dari referensi yang dilampirkan.
9. Jika ada referensi: "Gunakan referensi ini sebagai pola struktur, hierarki, dan urutan section, bukan salinan visual. Pertahankan design system, token, dan identitas visual project." Artinya ikuti urutan section dan proporsinya, tetapi warna, font, radius, dan token tetap milik sistem preset ini.
10. Halaman pertama harus slug "index". Maksimal 4 halaman. Halaman index harus berisi 8-12 section.
11. Gunakan field yang tercantum di skema. Jangan menambah field bebas.

SKEMA:
{
  "design": {
    "preset": "editorial|finance|command|schedule|brutal|catalog|dashboard",
    "pattern": "${Object.keys(DESIGN_PATTERNS).join("|")}",
    "rationale": "alasan singkat mengapa preset dan pattern ini cocok, maksimal 2 kalimat",
    "source": "brief|look|reference|template",
    "layout": {
      "contentMax": "1180px", "padding": "56px", "mobilePadding": "20px",
      "gutter": "32px", "sectionGap": "96px", "itemGap": "24px",
      "columns": {"mobile": 4, "tablet": 8, "desktop": 12},
      "breakpoints": {"tablet": 620, "desktop": 900}
    },
    "sectionPlan": ["hero","logos","features","showcase","stats","pricing","testimonial","faq","cta","footer"]
  },
  "name": "Nama produk",
  "tagline": "Satu kalimat nilai utama",
  "theme": {
    "accent": "#xxxxxx", "ink": "#xxxxxx", "muted": "#xxxxxx",
    "paper": "#xxxxxx", "surface": "#xxxxxx", "line": "#xxxxxx",
    "radius": 0, "spacing": 16,
    "font": "Font display", "fontBody": "Font tubuh"
  },
  "pages": [
    {
      "title": "Beranda", "slug": "index",
      "sections": [
        {"type":"hero","eyebrow":"...","title":"...","subtitle":"...","primaryCta":"...","secondaryCta":"...","visual":"dashboard|calendar|product|none","note":"..."},
        {"type":"logos","title":"...","items":["..."]},
        {"type":"features","title":"...","subtitle":"...","items":[{"title":"...","body":"...","meta":"01","icon":"check|bolt|spark"}]},
        {"type":"showcase","title":"...","subtitle":"...","items":[{"title":"...","body":"...","meta":"...","visual":"board|flow|list"}]},
        {"type":"steps","title":"...","subtitle":"...","items":[{"title":"...","body":"...","meta":"01"}]},
        {"type":"stats","title":"...","items":[{"value":"...","label":"..."}]},
        {"type":"pricing","title":"...","subtitle":"...","plans":[{"name":"...","price":"...","features":["..."],"cta":"...","featured":true}]},
        {"type":"testimonial","quote":"...","author":"...","role":"..."},
        {"type":"faq","title":"...","items":[{"q":"...","a":"..."}]},
        {"type":"cta","title":"...","body":"...","button":"...","note":"..."},
        {"type":"footer","text":"..."}
      ]
    }
  ]
}

Tipe section yang diizinkan: hero, logos, features, cards, showcase, steps, stats, pricing, testimonial, faq, cta, form, text, gallery, reference, footer.
Aturan layout system: panjang boleh px/rem atau var(--token, fallback); kolom 1-12 dan tidak boleh menurun dari mobile ke tablet ke desktop; breakpoint desktop harus lebih lebar dari tablet. Salin nilai layout dari context yang diberikan; jangan mengarang geometri baru.`;

export async function generateSiteModel(options) {
  const local = makeSiteModel(options);
  const references = options.references || (options.reference ? [options.reference] : []);
  const context = {
    prompt: options.prompt,
    platform: options.platform || "web",
    look: options.look || "auto",
    lookSelection: options.lookSelection || (options.template ? { kind: "template", id: options.template.id } : references.length ? { kind: "reference", id: references[0].id } : null),
    references: references.map(r => ({
      id: r.id, title: r.title, category: r.category, description: r.description, kind: r.kind,
      signals: r.signals || [], sections: r.sections || [], rules: r.rules || [],
      note: "Gunakan hanya sebagai pola struktur, hierarki, dan urutan section; jangan salin visual."
    })),
    template: options.template ? { id: options.template.id, title: options.template.title, description: options.template.description, kind: options.template.kind } : null,
    designSystem: local.design,
    suggestedPreset: local.design.preset,
    suggestedPattern: local.design.pattern,
    allowedPresets: presetsForLook(options.look),
    allowedPatterns: Object.keys(DESIGN_PATTERNS)
  };
  const ai = await callAIJson({
    system: GENERATE_SYSTEM,
    user: `${options.viewport ? `[Tampilan: ${options.viewport}]\n\n` : ""}Brief pengguna:\n${JSON.stringify(context, null, 2)}\n\nPreset yang disarankan sistem: ${context.suggestedPreset} (pattern: ${context.suggestedPattern}). Pilih itu jika sesuai brief; jika tidak, pilih preset lain dari daftar. Kembalikan JSON lengkap sesuai skema.`,
    userId: options.userId
  });
  if (!ai) return local;
  return sanitizeModel(ai, { ...local, meta: { ...local.meta, generatedBy: aiProvider(options.userId) } });
}

export async function editSiteModel(model, instruction, userId) {
  const text = instruction.toLowerCase();
  const next = structuredClone(model);
  const updated = [];

  const hexMatch = text.match(/#([0-9a-f]{6})\b/i);
  let color = hexMatch ? `#${hexMatch[1]}` : null;
  if (!color) {
    if (/hijau|green/.test(text)) color = "#16734f";
    else if (/biru|blue/.test(text)) color = "#2563eb";
    else if (/merah|red/.test(text)) color = "#ba343e";
    else if (/kuning|yellow/.test(text)) color = "#946200";
    else if (/ungu|purple|violet/.test(text)) color = "#7438d0";
    else if (/hitam|black/.test(text)) color = "#241b32";
  }
  if (color && /(warna|color|tombol|button|akcen|accent|hijau|biru|merah|kuning|ungu|hitam|#)/.test(text)) {
    next.theme.accent = color;
    updated.push(`Warna aksen diubah menjadi ${color}.`);
  }
  if (/spacing|jarak|rapat|longgar/.test(text)) {
    next.theme.spacing = /rapat|kecil|minimal/.test(text) ? 12 : 24;
    if (next.design?.layout) next.design.layout.itemGap = `${next.theme.spacing}px`;
    updated.push(`Spacing dasar disetel ke ${next.theme.spacing}px.`);
  }
  if (/minimalis|minimal|simpel|bersih/.test(text)) {
    next.theme.radius = 8;
    next.pages = next.pages.map(p => ({ ...p, sections: p.sections.filter(s => !["gallery", "faq"].includes(s.type)) }));
    updated.push("Layout disederhanakan dan radius diperkecil.");
  }
  const pageMatch = text.match(/(?:tambah|buat|add)\s+(?:halaman|page)\s+([a-z0-9\s-]+)/i);
  if (pageMatch) {
    const title = titleCase(pageMatch[1].trim().slice(0, 30));
    const slug = pageMatch[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "halaman-baru";
    if (!next.pages.some(p => p.slug === slug)) {
      next.pages.push({ id: id(), slug, title, sections: [
        { type: "hero", eyebrow: title, title, subtitle: "Halaman baru yang dibuat melalui AI chat." },
        { type: "text", title: "Isi halaman", body: "Tulis instruksi lanjutan untuk mengisi bagian ini." },
        { type: "footer", text: `© ${new Date().getFullYear()} ${next.name}` }
      ] });
      updated.push(`Halaman ${title} ditambahkan.`);
    }
  }
  if (/(judul|title|headline).*(jadi|menjadi|ubah)/.test(text)) {
    const quoted = instruction.match(/["“']([^"”']+)["”']/);
    if (quoted && next.pages[0]?.sections[0]) {
      next.pages[0].sections[0].title = quoted[1];
      updated.push("Judul utama diperbarui.");
    }
  }
  if (/(hapus|remove).*(halaman|page)\s+([a-z0-9\s-]+)/i.test(text) && next.pages.length > 1) {
    const target = text.match(/([a-z0-9\s-]+)$/)?.[1]?.trim();
    const idx = next.pages.findIndex(p => p.slug.includes(target) || p.title.toLowerCase().includes(target || "~~~"));
    if (idx > 0) { next.pages.splice(idx, 1); updated.push(`Halaman dihapus: ${next.pages[idx]?.title || ""}.`); }
  }
  if (/testimoni|testimonial/.test(text) && /tambah|add/.test(text)) {
    next.pages[0].sections.splice(-1, 0, { type: "testimonial", quote: "Keren dan rapi hasilnya.", author: "Pengguna" });
    updated.push("Section testimoni ditambahkan.");
  }

  const ai = await callAIJson({
    system: `Kamu adalah agen edit DesainPakeAI. Kamu menerima model JSON lengkap, DESIGN.md, dan instruksi pengguna. Kembalikan SATU objek JSON: {"model": {...model lengkap...}, "summary": "ringkasan 1 kalimat"}.

ATURAN WAJIB:
1. Pertahankan design.preset, design.pattern, design.layout (termasuk columns dan breakpoints), struktur halaman, dan semua copy yang tidak disebut dalam instruksi. Ubah hanya bagian yang diminta.
2. Jangan mengganti preset atau pattern hanya karena ingin "mempercantik". Ganti keduanya hanya jika pengguna meminta arah visual baru secara eksplisit.
3. Jangan menambah gradient, glassmorphism, emoji, logo palsu, testimoni palsu, atau angka yang tidak disebut pengguna.
4. Tetap gunakan Bahasa Indonesia dan tipe section yang sudah didukung.
5. Jika instruksi hanya warna, ubah theme.accent/ink/paper/surface/line yang relevan dan biarkan isi tetap sama.
6. Jika instruksi hanya spacing, ubah theme.spacing atau design.layout.itemGap/sectionGap (nilai px/rem), bukan struktur.
7. Jika instruksi menambah halaman, tambahkan halaman baru dengan 6-9 section yang relevan, bukan halaman kosong.
8. Jangan mengembalikan markdown, CSS, atau HTML.`,
    user: `DESIGN.md:\n${designMarkdown({ name: next.name, model: next, design_system: defaultDesignSystem(next.theme, next.design) })}\n\nMODEL JSON:\n${JSON.stringify(next)}\n\nINSTRUKSI: ${instruction}\n\nKembalikan {"model": ..., "summary": ...} sebagai JSON saja.`,
    userId
  });
  if (ai) {
    const candidate = ai && typeof ai.model === "object" ? ai.model : ai;
    const merged = sanitizeModel(candidate, next);
    if (merged.pages?.length && JSON.stringify(merged) !== JSON.stringify(next)) {
      const summary = typeof ai.summary === "string" && ai.summary.trim()
        ? ai.summary.trim().slice(0, 240)
        : `AI menerapkan instruksi: ${instruction}`;
      return { model: merged, summary };
    }
  }
  return { model: next, summary: updated.length ? updated.join(" ") : "Instruksi diterima, tetapi tidak ada perubahan yang dikenali. Coba sebutkan warna, halaman, atau bagian tertentu." };
}
