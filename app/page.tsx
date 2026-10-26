"use client";

import { useEffect, useRef, useState } from "react";
import Nav from "@/components/Nav";
import SearchHero from "@/components/SearchHero";
import ItineraryList from "@/components/ItineraryList";
import GettingThere from "@/components/GettingThere";
import TripSummary from "@/components/TripSummary";
import s from "@/components/ui.module.css";
import { CurrencyProvider } from "@/lib/currency";
import { BUDGET_KEY, type Budget, type ModeKey, type Opt } from "@/lib/data";
import { cap, derive, hopsFor, iso, toOpt, tripDays, type Query } from "@/lib/plan";
import type { Itinerary, SearchLink, TransportOption } from "@/lib/types";

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json as T;
}

const sessions: Record<string, string> = {};
const fetchCities = (field: string) => async (q: string) => {
  const session = (sessions[field] ??= crypto.randomUUID());
  const r = await fetch(`/api/places?q=${encodeURIComponent(q)}&session=${session}`);
  return ((await r.json()).suggestions ?? []) as { value: string; sub?: string }[];
};
const fetchFrom = fetchCities("from");
const fetchTo = fetchCities("to");

const ALL: ModeKey[] = ["flight", "train", "bus"];
interface Result { q: Query; budget: Budget; itins: Itinerary[]; links: SearchLink[]; notes: string[]; tx: Record<string, Opt[]>; warnings: string[] }

export default function Home() {
  const [f, setF] = useState({
    from: "", to: "", date: "", endDate: "", travelers: "",
    budget: "" as Budget | "", interest: "", modes: { flight: true, train: true, bus: true } as Record<ModeKey, boolean>,
  });
  const [itin, setItin] = useState(0);
  const [filter, setFilter] = useState<"all" | ModeKey>("all");
  const [sel, setSel] = useState<Record<string, number>>({});
  const [booked, setBooked] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [picked, setPicked] = useState<{ from?: string; to?: string }>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const results = useRef<HTMLDivElement>(null);

  const update = (patch: Partial<typeof f>) => { setF((p) => ({ ...p, ...patch })); setBooked(false); };
  const days = tripDays(f.date, f.endDate);

  const search = async () => {
    if (picked.from !== f.from || picked.to !== f.to) return setError("Please pick both cities from the suggestions.");
    if (!f.from.trim() || !f.to.trim()) return setError("Enter both a From and a To city.");
    if (!f.date || !f.endDate) return setError("Choose your start and end dates.");
    if (!f.budget) return setError("Choose a budget.");
    const budget = f.budget;
    if (f.from.trim().toLowerCase() === f.to.trim().toLowerCase()) return setError("From and To must be different.");
    setError(""); setBusy(true); setBooked(false);
    const q: Query = { from: f.from.trim(), to: f.to.trim(), date: f.date, days };
    try {
      const it = await post<{ itineraries: Itinerary[]; searchLinks: SearchLink[]; notes: string[]; country: boolean }>("/api/itineraries", {
        from: q.from, to: q.to, date: q.date, days, travelers: Number(f.travelers) || 1, budget: BUDGET_KEY[budget], interests: f.interest, modes: ALL,
      });
      q.country = it.country;
      // One transport search per distinct journey across all itineraries (outbound, between cities, return).
      const hops = new Map(it.itineraries.flatMap((x) => hopsFor(q, x)).map((h) => [h.id, h]));
      const found = await Promise.all([...hops.values()].map((h) =>
        post<{ options: TransportOption[]; warnings: string[] }>("/api/transport", { from: h.from, to: h.to, date: h.date, modes: ALL }).then((r) => [h.id, r] as const)));
      const tx: Record<string, Opt[]> = {};
      const warnings = new Set<string>();
      for (const [id, r] of found) { tx[id] = r.options.map(toOpt); r.warnings.forEach((w) => warnings.add(w)); }
      setRes({ q, budget, itins: it.itineraries, links: it.searchLinks, notes: it.notes, tx, warnings: [...warnings] });
      setItin(0); setSel({}); setFilter("all");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { if (res) results.current?.scrollIntoView({ behavior: "smooth" }); }, [res]);

  const setDate = (v: string) => {
    const sd = new Date(v + "T00:00");
    update({ date: v, endDate: isNaN(sd.getTime()) ? f.endDate : f.endDate ? iso(new Date(sd.getTime() + (days - 1) * 864e5)) : v });
  };

  const stale = !!res && (res.q.from !== f.from.trim() || res.q.to !== f.to.trim() || res.q.date !== f.date || res.q.days !== days || res.budget !== f.budget);
  const d = res && res.itins[itin] ? derive({ q: res.q, it: res.itins[itin], tx: res.tx, travelers: f.travelers, modes: f.modes, filter, sel }) : null;
  const start = res ? new Date(res.q.date + "T00:00") : null;

  return (
    <CurrencyProvider>
    <div className={s.root}>
      <Nav />
      <SearchHero
        {...f} days={days} busy={busy} error={error} stale={stale}
        set={(patch) => update(patch)} setDate={setDate}
        toggleMode={(m) => update({ modes: { ...f.modes, [m]: !f.modes[m] } })}
        onSearch={search} fetchFrom={fetchFrom} fetchTo={fetchTo}
        onPick={(field, v) => { setPicked((p) => ({ ...p, [field]: v })); delete sessions[field]; }}
      />
      <div ref={results} />
      {res && d && start && (
        <main className={`${s.wrap} ${s.main}`}>
          <div className={s.left}>
            <ItineraryList itins={res.itins} itin={itin} setItin={(i) => { setItin(i); setBooked(false); }} days={res.q.days} city={d.city}
              budget={res.budget} date={res.q.date} links={res.links} notes={res.notes} />
            <GettingThere
              legs={d.legs} filter={filter} setFilter={setFilter} warnings={res.warnings}
              label={`${d.legs.length} legs for ${res.itins[itin].title} · ${d.home} → ${d.city} → ${d.home}`}
              pick={(key, j) => { setSel({ ...sel, [d.selKey(key)]: j }); setBooked(false); }}
            />
          </div>
          <TripSummary
            route={`${d.home} → ${d.city}`}
            meta={`${isNaN(start.getTime()) ? "" : start.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + " · "}${res.q.days} ${res.q.days > 1 ? "days" : "day"} · ${res.budget}`}
            itinName={res.itins[itin].title} actTotal={d.actPP * d.trav}
            transName={`${d.legs.length} legs · ${d.usedModes.map(cap).join(", ") || "none picked"}`} transTotal={d.transPP * d.trav}
            travelers={d.trav} perPerson={d.actPP + d.transPP} booked={booked} onBook={() => setBooked(true)}
          />
        </main>
      )}
    </div>
    </CurrencyProvider>
  );
}
