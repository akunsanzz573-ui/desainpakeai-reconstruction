import React, { useEffect, useState } from "react";
import { get, put, del } from "./api.js";
import { Icon, Modal } from "./ui.jsx";

export default function AiSettingsButton({ className = "dp-top-button", compact = false }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gemini-2.5-flash");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const data = await get("/api/settings/ai");
      setStatus(data);
      setModel(data.model || "gemini-2.5-flash");
    } catch (err) { setMessage(err.message); }
  }

  useEffect(() => { if (open) load(); }, [open]);

  async function save(e) {
    e.preventDefault();
    setBusy(true); setMessage("");
    try {
      const data = await put("/api/settings/ai", { apiKey, model });
      setStatus({ ...status, ...data, hasKey: true });
      setApiKey("");
      setMessage(data.note || "Kunci Gemini tersimpan di akunmu dan siap dipakai untuk generate serta AI chat.");
    } catch (err) { setMessage(err.message); }
    setBusy(false);
  }

  async function remove() {
    setBusy(true); setMessage("");
    try {
      const data = await del("/api/settings/ai");
      setStatus(data);
      setApiKey("");
      setMessage("Kunci akun dihapus. Provider lokal/environment dipakai kembali.");
    } catch (err) { setMessage(err.message); }
    setBusy(false);
  }

  const stateLabel = !status ? "Memeriksa…"
    : status.source === "user" ? `Kunci akun aktif (${status.maskedKey})`
    : status.source === "environment" ? `Kunci environment aktif (${status.provider})`
    : "Belum ada kunci — generator lokal dipakai";

  return <>
    <button type="button" className={`dp-ai-trigger ${className}`} onClick={() => setOpen(true)} aria-label="Pengaturan AI" title="Pengaturan AI Gemini">
      <Icon name="settings" size={compact ? 14 : 15} />
      {compact ? "AI" : "AI Gemini"}
    </button>
    <Modal open={open} onClose={() => setOpen(false)} title="Pengaturan AI Gemini">
      <div className="dp-ai-settings">
        <div className={`dp-ai-state ${status?.hasKey ? "active" : ""}`} role="status">{stateLabel}</div>
        <p className="dp-hint">Kunci disimpan di server pada akunmu dan tidak dikirim kembali ke browser. Kunci ini dipakai untuk pembuatan project dan AI chat.</p>
        <form className="dp-stack" onSubmit={save}>
          <label>API key Gemini
            <input className="dp-input" type="password" autoComplete="off" spellCheck="false" required
              placeholder={status?.source === "user" ? "Masukkan kunci baru untuk mengganti" : "AIza…"}
              value={apiKey} onChange={e => setApiKey(e.target.value)} />
          </label>
          <label>Model
            <input className="dp-input" value={model} onChange={e => setModel(e.target.value)} placeholder="gemini-2.5-flash" />
          </label>
          {message && <p className={message.includes("tersimpan") ? "dp-form-status" : "dp-form-error"} role="status">{message}</p>}
          <div className="dp-ai-actions">
            <button type="submit" className="dp-button-primary" disabled={busy || !apiKey.trim()}>
              {busy ? "Menyimpan…" : "Simpan kunci"}
            </button>
            {status?.source === "user" && <button type="button" className="dp-top-button" disabled={busy} onClick={remove}>Hapus kunci</button>}
          </div>
        </form>
      </div>
    </Modal>
  </>;
}
