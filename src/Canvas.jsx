import React, { useEffect, useMemo, useState } from "react";
import { get, post, patch, del } from "./api.js";
import { Icon, Modal, Toast } from "./ui.jsx";
import AiSettingsButton from "./AiSettings.jsx";

const SUGGESTIONS = ["Ubah warna tombol menjadi hijau", "Tambahkan halaman pricing", "Perbaiki spacing pada bagian hero", "Ubah layout menjadi lebih minimalis"];

export default function Canvas({ projectId }) {
  const [project, setProject] = useState(null);
  const [session, setSession] = useState(undefined);
  const [activeSlug, setActiveSlug] = useState("index");
  const [tab, setTab] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [versions, setVersions] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [device, setDevice] = useState("web");
  const [zoom, setZoom] = useState(100);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [pageOpen, setPageOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [slugDraft, setSlugDraft] = useState("");
  const [gallery, setGallery] = useState(true);
  const [publishedUrl, setPublishedUrl] = useState("");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    document.title = "Canvas — DesainPakeAI";
    get("/api/auth/session").then(data => {
      setSession(data);
      if (!data.user) window.location.replace(`/login?redirect=${encodeURIComponent(`/project/${projectId}/prototype`)}`);
    }).catch(() => window.location.replace("/login"));
    load();
  }, [projectId]);

  async function load() {
    try {
      const [{ project: p }, m, v] = await Promise.all([
        get(`/api/projects/${projectId}`),
        get(`/api/projects/${projectId}/messages`),
        get(`/api/projects/${projectId}/versions`)
      ]);
      setProject(p);
      setMessages(m.messages);
      setVersions(v.versions);
      setSlugDraft(p.published_slug || p.model?.name || "");
      setGallery(!!p.gallery);
      setPublishedUrl(p.published_slug ? `${window.location.origin}/sites/${p.published_slug}` : "");
      if (!p.model.pages.some(x => x.slug === activeSlug)) setActiveSlug(p.model.pages[0]?.slug || "index");
    } catch (e) { setError(e.message); }
  }

  const activePage = useMemo(() => project?.model?.pages?.find(p => p.slug === activeSlug) || project?.model?.pages?.[0], [project, activeSlug]);
  const previewSrc = `/api/projects/${projectId}/prototype/preview?page=${encodeURIComponent(activeSlug)}&r=${revision}`;

  async function sendChat(text = input) {
    if (!text.trim() || busy) return;
    setBusy(true); setInput(""); setError("");
    setMessages(ms => [...ms, { id: `tmp-${Date.now()}`, role: "user", text }]);
    try {
      const data = await post(`/api/projects/${projectId}/chat`, { instruction: text });
      setProject(data.project);
      setMessages(ms => [...ms.filter(m => !m.id.startsWith("tmp-")), { id: `a-${Date.now()}`, role: "assistant", text: data.reply }]);
      setRevision(r => r + 1);
      loadVersions();
    } catch (e) { setError(e.message); }
    setBusy(false);
  }

  async function loadVersions() {
    try { const v = await get(`/api/projects/${projectId}/versions`); setVersions(v.versions); } catch {}
  }

  async function saveTheme(patchData) {
    if (!project) return;
    const model = structuredClone(project.model);
    Object.assign(model.theme, patchData);
    const data = await patch(`/api/projects/${projectId}`, { model });
    setProject(data.project);
    setRevision(r => r + 1);
    setToast("Design token tersimpan.");
    loadVersions();
  }

  async function addPage() {
    if (!newPageTitle.trim()) return;
    try {
      const data = await post(`/api/projects/${projectId}/pages`, { title: newPageTitle });
      setProject(data.project);
      setActiveSlug(data.project.model.pages.at(-1).slug);
      setPageOpen(false); setNewPageTitle(""); setToast("Halaman ditambahkan.");
      loadVersions();
    } catch (e) { setError(e.message); }
  }

  async function removePage(slug) {
    if (!window.confirm(`Hapus halaman ${slug}?`)) return;
    try {
      const data = await del(`/api/projects/${projectId}/pages/${slug}`);
      setProject(data.project);
      setActiveSlug(data.project.model.pages[0].slug);
      setToast("Halaman dihapus.");
    } catch (e) { setToast(e.message); }
  }

  async function publish() {
    setBusy(true); setError("");
    try {
      const data = await post(`/api/projects/${projectId}/publish`, { slug: slugDraft, gallery });
      setPublishedUrl(data.url);
      setSlugDraft(data.slug);
      setPublishOpen(false);
      setToast(`Website berhasil dipublish: ${data.url}`);
      loadVersions();
      await load();
    } catch (e) { setError(e.message); }
    setBusy(false);
  }

  async function restore(versionId) {
    try {
      const data = await post(`/api/projects/${projectId}/versions/${versionId}/restore`);
      setProject(data.project); setRevision(r => r + 1); setToast("Versi dipulihkan."); loadVersions();
    } catch (e) { setToast(e.message); }
  }

  if (error && !project) return <div className="dp-canvas-error"><h1>Project tidak dapat dibuka</h1><p>{error}</p><a href="/projects" className="dp-button-primary">Kembali ke Projects</a></div>;

  if (!project) return <div className="dp-canvas-shell"><div className="dp-canvas-loading"><span className="dp-spinner" />Memuat project…</div></div>;

  const theme = project.model.theme || {};

  return <div className="dp-canvas-shell">
    <header className="dp-canvas-topbar">
      <div className="dp-canvas-topbar-left">
        <a href="/projects" aria-label="Kembali ke projects" className="dp-icon-button"><Icon name="arrowRight" size={18} className="dp-flip" /></a>
        <div><input aria-label="Nama project" value={project.name} onChange={e => setProject(p => ({ ...p, name: e.target.value }))} onBlur={e => patch(`/api/projects/${projectId}`, { name: e.target.value })} className="dp-project-name" />
          <span className="dp-topbar-meta">{project.platform === "app" ? "App · 390 × 844" : "Web · 1440 × 960"} · {project.model.pages.length} halaman</span></div>
      </div>
      <div className="dp-canvas-topbar-right">
        <label className="dp-select"><span>Perangkat</span><select value={device} onChange={e => setDevice(e.target.value)} aria-label="Ukuran perangkat"><option value="web">Desktop</option><option value="app">Mobile</option></select></label>
        <button type="button" className="dp-top-button" onClick={() => setPreviewOpen(true)}><Icon name="external" size={15} />Preview</button>
        <a className="dp-top-button" href={`/api/projects/${projectId}/export?format=html`} download><Icon name="download" size={15} />HTML</a>
        <a className="dp-top-button" href={`/api/projects/${projectId}/export?format=zip`} download><Icon name="download" size={15} />ZIP</a>
        <a className="dp-top-button" href={`/api/projects/${projectId}/design.md`} download><Icon name="layers" size={15} />DESIGN.md</a>
        {publishedUrl && <a className="dp-top-button" href={publishedUrl} target="_blank" rel="noreferrer"><Icon name="globe" size={15} />Situs</a>}
        <AiSettingsButton compact />
        <button type="button" className="dp-button-primary" onClick={() => setPublishOpen(true)}><Icon name="upload" size={15} />Publish</button>
      </div>
    </header>

    <div className="dp-canvas-body">
      <aside className="dp-canvas-sidebar dp-canvas-left">
        <div className="dp-sidebar-heading"><span>Halaman</span><button type="button" className="dp-icon-button" aria-label="Tambah halaman" onClick={() => setPageOpen(true)}><Icon name="plus" size={17} /></button></div>
        <ul className="dp-page-list">{project.model.pages.map(p => <li key={p.slug} className={p.slug === activeSlug ? "active" : ""}>
          <button type="button" onClick={() => setActiveSlug(p.slug)}><Icon name="layers" size={14} /><span>{p.title}</span><small>{p.sections.length}</small></button>
          {project.model.pages.length > 1 && <button type="button" className="dp-page-delete" aria-label={`Hapus halaman ${p.title}`} onClick={() => removePage(p.slug)}><Icon name="trash" size={13} /></button>}
        </li>)}</ul>
        <div className="dp-sidebar-heading mt"><span>Struktur halaman</span></div>
        <ul className="dp-section-list">{(activePage?.sections || []).map((s, i) => <li key={i}><span className="dp-section-dot" />{s.type}<small>{s.title || s.text || ""}</small></li>)}</ul>
      </aside>

      <main className="dp-canvas-main">
        <div className="dp-canvas-toolbar">
          <span className="dp-canvas-path">/{activePage?.slug || "index"}</span>
          <div className="flex items-center gap-2">
            <button type="button" className="dp-icon-button" aria-label="Perkecil" onClick={() => setZoom(z => Math.max(50, z - 10))}>−</button>
            <span className="dp-zoom">{zoom}%</span>
            <button type="button" className="dp-icon-button" aria-label="Perbesar" onClick={() => setZoom(z => Math.min(120, z + 10))}>+</button>
            <button type="button" className="dp-icon-button" aria-label="Muat ulang preview" onClick={() => setRevision(r => r + 1)}><Icon name="refresh" size={15} /></button>
          </div>
        </div>
        <div className="dp-canvas-stage">
          <div className={`dp-frame ${device === "app" ? "dp-frame-mobile" : ""}`} style={{ transform: `scale(${zoom / 100})` }}>
            <iframe key={`${activeSlug}-${revision}`} title="Preview desain" src={previewSrc} sandbox="allow-same-origin allow-forms allow-scripts" />
          </div>
        </div>
      </main>

      <aside className="dp-canvas-sidebar dp-canvas-right">
        <div className="dp-tabs" role="tablist">
          {[["chat", "Chat AI"], ["design", "Desain"], ["versions", "Riwayat"]].map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>)}
        </div>

        {tab === "chat" && <div className="dp-chat-panel">
          <div className="dp-chat-scroll">
            {messages.length === 0 && <div className="dp-empty dp-empty-small"><Icon name="spark" size={22} /><p>Ceritakan perubahan yang kamu inginkan.</p></div>}
            {messages.map(m => <div key={m.id} className={`dp-message ${m.role}`}><span className="dp-message-label">{m.role === "user" ? "Kamu" : "AI"}</span><p>{m.text}</p></div>)}
            {busy && <div className="dp-message assistant"><span className="dp-message-label">AI</span><p><span className="dp-typing" /><span className="dp-typing" /><span className="dp-typing" /></p></div>}
          </div>
          <div className="dp-suggestions">{SUGGESTIONS.map(s => <button key={s} type="button" onClick={() => sendChat(s)} disabled={busy}>{s}</button>)}</div>
          <form className="dp-chat-form" onSubmit={e => { e.preventDefault(); sendChat(); }}>
            <textarea rows={2} value={input} onChange={e => setInput(e.target.value)} placeholder="Contoh: ubah tombolnya jadi hijau…" aria-label="Instruksi untuk AI" />
            <button type="submit" disabled={!input.trim() || busy} aria-label="Kirim instruksi"><Icon name="arrowUp" size={16} /></button>
          </form>
          {error && <p role="alert" className="dp-form-error">{error}</p>}
        </div>}

        {tab === "design" && <div className="dp-design-panel">
          <h3>Fondasi visual</h3>
          <label>Warna aksen <input type="color" value={theme.accent || "#7438d0"} onChange={e => setProject(p => ({ ...p, model: { ...p.model, theme: { ...p.model.theme, accent: e.target.value } } }))} onBlur={e => saveTheme({ accent: e.target.value })} /></label>
          <label>Radius <input type="number" min="0" max="32" value={theme.radius || 12} onChange={e => setProject(p => ({ ...p, model: { ...p.model, theme: { ...p.model.theme, radius: Number(e.target.value) } } }))} onBlur={e => saveTheme({ radius: Number(e.target.value) })} /></label>
          <label>Spacing <input type="number" min="8" max="40" value={theme.spacing || 16} onChange={e => setProject(p => ({ ...p, model: { ...p.model, theme: { ...p.model.theme, spacing: Number(e.target.value) } } }))} onBlur={e => saveTheme({ spacing: Number(e.target.value) })} /></label>
          <h3>Token</h3>
          <ul className="dp-token-list">{Object.entries(project.design_system?.tokens || {}).map(([k, v]) => <li key={k}><span>{k}</span><code>{String(v)}</code></li>)}</ul>
          <a className="dp-top-button mt" href={`/api/projects/${projectId}/design.md`} download><Icon name="download" size={14} />Unduh DESIGN.md</a>
        </div>}

        {tab === "versions" && <div className="dp-versions-panel">
          <p className="dp-hint">Setiap perubahan AI dan publish membuat versi baru.</p>
          <ul>{versions.map(v => <li key={v.id}><div><strong>{v.label}</strong><small>{new Date(v.created_at).toLocaleString("id-ID")}</small></div><button type="button" onClick={() => restore(v.id)}>Pulihkan</button></li>)}</ul>
        </div>}
      </aside>
    </div>

    <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title={`Preview — ${activePage?.title || ""}`} wide>
      <div className="dp-preview-modal"><iframe title="Preview penuh" src={previewSrc} /></div>
    </Modal>

    <Modal open={publishOpen} onClose={() => setPublishOpen(false)} title="Publish website">
      <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); publish(); }}>
        <label className="flex flex-col gap-1 text-sm font-medium">Subdomain / slug
          <input required className="dp-input" value={slugDraft} onChange={e => setSlugDraft(e.target.value)} placeholder="kopi-senja" />
        </label>
        <p className="text-xs text-dpai-muted">Website akan tersedia di <code>/sites/{slugDraft || "slug"}</code> pada origin ini.</p>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={gallery} onChange={e => setGallery(e.target.checked)} /> Tampilkan di galeri</label>
        {publishedUrl && <p className="text-sm">Sudah online: <a href={publishedUrl} target="_blank" rel="noreferrer" className="underline">{publishedUrl}</a></p>}
        {error && <p className="dp-form-error" role="alert">{error}</p>}
        <button type="submit" disabled={busy} className="dp-button-primary">{busy ? "Memublish…" : "Publish sekarang"}</button>
      </form>
    </Modal>

    <Modal open={pageOpen} onClose={() => setPageOpen(false)} title="Tambah halaman">
      <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); addPage(); }}>
        <label className="flex flex-col gap-1 text-sm font-medium">Judul halaman<input required className="dp-input" value={newPageTitle} onChange={e => setNewPageTitle(e.target.value)} placeholder="Pricing" /></label>
        <button type="submit" className="dp-button-primary">Tambah halaman</button>
      </form>
    </Modal>

    <Toast message={toast} onClose={() => setToast("")} />
  </div>;
}
