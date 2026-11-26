import crypto from "node:crypto";
import { callAIJson, aiProvider } from "./ai.js";

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

function sectionsFor(industry, prompt, brand, tagline) {
  const out = [{
    type: "hero", eyebrow: industry.key === "general" ? "Dibuat dengan DesainPakeAI" : titleCase(industry.key),
    title: tagline, subtitle: `Selamat datang di ${brand}. ${prompt.length > 90 ? prompt.slice(0, 90).trim() + "…" : prompt}`,
    primaryCta: industry.key === "wedding" ? "Lihat acara" : industry.key === "booking" ? "Buat janji" : "Lihat penawaran",
    secondaryCta: "Tentang kami"
  }];
  const map = {
    menu: { type: "cards", title: " Pilihan kami", subtitle: "Beberapa favorit yang paling sering dipesan.", items: [
      { title: "Signature", body: "Pilihan utama dengan bahan yang dipilih setiap hari.", meta: "Favorit" },
      { title: "Musiman", body: "Rasa baru yang hadir sesuai musimnya.", meta: "Baru" },
      { title: "Klasik", body: "Resep yang tidak pernah salah untuk semua orang.", meta: "Klasik" }
    ] },
    story: { type: "text", title: "Cerita kami", body: `Kami percaya desain yang baik dimulai dari hal sederhana. ${brand} dibuat untuk merawat detail kecil yang membuat setiap kunjungan terasa berbeda.` },
    visit: { type: "form", title: "Mampir dan mengobrol", body: "Tinggalkan pesan, kami akan segera membalas.", button: "Kirim pesan" },
    destinations: { type: "cards", title: "Destinasi pilihan", subtitle: "Tempat yang layak menjadi bagian dari cerita Anda.", items: [
      { title: "Pulau dan laut", body: "Air jernih, ritme pelan, dan ruang untuk bernapas.", meta: "3 hari" },
      { title: "Pegunungan", body: "Jalur hijau dengan udara sejuk setiap pagi.", meta: "5 hari" },
      { title: "Kota tua", body: "Arsitektur, kuliner, dan cerita di setiap sudut.", meta: "2 hari" }
    ] },
    features: { type: "features", title: "Kenapa memilih kami", subtitle: "Hal-hal kecil yang membuat besar bedanya.", items: [
      { title: "Jelas sejak awal", body: "Informasi tersusun rapi tanpa perlu menebak-nebak.", icon: "check" },
      { title: "Respons cepat", body: "Setiap pertanyaan mendapat jawaban yang nyata.", icon: "bolt" },
      { title: "Detail diperhatikan", body: "Dari tipografi hingga state yang paling kecil.", icon: "spark" }
    ] },
    gallery: { type: "gallery", title: "Momen pilihan", items: [
      { caption: "Suasana pagi" }, { caption: "Sudut favorit" }, { caption: "Bersama" }
    ] },
    stats: { type: "stats", title: "Angka yang bermakna", items: [
      { value: "8.429", label: "Pengguna aktif" }, { value: "23,5%", label: "Pertumbuhan" }, { value: "12", label: "Tim kecil" }
    ] },
    pricing: { type: "pricing", title: "Paket yang sederhana", subtitle: "Pilih yang sesuai, tanpa biaya tersembunyi.", plans: [
      { name: "Dasar", price: "Gratis", features: ["1 halaman", "Desain dasar", "Publish ke link"], cta: "Mulai" },
      { name: "Pro", price: "Rp99rb", features: ["Halaman tanpa batas", "DESIGN.md", "Export HTML"], cta: "Pilih Pro", featured: true }
    ] },
    faq: { type: "faq", title: "Pertanyaan umum", items: [
      { q: "Bagaimana cara memulai?", a: "Tulis kebutuhan Anda, lalu biarkan sistem menyiapkan halaman awal." },
      { q: "Bisa diubah nanti?", a: "Tentu. Berikan instruksi singkat dan perubahan langsung diterapkan." }
    ] },
    testimonial: { type: "testimonial", quote: "Hasilnya rapi, enak dibaca, dan tidak terasa seperti template generik.", author: "-seorang pengguna" },
    form: { type: "form", title: "Hubungi kami", body: "Ceritakan kebutuhanmu, kami akan menghubungimu kembali.", button: "Kirim" },
    cta: { type: "cta", title: "Siap untuk mulai?", body: "Semua dimulai dari satu ide sederhana.", button: "Mulai sekarang" }
  };
  const seen = new Set();
  for (const key of industry.sections) {
    if (!seen.has(key) && map[key]) { out.push(structuredClone(map[key])); seen.add(key); }
  }
  if (/pricing|harga|paket/i.test(prompt) && !seen.has("pricing")) out.push(structuredClone(map.pricing));
  if (/faq|pertanyaan/i.test(prompt) && !seen.has("faq")) out.push(structuredClone(map.faq));
  out.push({ type: "footer", text: `© ${new Date().getFullYear()} ${brand}. Dibuat dengan DesainPakeAI.` });
  return out;
}

function newPage(slug, title, sections) {
  return { id: id(), slug, title, sections };
}

export function defaultDesignSystem(theme = {}) {
  const accent = theme.accent || "#7438d0";
  return {
    name: "DESIGN.md",
    tokens: {
      "color.accent": accent,
      "color.ink": theme.ink || "#241b32",
      "color.paper": theme.paper || "#f8f6fc",
      "color.surface": theme.surface || "#ffffff",
      "color.line": theme.line || "#e3ddeb",
      "radius": `${theme.radius || 12}px`,
      "spacing.base": `${theme.spacing || 16}px`,
      "font.display": theme.font || "Inter Tight",
      "font.body": theme.fontBody || "Inter"
    },
    guidelines: [
      "Gunakan satu aksen warna utama dan pertahankan kontras teks.",
      "Hindari gradient dekoratif dan efek kaca berlebihan.",
      "Gunakan hierarki yang jelas: satu judul per halaman.",
      "Jaga jarak antar elemen konsisten dengan token spacing.",
      "Setiap elemen interaktif harus memiliki state fokus dan hover."
    ]
  };
}

export function designMarkdown(project) {
  const ds = project.design_system || defaultDesignSystem();
  const lines = [`# ${project.name} — DESIGN.md`, "", "## Foundations", ""];
  for (const [key, value] of Object.entries(ds.tokens || {})) lines.push(`- \`${key}\`: ${value}`);
  lines.push("", "## Guidelines", "");
  for (const g of ds.guidelines || []) lines.push(`- ${g}`);
  lines.push("", "## Pages", "");
  for (const p of project.model?.pages || []) lines.push(`- ${p.title} (\`/${p.slug}\`) — ${p.sections.length} section`);
  return lines.join("\n");
}

export function makeSiteModel({ prompt, platform = "web", look = "auto", reference = null, template = null }) {
  const industry = detectIndustry(prompt);
  const brand = extractBrand(prompt, industry.brand);
  const tagline = industry.tagline;
  const accent = detectColor(prompt);
  const minimal = /minimal|simpel|bersih|simple/i.test(prompt) || look === "minimal";
  const theme = {
    accent, ink: "#241b32", muted: "#71647e", paper: "#f8f6fc", surface: "#ffffff", line: "#e3ddeb",
    radius: minimal ? 8 : 12, spacing: minimal ? 12 : 16,
    font: "Inter Tight", fontBody: "Inter", style: minimal ? "minimal" : "editorial"
  };
  let sections = sectionsFor(industry, prompt, brand, tagline);
  if (reference) {
    sections.splice(1, 0, { type: "reference", title: reference.title || "Referensi layout", image: reference.image || "", body: "Layout ini dipakai sebagai acuan arah visual." });
  }
  if (template?.kind === "foundation") {
    theme.accent = "#7438d0";
    sections.unshift({ type: "text", title: template.title, body: template.description || "" });
  }
  if (minimal) sections = sections.filter(s => !["gallery", "faq"].includes(s.type));

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
    pages,
    meta: { industry: industry.key, generatedBy: "local" }
  };
}

function normalizeHex(value) {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return v;
  return null;
}

export function sanitizeModel(input, fallback) {
  if (!input || typeof input !== "object") return fallback;
  const theme = { ...fallback.theme, ...(input.theme || {}) };
  for (const key of ["accent", "ink", "muted", "paper", "surface", "line"]) {
    theme[key] = normalizeHex(theme[key]) || fallback.theme[key];
  }
  theme.radius = Math.min(32, Math.max(0, Number(theme.radius) || fallback.theme.radius));
  theme.spacing = Math.min(40, Math.max(8, Number(theme.spacing) || fallback.theme.spacing));
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
    pages,
    meta: { ...(fallback.meta || {}), ...(input.meta || {}), generatedBy: input.meta?.generatedBy || fallback.meta?.generatedBy || "local" }
  };
}

function sanitizeSection(s) {
  if (!s || typeof s !== "object" || !s.type) return null;
  const allowed = ["hero", "features", "cards", "stats", "pricing", "testimonial", "cta", "form", "text", "gallery", "faq", "footer", "reference"];
  if (!allowed.includes(s.type)) return null;
  const out = { type: s.type };
  for (const key of ["eyebrow", "title", "subtitle", "body", "quote", "author", "text", "button", "primaryCta", "secondaryCta", "image"]) {
    if (typeof s[key] === "string") out[key] = s[key].slice(0, 1000);
  }
  for (const key of ["items", "plans"]) {
    if (Array.isArray(s[key])) out[key] = s[key].slice(0, 12).map(entry => {
      if (typeof entry === "string") return entry.slice(0, 200);
      if (!entry || typeof entry !== "object") return null;
      const o = {};
      for (const k of ["title", "body", "meta", "value", "label", "name", "price", "cta", "q", "a", "caption", "icon"]) {
        if (typeof entry[k] === "string") o[k] = entry[k].slice(0, 300);
      }
      if (Array.isArray(entry.features)) o.features = entry.features.slice(0, 10).map(f => String(f).slice(0, 150));
      o.featured = !!entry.featured;
      return o;
    }).filter(Boolean);
  }
  return out;
}

export async function generateSiteModel(options) {
  const local = makeSiteModel(options);
  const ai = await callAIJson({
    system: `You design clean, anti-slop websites. Return ONLY a JSON object with keys: name, tagline, theme {accent,ink,paper,surface,line,radius,spacing,font,fontBody}, pages [{title,slug,sections:[{type,title,...}]}]. Allowed section types: hero, features, cards, stats, pricing, testimonial, cta, form, text, gallery, faq, footer. Use the same language as the user. No gradients.`,
    user: `Create a website model for this brief: ${options.prompt}\nPlatform: ${options.platform}. Look: ${options.look}.\nReturn complete JSON, no markdown.`,
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
    system: `You edit website models through instructions. Return the COMPLETE updated JSON model with the same schema. Keep it clean, no gradients. Respond in the user's language.`,
    user: `Current model:\n${JSON.stringify(next)}\n\nInstruction: ${instruction}\n\nReturn complete JSON only.`,
    userId
  });
  if (ai) {
    const merged = sanitizeModel(ai, next);
    if (merged.pages?.length && JSON.stringify(merged) !== JSON.stringify(next)) return { model: merged, summary: `AI menerapkan instruksi: ${instruction}` };
  }
  return { model: next, summary: updated.length ? updated.join(" ") : "Instruksi diterima, tetapi tidak ada perubahan yang dikenali. Coba sebutkan warna, halaman, atau bagian tertentu." };
}
