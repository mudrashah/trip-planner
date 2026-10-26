import { HOP_MIN, type ModeKey, type Opt } from "./data";
import type { Itinerary, TransportOption } from "./types";

export const yt = (q: string) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
export const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
export const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);

export function tripDays(date: string, endDate: string) {
  const diff = Math.round((new Date(endDate + "T00:00").getTime() - new Date(date + "T00:00").getTime()) / 864e5) + 1;
  return Math.max(1, Math.min(7, isNaN(diff) ? 1 : diff));
}

export function dayDate(date: string, d: number) {
  const dt = new Date(new Date(date + "T00:00").getTime() + d * 864e5);
  return isNaN(dt.getTime()) ? "" : dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export const fmtViews = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n));
const hm = (m: number) => `${Math.floor(m / 60)}h ${m % 60}m`;
const timeOf = (s: string) => s.slice(11, 16);

/** Map an API transport option onto the row shape the design renders. */
export function toOpt(t: TransportOption): Opt {
  return {
    mode: t.mode, op: t.provider,
    cls: t.class + (t.fromCode && t.toCode ? ` · ${t.fromCode} → ${t.toCode}` : ""),
    dep: timeOf(t.departure), arr: timeOf(t.arrival), dur: hm(t.durationMin), p: t.baseFare,
  };
}

export type LegKind = "International" | "Intercity" | "Local";
export interface Leg { key: string; kind: LegKind; title: string; when: string; note?: string; hops?: string[]; opts: Opt[] }
export interface ResolvedLeg extends Leg {
  n: number;
  visible: (Opt & { j: number })[];
  effJ: number | undefined;
}

export interface Query { from: string; to: string; date: string; days: number; country?: boolean }

const first = (place: string, fallback: string) => (place.split(",")[0] || fallback).trim();
const addDays = (date: string, n: number) => iso(new Date(new Date(date + "T00:00").getTime() + n * 864e5));

/** A point-to-point journey the traveller needs transport for (outbound, between cities, return). */
export interface Hop { id: string; key: string; from: string; to: string; date: string; kind: LegKind; title: string; when: string }
export const hopId = (from: string, to: string, date: string) => `${from}|${to}|${date}`;

/** Cities visited in order (one for a city trip, several for a country trip) with the day index each starts on. */
export function stopsFor(q: Query, it: Itinerary) {
  const stops: { name: string; place: string; day: number }[] = [];
  if (q.country) {
    it.days.forEach((d, i) => {
      const name = d.city || first(q.to, "Destination");
      if (stops[stops.length - 1]?.name !== name) stops.push({ name, place: `${name}, ${q.to}`, day: i });
    });
  } else stops.push({ name: first(q.to, "Destination"), place: q.to, day: 0 });
  return stops;
}

export function hopsFor(q: Query, it: Itinerary): Hop[] {
  const n = it.days.length;
  const home = first(q.from, "Home");
  const stops = stopsFor(q, it);
  const last = stops[stops.length - 1];
  const mk = (key: string, from: string, to: string, day: number, kind: LegKind, title: string, suffix = ""): Hop => {
    const date = addDays(q.date, day);
    return { id: hopId(from, to, date), key, from, to, date, kind, title, when: `Day ${day + 1} · ${dayDate(q.date, day)}${suffix}` };
  };
  return [
    mk("out", q.from, stops[0].place, 0, "International", `${home} → ${stops[0].name}`),
    ...stops.slice(1).map((s, i) => mk(`hop${i + 1}`, stops[i].place, s.place, s.day, "Intercity", `${stops[i].name} → ${s.name}`)),
    mk("ret", last.place, q.from, n - 1, "International", `${last.name} → ${home}`, " · return"),
  ];
}

export function buildLegs(q: Query, it: Itinerary, tx: Record<string, Opt[]>): Leg[] {
  const stops = stopsFor(q, it);
  const city = q.country ? stops.map((s) => s.name).join(" · ") : stops[0].name;
  const n = it.days.length;
  const hops: string[] = [];
  let mins = 0, rides = 0;
  it.days.forEach((d) => d.places.forEach((p, j) => {
    if (!j) return;
    const mn = HOP_MIN[(d.day + j) % 6];
    mins += mn; rides++;
    hops.push(p.name === d.places[j - 1].name ? "" : d.places[j - 1].name + " → " + p.name + " · " + mn + " min");
  }));
  const dayWord = n + (n > 1 ? " days" : " day");
  const legs: Leg[] = hopsFor(q, it).map((h) => ({ key: h.key, kind: h.kind, title: h.title, when: h.when, opts: tx[h.id] ?? [] }));
  const local: Leg = {
    key: "local", kind: "Local", title: `Getting around ${city}`, when: n > 1 ? `Days 1–${n}` : "Day 1", hops: hops.filter(Boolean).slice(0, 8),
    opts: [
      { mode: "train", op: `${city} Metro & rail`, cls: `IC card · ${dayWord}`, dep: "", arr: "", dur: `${rides} rides · ~${mins} min`, p: 8 * n },
      { mode: "bus", op: `${city} City Bus`, cls: `Day pass · ${dayWord}`, dep: "", arr: "", dur: "Unlimited rides", p: 5 * n },
    ],
  };
  legs.splice(legs.length - 1, 0, local);
  return legs;
}

export interface Inputs {
  q: Query; it: Itinerary; tx: Record<string, Opt[]>;
  travelers: number | string; modes: Record<ModeKey, boolean>; filter: "all" | ModeKey; sel: Record<string, number>;
}

export function derive(s: Inputs) {
  const { q, it } = s;
  const trav = Math.max(1, parseInt(String(s.travelers)) || 1);
  const city = (q.to.split(",")[0] || "Destination").trim();
  const home = (q.from.split(",")[0] || "Home").trim();
  const raw = buildLegs(q, it, s.tx);
  const selKey = (k: string) => `${it.id}:${q.days}:${k}`;
  let transPP = 0;
  const used = new Set<ModeKey>();
  const legs: ResolvedLeg[] = raw.map((lg, i) => {
    const indexed = lg.opts.map((x, j) => ({ ...x, j }));
    const visible = indexed.filter((x) => s.modes[x.mode] && (s.filter === "all" || x.mode === s.filter));
    const pool = indexed.filter((x) => s.modes[x.mode]);
    const chosen = s.sel[selKey(lg.key)];
    const eff = pool.find((x) => x.j === chosen) || pool.slice().sort((a, b) => a.p - b.p)[0];
    if (eff) { transPP += eff.p; used.add(eff.mode); }
    return { ...lg, n: i + 1, visible, effJ: eff?.j };
  });
  return { trav, city, home, legs, selKey, actPP: it.estActivitiesCostPerPerson, transPP, usedModes: [...used] };
}
