import { designMarkdown } from "./model.js";

const esc = (v = "") => String(v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function icon(kind = "check") {
  const paths = {
    check: '<path d="m5 12 4 4L19 6"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    spark: '<path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>'
  };
  return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[kind] || paths.check}</svg>`;
}

function sectionHtml(section, ctx) {
  const t = section.type;
  if (t === "hero") return `<section class="hero">
    <p class="eyebrow">${esc(section.eyebrow)}</p>
    <h1>${esc(section.title)}</h1>
    <p class="lead">${esc(section.subtitle)}</p>
    <div class="actions"><a class="btn primary" href="${section.primaryCta === "Buat janji" ? "/jadwal" : "#konten"}">${esc(section.primaryCta)}</a><a class="btn ghost" href="/tentang">${esc(section.secondaryCta)}</a></div>
  </section>`;
  if (t === "features") return `<section id="konten"><p class="eyebrow">Fitur</p><h2>${esc(section.title)}</h2><p class="muted">${esc(section.subtitle || "")}</p><div class="grid three">${(section.items || []).map(i => `<article class="feature"><span class="ico">${icon(i.icon)}</span><h3>${esc(i.title)}</h3><p>${esc(i.body)}</p></article>`).join("")}</div></section>`;
  if (t === "cards") return `<section id="konten"><p class="eyebrow">Pilihan</p><h2>${esc(section.title)}</h2><p class="muted">${esc(section.subtitle || "")}</p><div class="grid three">${(section.items || []).map(i => `<article class="card"><span class="tag">${esc(i.meta || "")}</span><h3>${esc(i.title)}</h3><p>${esc(i.body)}</p></article>`).join("")}</div></section>`;
  if (t === "stats") return `<section><h2>${esc(section.title)}</h2><div class="grid three">${(section.items || []).map(i => `<div class="stat"><strong>${esc(i.value)}</strong><span>${esc(i.label)}</span></div>`).join("")}</div></section>`;
  if (t === "pricing") return `<section><h2>${esc(section.title)}</h2><p class="muted">${esc(section.subtitle || "")}</p><div class="grid two">${(section.plans || []).map(p => `<article class="plan${p.featured ? " featured" : ""}"><h3>${esc(p.name)}</h3><strong>${esc(p.price)}</strong><ul>${(p.features || []).map(f => `<li>${esc(f)}</li>`).join("")}</ul><span class="btn ${p.featured ? "primary" : "ghost"}">${esc(p.cta || "Pilih")}</span></article>`).join("")}</div></section>`;
  if (t === "testimonial") return `<section class="quote"><blockquote>“${esc(section.quote)}”</blockquote><p>${esc(section.author)}</p></section>`;
  if (t === "cta") return `<section class="cta"><h2>${esc(section.title)}</h2><p>${esc(section.body)}</p><a class="btn primary" href="#konten">${esc(section.button)}</a></section>`;
  if (t === "form") return `<section id="konten"><h2>${esc(section.title)}</h2><p class="muted">${esc(section.body || "")}</p><form class="contact" onsubmit="event.preventDefault();this.querySelector('.form-status').textContent='Terima kasih. Pesanmu sudah tercatat.'"><input required placeholder="Nama" aria-label="Nama"><input required type="email" placeholder="Email" aria-label="Email"><textarea required placeholder="Pesan" aria-label="Pesan" rows="4"></textarea><button class="btn primary" type="submit">${esc(section.button || "Kirim")}</button><span class="form-status" role="status"></span></form></section>`;
  if (t === "text") return `<section><h2>${esc(section.title)}</h2><p class="prose">${esc(section.body)}</p></section>`;
  if (t === "gallery") return `<section><h2>${esc(section.title)}</h2><div class="grid three tiles">${(section.items || []).map((i, n) => `<div class="tile tile-${n % 3}"><span>${esc(i.caption || "")}</span></div>`).join("")}</div></section>`;
  if (t === "faq") return `<section><h2>${esc(section.title)}</h2><div class="faq">${(section.items || []).map(i => `<details><summary>${esc(i.q)}</summary><p>${esc(i.a)}</p></details>`).join("")}</div></section>`;
  if (t === "reference") return `<section class="reference"><img src="${esc(section.image)}" alt="Referensi layout"><p>${esc(section.body || "")}</p></section>`;
  if (t === "footer") return `<footer><span>${esc(section.text || "")}</span><span>${esc(ctx.name)}</span></footer>`;
  return "";
}

const css = `
:root{--accent:#7438d0;--ink:#241b32;--muted:#71647e;--paper:#f8f6fc;--surface:#fff;--line:#e3ddeb;--radius:12px;--space:16px;--display:'Inter Tight',Inter,system-ui,sans-serif;--body:Inter,system-ui,sans-serif}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--body);line-height:1.55;-webkit-font-smoothing:antialiased}a{color:inherit;text-decoration:none}
.wrap{max-width:1120px;margin:0 auto;padding:0 24px}header{position:sticky;top:0;z-index:10;background:color-mix(in srgb,var(--paper) 92%,transparent);border-bottom:1px solid var(--line);backdrop-filter:blur(8px)}
.nav{height:72px;display:flex;align-items:center;justify-content:space-between;gap:24px}.brand{font:700 20px var(--display);letter-spacing:-.035em}.brand i{font-style:normal;color:var(--accent)}nav.links{display:flex;gap:24px;font-size:14px;color:var(--muted)}nav.links a:hover{color:var(--ink)}nav.links a.active{color:var(--accent);font-weight:600}
main>section{padding:calc(var(--space)*5) 0;border-bottom:1px solid var(--line)}.hero{padding:calc(var(--space)*8) 0 calc(var(--space)*6)!important;text-align:center}.eyebrow{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin:0 0 16px}
h1{font:600 clamp(40px,6vw,68px)/1.02 var(--display);letter-spacing:-.055em;max-width:18ch;margin:0 auto 20px}h2{font:600 clamp(28px,4vw,40px)/1.1 var(--display);letter-spacing:-.04em;margin:0 0 12px}h3{font:600 18px/1.3 var(--display);letter-spacing:-.02em;margin:0 0 8px}
p{margin:0 0 12px}.lead{font-size:18px;color:var(--muted);max-width:60ch;margin:0 auto 28px}.muted,.prose{color:var(--muted)}.prose{max-width:70ch;font-size:17px}
.actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}.btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 20px;border-radius:calc(var(--radius)*.8);font-size:14px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:transform .15s,background .15s}.btn:hover{transform:translateY(-1px)}.btn.primary{background:var(--accent);color:#fff}.btn.ghost{background:var(--surface);border-color:var(--line)}
.grid{display:grid;gap:20px;margin-top:32px}.grid.three{grid-template-columns:repeat(3,1fr)}.grid.two{grid-template-columns:repeat(2,1fr)}.feature,.card,.plan,.stat{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:24px}.feature p,.card p{color:var(--muted);font-size:14px}.ico{display:grid;place-items:center;width:36px;height:36px;border-radius:10px;background:color-mix(in srgb,var(--accent) 12%,white);color:var(--accent);margin-bottom:14px}.tag{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}
.stat strong{display:block;font:700 34px var(--display);letter-spacing:-.04em}.stat span{color:var(--muted);font-size:14px}.plan.featured{border-color:var(--accent);box-shadow:0 8px 30px rgba(36,27,50,.08)}.plan strong{font:700 32px var(--display)}.plan ul{padding-left:18px;color:var(--muted);font-size:14px}.quote{text-align:center}.quote blockquote{font:500 clamp(22px,3vw,30px)/1.35 var(--display);letter-spacing:-.03em;max-width:40ch;margin:0 auto 12px}.quote p{color:var(--muted)}
.cta{text-align:center;background:var(--surface);border-radius:var(--radius);margin:calc(var(--space)*4) 24px;padding:calc(var(--space)*4)!important}.contact{display:grid;gap:12px;max-width:520px;margin-top:24px}.contact input,.contact textarea{width:100%;padding:12px 14px;border:1px solid var(--line);border-radius:calc(var(--radius)*.7);background:var(--surface);font:inherit;color:var(--ink)}.contact textarea{resize:vertical}.form-status{font-size:14px;color:var(--accent)}
.tiles .tile{height:180px;border-radius:var(--radius);background:var(--desk, #f0ecf6);display:flex;align-items:flex-end;padding:16px;color:var(--muted)}.tile-0{background:#eee7f7}.tile-1{background:#e7eef7}.tile-2{background:#f3ece4}.faq details{border-bottom:1px solid var(--line);padding:14px 0}.faq summary{cursor:pointer;font-weight:600}.faq p{color:var(--muted);margin-top:10px}.reference img{width:100%;border-radius:var(--radius);border:1px solid var(--line)}.reference p{color:var(--muted);font-size:14px;margin-top:10px}
footer{display:flex;justify-content:space-between;gap:20px;padding:28px 24px;color:var(--muted);font-size:13px}
@media(max-width:820px){.grid.three,.grid.two{grid-template-columns:1fr}nav.links{display:none}main>section{padding:40px 0}.hero{padding:64px 0 48px!important}}
`;

export function renderProjectHtml(project, options = {}) {
  const model = project.model || {};
  const theme = model.theme || {};
  const active = options.activeSlug || "index";
  const vars = `
    --accent:${theme.accent || "#7438d0"};--ink:${theme.ink || "#241b32"};--muted:${theme.muted || "#71647e"};
    --paper:${theme.paper || "#f8f6fc"};--surface:${theme.surface || "#fff"};--line:${theme.line || "#e3ddeb"};
    --radius:${theme.radius || 12}px;--space:${theme.spacing || 16}px;
    --display:'${theme.font || "Inter Tight"}',Inter,system-ui,sans-serif;--body:'${theme.fontBody || "Inter"}',Inter,system-ui,sans-serif;`;
  const nav = (model.pages || []).map(p => `<a class="${p.slug === active ? "active" : ""}" href="/sites/${encodeURIComponent(project.published_slug || "preview")}${p.slug === "index" ? "" : "/" + p.slug}">${esc(p.title)}</a>`).join("");
  const page = (model.pages || []).find(p => p.slug === active) || model.pages?.[0];
  const body = (page?.sections || []).map(s => sectionHtml(s, { name: model.name || project.name })).join("");
  return `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(page?.title || project.name)} — ${esc(model.name || project.name)}</title><meta name="description" content="${esc(model.tagline || project.prompt || "")}"><style>:root{${vars}}${css}</style></head><body>
  <header><div class="wrap nav"><a class="brand" href="/sites/${encodeURIComponent(project.published_slug || "preview")}">${esc(model.name || project.name).replace(/([A-Z])/g, "<i>$1</i>").replace(/^<i>/, "")}</a><nav class="links">${nav}</nav><a class="btn ghost" href="/sites/${encodeURIComponent(project.published_slug || "preview")}/tentang">Tentang</a></div></header>
  <main class="wrap">${body}</main>
  ${options.includeMeta ? `<script type="application/json" id="design-md">${JSON.stringify(designMarkdown(project)).replace(/</g, "\\u003c")}</script>` : ""}
</body></html>`;
}

export function renderPreviewHtml(project, activeSlug) {
  return renderProjectHtml(project, { activeSlug, includeMeta: false });
}
