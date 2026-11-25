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

export default function Marketing({ route }) {
  const ref = useRef(null);
  const [checkoutNote, setCheckoutNote] = useState("");

  useEffect(() => {
    document.title = TITLES[route] || "DesainPakeAI";
    const root = ref.current;
    if (!root) return;
    const cleanups = [];

    if (route === "home") {
      const mount = root.querySelector("#hero-composer-root");
      if (mount) {
        const reactRoot = createRoot(mount);
        reactRoot.render(<HeroComposer />);
        cleanups.push(() => reactRoot.unmount());
      }
      get("/api/landing-stats").then(({ users, designs }) => {
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
      const handler = () => {
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
      };
      menuButton.addEventListener("click", handler);
      cleanups.push(() => menuButton.removeEventListener("click", handler));
    }

    // Layout reference tiles attach a reference to the composer prompt.
    const tiles = root.querySelectorAll('button[aria-label^="Lampirkan "]');
    for (const tile of tiles) {
      const handler = () => {
        const label = tile.getAttribute("aria-label");
        const title = label.replace(/^Lampirkan /, "").replace(/ ke ide$/, "");
        const img = tile.querySelector("img");
        const src = img?.getAttribute("src") || "";
        const id = src.match(/\/layout-references\/([^/]+)-\d+\.webp/)?.[1]
          || src.match(/\/api\/(?:project-templates|catalog\/templates)\/([^/]+)\/thumbnail/)?.[1] || "";
        sessionStorage.setItem("dpai:reference", JSON.stringify({ id, title, image: src }));
        window.dispatchEvent(new CustomEvent("dpai:starter", { detail: { text: `Buat website ${title.toLowerCase()} dengan tampilan rapi dan siap dipublish`, referenceIds: id ? [id] : [] } }));
        document.querySelector("#hero")?.scrollIntoView({ behavior: "smooth", block: "start" });
      };
      tile.addEventListener("click", handler);
      cleanups.push(() => tile.removeEventListener("click", handler));
    }

    // Pricing CTAs record an intent in the single-user workspace.
    root.querySelectorAll("button, a").forEach(el => {
      const label = el.textContent.trim();
      if (!["Pilih Pro", "Pilih Pro + Hosting", "Pilih Bundle"].includes(label)) return;
      const plan = label === "Pilih Pro" ? "pro" : label === "Pilih Pro + Hosting" ? "pro-hosting" : "bundle";
      const handler = async event => {
        event.preventDefault();
        try {
          const result = await post("/api/checkout/intent", { plan });
          setCheckoutNote(result.note);
        } catch (err) { setCheckoutNote(err.message); }
      };
      el.addEventListener("click", handler);
      cleanups.push(() => el.removeEventListener("click", handler));
    });

    return () => cleanups.forEach(fn => fn());
  }, [route]);

  return <>
    {checkoutNote && <div className="dp-checkout-note" role="status">{checkoutNote}</div>}
    <div ref={ref} dangerouslySetInnerHTML={{ __html: marketingHtml[route] || "" }} />
  </>;
}
