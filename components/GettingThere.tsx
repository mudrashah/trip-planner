import { Bus, Plane, TrainFront } from "lucide-react";
import type { ModeKey, Opt } from "@/lib/data";
import { cap, type ResolvedLeg } from "@/lib/plan";
import { useCurrency } from "@/lib/currency";
import s from "./ui.module.css";

const KIND = {
  International: { tag: "tag-accent", bg: "var(--color-accent)", fg: "var(--color-bg)" },
  Intercity: { tag: "tag-accent-2", bg: "var(--color-accent-2)", fg: "var(--color-bg)" },
  Local: { tag: "tag-neutral", bg: "var(--color-neutral-300)", fg: "var(--color-text)" },
} as const;

const ICON = { flight: Plane, train: TrainFront, bus: Bus };

function TransportOption({ o, sel, onPick }: { o: Opt; sel: boolean; onPick: () => void }) {
  const Icon = ICON[o.mode];
  const { money } = useCurrency();
  return (
    <button type="button" aria-pressed={sel} onClick={onPick} className={`${s.opt} ${sel ? s.optSel : ""}`}>
      <span className={`${s.icon} ${sel ? s.iconSel : ""}`}><Icon size={20} strokeWidth={2.75} /></span>
      <span style={{ flex: "1 1 170px", minWidth: 0, display: "flex", flexDirection: "column" }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{o.op}</span>
        <span style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>{cap(o.mode)} · {o.cls}</span>
      </span>
      <span style={{ flex: "1 1 170px", display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600 }}>
        {o.dep}
        <span style={{ flex: 1, minWidth: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <span style={{ fontSize: 11, fontWeight: 400, color: "var(--color-neutral-700)" }}>{o.dur}</span>
          <span style={{ width: "100%", height: 2, borderRadius: 2, background: "var(--color-neutral-400)" }} />
        </span>
        {o.arr}
      </span>
      <span style={{ flex: "none", minWidth: 70, textAlign: "right", fontFamily: "var(--font-heading)", fontSize: 21 }}>{money(o.p)}</span>
    </button>
  );
}

function LegRow({ leg, onPick }: { leg: ResolvedLeg; onPick: (j: number) => void }) {
  const k = KIND[leg.kind];
  return (
    <div style={{ display: "flex", gap: 18 }}>
      <div style={{ flex: "none", width: 44, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span style={{ width: 44, height: 44, flex: "none", borderRadius: "50%", display: "grid", placeItems: "center", fontFamily: "var(--font-heading)", fontSize: 16, background: k.bg, color: k.fg }}>{leg.n}</span>
        <span style={{ flex: 1, width: 3, minHeight: 20, margin: "8px 0", borderRadius: 3, background: "var(--color-neutral-300)" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10, padding: "6px 0 32px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
          <span className={`tag ${k.tag}`}>{leg.kind}</span>
          <span style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>{leg.when}</span>
        </div>
        <h4 style={{ margin: 0, fontSize: 21 }}>{leg.title}</h4>
        {leg.hops && leg.hops.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {leg.hops.map((h) => <span key={h} className="tag tag-neutral" style={{ fontSize: 12 }}>{h}</span>)}
          </div>
        )}
        {leg.note && <div style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>{leg.note}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {leg.visible.map((o) => <TransportOption key={o.j} o={o} sel={o.j === leg.effJ} onPick={() => onPick(o.j)} />)}
          {leg.visible.length === 0 && (
            <div style={{ padding: "14px 20px", borderRadius: "var(--radius-lg)", background: "var(--color-surface)", fontSize: 14, color: "var(--color-neutral-800)" }}>
              No matching options on this leg — switch the filter or turn more travel modes on.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props { legs: ResolvedLeg[]; label: string; filter: "all" | ModeKey; setFilter: (f: "all" | ModeKey) => void; pick: (legKey: string, j: number) => void }

export default function GettingThere({ legs, label, filter, setFilter, pick }: Props) {
  return (
    <section id="transport" className={s.section}>
      <div className={s.head} style={{ flexWrap: "wrap" }}>
        <span className={s.step} style={{ background: "var(--color-accent-2)" }}>2</span>
        <div style={{ flex: 1, minWidth: 220 }}><h2 className={s.h2}>Getting there</h2><div className={s.sub}>{label}</div></div>
        <div className="seg">
          {(["all", "flight", "train", "bus"] as const).filter((f) => f === "all" || legs.some((l) => l.opts.some((o) => o.mode === f))).map((f) => (
            <label key={f} className="seg-opt"><input type="radio" name="tf" checked={filter === f} onChange={() => setFilter(f)} />{cap(f)}</label>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {legs.map((leg) => <LegRow key={leg.key} leg={leg} onPick={(j) => pick(leg.key, j)} />)}
      </div>
    </section>
  );
}
