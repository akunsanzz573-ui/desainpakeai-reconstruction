import React, { useEffect, useState } from "react";
import { post } from "./api.js";
import { Icon } from "./ui.jsx";

function safeRedirect(value) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/projects";
  return value;
}

export default function Login() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState(null);
  const redirect = safeRedirect(new URLSearchParams(window.location.search).get("redirect"));

  useEffect(() => { document.title = "Masuk - DesainPakeAI"; }, []);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (busy) return;
    setBusy(true);
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      await post(path, { email, password, name });
      window.location.assign(redirect);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-dpai-paper px-4 py-12 text-dpai-ink">
    <div className="absolute inset-0"><canvas aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" /></div>
    <main className="relative z-[1] w-full max-w-md rounded-[1.25rem] shadow-[0_1px_2px_rgba(0,0,0,0.06),0_1.5rem_3.75rem_rgba(0,0,0,0.10)] sm:rounded-[1.5rem]" aria-labelledby="sign-in-title">
      <div className="relative min-w-0 rounded-[1.25rem] border border-dpai-line bg-dpai-paper p-1 sm:rounded-[1.5rem]">
        <header className="flex h-12 items-center gap-2 px-5">
          <a aria-label="DesainPakeAI - beranda" href="/" className="inline-flex items-center gap-2 text-sm font-medium tracking-tight text-dpai-ink no-underline">
            <img className="h-7 w-6" src="/brand/mark.svg" alt="" /><span>desainpakeai</span>
          </a>
        </header>
        <section className="relative flex min-w-0 flex-col gap-4 overflow-hidden rounded-dpai-panel border border-dpai-line bg-white p-8 max-[480px]:p-6 sm:rounded-[1.25rem]">
          <div>
            <h1 className="m-0 text-base font-medium tracking-tight" id="sign-in-title">{mode === "login" ? "Masuk ke DesainPakeAI" : "Buat akun DesainPakeAI"}</h1>
            <p className="mt-1 mb-0 text-sm leading-6 text-dpai-muted">
              {mode === "login" ? "Masuk untuk membuat project baru atau membuka project-mu." : "Mulai dengan satu project gratis dan satu halaman."}
            </p>
          </div>
          <button type="button" disabled className="flex h-11 w-full items-center justify-center gap-2 rounded-dpai-action border border-dpai-line bg-dpai-chrome text-sm font-medium text-dpai-muted opacity-60" title="Google OAuth memerlukan kredensial server">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9l3.3-2.6Z"/><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.7 9.4 6 12 6Z"/></svg>
            Masuk dengan Google
          </button>
          <div className="flex items-center gap-3 text-xs text-dpai-muted"><span className="h-px flex-1 bg-dpai-line" />atau dengan email<span className="h-px flex-1 bg-dpai-line" /></div>
          <form className="flex flex-col gap-3" onSubmit={submit}>
            {mode === "register" && <label className="flex flex-col gap-1 text-sm font-medium">Nama
              <input required value={name} onChange={e => setName(e.target.value)} className="dp-input" placeholder="Nama kamu" autoComplete="name" />
            </label>}
            <label className="flex flex-col gap-1 text-sm font-medium">Email
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="dp-input" placeholder="nama@email.com" autoComplete="email" />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">Kata sandi
              <input required type="password" minLength={mode === "register" ? 8 : 1} value={password} onChange={e => setPassword(e.target.value)} className="dp-input" placeholder="Minimal 8 karakter" autoComplete={mode === "login" ? "current-password" : "new-password"} />
            </label>
            {error && <p role="alert" className="dp-form-error">{error}</p>}
            <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center justify-center rounded-dpai-action bg-dpai-violet px-5 text-sm font-semibold text-white shadow-dpai-action transition hover:bg-dpai-violet-hover disabled:opacity-50">
              {busy ? "Memproses…" : mode === "login" ? "Masuk" : "Buat akun"}
            </button>
          </form>
          <button type="button" className="text-center text-sm text-dpai-muted underline underline-offset-4" onClick={() => { setMode(m => m === "login" ? "register" : "login"); setError(""); }}>
            {mode === "login" ? "Belum punya akun? Daftar gratis" : "Sudah punya akun? Masuk"}
          </button>
          <p className="m-0 text-center text-xs leading-5 text-dpai-muted">Dengan melanjutkan, kamu menyetujui <a href="/terms" className="underline">Terms</a> dan <a href="/privacy" className="underline">Privacy Policy</a>.</p>
          {session && <p className="text-xs text-dpai-muted">{session}</p>}
        </section>
      </div>
    </main>
  </div>;
}
