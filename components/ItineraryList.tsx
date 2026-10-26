import { Play } from "lucide-react";
import type { Itinerary, Tip } from "@/lib/types";
import { dayDate, fmtViews, yt } from "@/lib/plan";
import { useCurrency } from "@/lib/currency";
import s from "./ui.module.css";

interface Props {
  itins: Itinerary[]; itin: number; setItin: (i: number) => void; days: number; city: string; budget: string; date: string;
  links: { label: string; url: string }[]; notes: string[];
}

const SLOT_COLORS = ["var(--color-accent-400)", "var(--color-accent-2-500)", "var(--color-neutral-800)"];
const GENERIC_TIPS: Tip[] = [
  { title: "Transport", text: "Check local transit passes or ride-hailing apps before you arrive; they are usually cheaper than single tickets." },
  { title: "Cash & cards", text: "Carry some cash for small vendors, entrance fees and tips, even where cards are accepted." },
  { title: "Book ahead", text: "Reserve popular attractions in advance, and start early to beat the crowds." },
];

function VideoSource({ it }: { it: Itinerary }) {
  const src = it.source;
  const url = src ? src.url : yt(it.title + " travel itinerary");
  return (
    <a href={url} target="_blank" rel="noreferrer" className={s.video}>
      <span style={{ width: 34, height: 34, flex: "none", borderRadius: "50%", background: "var(--color-accent)", color: "var(--color-bg)", display: "grid", placeItems: "center" }}>
        <Play size={14} strokeWidth={2.75} fill="currentColor" />
      </span>
      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
        <span style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>{src ? "Built from this video" : "Find videos on YouTube"}</span>
        <span style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{src ? src.title : it.title}</span>
      </span>
      {src && <span style={{ flex: "none", fontSize: 12, color: "var(--color-neutral-700)" }}>{src.channel} · {fmtViews(src.views)} views</span>}
    </a>
  );
}

function DayCard({ n, date, title, places }: { n: number; date: string; title: string; places: Itinerary["days"][number]["places"] }) {
  return (
    <div className={s.day}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 18 }}>Day {n}</span>
        <span style={{ fontSize: 12, color: "var(--color-neutral-700)" }}>{date}</span>
      </div>
      {title && <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, color: "var(--color-accent-2-700)", marginTop: -6, marginBottom: 8 }}>{title}</div>}
      {places.map((p, j) => (
        <div key={p.name + j} className={s.slot}>
          <span style={{ width: 8, height: 8, marginTop: 7, flex: "none", borderRadius: "50%", background: SLOT_COLORS[j % 3] }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>{[p.period, p.time].filter(Boolean).join(" · ")}</div>
            <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.3 }}>{p.name}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TipsBox({ tips }: { tips: Tip[] }) {
  return (
    <div className={s.tips}>
      <h4 style={{ margin: "0 0 12px", fontSize: 18, color: "var(--color-accent-2-900)" }}>Good to know</h4>
      <div className={s.tipsGrid}>
        {tips.map((t) => (
          <div key={t.title}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--color-accent-2-900)" }}>{t.title}</div>
            <div style={{ fontSize: 13, color: "var(--color-accent-2-800)", textWrap: "pretty" }}>{t.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ItineraryCard({ i, sel, p }: { i: number; sel: boolean; p: Props }) {
  const { money } = useCurrency();
  const it = p.itins[i];
  const names = [...new Set(it.days.flatMap((d) => d.places.map((x) => x.name)))];
  const highlights = [p.city, ...names.slice(0, 3)];
  return (
    <article className={`card ${s.itin} ${sel ? s.itinSel : ""}`}>
      <button type="button" className={s.itinBtn} aria-pressed={sel} onClick={() => p.setItin(i)}>
        <span className={`${s.ring} ${sel ? s.ringOn : ""}`} />
        <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 21 }}>{it.title}</span>
          <span style={{ fontSize: 14, color: "var(--color-neutral-700)" }}>{it.summary}</span>
        </span>
        <span style={{ textAlign: "right", flex: "none" }}>
          <span style={{ display: "block", fontFamily: "var(--font-heading)", fontSize: 22 }}>~{money(it.estActivitiesCostPerPerson)}</span>
          <span style={{ fontSize: 12, color: "var(--color-neutral-700)" }}>per person · activities</span>
        </span>
      </button>
      <VideoSource it={it} />
      {sel ? (
        <>
          <div className={s.days}>
            {it.days.map((d) => <DayCard key={d.day} n={d.day} title={d.title.replace(/^Day \d+:?\s*/i, "")} date={dayDate(p.date, d.day - 1)} places={d.places} />)}
          </div>
          <TipsBox tips={it.tips?.length ? it.tips : GENERIC_TIPS} />
        </>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "0 26px 22px 66px" }}>
          {highlights.map((h) => <span key={h} className="tag tag-neutral" style={{ fontSize: 12 }}>{h}</span>)}
        </div>
      )}
    </article>
  );
}

export default function ItineraryList(p: Props) {
  return (
    <section id="itinerary" className={s.section}>
      <div className={s.head}>
        <span className={s.step} style={{ background: "var(--color-accent)" }}>1</span>
        <div><h2 className={s.h2}>Choose an itinerary</h2><div className={s.sub}>{p.days} {p.days > 1 ? "days" : "day"} in {p.city} · tuned for {p.budget.toLowerCase()}</div></div>
      </div>
      {p.notes.map((n) => <div key={n} className={s.sub}>{n}</div>)}
      {p.itins.map((_, i) => <ItineraryCard key={i} i={i} sel={i === p.itin} p={p} />)}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "6px 2px" }}>
        <span style={{ fontSize: 13, color: "var(--color-neutral-700)", marginRight: 4 }}>More on YouTube</span>
        {p.links.map((l) => <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className={`tag tag-outline ${s.ytTag}`}>{l.label}</a>)}
      </div>
    </section>
  );
}
