import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { marketingHtml } from "./marketing.js";
import HeroComposer from "./HeroComposer.jsx";
import { get, post } from "./api.js";

const TITLES = {
  home: "DesainPakeAI — Rancang UI dan alur bersama coding agent",
  pricing: "Harga - DesainPakeAI",
  galeri: "Galeri - DesainPakeAI",
  updates: "Update - DesainPakeAI",
  templates: "Template - DesainPakeAI"
};

const FILTER_CATEGORY = {
  "Semua industri": "",
  "SaaS": "saas",
  "Travel": "travel",
  "Booking & reservasi": "booking",
  "Undangan pernikahan": "wedding"
};

let catalogPromise;
function loadCatalog() {
  if (!catalogPromise) catalogPromise = get("/api/templates").then(d => d.templates || []).catch(() => []);
  return catalogPromise;
}

export default function Marketing({ route }) {
  const ref = useRef(null);
  const [checkoutNote, setCheckoutNote] = useState("");

  useEffect(() => {
    document.title = TITLES[route] || "DesainPakeAI";
    const root = ref.current;
    if (!root) return;
    const cleanups = [];
    let cancelled = false;
    const listen = (el, event, handler) => {
      el.addEventListener(event, handler);
      cleanups.push(() => el.removeEventListener(event, handler));
    };

    // Home has a dedicated mount point. The captured templates page contains a
    // static composer copy, so replace that dead markup with the real component.
    let mount = root.querySelector("#hero-composer-root");
    if (!mount && route === "templates") {
      const shell = root.querySelector("#landing-hero-prompt")?.closest("form")?.parentElement;
      if (shell) {
        shell.innerHTML = '<div id="hero-composer-root" class="mx-auto w-full max-w-[48rem]"></div>';
        mount = shell.querySelector("#hero-composer-root");
      }
    }
    if (mount) {
      const reactRoot = createRoot(mount);
      reactRoot.render(<HeroComposer />);
      cleanups.push(() => reactRoot.unmount());
    }

    if (route === "home") {
      get("/api/landing-stats").then(({ users, designs }) => {
        if (cancelled) return;
        const defs = root.querySelectorAll("dl[aria-label='Statistik terkini'] dd");
        const fmt = n => new Intl.NumberFormat("id-ID").format(n);
        if (defs[0]) defs[0].textContent = fmt(users);
        if (defs[1]) defs[1].textContent = fmt(designs);
        const sr = root.querySelector("span[sr-only], .sr-only[aria-live]");
        if (sr) sr.textContent = `${fmt(users)} pengguna dan ${fmt(designs)} total desain.`;
      }).catch(() => {});
    }

    if (route === "galeri") {
      get("/api/gallery").then(({ sites }) => {
        if (cancelled) return;
        const container = Array.from(root.querySelectorAll("div")).find(d => d.textContent === "Memuat galeri…");
        if (!container) return;
        container.textContent = "";
        if (!sites.length) {
          container.innerHTML = '<p class="text-dpai-body-sm text-dpai-muted">Belum ada situs yang ditampilkan di galeri. Publish situsmu dan nyalakan “Tampilkan di galeri”.</p>';
          return;
        }
        for (const site of sites) {
          const a = document.createElement("a");
          a.href = site.url;
          a.className = "group block overflow-hidden rounded-dpai-surface border border-dpai-line bg-white shadow-dpai-popover transition-transform hover:-translate-y-1";
          a.innerHTML = `<div class="grid h-36 place-items-center bg-dpai-desk font-display text-xl font-semibold text-dpai-violet-dark">${site.title}</div><div class="p-4 text-dpai-body-sm font-medium">${site.title}</div>`;
          container.appendChild(a);
        }
      }).catch(() => {});
    }

    // Mobile navigation toggle
    const menuButton = root.querySelector("button[aria-label='Buka menu']");
    if (menuButton) {
      listen(menuButton, "click", () => {
        let panel = root.querySelector("#marketing-mobile-menu");
        if (!panel) {
          panel = document.createElement("div");
          panel.id = "marketing-mobile-menu";
          panel.className = "dp-mobile-menu";
          panel.innerHTML = `<a href="/#capabilities">Fitur</a><a href="/pricing">Harga</a><a href="/galeri">Galeri</a><a href="/updates">Update</a><a href="/projects">Project</a><a href="/projects">Workspace</a>`;
          root.querySelector("header").after(panel);
        }
        const open = panel.classList.toggle("open");
        menuButton.setAttribute("aria-expanded", String(open));
      });
    }

    async function useTemplate(id, title, button) {
      const original = button?.innerHTML;
      if (button) { button.disabled = true; button.innerHTML = "Membuka…"; }
      try {
        const { project } = await post(`/api/templates/${encodeURIComponent(id)}/use`, { prompt: `Buat website ${title} dengan tampilan rapi dan siap dipublish` });
        if (!cancelled) window.location.assign(`/project/${project.id}/prototype`);
      } catch (err) {
        if (!cancelled) setCheckoutNote(err.message || `Template ${title} tidak dapat dibuka.`);
        if (button) { button.disabled = false; button.innerHTML = original; }
      }
    }

    // Layout reference tiles attach a reference to the composer prompt.
    root.querySelectorAll('button[aria-label^="Lampirkan "]').forEach(tile => {
      listen(tile, "click", () => {
        const label = tile.getAttribute("aria-label");
        const title = label.replace(/^Lampirkan /, "").replace(/ ke ide$/, "");
        const img = tile.querySelector("img");
        const src = img?.getAttribute("src") || "";
        const id = src.match(/\/layout-references\/([^/]+)-\d+\.webp/)?.[1]
          || src.match(/\/api\/(?:project-templates|catalog\/templates)\/([^/]+)\/thumbnail/)?.[1] || "";
        sessionStorage.setItem("dpai:reference", JSON.stringify({ id, title, image: src }));
        window.dispatchEvent(new CustomEvent("dpai:starter", { detail: { text: `Buat website ${title.toLowerCase()} dengan tampilan rapi dan siap dipublish`, referenceIds: id ? [id] : [] } }));
        (document.querySelector("#hero") || document.querySelector("#hero-composer-root"))?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    // Template tiles on the homepage open a real project.
    root.querySelectorAll('button[aria-label^="Pakai template "]').forEach(tile => {
      listen(tile, "click", async () => {
        const title = tile.getAttribute("aria-label").replace(/^Pakai template /, "");
        const templates = await loadCatalog();
        const item = templates.find(t => t.title === title);
        if (!item) { if (!cancelled) setCheckoutNote(`Template ${title} tidak ditemukan.`); return; }
        if (!cancelled) window.location.assign(`/t/${encodeURIComponent(item.id)}`);
      });
    });

    // Catalog tabs and industry filters on /templates.
    const tabs = [...root.querySelectorAll('[role="tab"][aria-controls]')];
    tabs.forEach(tab => {
      listen(tab, "click", () => {
        tabs.forEach(other => {
          const active = other === tab;
          other.setAttribute("aria-selected", String(active));
          const panel = root.querySelector(`#${other.getAttribute("aria-controls")}`);
          if (panel) panel.hidden = !active;
        });
      });
    });

    const filterGroup = root.querySelector('[aria-label="Industri"]');
    if (filterGroup) {
      const buttons = [...filterGroup.querySelectorAll("button")];
      buttons.forEach(button => {
        listen(button, "click", () => {
          const category = FILTER_CATEGORY[button.textContent.trim()] ?? "";
          buttons.forEach(b => b.setAttribute("aria-pressed", String(b === button)));
          root.querySelectorAll("#reference-catalog-panel ul > li").forEach(li => {
            li.hidden = !!category && li.dataset.category !== category;
          });
        });
      });
    }

    loadCatalog().then(templates => {
      if (cancelled || !templates.length) return;
      const byTitle = new Map(templates.map(t => [t.title, t]));
      root.querySelectorAll('button[aria-label^="Lampirkan "]').forEach(tile => {
        const title = tile.getAttribute("aria-label").replace(/^Lampirkan /, "").replace(/ ke ide$/, "");
        const item = byTitle.get(title);
        if (item) (tile.closest("li") || tile).dataset.category = item.category || "";
      });

      const panel = root.querySelector("#template-catalog-panel");
      const container = panel?.querySelector('[aria-label="Memuat katalog template"]');
      if (container) {
        container.setAttribute("aria-label", "Katalog template");
        container.textContent = "";
        templates.filter(t => t.kind === "template").forEach(item => {
          const card = document.createElement("article");
          card.className = "group overflow-hidden rounded-[1.125rem] border border-dpai-line bg-dpai-surface shadow-[0_1px_2px_rgba(35,33,38,0.04)]";
          card.innerHTML = `<div class="aspect-[16/10] overflow-hidden border-b border-dpai-line bg-dpai-desk"><img alt="" class="size-full object-cover" loading="lazy" src="/api/templates/${encodeURIComponent(item.id)}/thumbnail"></div><div class="p-5"><h2 class="m-0 font-display text-dpai-title font-semibold text-dpai-ink"></h2><p class="mt-2 mb-4 text-dpai-body-sm text-dpai-muted">Template siap dipakai dari katalog publik.</p><button type="button" class="inline-flex min-h-11 w-full items-center justify-center rounded-dpai-action bg-dpai-violet px-4 text-dpai-label font-semibold text-white">Pakai template</button></div>`;
          card.querySelector("h2").textContent = item.title;
          listen(card.querySelector("button"), "click", e => useTemplate(item.id, item.title, e.currentTarget));
          container.appendChild(card);
        });
      }
    });

    root.querySelectorAll("button").forEach(button => {
      if (!button.textContent.trim().startsWith("Gunakan fondasi")) return;
      listen(button, "click", async () => {
        const title = button.closest("article")?.querySelector("h2")?.textContent.trim() || "";
        const templates = await loadCatalog();
        const item = templates.find(t => t.kind === "foundation" && t.title === title);
        if (!item) { if (!cancelled) setCheckoutNote(`Fondasi ${title} tidak ditemukan.`); return; }
        await useTemplate(item.id, title, button);
      });
    });

    // Pricing CTAs are disabled in the captured SSR markup; enable and wire them.
    root.querySelectorAll("button, a").forEach(el => {
      const label = el.textContent.trim();
      if (!["Pilih Pro", "Pilih Pro + Hosting", "Pilih Bundle"].includes(label)) return;
      el.disabled = false;
      el.removeAttribute("disabled");
      const plan = label === "Pilih Pro" ? "pro" : label === "Pilih Pro + Hosting" ? "pro-hosting" : "bundle";
      listen(el, "click", async event => {
        event.preventDefault();
        try {
          const result = await post("/api/checkout/intent", { plan });
          if (!cancelled) setCheckoutNote(result.note);
        } catch (err) {
          if (!cancelled) setCheckoutNote(err.message);
        }
      });
    });

    return () => { cancelled = true; cleanups.forEach(fn => fn()); };
  }, [route]);

  return <>
    {checkoutNote && <div className="dp-checkout-note" role="status">{checkoutNote}</div>}
    <div ref={ref} dangerouslySetInnerHTML={{ __html: marketingHtml[route] || "" }} />
  </>;
}
