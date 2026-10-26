import { Search } from "lucide-react";
import { BUDGETS, type Budget, type ModeKey } from "@/lib/data";
import { cap, iso } from "@/lib/plan";
import { INTERESTS } from "@/lib/options";
import Autocomplete, { type Suggestion } from "./Autocomplete";
import s from "./ui.module.css";

export interface HeroProps {
  from: string; to: string; date: string; endDate: string; travelers: number | string; budget: Budget | ""; interests: string[];
  modes: Record<ModeKey, boolean>; days: number;
  set: (patch: Partial<{ from: string; to: string; endDate: string; travelers: string; budget: Budget | ""; interests: string[] }>) => void;
  setDate: (v: string) => void; toggleMode: (m: ModeKey) => void; onSearch: () => void; fetchFrom: (q: string) => Promise<Suggestion[]>; fetchTo: (q: string) => Promise<Suggestion[]>; onPick: (field: "from" | "to", v: string) => void; busy: boolean; error: string; stale: boolean;
}

export default function SearchHero(p: HeroProps) {
  const start = new Date(p.date + "T00:00");
  const maxEnd = isNaN(start.getTime()) ? "" : iso(new Date(start.getTime() + 6 * 864e5));
  return (
    <header id="plan" className={`${s.wrap} ${s.hero}`}>
      <div className={s.circleA} /><div className={s.circleB} />
      <div className={s.heroText}>
        <span className="tag tag-accent-2">Trip planner</span>
        <h1 className={s.h1}>Where are we wandering next?</h1>
        <p className={s.lead}>Search a destination, pick an itinerary, choose how you get there — and see the whole trip priced up as you go.</p>
      </div>
      <form className={`card elev-md ${s.form}`} onSubmit={(e) => { e.preventDefault(); p.onSearch(); }}>
        <Autocomplete className={s.span2} label="From" strict placeholder="Leaving from" value={p.from} onChange={(v) => p.set({ from: v })} fetcher={p.fetchFrom} onPick={(v) => p.onPick("from", v)} />
        <Autocomplete className={s.span2} label="To" strict placeholder="Going to" value={p.to} onChange={(v) => p.set({ to: v })} fetcher={p.fetchTo} onPick={(v) => p.onPick("to", v)} />
        <div className={`field ${s.span2}`}>
          <label>Dates{p.date && p.endDate ? ` · ${p.days} ${p.days > 1 ? "days" : "day"}` : ""}</label>
          <div className={`input ${s.dateBox}`}>
            <input type="date" className={s.dateIn} value={p.date} onChange={(e) => p.setDate(e.target.value)} aria-label="Start date" />
            <span style={{ flex: "none", color: "var(--color-neutral-700)" }}>→</span>
            <input type="date" className={s.dateIn} value={p.endDate} min={p.date} max={maxEnd} onChange={(e) => p.set({ endDate: e.target.value })} aria-label="End date" />
          </div>
        </div>
        <div className="field"><label htmlFor="f-trav">Travelers</label><input id="f-trav" className="input" type="number" min={1} max={12} value={p.travelers} onChange={(e) => p.set({ travelers: e.target.value })} /></div>
        <div className={`field ${s.span2}`}>
          <label>Budget</label>
          <div className="seg" style={{ display: "flex" }}>
            {BUDGETS.map((b) => (
              <label key={b} className="seg-opt" style={{ flex: 1, justifyContent: "center" }}>
                <input type="radio" name="budget" checked={p.budget === b} onChange={() => p.set({ budget: b })} />{b}
              </label>
            ))}
          </div>
        </div>
        <div className={`field ${s.span2}`} style={{ gridColumn: "1 / -1" }}>
          <label>Interests{p.interests.length ? ` · ${p.interests.length} selected` : " · pick any"}</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {INTERESTS.map((i) => {
              const on = p.interests.includes(i);
              return (
                <button key={i} type="button" aria-pressed={on} className={`btn ${s.pill} ${on ? s.pillOn : s.pillOff}`}
                  onClick={() => p.set({ interests: on ? p.interests.filter((x) => x !== i) : [...p.interests, i] })}>
                  {on ? "✓" : "+"} {i}
                </button>
              );
            })}
          </div>
        </div>
        <div className={s.bottom}>
          <span style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>Travel by</span>
          {(["flight", "train", "bus"] as ModeKey[]).map((m) => (
            <button key={m} type="button" aria-pressed={p.modes[m]} className={`btn ${s.pill} ${p.modes[m] ? s.pillOn : s.pillOff}`} onClick={() => p.toggleMode(m)}>
              {p.modes[m] ? "✓" : "+"} {cap(m)}
            </button>
          ))}
          <button type="submit" disabled={p.busy} className={`btn btn-primary ${s.search}`}><Search size={18} strokeWidth={2.75} />{p.busy ? "Searching…" : "Search trips"}</button>
        </div>
      </form>
      <p className={s.note} role="status" style={p.error ? { color: "#b42318" } : undefined}>{p.error || (p.stale ? "Inputs changed — press Search trips to update the plan." : "Without YOUTUBE_API_KEY / ANTHROPIC_API_KEY, generated plans are shown instead of ones built from top YouTube videos.")}</p>
    </header>
  );
}
