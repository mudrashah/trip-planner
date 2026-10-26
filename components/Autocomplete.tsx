"use client";

import { useEffect, useId, useRef, useState } from "react";
import s from "./ui.module.css";

export interface Suggestion { value: string; sub?: string }

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** Static list (filtered locally) or async lookup (called debounced as the user types). */
  suggestions?: Suggestion[];
  fetcher?: (q: string) => Promise<Suggestion[]>;
  onPick?: (v: string) => void;
  placeholder?: string;
  /** Typed text must be picked from the list (shows a hint otherwise). */
  strict?: boolean;
  /** Value that counts as already picked (e.g. a default). */
  initialPicked?: string;
  className?: string;
}

export default function Autocomplete({ label, value, onChange, suggestions, fetcher, onPick, placeholder, strict, initialPicked, className }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState(false);
  const [picked, setPicked] = useState(initialPicked ?? "");
  const [remote, setRemote] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) { setOpen(false); setTouched(true); }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    if (!fetcher || value === picked || value.trim().length < 2) { setRemote([]); return; }
    let stale = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try { const r = await fetcher(value.trim()); if (!stale) setRemote(r); }
      catch { if (!stale) setRemote([]); }
      finally { if (!stale) setLoading(false); }
    }, 250);
    return () => { stale = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, picked]);

  const q = value.trim().toLowerCase();
  const matches = (fetcher ? remote : (suggestions ?? [])
    .filter((x) => !q || x.value.toLowerCase().includes(q))
    .sort((a, b) => Number(b.value.toLowerCase().startsWith(q)) - Number(a.value.toLowerCase().startsWith(q)))
  ).slice(0, 8);

  const pick = (sg: Suggestion) => { setPicked(sg.value); onChange(sg.value); onPick?.(sg.value); setOpen(false); };
  const invalid = strict && touched && value && value !== picked;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, matches.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && open && matches[active]) { e.preventDefault(); pick(matches[active]); }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div className={`field ${className ?? ""}`} ref={box} style={{ position: "relative", minWidth: 0 }}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className="input"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(0); }}
        onKeyDown={onKey}
        style={invalid ? { borderColor: "#b42318" } : undefined}
      />
      {invalid && <span style={{ fontSize: 12, color: "#b42318" }}>Pick a city from the list</span>}
      {open && (matches.length > 0 || loading) && (
        <ul className={s.acList} role="listbox">
          {matches.map((sg, i) => (
            <li
              key={sg.value}
              role="option"
              aria-selected={i === active}
              className={i === active ? s.acOn : ""}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => { e.preventDefault(); pick(sg); }}
            >
              <span>{sg.value}</span>
              {sg.sub && <small>{sg.sub}</small>}
            </li>
          ))}
          {loading && !matches.length && <li style={{ color: "var(--color-neutral-700)" }}>Searching…</li>}
        </ul>
      )}
    </div>
  );
}
