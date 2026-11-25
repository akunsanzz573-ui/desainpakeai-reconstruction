import React, { useEffect, useRef, useState } from "react";
import { get, post } from "./api.js";
import { Icon } from "./ui.jsx";

const LOOKS = [
  { id: "auto", label: "Biar Agent yang menentukan", colors: ["#ffffff", "#f4f3f7", "#d8d4dd", "#8f8994"] },
  { id: "minimal", label: "Minimalis & rapi", colors: ["#ffffff", "#f7f7f7", "#dcdcdc", "#1f1f1f"] },
  { id: "editorial", label: "Editorial hangat", colors: ["#fffdf8", "#f3ece1", "#d8c8b4", "#593f2d"] },
  { id: "dashboard", label: "Dashboard terang", colors: ["#ffffff", "#eef2ff", "#c7d2fe", "#4338ca"] }
];

const STARTERS = ["Dashboard penjualan UMKM", "Landing page produk SaaS", "Aplikasi absensi karyawan"];

export default function HeroComposer() {
  const [text, setText] = useState("");
  const [platform, setPlatform] = useState("web");
  const [look, setLook] = useState(LOOKS[0]);
  const [lookOpen, setLookOpen] = useState(false);
  const [prdOpen, setPrdOpen] = useState(false);
  const [user, setUser] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const textRef = useRef(null);
  const valid = text.trim().length >= 20;

  useEffect(() => {
    get("/api/auth/session").then(d => setUser(d.user)).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const onDoc = e => {
      if (!e.target.closest("[data-composer-menu]")) { setLookOpen(false); setPrdOpen(false); }
    };
    const onStarter = e => { if (e.detail?.text) setText(e.detail.text); };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("dpai:starter", onStarter);
    return () => { document.removeEventListener("mousedown", onDoc); window.removeEventListener("dpai:starter", onStarter); };
  }, []);

  async function submit(event) {
    event?.preventDefault();
    if (busy) return;
    if (!valid) {
      setError("Tulis ide minimal 20 karakter.");
      textRef.current?.focus();
      return;
    }
    sessionStorage.setItem("dpai:starter-prompt", JSON.stringify({ text, platform, look: look.id }));
    if (!user) {
      window.location.assign(`/login?redirect=${encodeURIComponent("/projects?create=true")}`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { project } = await post("/api/projects", { starter: { prompt: text, platform, look: look.id } });
      window.location.assign(`/project/${project.id}/prototype`);
    } catch (e) {
      setError(e.message || "Project belum dapat dibuat. Coba lagi.");
      setBusy(false);
    }
  }

  function useStarter(value) {
    setText(value);
    sessionStorage.setItem("dpai:starter-prompt", JSON.stringify({ text: value, platform, look: look.id }));
    textRef.current?.focus();
  }

  return <div className="mt-9 w-full animate-[dpai-landing-enter_400ms_ease-out_both] [animation-delay:120ms] motion-reduce:animate-none max-[640px]:mt-8">
    <div className="mx-auto w-full max-w-[44rem]">
      <div className="overflow-hidden rounded-2xl bg-dpai-chrome text-dpai-ink ring-1 ring-dpai-line shadow-dpai-composer transition-shadow duration-200 focus-within:ring-dpai-violet motion-reduce:transition-none">
        <form onSubmit={submit}>
          <div className="p-3 max-[640px]:p-2.5">
            <label className="sr-only" htmlFor="landing-hero-prompt">Ceritakan produk yang mau dibuat</label>
            <textarea
              ref={textRef}
              id="landing-hero-prompt"
              autoComplete="off"
              aria-describedby="landing-hero-prompt-hint"
              maxLength={9900}
              rows={3}
              value={text}
              onChange={e => { setText(e.target.value); setError(""); }}
              placeholder="Mau buat apa hari ini?"
              className="block max-h-64 w-full min-w-0 resize-none overflow-y-auto border-0 bg-transparent px-3 py-3 text-dpai-body-lg leading-[1.55] text-dpai-ink caret-dpai-violet placeholder:text-dpai-body-lg placeholder:text-dpai-muted focus:outline-none max-[640px]:px-2 max-[640px]:text-dpai-body max-[640px]:placeholder:text-dpai-body min-h-28 max-[640px]:min-h-24"
            />
            <div className="flex items-center gap-2 px-3 pb-1 max-[640px]:px-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div role="group" aria-label="Tampilan desain" className="inline-flex items-center gap-0.5 rounded-lg bg-dpai-paper p-0.5">
                    <button type="button" aria-pressed={platform === "app"} title="App - Mobile 390 x 844 px" onClick={() => setPlatform("app")}
                      className={`inline-flex min-h-8 items-center gap-1.5 rounded-md text-dpai-caption font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dpai-violet disabled:cursor-not-allowed disabled:opacity-50 px-2 ${platform === "app" ? "bg-dpai-chrome shadow-sm text-dpai-violet-dark" : "text-dpai-muted hover:bg-dpai-chrome/60 hover:text-dpai-ink"}`}>
                      <Icon name="phone" size={14} />App
                    </button>
                    <button type="button" aria-pressed={platform === "web"} title="Web - Desktop 1440 x 960 px" onClick={() => setPlatform("web")}
                      className={`inline-flex min-h-8 items-center gap-1.5 rounded-md text-dpai-caption font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dpai-violet disabled:cursor-not-allowed disabled:opacity-50 px-2 ${platform === "web" ? "bg-dpai-chrome shadow-sm text-dpai-violet-dark" : "text-dpai-muted hover:bg-dpai-chrome/60 hover:text-dpai-ink"}`}>
                      <Icon name="desktop" size={14} />Web
                    </button>
                  </div>
                  <span role="status" className="text-dpai-caption" />
                </div>
                <span className="inline-flex min-h-9 max-w-56 min-w-0 items-center rounded-lg bg-dpai-paper text-dpai-muted hover:bg-dpai-desk hover:text-dpai-ink">
                  <button type="button" data-composer-menu aria-haspopup="menu" aria-expanded={prdOpen} aria-label="Pakai PRD dari NgodingPakeAI" title="Pakai PRD dari NgodingPakeAI"
                    onClick={() => { setPrdOpen(v => !v); setLookOpen(false); }}
                    className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-dpai-caption font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dpai-violet min-w-0">
                    <img alt="" className="size-3.5 shrink-0" src="/brand/ngodingpakeai-mark.svg" />PRD
                  </button>
                  {prdOpen && <div role="menu" className="dp-popover-menu">
                    <button role="menuitem" type="button" onClick={() => { window.location.assign("/handoff/ngoding"); }}>Impor PRD dari NgodingPakeAI</button>
                    <p>Belum ada PRD tersimpan di sesi ini.</p>
                  </div>}
                </span>
                <span className="inline-flex min-h-9 max-w-56 min-w-0 items-center rounded-lg bg-dpai-paper text-dpai-muted hover:bg-dpai-desk hover:text-dpai-ink">
                  <button type="button" data-composer-menu data-starter-look="true" aria-haspopup="dialog" aria-expanded={lookOpen}
                    aria-label={`Gaya tampilan: ${look.label}`} onClick={() => { setLookOpen(v => !v); setPrdOpen(false); }}
                    className="inline-flex min-h-9 max-w-56 min-w-0 cursor-pointer items-center gap-2 rounded-lg bg-dpai-paper px-2.5 text-dpai-caption font-medium text-dpai-muted hover:bg-dpai-desk hover:text-dpai-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dpai-violet">
                    <span aria-hidden="true" className="flex shrink-0 -space-x-0.5">
                      {look.colors.map((c, i) => <i key={i} className="size-3 rounded-[4px] ring-1 ring-dpai-surface" style={{ backgroundColor: c }} />)}
                    </span>
                    <span className="truncate">{look.label}</span>
                    <Icon name="chevronDown" size={14} className="shrink-0" />
                  </button>
                  {lookOpen && <div role="dialog" aria-label="Pilih gaya tampilan" className="dp-popover-menu dp-popover-look">
                    {LOOKS.map(option => <button type="button" key={option.id} onClick={() => { setLook(option); setLookOpen(false); }} className={option.id === look.id ? "selected" : ""}>
                      <span className="flex -space-x-0.5">{option.colors.map((c, i) => <i key={i} className="size-3 rounded-[4px] ring-1 ring-dpai-surface" style={{ backgroundColor: c }} />)}</span>
                      {option.label}
                    </button>)}
                  </div>}
                </span>
              </div>
              <p id="landing-hero-prompt-hint" className="mr-auto shrink-0 text-dpai-caption text-dpai-muted" role="status" aria-atomic="true">
                <span className="inline-block font-semibold tabular-nums">{valid ? "siap" : "min. 20"}</span>
                <span className="sr-only">{text.length} karakter. Minimal 20 karakter.</span>
              </p>
              <button aria-label="Mulai project dari ide ini" type="submit" disabled={!valid || busy}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-dpai-violet-dark text-white shadow-dpai-press transition-[background-color,scale] duration-150 ease-out hover:bg-dpai-violet-hover enabled:active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dpai-violet disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none">
                <Icon name="arrowUp" size={16} strokeWidth={2} />
              </button>
            </div>
            {error && <p className="dp-form-error" role="alert">{error}</p>}
          </div>
        </form>
      </div>
      <div className="mt-5 flex flex-wrap gap-2 max-[640px]:mt-4 max-[640px]:gap-1.5 justify-center">
        {STARTERS.map(s => <button key={s} type="button" onClick={() => useStarter(s)}
          className="inline-flex min-h-9 items-center rounded-full border border-dpai-line bg-dpai-chrome/80 px-3.5 text-dpai-label font-medium text-dpai-muted backdrop-blur-sm transition-[background-color,border-color,color,transform] duration-150 ease-out hover:-translate-y-px hover:border-dpai-violet/40 hover:bg-dpai-chrome hover:text-dpai-ink active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dpai-violet motion-reduce:transform-none motion-reduce:transition-none">{s}</button>)}
      </div>
    </div>
  </div>;
}
