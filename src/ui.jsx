import React, { useEffect } from "react";

const paths = {
  arrowUp: <><path d="M8 13V3.5M3.75 7.75 8 3.5l4.25 4.25" strokeLinecap="round" strokeLinejoin="round" /></>,
  arrowRight: <><path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" /></>,
  chevronDown: <path d="M18 9C18 9 13.5811 15 12 15 10.4188 15 6 9 6 9" strokeLinecap="round" strokeLinejoin="round" />,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" /></>,
  close: <><path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" /></>,
  phone: <><path d="M13.5 2H10.5C8.143 2 6.964 2 6.232 2.732 5.5 3.464 5.5 4.643 5.5 7v10c0 2.357 0 3.536.732 4.268.732.732 1.911.732 4.268.732h3c2.357 0 3.536 0 4.268-.732.732-.732.732-1.911.732-4.268V7c0-2.357 0-3.536-.732-4.268C17.035 2 15.857 2 13.5 2Z" /><path d="M12.125 19H12M12.25 19a.25.25 0 1 1-.5 0 .25.25 0 0 1 .5 0Z" /></>,
  desktop: <><path d="M16 3H8C5.172 3 3.757 3 2.879 3.879 2 4.757 2 6.172 2 9v2c0 2.828 0 4.243.879 5.121C3.757 17 5.172 17 8 17h8c2.828 0 4.243 0 5.121-.879C22 15.243 22 13.828 22 11V9c0-2.828 0-4.243-.879-5.121C20.243 3 18.828 3 16 3Z" /><path d="M14 21h2M14 21c-.828 0-1.5-.672-1.5-1.5V17l-.5 0M10 21H8m2 0c.828 0 1.5-.672 1.5-1.5V17l.5 0m0 0v4" /></>,
  check: <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />,
  plus: <path d="M12 5v14M5 12h14" strokeLinecap="round" />,
  trash: <><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /><path d="M10 11v6M14 11v6" /></>,
  upload: <><path d="M12 16V4m0 0L8 8m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 16v3h16v-3" /></>,
  download: <><path d="M12 4v12m0 0 4-4m-4 4-4-4" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 18v2h16v-2" /></>,
  spark: <><path d="M12 3v4m0 10v4M3 12h4m10 0h4M5.6 5.6l2.8 2.8m7.2 7.2 2.8 2.8m0-12.8-2.8 2.8m-7.2 7.2-2.8 2.8" strokeLinecap="round" /></>,
  chat: <path d="M20 12a8 8 0 0 1-8 8H8l-4 2 1.2-4A8 8 0 1 1 20 12Z" strokeLinejoin="round" />,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" strokeLinejoin="round" /><path d="m3 13 9 5 9-5M3 17l9 5 9-5" strokeLinejoin="round" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.5 5.6 3.5 9S14.5 18.4 12 21c-2.5-2.6-3.5-5.6-3.5-9S9.5 5.6 12 3Z" /></>,
  search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" strokeLinecap="round" /></>,
  external: <><path d="M13 5h6v6M19 5l-8 8" strokeLinecap="round" strokeLinejoin="round" /><path d="M19 14v5H5V5h5" strokeLinecap="round" /></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5" strokeLinecap="round" strokeLinejoin="round" /><path d="M6.3 9A7 7 0 0 1 18 7l2 5M4 12l2 5a7 7 0 0 0 11.7-2" strokeLinecap="round" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9v.01a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" /></>
};

export function Icon({ name, size = 16, className = "", strokeWidth = 1.6 }) {
  return <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}>{paths[name] || paths.check}</svg>;
}

export function Modal({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return <div className="dp-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className={`dp-modal ${wide ? "dp-modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
      <header><h2>{title}</h2><button type="button" className="dp-icon-button" aria-label="Tutup" onClick={onClose}><Icon name="close" size={18} /></button></header>
      <div className="dp-modal-body">{children}</div>
    </div>
  </div>;
}

export function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [message, onClose]);
  if (!message) return null;
  return <div className="dp-toast" role="status"><Icon name="check" size={16} /> <span>{message}</span></div>;
}
