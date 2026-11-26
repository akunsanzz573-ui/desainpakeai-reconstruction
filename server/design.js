// Reference-derived design presets.
//
// The public bundles show that the reference app does not ask the model for a
// generic "website". It hands the agent a design system (DESIGN.md), layout
// geometry tokens, and full component templates. This module implements the
// same idea in a compact, locally owned form: the model may select and adapt a
// preset, but it cannot invent arbitrary layout geometry or CSS.

const clamp = (value, min, max, fallback) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
};

const str = (value, fallback = "", max = 240) => {
  if (typeof value !== "string") return fallback;
  const clean = value.replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim();
  return clean ? clean.slice(0, max) : fallback;
};

// The reference validates length tokens as px/rem (or var(--token, fallback)).
// Keep the same shape locally instead of bare numbers.
function layoutTokens(max, pad, mobilePad, gutter, sectionGap, itemGap, tablet, desktop) {
  return {
    contentMax: `${max}px`, padding: `${pad}px`, mobilePadding: `${mobilePad}px`,
    gutter: `${gutter}px`, sectionGap: `${sectionGap}px`, itemGap: `${itemGap}px`,
    columns: { mobile: 4, tablet: 8, desktop: 12 },
    breakpoints: { tablet, desktop }
  };
}

export const DESIGN_PRESETS = {
  editorial: {
    label: "Editorial hangat",
    hint: "Hierarki tipografi kuat,aturan tipis, ruang lapang, satu halaman yang terasa seperti majalah.",
    theme: {
      accent: "#7438d0", ink: "#241b32", muted: "#71647e", paper: "#fffdf8",
      surface: "#ffffff", line: "#ded5c8", radius: 0, spacing: 16,
      font: "Newsreader Variable, Georgia, serif", fontBody: "Inter Variable, Inter, sans-serif"
    },
    layout: layoutTokens(1180, 56, 20, 32, 96, 24, 620, 900),
    sectionPlan: ["hero", "logos", "features", "showcase", "stats", "pricing", "testimonial", "faq", "cta", "footer"],
    guidelines: [
      "Gunakan satu H1 dengan ukuran besar dan satu paragraf pembuka yang pendek.",
      "Pisahkan bagian dengan aturan 1px dan label bernomor, bukan kartu berlebih.",
      "Biarkan whitespace bekerja; jangan menambah dekorasi tanpa informasi."
    ]
  },
  finance: {
    label: "Lembar finansial",
    hint: "Permukaan putih, tinta pekat, aksen lime, tabel padat, dan sinyal status yang jelas.",
    theme: {
      accent: "#d7f000", ink: "#111111", muted: "#66665f", paper: "#ffffff",
      surface: "#f7f7f2", line: "#d9d9d2", radius: 0, spacing: 12,
      font: "Inter Tight Variable, Inter, sans-serif", fontBody: "Inter Variable, Inter, sans-serif"
    },
    layout: layoutTokens(1240, 48, 20, 20, 72, 16, 640, 960),
    sectionPlan: ["hero", "logos", "showcase", "features", "stats", "steps", "pricing", "testimonial", "cta", "footer"],
    guidelines: [
      "Tampilkan data sebagai baris dan kolom yang bisa dipindai, bukan kartu-kartu besar.",
      "Aksen lime hanya untuk sinyal utama: CTA, status aktif, dan angka penting.",
      "Teks tetap hitam pekat dengan kontras tinggi di atas permukaan putih."
    ]
  },
  command: {
    label: "Panel gelap",
    hint: "Charcoal, label monospace, petak komando, dan aksi cepat alat developer.",
    theme: {
      accent: "#a78bfa", ink: "#f5f5f5", muted: "#a3a3a3", paper: "#111111",
      surface: "#181818", line: "#2b2b2b", radius: 8, spacing: 12,
      font: "Geist Mono Variable, ui-monospace, monospace", fontBody: "Inter Variable, Inter, sans-serif"
    },
    layout: layoutTokens(1120, 48, 18, 16, 64, 14, 600, 920),
    sectionPlan: ["hero", "logos", "features", "showcase", "steps", "stats", "pricing", "faq", "cta", "footer"],
    guidelines: [
      "Gunakan label kecil monospace untuk kategori dan status.",
      "Susun fitur seperti palet perintah: padat, rapi, dan langsung bisa dipindai.",
      "Jangan meniru logo atau nama produk referensi; cukup adaptasi ritme panelnya."
    ]
  },
  schedule: {
    label: "Jadwal netral",
    hint: "Permukaan netral, grid kalender, langkah pemesanan yang tenang, dan CTA jelas.",
    theme: {
      accent: "#2f6fed", ink: "#242424", muted: "#6b7280", paper: "#f7f7f5",
      surface: "#ffffff", line: "#e1e1dc", radius: 14, spacing: 16,
      font: "Cal Sans UI, Inter Tight Variable, sans-serif", fontBody: "Inter Variable, Inter, sans-serif"
    },
    layout: layoutTokens(1120, 56, 20, 24, 88, 20, 620, 900),
    sectionPlan: ["hero", "logos", "steps", "showcase", "features", "testimonial", "pricing", "faq", "cta", "footer"],
    guidelines: [
      "Tampilkan alur jadwal sebagai grid mingguan atau langkah bernomor.",
      "Simpan warna netral sebagai dominan; aksen biru hanya untuk aksi aktif.",
      "Form dan pilihan waktu harus terlihat dapat diklik sejak pertama kali dilihat."
    ]
  },
  brutal: {
    label: "Kontras berani",
    hint: "Kertas hangat, garis tebal, bayangan keras, tipografi kecil-kapital, dan aksi yang menyolok.",
    theme: {
      accent: "#ff5c35", ink: "#111111", muted: "#555048", paper: "#f4ead7",
      surface: "#fffaf0", line: "#111111", radius: 0, spacing: 16,
      font: "Archivo Black, Inter Tight Variable, sans-serif", fontBody: "Inter Variable, Inter, sans-serif"
    },
    layout: layoutTokens(1160, 48, 20, 20, 72, 18, 620, 900),
    sectionPlan: ["hero", "logos", "features", "showcase", "stats", "pricing", "testimonial", "cta", "footer"],
    guidelines: [
      "Gunakan border 2px dan bayangan keras, bukan gradient atau blur.",
      "Huruf kecil-kapital dan angka besar boleh dipakai sebagai ritme visual.",
      "Satu warna aksen saja; hindari palet warna yang berdiri sendiri tiap bagian."
    ]
  },
  catalog: {
    label: "Katalog hangat",
    hint: "Hero dua kolom, gambar sebagai narasi utama, caption singkat, dan ritme editorial yang tenang.",
    theme: {
      accent: "#b45f3c", ink: "#2b211b", muted: "#786c61", paper: "#f3efe8",
      surface: "#ffffff", line: "#ded6ca", radius: 4, spacing: 16,
      font: "Newsreader Variable, Georgia, serif", fontBody: "Inter Variable, Inter, sans-serif"
    },
    layout: layoutTokens(1200, 56, 20, 28, 96, 24, 620, 900),
    sectionPlan: ["hero", "showcase", "features", "steps", "gallery", "testimonial", "cta", "footer"],
    guidelines: [
      "Biarkan visual membawa cerita; teks hanya memberi konteks singkat.",
      "Gunakan grid tidak simetris dan caption kecil, bukan kartu seragam.",
      "Hindari janji berlebihan dan statistik yang tidak diberikan pengguna."
    ]
  },
  dashboard: {
    label: "Dashboard terang",
    hint: "Panel aplikasi dengan sidebar ringkas, tabel data, ringkasan angka, dan kontrol yang rapat.",
    theme: {
      accent: "#4f46e5", ink: "#172033", muted: "#667085", paper: "#f6f7fb",
      surface: "#ffffff", line: "#e4e7ec", radius: 12, spacing: 12,
      font: "Inter Tight Variable, Inter, sans-serif", fontBody: "Inter Variable, Inter, sans-serif"
    },
    layout: layoutTokens(1320, 40, 18, 16, 64, 14, 620, 980),
    sectionPlan: ["hero", "logos", "showcase", "stats", "features", "steps", "pricing", "faq", "cta", "footer"],
    guidelines: [
      "Tampilkan satu layar panel utama di hero dengan sidebar, header, dan tabel.",
      "Gunakan angka ringkas dengan label yang jelas dan satuan yang konsisten.",
      "Jangan menambah ilustrasi dekoratif; gunakan struktur data sebagai konten visual."
    ]
  }
};

const KEYWORDS = {
  finance: ["ramp", "lime", "ledger", "finansial", "finance", "invoice", "pembayaran", "kasir", "akuntansi", "harvest", "crm penjualan"],
  schedule: ["cal.com", "calendly", "jadwal", "booking", "reservasi", "appointment", "schedule", "salon", "klinik", "gesture", "calendar"],
  command: ["raycast", "command", "terminal", "cli", "developer", "engineering", "api", "kode", "code", "shortcut", "linux", "tooling"],
  brutal: ["neobrutal", "brutal", "berani", "tebal", "playful", "kontras", "stiker", "poster"],
  dashboard: ["dashboard", "analytics", "analitik", "admin", "panel", "metric", "metrics", "ops", "operations", "erp", "absensi", "manajemen proyek", "umkm"],
  catalog: ["travel", "hotel", "resor", "resort", "wisata", "perjalanan", "wedding", "nikah", "kopi", "kafe", "restoran", "kuliner", "portofolio", "foto", "galeri", "villa"],
  editorial: ["editorial", "majalah", "artikel", "berita", "jurnal", "portfolio"]
};

export function detectPreset({ prompt = "", look = "auto", platform = "web", reference = null, template = null } = {}) {
  const parts = [prompt, look, platform, reference?.title, reference?.category, reference?.description, template?.title, template?.description, template?.id];
  const text = parts.filter(Boolean).join(" ").toLowerCase();
  if (look === "dashboard" || /dashboard|panel|analytics/i.test(look)) return "dashboard";
  if (look === "editorial" || /editorial/i.test(look)) return "editorial";
  if (look === "minimal") return "editorial";
  const priority = ["catalog", "finance", "command", "brutal", "dashboard", "schedule", "editorial"];
  for (const preset of priority) {
    if (KEYWORDS[preset].some(word => text.includes(word))) return preset;
  }
  if (platform === "app") return "schedule";
  if (template?.kind === "foundation") return "finance";
  if (reference) return "catalog";
  return "editorial";
}

export function presetsForLook(look) {
  if (look === "dashboard") return ["dashboard", "finance", "command"];
  if (look === "editorial") return ["editorial", "catalog", "brutal"];
  if (look === "minimal") return ["editorial", "schedule", "catalog"];
  return Object.keys(DESIGN_PRESETS);
}

// Locally owned visual patterns derived from the six landing templates shipped
// in the reference bundles. Presets choose the default pattern; the model may
// only pick from this list. AI never emits raw CSS.
export const DESIGN_PATTERNS = {
  aurora: "Gelap dengan panel produk asimetris dan hierarki kontras tinggi.",
  neobrutal: "Poster kontras tinggi: garis tebal, bayangan keras, label stiker.",
  terminal: "Permukaan monolokal, label status, dan ritme baris padat.",
  "grid-editorial": "Majalah asimetris dengan masthead, aturan tipis, dan whitespace.",
  sunlit: "Cerita produk hangat, dua kolom, dan bentuk lembut.",
  utility: "Katalog teknis dengan label ringkas dan fokus pada konten.",
  editorial: "Tipografi editorial dengan grid teks yang tenang.",
  finance: "Lembar data putih dengan aksen tajam dan baris padat.",
  schedule: "Permukaan netral untuk jadwal dan alur pemesanan.",
  dashboard: "Panel aplikasi dengan metrik ringkas dan tabel data."
};

export const PRESET_PATTERN = {
  editorial: "grid-editorial", finance: "utility", command: "terminal",
  schedule: "schedule", brutal: "neobrutal", catalog: "sunlit", dashboard: "dashboard"
};

export function normalizePattern(value, presetId = "editorial") {
  const key = str(value, "").toLowerCase();
  return DESIGN_PATTERNS[key] ? key : (PRESET_PATTERN[presetId] || "grid-editorial");
}

const LENGTH_RE = /^(?:var\(--[a-z][a-z0-9-]*,\s*\d+(?:\.\d+)?(?:px|rem)\)|\d+(?:\.\d+)?(?:px|rem))$/i;

function normalizeLength(value, fallback) {
  if (typeof value === "number" && Number.isFinite(value)) return `${Math.max(0, Math.round(value))}px`;
  const clean = str(value, "", 120);
  return LENGTH_RE.test(clean) ? clean : fallback;
}

function normalizeColumns(value, fallback) {
  const raw = value && typeof value === "object"
    ? value
    : (typeof value === "number" ? { mobile: Math.min(4, value), tablet: Math.min(8, value), desktop: value } : {});
  const mobile = clamp(raw.mobile ?? fallback.mobile, 1, 12, fallback.mobile);
  const tablet = Math.max(mobile, clamp(raw.tablet ?? fallback.tablet, 1, 12, fallback.tablet));
  const desktop = Math.max(tablet, clamp(raw.desktop ?? fallback.desktop, 1, 12, fallback.desktop));
  return { mobile, tablet, desktop };
}

function normalizeBreakpoints(value, fallback) {
  const raw = value && typeof value === "object" ? value : {};
  const tablet = clamp(raw.tablet ?? raw.sm ?? fallback.tablet, 320, 1600, fallback.tablet);
  let desktop = clamp(raw.desktop ?? raw.md ?? fallback.desktop, 321, 2400, fallback.desktop);
  if (desktop <= tablet) desktop = Math.min(2400, tablet + 1);
  return { tablet, desktop };
}

export function normalizeLayout(input = {}, fallback = {}) {
  const source = input && typeof input === "object" ? input : {};
  const base = fallback && typeof fallback === "object" ? fallback : {};
  const out = {};
  for (const key of ["contentMax", "padding", "mobilePadding", "gutter", "sectionGap", "itemGap"]) {
    out[key] = normalizeLength(source[key] ?? base[key], base[key] || "24px");
  }
  out.columns = normalizeColumns(source.columns, base.columns || { mobile: 4, tablet: 8, desktop: 12 });
  out.breakpoints = normalizeBreakpoints(source.breakpoints, base.breakpoints || { tablet: 640, desktop: 1024 });
  return out;
}

export function normalizeDesign(input, fallback = null) {
  const requested = input && typeof input === "object" ? input : {};
  const requestedPreset = str(requested.preset, "").toLowerCase();
  const presetId = DESIGN_PRESETS[requestedPreset]
    ? requestedPreset
    : (fallback?.preset && DESIGN_PRESETS[fallback.preset] ? fallback.preset : "editorial");
  const preset = DESIGN_PRESETS[presetId];
  const sectionPlan = Array.isArray(requested.sectionPlan) && requested.sectionPlan.length
    ? requested.sectionPlan.map(s => str(s, "", 40)).filter(Boolean).slice(0, 14)
    : preset.sectionPlan;
  return {
    preset: presetId,
    label: preset.label,
    pattern: normalizePattern(requested.pattern || fallback?.pattern, presetId),
    rationale: str(requested.rationale, fallback?.rationale || preset.hint, 320),
    source: str(requested.source, fallback?.source || "brief", 40),
    layout: normalizeLayout(requested.layout, fallback?.layout || preset.layout),
    sectionPlan
  };
}

export function designForModel(model, input) {
  const fallbackPreset = model?.design?.preset || detectPreset(model || {});
  return normalizeDesign(input, {
    ...(model?.design || {}),
    preset: fallbackPreset,
    layout: { ...DESIGN_PRESETS[fallbackPreset].layout, ...(model?.design?.layout || {}) }
  });
}

export function presetGuidelines(presetId) {
  return DESIGN_PRESETS[presetId]?.guidelines || DESIGN_PRESETS.editorial.guidelines;
}
