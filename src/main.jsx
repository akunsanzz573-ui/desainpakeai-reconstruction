import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./app.css";
import Marketing from "./Marketing.jsx";
import Projects from "./Projects.jsx";
import Canvas from "./Canvas.jsx";
import { get, post } from "./api.js";
import { Icon } from "./ui.jsx";

function NotFound() {
  useEffect(() => { document.title = "Halaman tidak ditemukan — DesainPakeAI"; }, []);
  return <main className="dp-simple-page">
    <a href="/" className="dp-simple-brand"><img src="/brand/mark.svg" alt="" />desainpake<span>ai</span></a>
    <h1>Halaman tidak ditemukan</h1>
    <p>Alamat ini tidak tersedia. Kembali ke beranda untuk mulai membuat project.</p>
    <a className="dp-button-primary" href="/">Ke beranda</a>
  </main>;
}

function ReportPage() {
  const [form, setForm] = useState({ url: "", issue: "Lainnya", detail: "", email: "" });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { document.title = "Laporkan situs - DesainPakeAI"; }, []);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setStatus("");
    try { await post("/api/reports", form); setStatus("Laporan tersimpan. Terima kasih sudah membantu menjaga galeri."); setForm({ url: "", issue: "Lainnya", detail: "", email: "" }); }
    catch (err) { setStatus(err.message); }
    setBusy(false);
  }
  return <div className="dp-simple-page">
    <a href="/" className="dp-simple-brand"><img src="/brand/mark.svg" alt="" />desainpake<span>ai</span></a>
    <main className="dp-simple-card">
      <h1>Laporkan situs</h1>
      <p className="dp-muted">Laporkan situs yang bermasalah di galeri DesainPakeAI.</p>
      <form onSubmit={submit} className="dp-stack">
        <label>Alamat situs<input required className="dp-input" placeholder=".desainpakeai.com" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} /></label>
        <label>Masalahnya<select className="dp-input" value={form.issue} onChange={e => setForm({ ...form, issue: e.target.value })}>
          <option>Konten ilegal</option><option>Menyamar sebagai pihak lain</option><option>Malware atau unduhan berbahaya</option><option>Phishing / mencuri data login</option><option>Penipuan</option><option>Lainnya</option>
        </select></label>
        <label>Detail (opsional)<textarea rows={4} className="dp-input" value={form.detail} onChange={e => setForm({ ...form, detail: e.target.value })} /></label>
        <label>Email Anda (opsional)<input type="email" className="dp-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
        {status && <p role="status" className="dp-form-status">{status}</p>}
        <button className="dp-button-primary" disabled={busy}>{busy ? "Mengirim…" : "Kirim laporan"}</button>
      </form>
    </main>
  </div>;
}

function MaintenancePage() {
  useEffect(() => { document.title = "Maintenance - DesainPakeAI"; }, []);
  return <main className="dp-simple-page">
    <a href="/" className="dp-simple-brand"><img src="/brand/mark.svg" alt="" />desainpake<span>ai</span></a>
    <div className="dp-simple-card">
      <span className="dp-badge">Pemeliharaan terjadwal</span>
      <h1>DesainPakeAI sedang dalam pemeliharaan.</h1>
      <p>Akses sementara dihentikan agar kami dapat memperbarui layanan dan memastikan workspace kembali berjalan dengan baik.</p>
      <p><strong>Perkiraan kembali:</strong> Segera kembali</p>
      <p>Project dan pekerjaan yang sudah tersimpan tetap aman.</p>
      <a className="dp-button-primary" href="/projects">Periksa kembali</a>
    </div>
  </main>;
}

function HandoffPage() {
  const [prd, setPrd] = useState(() => {
    const raw = new URLSearchParams(window.location.search).get("prd");
    if (!raw) return "";
    try { return JSON.parse(decodeURIComponent(raw)).text || raw; } catch { return raw; }
  });
  useEffect(() => { document.title = "Impor PRD - DesainPakeAI"; }, []);
  return <main className="dp-simple-page">
    <a href="/" className="dp-simple-brand"><img src="/brand/mark.svg" alt="" />desainpake<span>ai</span></a>
    <div className="dp-simple-card">
      <h1>Impor dari NgodingPakeAI</h1>
      <p className="dp-muted">Tempel PRD dari coding agent-mu untuk dipakai sebagai titik awal project.</p>
      <form className="dp-stack" onSubmit={e => {
        e.preventDefault();
        sessionStorage.setItem("dpai:starter-prompt", JSON.stringify({ text: prd, platform: "web", look: "auto" }));
        window.location.assign("/projects?create=true");
      }}>
        <textarea required minLength={20} rows={9} className="dp-input" placeholder="Tempel isi PRD di sini…" value={prd} onChange={e => setPrd(e.target.value)} />
        <button className="dp-button-primary">Lanjutkan ke project</button>
      </form>
    </div>
  </main>;
}

function TemplateOpen() {
  const id = decodeURIComponent(window.location.pathname.split("/")[2] || "");
  const [state, setState] = useState("Membuka template…");
  useEffect(() => {
    document.title = "Membuka template - DesainPakeAI";
    get(`/api/templates/${encodeURIComponent(id)}`).then(async ({ template }) => {
      if (!window.localStorage.getItem("dpai:user")) {
        // Session cookies are authoritative; this call still works while unauthenticated.
      }
      const { project } = await post(`/api/templates/${encodeURIComponent(id)}/use`, { prompt: `Buat website ${template.title} dengan tampilan rapi dan siap dipublish` });
      window.location.replace(`/project/${project.id}/prototype`);
    }).catch(err => setState(err.message || "Template tidak dapat dibuka."));
  }, [id]);
  return <main className="dp-simple-page"><h1>Membuka template</h1><p>{state}</p><a href="/templates">Kembali ke template</a></main>;
}

function App() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  if (pathname === "/") return <Marketing route="home" />;
  if (pathname === "/pricing") return <Marketing route="pricing" />;
  if (pathname === "/galeri") return <Marketing route="galeri" />;
  if (pathname === "/updates") return <Marketing route="updates" />;
  if (pathname === "/templates") return <Marketing route="templates" />;
  if (pathname === "/login" || pathname === "/admin") { window.location.replace("/projects"); return null; }
  if (pathname === "/onboarding") { window.location.replace("/projects"); return null; }
  if (pathname === "/projects") return <Projects />;
  if (pathname === "/project/prototype") return <Canvas projectId="" />;
  if (/^\/project\/[^/]+\/prototype$/.test(pathname)) return <Canvas projectId={pathname.split("/")[2]} />;
  if (/^\/t\/[^/]+$/.test(pathname)) return <TemplateOpen />;
  if (pathname === "/laporkan-situs") return <ReportPage />;
  if (pathname === "/maintenance") return <MaintenancePage />;
  if (pathname === "/handoff/ngoding") return <HandoffPage />;
  return <NotFound />;
}

const root = document.getElementById("root");
createRoot(root).render(<App />);
