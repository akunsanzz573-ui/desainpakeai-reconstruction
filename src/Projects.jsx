import React, { useEffect, useState } from "react";
import { get, post, del } from "./api.js";
import { Icon, Modal, Toast } from "./ui.jsx";
import HeroComposer from "./HeroComposer.jsx";
import AiSettingsButton from "./AiSettings.jsx";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [platform, setPlatform] = useState("web");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { document.title = "Projects - DesainPakeAI"; }, []);

  async function load(q = "") {
    try { const data = await get(`/api/projects?${new URLSearchParams({ query: q })}`); setProjects(data.projects); }
    catch { setProjects([]); }
  }

  useEffect(() => {
    load();
    const handoff = sessionStorage.getItem("dpai:starter-prompt");
    if (handoff) { try { const p = JSON.parse(handoff); setDraft(p.text || ""); setPlatform(p.platform || "web"); } catch {} }
    if (new URLSearchParams(window.location.search).get("create") === "true") setCreateOpen(true);
  }, []);

  async function create(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const reference = JSON.parse(sessionStorage.getItem("dpai:reference") || "null");
      const { project } = await post("/api/projects", { starter: { prompt: draft, platform, look: "auto", referenceIds: reference?.id ? [reference.id] : [] } });
      sessionStorage.removeItem("dpai:starter-prompt");
      window.location.assign(`/project/${project.id}/prototype`);
    } catch (err) { setError(err.message); setBusy(false); }
  }

  async function remove(project) {
    if (!window.confirm(`Hapus project "${project.name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    await del(`/api/projects/${project.id}`);
    setProjects(ps => ps.filter(p => p.id !== project.id));
    setToast("Project dihapus.");
  }

  async function publish(project) {
    const slug = window.prompt("Slug publik (kosongkan untuk dibuat otomatis):", project.published_slug || project.model?.name || "");
    if (slug === null) return;
    try {
      const result = await post(`/api/projects/${project.id}/publish`, { slug, gallery: true });
      setToast(`Published: ${result.url}`);
      load(query);
    } catch (err) { setToast(err.message); }
  }

  return <div className="min-h-dvh bg-dpai-paper font-landing text-dpai-ink [&_*]:box-border">
    <header><nav className="relative mx-auto flex h-16 w-[calc(100%-2rem)] items-center justify-between font-sans sm:h-20 sm:w-[calc(100%-3rem)] max-w-[82.625rem]" aria-label="Navigasi utama">
      <div className="flex items-center"><a href="/" aria-label="DesainPakeAI — beranda" className="inline-flex shrink-0 items-center gap-1 font-display text-dpai-title-sm font-bold tracking-dpai-display text-dpai-ink no-underline">
        <img src="/brand/mark.svg" alt="" width="133" height="152" className="mr-1.5 h-8 w-7 shrink-0" /><span>desainpake<span className="text-dpai-violet">ai</span></span></a></div>
      <div className="flex items-center gap-3">
        <AiSettingsButton className="inline-flex min-h-10 items-center gap-1.5 rounded-dpai-action border border-dpai-line bg-dpai-desk px-4 text-sm font-medium hover:bg-dpai-line" compact />
        <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex min-h-10 items-center rounded-dpai-action bg-dpai-violet px-5 text-sm font-semibold text-white shadow-dpai-action hover:bg-dpai-violet-hover">Project baru</button>
      </div>
    </nav></header>

    <main className="mx-auto w-[calc(100%-3rem)] max-w-[82.625rem] py-10 max-[640px]:w-[calc(100%-1.5rem)]">
      <section className="mx-auto max-w-[44rem] text-center">
        <h1 className="m-0 font-display text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.05em]">Mau buat apa hari ini?</h1>
        <p className="mt-2 mb-8 text-dpai-body text-dpai-muted">Ceritakan idemu dan pilih tampilannya.</p>
        <HeroComposer />
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dpai-line pb-4">
          <h2 className="m-0 font-display text-2xl font-semibold tracking-[-0.035em]">Projects</h2>
          <div className="flex items-center gap-2">
            <label className="dp-search"><Icon name="search" size={16} /><input value={query} onChange={e => { setQuery(e.target.value); load(e.target.value); }} placeholder="Cari project" aria-label="Cari project" /></label>
            <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex min-h-10 items-center gap-1.5 rounded-dpai-action border border-dpai-line bg-dpai-chrome px-4 text-sm font-medium hover:bg-dpai-desk"><Icon name="plus" size={15} /> Project baru</button>
          </div>
        </div>

        {projects.length === 0 ? <div className="dp-empty"><Icon name="layers" size={24} /><h3>Belum ada project</h3><p>Mulai dari ide singkat. Kami akan menyiapkan halaman pertamamu.</p><button type="button" onClick={() => setCreateOpen(true)} className="dp-button-primary">Buat project pertama</button></div> :
          <ul className="dp-project-grid">{projects.map(p => <li key={p.id} className="dp-project-card">
            <div className="flex items-start justify-between gap-2">
              <span className="dp-badge">{p.platform === "app" ? "App" : "Web"}</span>
              {p.published_slug && <span className="dp-badge dp-badge-green">Online</span>}
            </div>
            <h3>{p.name}</h3>
            <p>{p.prompt.slice(0, 110)}{p.prompt.length > 110 ? "…" : ""}</p>
            <p className="dp-meta">{p.model?.pages?.length || 0} halaman · {new Date(p.updated_at).toLocaleDateString("id-ID")}</p>
            <div className="dp-card-actions">
              <a className="dp-button-primary" href={`/project/${p.id}/prototype`}>Buka</a>
              <button type="button" onClick={() => publish(p)}><Icon name="globe" size={15} />Publish</button>
              <a href={`/api/projects/${p.id}/export?format=zip`} download><Icon name="download" size={15} />ZIP</a>
              <button type="button" aria-label={`Hapus ${p.name}`} onClick={() => remove(p)}><Icon name="trash" size={15} /></button>
            </div>
            {p.published_slug && <a className="dp-card-link" href={`/sites/${p.published_slug}`} target="_blank" rel="noreferrer">/sites/{p.published_slug} <Icon name="external" size={13} /></a>}
          </li>)}</ul>}
      </section>
    </main>

    <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Project baru">
      <form className="flex flex-col gap-4" onSubmit={create}>
        <label className="flex flex-col gap-1 text-sm font-medium">Ceritakan idemu
          <textarea required minLength={20} rows={5} value={draft} onChange={e => setDraft(e.target.value)} className="dp-input resize-y" placeholder="Contoh: landing page kedai kopi yang hangat, ada menu dan lokasi" />
        </label>
        <p className="text-xs text-dpai-muted">{draft.trim().length} karakter · minimal 20</p>
        <div className="flex gap-2" role="group" aria-label="Tampilan desain">
          {["web", "app"].map(p => <button type="button" key={p} onClick={() => setPlatform(p)} className={`dp-toggle ${platform === p ? "active" : ""}`}>{p === "web" ? "Web" : "App"}</button>)}
        </div>
        {error && <p role="alert" className="dp-form-error">{error}</p>}
        <button type="submit" disabled={busy || draft.trim().length < 20} className="dp-button-primary">{busy ? "Membuat project…" : "Buat project"}</button>
      </form>
    </Modal>
    <Toast message={toast} onClose={() => setToast("")} />
  </div>;
}
