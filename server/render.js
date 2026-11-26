import { designMarkdown } from "./model.js";
import { DESIGN_PATTERNS, DESIGN_PRESETS, PRESET_PATTERN, detectPreset, normalizeDesign } from "./design.js";

const esc = (v = "") => String(v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeCss = (v = "", fallback = "") => {
  const clean = String(v ?? "").replace(/[{};<>]`/g, "").replace(/"/g, "").replace(/\s+/g, " ").trim();
  return clean || fallback;
};

function icon(kind = "check") {
  const paths = {
    check: '<path d="m5 12 4 4L19 6"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    spark: '<path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>'
  };
  return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[kind] || paths.check}</svg>`;
}

function heroVisual(kind = "none", name = "Produk") {
  if (kind === "dashboard") return `<div class="visual-board" aria-hidden="true">
    <div class="visual-side"><span></span><span></span><span></span><span></span></div>
    <div class="visual-main"><div class="visual-top"><b>${esc(name)}</b><i></i></div><div class="visual-metrics"><span><small>Total</small><b>—</b></span><span><small>Aktif</small><b>—</b></span><span><small>Selesai</small><b>—</b></span></div><div class="visual-table">${[1,2,3,4].map(() => `<span><i></i><i></i><i></i></span>`).join("")}</div></div>
  </div>`;
  if (kind === "calendar") return `<div class="visual-calendar" aria-hidden="true"><div class="cal-head"><b>September</b><span>Senin — Minggu</span></div><div class="cal-grid">${Array.from({ length: 35 }, (_, i) => `<span class="${i % 7 === 0 || i % 7 === 6 ? "off" : ""}">${i % 7 === 0 || i % 7 === 6 ? "" : (i % 28) + 1}</span>`).join("")}</div><div class="cal-foot"><i></i> Tersedia &nbsp; <b></b> Dipilih</div></div>`;
  if (kind === "product") return `<div class="visual-product" aria-hidden="true"><span class="visual-tag">PRATINJAU</span><div class="visual-shape"><i></i><i></i><i></i></div><p>${esc(name)}</p><small>Komposisi visual mengikuti preset</small></div>`;
  return `<div class="visual-quiet" aria-hidden="true"><span>01</span><p>${esc(name)}</p><i></i></div>`;
}

function sectionHead(section, label, ctx) {
  const kicker = section.eyebrow || section.kicker || label;
  return `<header class="section-head"><p class="section-kicker">${esc(kicker)}</p><h2>${esc(section.title || label)}</h2>${section.subtitle ? `<p class="section-sub">${esc(section.subtitle)}</p>` : ""}${ctx.rationale ? `<span class="section-source">${esc(ctx.rationale)}</span>` : ""}</header>`;
}

function sectionFrame(section, index, inner, extraClass = "", ctx = {}) {
  const id = `${ctx.slug || "index"}-${section.type}-${index + 1}`;
  return `<section class="section ${extraClass}" data-node-id="${esc(id)}" data-section-type="${esc(section.type)}" data-layout-grid data-layout-span-mobile="4" data-layout-span-tablet="8" data-layout-span="12"><div class="section-inner" data-layout-span-mobile="4" data-layout-span-tablet="8" data-layout-span="12">${inner}</div></section>`;
}

function gridSpans(count, desktop = null) {
  const n = Math.max(1, Math.min(12, count || 1));
  const desktopSpan = desktop || Math.max(3, Math.min(12, Math.floor(12 / n)));
  const tabletSpan = n <= 2 ? 6 : 6;
  return `data-layout-span-mobile="12" data-layout-span-tablet="${tabletSpan}" data-layout-span="${desktopSpan}"`;
}

function sectionHtml(section, ctx, index) {
  const t = section.type;
  if (t === "hero") {
    const secondary = section.secondaryCta ? `<a class="btn ghost" data-route-link href="${ctx.secondaryHref}">${esc(section.secondaryCta)}</a>` : "";
    return sectionFrame(section, index, `<div class="hero-grid" data-layout-grid>
      <div class="hero-copy" data-layout-span-mobile="4" data-layout-span-tablet="6" data-layout-span="7"><p class="hero-eyebrow">${esc(section.eyebrow || "Mulai dari ide")}</p><h1>${esc(section.title || ctx.name)}</h1><p class="hero-lead">${esc(section.subtitle || "")}</p><div class="actions"><a class="btn primary" data-route-link href="${ctx.pageHref("index")}#konten">${esc(section.primaryCta || "Lihat penawaran")}</a>${secondary}</div>${section.note ? `<p class="hero-note">${esc(section.note)}</p>` : ""}</div>
      <div class="hero-visual-wrap" data-layout-span-mobile="4" data-layout-span-tablet="6" data-layout-span="5">${heroVisual(section.visual, ctx.name)}</div>
    </div>`, "hero", ctx);
  }
  if (t === "logos") {
    const items = (section.items || []).map(i => `<span>${esc(typeof i === "string" ? i : i.title || i.name || "")}</span>`).join("");
    return sectionFrame(section, index, `<div class="focus-row"><p class="focus-label">${esc(section.title || "Fokus utama")}</p><div>${items}</div></div>`, "focus", ctx);
  }
  if (t === "features") {
    const items = section.items || [];
    const cards = items.map(i => `<article class="feature-card" ${gridSpans(items.length)}><span class="feature-index">${esc(i.meta || "•")}</span><span class="feature-icon">${icon(i.icon)}</span><h3>${esc(i.title)}</h3><p>${esc(i.body)}</p></article>`).join("");
    return sectionFrame(section, index, `${sectionHead(section, "Fitur", ctx)}<div class="feature-grid" data-layout-grid>${cards}</div>`, "features", ctx);
  }
  if (t === "cards" || t === "showcase") {
    const items = section.items || [];
    const cards = items.map((i, n) => `<article class="showcase-card show-${n % 3}" ${gridSpans(items.length)}><div class="show-media visual-${esc(i.visual || ["board","flow","list"][n % 3])}"><span>${esc(i.meta || String(n + 1).padStart(2,"0"))}</span><i></i><i></i><i></i></div><div class="show-copy"><h3>${esc(i.title)}</h3><p>${esc(i.body)}</p></div></article>`).join("");
    return sectionFrame(section, index, `${sectionHead(section, t === "cards" ? "Pilihan" : "Tampilan", ctx)}<div class="showcase-grid" data-layout-grid>${cards}</div>`, "showcase", ctx);
  }
  if (t === "steps") {
    const items = (section.items || []).map((i, n) => `<li data-layout-span-mobile="4" data-layout-span-tablet="8" data-layout-span="12"><span class="step-index">${esc(i.meta || String(n + 1).padStart(2, "0"))}</span><div><h3>${esc(i.title)}</h3><p>${esc(i.body)}</p></div></li>`).join("");
    return sectionFrame(section, index, `${sectionHead(section, "Alur", ctx)}<ol class="step-list" data-layout-grid>${items}</ol>`, "steps", ctx);
  }
  if (t === "stats") {
    const entries = section.items || [];
    const items = entries.map(i => `<div class="stat-item" ${gridSpans(entries.length)}><strong>${esc(i.value)}</strong><span>${esc(i.label)}</span></div>`).join("");
    return sectionFrame(section, index, `${sectionHead(section, "Ringkasan", ctx)}<div class="stat-rail" data-layout-grid>${items}</div>`, "stats", ctx);
  }
  if (t === "pricing") {
    const plans = section.plans || [];
    const cards = plans.map(p => `<article class="plan${p.featured ? " featured" : ""}" ${gridSpans(plans.length)}><p class="plan-name">${esc(p.name)}</p><strong>${esc(p.price)}</strong><ul>${(p.features || []).map(f => `<li>${esc(f)}</li>`).join("")}</ul><span class="btn ${p.featured ? "primary" : "ghost"}">${esc(p.cta || "Pilih")}</span></article>`).join("");
    return sectionFrame(section, index, `${sectionHead(section, "Harga", ctx)}<div class="plan-grid" data-layout-grid>${cards}</div>`, "pricing", ctx);
  }
  if (t === "testimonial") {
    return sectionFrame(section, index, `<figure class="quote"><span class="quote-mark">“</span><blockquote>${esc(section.quote)}</blockquote><figcaption><b>${esc(section.author || "")}</b>${section.role ? `<span>${esc(section.role)}</span>` : ""}</figcaption></figure>`, "testimonial", ctx);
  }
  if (t === "faq") {
    const items = (section.items || []).map(i => `<details><summary>${esc(i.q)}</summary><p>${esc(i.a)}</p></details>`).join("");
    return sectionFrame(section, index, `${sectionHead(section, "Tanya jawab", ctx)}<div class="faq-list">${items}</div>`, "faq", ctx);
  }
  if (t === "cta") {
    return sectionFrame(section, index, `<div class="cta-panel"><div><p class="section-kicker">${esc(section.eyebrow || "Langkah berikutnya")}</p><h2>${esc(section.title)}</h2><p>${esc(section.body || "")}</p></div><div class="cta-action"><a class="btn primary" data-route-link href="${ctx.pageHref("index")}#konten">${esc(section.button || "Mulai sekarang")}</a>${section.note ? `<small>${esc(section.note)}</small>` : ""}</div></div>`, "cta", ctx);
  }
  if (t === "form") {
    return sectionFrame(section, index, `${sectionHead(section, "Kontak", ctx)}<form class="contact-form" onsubmit="event.preventDefault();this.querySelector('.form-status').textContent='Terima kasih. Pesanmu sudah tercatat.'"><label>Nama<input required placeholder="Nama lengkap" aria-label="Nama"></label><label>Email<input required type="email" placeholder="nama@email.com" aria-label="Email"></label><label class="wide">Pesan<textarea required rows="4" placeholder="Ceritakan kebutuhanmu" aria-label="Pesan"></textarea></label><div class="form-actions"><button class="btn primary" type="submit">${esc(section.button || "Kirim")}</button><span class="form-status" role="status"></span></div></form>`, "form", ctx);
  }
  if (t === "text") {
    return sectionFrame(section, index, `${sectionHead(section, "Catatan", ctx)}<p class="prose">${esc(section.body)}</p>`, "text", ctx);
  }
  if (t === "gallery") {
    const items = section.items || [];
    const tiles = items.map((i, n) => `<figure class="tile tile-${n % 4}" ${gridSpans(items.length)}><span>${esc(i.caption || "")}</span></figure>`).join("");
    return sectionFrame(section, index, `${sectionHead(section, "Galeri", ctx)}<div class="gallery-grid" data-layout-grid>${tiles}</div>`, "gallery", ctx);
  }
  if (t === "reference") {
    return sectionFrame(section, index, `<figure class="reference"><img src="${esc(section.image)}" alt="${esc(section.title || "Referensi layout")}" loading="lazy"><figcaption><b>${esc(section.title || "Referensi layout")}</b><span>${esc(section.body || "")}</span></figcaption></figure>`, "reference", ctx);
  }
  if (t === "footer") {
    return `<footer class="site-footer" data-node-id="${esc(`${ctx.slug || "index"}-footer`)}"><div class="footer-brand"><b>${esc(ctx.name)}</b><span>${esc(section.text || "")}</span></div><nav class="footer-links">${ctx.links}</nav><span class="footer-meta">DESAIN + SISTEM · ${new Date().getFullYear()}</span></footer>`;
  }
  return "";
}

const baseCss = `
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--body);line-height:1.55;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}button,input,textarea{font:inherit}img{max-width:100%}
.dp-shell{min-width:0}.section-inner,.hero-visual-wrap{min-width:0;width:100%}
.site-header{position:sticky;top:0;z-index:20;background:var(--paper);border-bottom:1px solid var(--line)}
.site-nav{height:72px;display:flex;align-items:center;justify-content:space-between;gap:24px}
.brand{font-family:var(--display);font-weight:700;font-size:20px;letter-spacing:-.04em}.brand span{color:var(--accent)}
.nav-links{display:flex;align-items:center;gap:22px;font-size:13px;color:var(--muted);overflow:hidden}.nav-links a:hover,.nav-links a.active{color:var(--accent)}
.site-main{display:block}.section{padding-block:var(--dpai-layout-section-gap,var(--section-gap));border-bottom:1px solid var(--line)}.section:first-child{border-top:0}
.section-head{max-width:760px;margin-bottom:calc(var(--item-gap) * 1.6)}.section-kicker{margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);display:flex;align-items:center;gap:10px}.section-kicker::before{content:"";width:24px;height:1px;background:currentColor}
h1,h2,h3,p,blockquote,figure{margin-top:0}h1{font-family:var(--display);font-size:clamp(40px,6.4vw,78px);line-height:1.02;letter-spacing:-.05em;margin-bottom:20px}h2{font-family:var(--display);font-size:clamp(28px,4vw,46px);line-height:1.1;letter-spacing:-.04em;margin-bottom:12px}h3{font-family:var(--display);font-size:18px;line-height:1.3;margin-bottom:8px}
.section-sub,.hero-lead{color:var(--muted);font-size:16px;max-width:62ch}.section-source{display:block;margin-top:12px;font-size:12px;color:var(--muted);opacity:.75}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 22px;border:1px solid transparent;border-radius:var(--radius);font-size:14px;font-weight:650;cursor:pointer;transition:transform .15s,background .15s,border-color .15s}.btn:hover{transform:translateY(-1px)}.btn:focus-visible{outline:3px solid var(--accent);outline-offset:2px}.btn.primary{background:var(--accent);color:#fff}.btn.ghost{background:var(--surface);border-color:var(--line);color:var(--ink)}
.actions,.cta-action{display:flex;gap:12px;flex-wrap:wrap;align-items:center}.hero-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:calc(var(--gutter) * 1.5);align-items:center}.hero-copy{max-width:720px}.hero-eyebrow{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:18px}.hero-note{margin:18px 0 0;font-size:12px;color:var(--muted)}
.hero-visual{min-height:380px;border:1px solid var(--line);border-radius:var(--radius);background:var(--surface);overflow:hidden;position:relative}
.visual-board{display:grid;grid-template-columns:76px 1fr;height:100%;min-height:380px}.visual-side{background:var(--ink);padding:22px 12px;display:grid;gap:14px;align-content:start}.visual-side span{height:8px;background:rgba(255,255,255,.22);border-radius:2px}.visual-side span:first-child{width:60%;background:var(--accent)}
.visual-main{padding:20px;display:grid;gap:18px;align-content:start}.visual-top{display:flex;justify-content:space-between;align-items:center;font-size:13px}.visual-top i{width:34px;height:8px;border-radius:4px;background:var(--line)}
.visual-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.visual-metrics span{border:1px solid var(--line);border-radius:6px;padding:10px;display:grid;gap:4px}.visual-metrics small{font-size:9px;text-transform:uppercase;color:var(--muted)}.visual-metrics b{font-size:22px;font-family:var(--display)}
.visual-table{display:grid;gap:8px}.visual-table span{display:grid;grid-template-columns:1.4fr .8fr .5fr;gap:8px;padding:9px 0;border-top:1px solid var(--line)}.visual-table i{height:6px;background:var(--line);border-radius:3px}.visual-table i:first-child{background:var(--accent);opacity:.35}
.visual-calendar{padding:24px}.cal-head{display:flex;justify-content:space-between;align-items:end;border-bottom:1px solid var(--line);padding-bottom:14px;margin-bottom:14px}.cal-head b{font-family:var(--display);font-size:22px}.cal-head span{font-size:11px;color:var(--muted)}.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}.cal-grid span{aspect-ratio:1;display:grid;place-items:center;border:1px solid var(--line);border-radius:5px;font-size:10px}.cal-grid span:nth-child(10),.cal-grid span:nth-child(17){background:var(--accent);color:#fff;border-color:var(--accent)}.cal-grid .off{background:transparent;border-color:transparent}.cal-foot{margin-top:14px;font-size:10px;color:var(--muted)}
.visual-product{padding:28px;display:grid;align-content:space-between;height:100%;min-height:380px}.visual-tag{font-size:10px;letter-spacing:.14em;color:var(--accent);font-weight:700}.visual-shape{display:grid;gap:8px;margin:auto 0}.visual-shape i{display:block;height:48px;border:1px solid var(--line);border-radius:8px;background:var(--paper)}.visual-shape i:nth-child(2){width:72%;margin-left:auto;background:var(--accent);opacity:.16}.visual-product p{font-family:var(--display);font-size:26px;margin:0}.visual-product small{color:var(--muted);font-size:11px}
.visual-quiet{padding:32px;display:grid;align-content:space-between;height:100%;min-height:380px}.visual-quiet span{font-family:var(--display);font-size:74px;line-height:1;color:var(--accent);opacity:.25}.visual-quiet p{font-family:var(--display);font-size:24px;margin:0}.visual-quiet i{height:2px;background:var(--line);display:block;width:70%}
.focus-row{display:grid;grid-template-columns:220px 1fr;gap:32px;align-items:center;padding-block:24px;border-block:1px solid var(--line)}.focus-label{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin:0}.focus-row>div{display:flex;flex-wrap:wrap;gap:12px}.focus-row>div span{border:1px solid var(--line);border-radius:999px;padding:8px 14px;font-size:13px;color:var(--muted);background:var(--surface)}
.feature-grid,.showcase-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--item-gap)}.feature-card{border:1px solid var(--line);border-radius:var(--radius);background:var(--surface);padding:24px;display:grid;align-content:start;gap:10px}.feature-index{font-size:11px;letter-spacing:.12em;color:var(--accent);font-weight:700}.feature-icon{width:36px;height:36px;display:grid;place-items:center;border-radius:calc(var(--radius) * .7);background:var(--paper);color:var(--accent)}.feature-card p,.show-copy p{color:var(--muted);font-size:14px;margin:0}
.showcase-card{border:1px solid var(--line);border-radius:var(--radius);background:var(--surface);overflow:hidden}.show-media{height:180px;padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:8px;align-content:end;background:var(--paper);border-bottom:1px solid var(--line);position:relative}.show-media>span{position:absolute;top:14px;left:16px;font-size:10px;letter-spacing:.14em;color:var(--accent);font-weight:700}.show-media i{height:34px;background:var(--line);border-radius:5px}.show-media i:first-of-type{background:var(--accent);opacity:.2}.show-copy{padding:20px}.show-copy h3{margin-bottom:6px}
.step-list{list-style:none;padding:0;margin:0;display:grid;gap:var(--item-gap)}.step-list li{display:grid;grid-template-columns:64px 1fr;gap:20px;padding-block:20px;border-top:1px solid var(--line)}.step-index{font-family:var(--display);font-size:28px;color:var(--accent)}.step-list p{color:var(--muted);margin:0}
.stat-rail{display:grid;grid-template-columns:repeat(3,1fr);border-block:1px solid var(--line)}.stat-item{padding:28px 22px;border-right:1px solid var(--line)}.stat-item:last-child{border-right:0}.stat-item strong{display:block;font-family:var(--display);font-size:36px;line-height:1.1;margin-bottom:8px}.stat-item span{font-size:12px;color:var(--muted)}
.plan-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:var(--item-gap)}.plan{border:1px solid var(--line);border-radius:var(--radius);background:var(--surface);padding:26px;display:flex;flex-direction:column;gap:14px}.plan-name{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin:0}.plan strong{font-family:var(--display);font-size:32px}.plan ul{padding-left:18px;color:var(--muted);font-size:14px;margin:0;flex:1}.plan .btn{width:100%}.plan.featured{border-color:var(--accent)}
.quote{max-width:820px;margin-inline:auto;text-align:center}.quote-mark{font-family:var(--display);font-size:64px;line-height:.6;color:var(--accent);display:block;margin-bottom:20px}.quote blockquote{font-family:var(--display);font-size:clamp(24px,3.2vw,36px);line-height:1.25;letter-spacing:-.03em}.quote figcaption{display:grid;gap:2px;font-size:13px;color:var(--muted)}
.faq-list{border-top:1px solid var(--line)}.faq-list details{border-bottom:1px solid var(--line);padding:18px 0}.faq-list summary{cursor:pointer;font-weight:650}.faq-list p{color:var(--muted);margin:12px 0 0}
.cta-panel{border:1px solid var(--line);border-radius:var(--radius);background:var(--surface);padding:clamp(28px,5vw,56px);display:grid;grid-template-columns:1.4fr .6fr;gap:28px;align-items:end}.cta-panel p:not(.section-kicker){color:var(--muted);margin:0}.cta-panel small{display:block;margin-top:10px;color:var(--muted);font-size:11px}
.contact-form{max-width:620px;display:grid;grid-template-columns:1fr 1fr;gap:14px}.contact-form label{display:grid;gap:6px;font-size:12px;color:var(--muted);font-weight:650}.contact-form label.wide{grid-column:1/-1}.contact-form input,.contact-form textarea{width:100%;padding:12px 14px;border:1px solid var(--line);border-radius:var(--radius);background:var(--surface);color:var(--ink)}.form-actions{grid-column:1/-1;display:flex;align-items:center;gap:14px}.form-status{font-size:13px;color:var(--accent)}
.prose{max-width:74ch;font-size:16px;color:var(--muted)}
.gallery-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:var(--item-gap)}.tile{min-height:200px;border:1px solid var(--line);border-radius:var(--radius);background:var(--surface);display:flex;align-items:flex-end;padding:16px;color:var(--muted)}.tile span{font-size:12px}.tile-0{background:var(--paper)}.tile-1{background:var(--surface)}.tile-2{background:var(--accent);opacity:.12}.tile-3{background:var(--paper)}
.reference{max-width:900px;margin-inline:auto;border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;background:var(--surface)}.reference img{width:100%;display:block}.reference figcaption{padding:18px;display:grid;gap:4px}.reference span{font-size:13px;color:var(--muted)}
.site-footer{display:grid;grid-template-columns:1.4fr 1fr auto;gap:24px;align-items:start;padding:36px 0;background:var(--ink);color:var(--paper)}.site-footer b{font-family:var(--display);font-size:18px}.site-footer span,.site-footer a{color:rgba(255,255,255,.7);font-size:12px}.footer-brand{display:grid;gap:6px}.footer-links{display:flex;flex-wrap:wrap;gap:14px}.footer-meta{text-align:right;font-size:10px!important;letter-spacing:.12em}
@media(max-width:900px){.hero-grid,.cta-panel,.focus-row{grid-template-columns:1fr}.feature-grid,.showcase-grid,.gallery-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.site-footer{grid-template-columns:1fr}.footer-meta{text-align:left}.nav-links{display:none}.hero-visual{min-height:300px}.visual-board,.visual-product,.visual-quiet{min-height:300px}}
@media(max-width:620px){:root{--pad:var(--mobile-pad);--section-gap:64px}.feature-grid,.showcase-grid,.gallery-grid,.stat-rail{grid-template-columns:1fr}.stat-item{border-right:0;border-bottom:1px solid var(--line)}.stat-item:last-child{border-bottom:0}.contact-form{grid-template-columns:1fr}.hero-grid{gap:28px}.visual-board{grid-template-columns:52px 1fr}.site-nav{height:64px}}
`;

const presetCss = {
  editorial: `
.dp-preset-editorial{--display:'Newsreader Variable',Georgia,serif;--body:'Inter Variable',Inter,sans-serif}
.dp-preset-editorial .hero{padding-top:calc(var(--section-gap) * .9)}
.dp-preset-editorial .hero-copy h1{max-width:16ch}
.dp-preset-editorial .section-head{display:grid;grid-template-columns:180px 1fr;gap:0 32px;align-items:start;max-width:none}
.dp-preset-editorial .section-kicker{grid-row:1/3;margin:0;padding-top:8px}
.dp-preset-editorial .section-head h2{max-width:20ch}
.dp-preset-editorial .section-sub{grid-column:2}
.dp-preset-editorial .visual-quiet{border-radius:0}
.dp-preset-editorial .feature-card,.dp-preset-editorial .plan,.dp-preset-editorial .cta-panel{border-radius:0}
@media(max-width:900px){.dp-preset-editorial .section-head{display:block}.dp-preset-editorial .section-kicker{margin-bottom:14px}}
`,
  finance: `
.dp-preset-finance{--display:'Inter Tight Variable',Inter,sans-serif;--body:'Inter Variable',Inter,sans-serif;--radius:0}
.dp-preset-finance .site-nav{height:64px}.dp-preset-finance .nav-links{font-size:12px}
.dp-preset-finance .hero-grid{grid-template-columns:1fr 1fr;gap:36px}
.dp-preset-finance .hero-eyebrow,.dp-preset-finance .section-kicker{font-family:ui-monospace,monospace;letter-spacing:.1em}
.dp-preset-finance .hero-lead{max-width:52ch}
.dp-preset-finance .stat-rail{border-top:3px solid var(--ink)}
.dp-preset-finance .stat-item strong{letter-spacing:-.05em}
.dp-preset-finance .plan.featured{background:var(--ink);color:#fff;border-color:var(--ink)}
.dp-preset-finance .plan.featured .btn.primary{background:var(--accent);color:#111}
.dp-preset-finance .feature-index{font-family:ui-monospace,monospace}
.dp-preset-finance .focus-row{border-radius:0}
.dp-preset-finance .show-media i:first-of-type{opacity:.5}
`,
  command: `
.dp-preset-command{--display:'Geist Mono Variable',ui-monospace,monospace;--body:'Inter Variable',Inter,sans-serif;--radius:8px}
.dp-preset-command .site-header,.dp-preset-command .hero-visual,.dp-preset-command .feature-card,.dp-preset-command .showcase-card,.dp-preset-command .plan,.dp-preset-command .cta-panel{background:var(--surface)}
.dp-preset-command .hero-eyebrow::before{content:"> ";color:var(--accent)}
.dp-preset-command .section-kicker{font-family:ui-monospace,monospace;letter-spacing:.1em}
.dp-preset-command h1,.dp-preset-command h2,.dp-preset-command h3{letter-spacing:-.035em}
.dp-preset-command .visual-main{font-family:ui-monospace,monospace}
.dp-preset-command .feature-card{border-style:dashed}.dp-preset-command .feature-icon{background:var(--paper)}
.dp-preset-command .show-media{background:var(--ink)}.dp-preset-command .show-media i{opacity:.35}
.dp-preset-command .plan.featured{box-shadow:inset 0 0 0 2px var(--accent)}
.dp-preset-command .site-footer{background:#0a0a0a}
`,
  schedule: `
.dp-preset-schedule{--display:'Cal Sans UI','Inter Tight Variable',sans-serif;--body:'Inter Variable',Inter,sans-serif}
.dp-preset-schedule .hero-grid{grid-template-columns:1.05fr .95fr}
.dp-preset-schedule .hero-visual{border-radius:calc(var(--radius) * 1.6)}
.dp-preset-schedule .step-list li{border:1px solid var(--line);border-radius:var(--radius);padding:20px;background:var(--surface)}
.dp-preset-schedule .feature-card{border-radius:calc(var(--radius) * 1.3)}
.dp-preset-schedule .cal-grid span{border-radius:8px}
.dp-preset-schedule .plan.featured{box-shadow:0 14px 40px rgba(47,111,237,.12)}
.dp-preset-schedule .cta-panel{background:var(--accent);color:#fff;border-color:var(--accent)}
.dp-preset-schedule .cta-panel p:not(.section-kicker),.dp-preset-schedule .cta-panel .section-kicker{color:rgba(255,255,255,.85)}
.dp-preset-schedule .cta-panel .btn.primary{background:#fff;color:var(--accent)}
`,
  brutal: `
.dp-preset-brutal{--display:'Archivo Black','Inter Tight Variable',sans-serif;--body:'Inter Variable',Inter,sans-serif;--radius:0}
.dp-preset-brutal .section-kicker{letter-spacing:.18em;text-transform:uppercase}
.dp-preset-brutal h1,.dp-preset-brutal h2,.dp-preset-brutal .plan-name{text-transform:uppercase;letter-spacing:-.04em}
.dp-preset-brutal .btn,.dp-preset-brutal .feature-card,.dp-preset-brutal .showcase-card,.dp-preset-brutal .plan,.dp-preset-brutal .cta-panel,.dp-preset-brutal .focus-row>div span{border:2px solid var(--ink);box-shadow:6px 6px 0 var(--ink)}
.dp-preset-brutal .btn.primary{color:#111;text-shadow:none}
.dp-preset-brutal .hero-visual{border:2px solid var(--ink);box-shadow:8px 8px 0 var(--ink)}
.dp-preset-brutal .feature-card:hover,.dp-preset-brutal .showcase-card:hover{transform:translate(-2px,-2px);box-shadow:8px 8px 0 var(--ink)}
.dp-preset-brutal .stat-item{border-right:2px solid var(--ink)}
.dp-preset-brutal .site-footer{border-top:4px solid var(--ink)}
`,
  catalog: `
.dp-preset-catalog{--display:'Newsreader Variable',Georgia,serif;--body:'Inter Variable',Inter,sans-serif}
.dp-preset-catalog .hero-grid{grid-template-columns:.9fr 1.1fr;gap:48px}
.dp-preset-catalog .visual-product{border-radius:2px;background:var(--paper)}
.dp-preset-catalog .showcase-grid{grid-template-columns:1.2fr .8fr 1fr}
.dp-preset-catalog .show-media{height:220px}
.dp-preset-catalog .gallery-grid{grid-template-columns:2fr 1fr 1fr}.dp-preset-catalog .gallery-grid .tile:first-child{grid-row:span 2}
.dp-preset-catalog .quote{border-top:1px solid var(--ink);border-bottom:1px solid var(--ink);padding-block:36px}
.dp-preset-catalog .focus-row{border-top:2px solid var(--ink)}
@media(max-width:900px){.dp-preset-catalog .showcase-grid,.dp-preset-catalog .gallery-grid{grid-template-columns:1fr 1fr}}
`,
  dashboard: `
.dp-preset-dashboard{--display:'Inter Tight Variable',Inter,sans-serif;--body:'Inter Variable',Inter,sans-serif;--section-gap:64px}
.dp-preset-dashboard .site-nav{height:60px}.dp-preset-dashboard .nav-links{font-size:12px}
.dp-preset-dashboard .hero-grid{grid-template-columns:.85fr 1.15fr;gap:24px}
.dp-preset-dashboard .hero-visual{min-height:420px;border-radius:10px}
.dp-preset-dashboard .visual-board{grid-template-columns:90px 1fr;min-height:420px}
.dp-preset-dashboard h1{font-size:clamp(36px,5vw,64px)}
.dp-preset-dashboard .feature-grid{grid-template-columns:repeat(3,1fr)}
.dp-preset-dashboard .feature-card{padding:18px;gap:6px}.dp-preset-dashboard .feature-card h3{font-size:15px}.dp-preset-dashboard .feature-card p{font-size:13px}
.dp-preset-dashboard .stat-item{padding:20px 16px}.dp-preset-dashboard .stat-item strong{font-size:28px}
.dp-preset-dashboard .step-list li{grid-template-columns:48px 1fr;padding-block:14px}
.dp-preset-dashboard .site-footer{padding-block:26px}
`
};

// Local implementation of the layout geometry observed in the reference
// bundle: container-scoped columns with mobile/tablet/desktop spans.
const layoutCss = layout => {
  const columns = layout.columns || { mobile: 4, tablet: 8, desktop: 12 };
  const bp = layout.breakpoints || { tablet: 640, desktop: 1024 };
  const spanRules = (attr, max) => Array.from({ length: 12 }, (_, i) =>
    `[data-layout-grid]>[${attr}="${i + 1}"]{--dpai-layout-span:${Math.min(max, i + 1)}}`).join("");
  return `
[data-layout-system]{--dpai-layout-max:${safeCss(layout.contentMax, "1200px")};--dpai-layout-padding:${safeCss(layout.padding, "24px")};--dpai-layout-gutter:${safeCss(layout.gutter, "24px")};--dpai-layout-section-gap:${safeCss(layout.sectionGap, "32px")};--dpai-layout-item-gap:${safeCss(layout.itemGap, "12px")};--dpai-layout-columns:${columns.mobile};min-width:0}
[data-layout-container]{box-sizing:border-box;width:100%;max-width:var(--dpai-layout-max);margin-inline:auto;padding:var(--dpai-layout-padding);min-width:0;container:dpai-layout / inline-size}
[data-layout-stack]{display:flex;flex-direction:column;gap:var(--dpai-layout-section-gap);min-width:0}
[data-layout-stack].site-main{gap:0}
[data-layout-cluster]{display:flex;flex-wrap:wrap;align-items:center;gap:var(--dpai-layout-item-gap);min-width:0}
[data-layout-grid]{display:grid;grid-template-columns:repeat(var(--dpai-layout-columns),minmax(0,1fr));gap:var(--dpai-layout-gutter);min-width:0}
[data-layout-grid]>*{min-width:0;grid-column:span var(--dpai-layout-span,12)}
${spanRules("data-layout-span-mobile", columns.mobile)}
@container dpai-layout (min-width:${bp.tablet}px){[data-layout-grid]{--dpai-layout-columns:${columns.tablet}}${spanRules("data-layout-span-tablet", columns.tablet)}}
@container dpai-layout (min-width:${bp.desktop}px){[data-layout-grid]{--dpai-layout-columns:${columns.desktop}}${spanRules("data-layout-span", columns.desktop)}}
@media(max-width:${bp.tablet - 1}px){[data-layout-system]{--dpai-layout-padding:${safeCss(layout.mobilePadding, "16px")}}}
`;
};

const patternCss = {
  aurora: `
[data-page-content] .hero{background:var(--ink);color:var(--paper);border-bottom-color:var(--line)}
[data-page-content] .hero .hero-lead,[data-page-content] .hero .hero-note{color:rgba(255,255,255,.72)}
[data-page-content] .hero .btn.ghost{background:transparent;border-color:rgba(255,255,255,.35);color:var(--paper)}
[data-page-content] .hero-visual{border-color:rgba(255,255,255,.18)}
`,
  neobrutal: `
[data-page-content] .section-kicker::before{width:32px;height:5px}
[data-page-content] .hero .btn.primary{color:#111}
[data-page-content] .focus-row>div span{border-width:2px;box-shadow:3px 3px 0 var(--ink)}
`,
  terminal: `
[data-page-content] .hero-eyebrow::before{content:"> ";color:var(--accent)}
[data-page-content] .section-kicker{font-family:ui-monospace,monospace;letter-spacing:.1em}
[data-page-content] .show-media{border-top:3px solid var(--accent)}
`,
  "grid-editorial": `
[data-page-content] .hero{border-top:3px solid var(--ink)}
[data-page-content] .section-head h2{max-width:24ch}
`,
  sunlit: `
[data-page-content] .hero-visual{border-radius:calc(var(--radius) + 12px)}
[data-page-content] .show-media,[data-page-content] .tile{border-radius:calc(var(--radius) + 8px)}
`,
  utility: `
[data-page-content] .section-kicker{font-family:ui-monospace,monospace;letter-spacing:.12em}
[data-page-content] .show-media{background:var(--surface);height:150px}
[data-page-content] .feature-card{padding:18px}
`,
  editorial: "", finance: "", schedule: "", dashboard: ""
};

export function renderProjectHtml(project, options = {}) {
  const model = project.model || {};
  const theme = model.theme || {};
  const active = options.activeSlug || "index";
  const design = normalizeDesign(model.design, { preset: detectPreset({ prompt: model.prompt || project.prompt, look: model.look || project.look, platform: model.platform || project.platform }) });
  const preset = DESIGN_PRESETS[design.preset] ? design.preset : "editorial";
  const presetDef = DESIGN_PRESETS[preset];
  const pattern = DESIGN_PATTERNS[design.pattern] ? design.pattern : (PRESET_PATTERN[preset] || "grid-editorial");
  const layout = design.layout;
  const basePath = options.basePath || (project.published_slug ? `/sites/${encodeURIComponent(project.published_slug)}` : "");
  const pageHref = slug => {
    if (!basePath) return `#${slug}`;
    if (basePath.includes("?")) return `${basePath}&page=${encodeURIComponent(slug)}`;
    if (basePath.startsWith("/api/")) return `${basePath}?page=${encodeURIComponent(slug)}`;
    return `${basePath}${slug === "index" ? "" : "/" + slug}`;
  };
  const pages = model.pages || [];
  const page = pages.find(p => p.slug === active) || pages[0];
  const secondaryPage = pages.find(p => p.slug === "tentang") || pages.find(p => p.slug !== "index");
  const secondaryHref = secondaryPage ? pageHref(secondaryPage.slug) : "#konten";
  const links = pages.map(p => `<a data-route-link class="${p.slug === active ? "active" : ""}" href="${pageHref(p.slug)}">${esc(p.title)}</a>`).join("");
  const ctx = {
    name: model.name || project.name || "Project",
    slug: page?.slug || active,
    pageHref,
    secondaryHref,
    links,
    rationale: design.rationale
  };
  const body = (page?.sections || []).map((s, i) => sectionHtml(s, ctx, i)).join("");
  const vars = `
    --accent:${safeCss(theme.accent, "#7438d0")};--ink:${safeCss(theme.ink, "#241b32")};--muted:${safeCss(theme.muted, "#71647e")};
    --paper:${safeCss(theme.paper, "#f8f6fc")};--surface:${safeCss(theme.surface, "#ffffff")};--line:${safeCss(theme.line, "#e3ddeb")};
    --radius:${Number(theme.radius) || 0}px;--space:${Number(theme.spacing) || 16}px;
    --display:${safeCss(theme.font, presetDef.theme.font)};--body:${safeCss(theme.fontBody, presetDef.theme.fontBody)};
    --content-max:${safeCss(layout.contentMax, "1180px")};--pad:${safeCss(layout.padding, "56px")};--mobile-pad:${safeCss(layout.mobilePadding, "20px")};
    --gutter:${safeCss(layout.gutter, "32px")};--section-gap:${safeCss(layout.sectionGap, "96px")};--item-gap:${safeCss(layout.itemGap, "24px")};--columns:${Number(layout.columns?.mobile) || 4};`;
  const css = baseCss + (presetCss[preset] || "") + layoutCss(layout) + (patternCss[pattern] || "");
  return `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(page?.title || project.name)} — ${esc(ctx.name)}</title><meta name="description" content="${esc(model.tagline || project.prompt || "")}"><style>:root{${vars}}${css}</style></head><body class="dp-site dp-preset-${preset} dp-pattern-${pattern}" data-preset="${preset}" data-pattern="${pattern}" data-design-source="${esc(design.source || "brief")}">
  <div class="dp-shell" data-layout-system data-layout-container>
    <header class="site-header"><div class="site-nav" data-layout-cluster><a class="brand" data-route-link href="${pageHref("index")}">${esc(ctx.name)}</a><nav class="nav-links" aria-label="Navigasi halaman">${links}</nav><a class="btn ghost" data-route-link href="${secondaryHref}">Tentang</a></div></header>
    <main class="site-main" id="konten" data-layout-stack data-page-content="${esc(page?.slug || "index")}">${body}</main>
  </div>
  ${options.includeMeta ? `<script type="application/json" id="design-md">${JSON.stringify(designMarkdown(project)).replace(/</g, "\\u003c")}</script>` : ""}
</body></html>`;
}

export function renderPreviewHtml(project, activeSlug, projectId) {
  return renderProjectHtml(project, {
    activeSlug,
    includeMeta: false,
    basePath: projectId ? `/api/projects/${encodeURIComponent(projectId)}/prototype/preview` : ""
  });
}
