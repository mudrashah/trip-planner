import type { Mode } from "./types";

export interface Geo { lat: number; lon: number; country: string; countryCode: string }
export interface PlaceHit { value: string; sub?: string }

const BASE = "https://photon.komoot.io/api/";
const cache = new Map<string, Geo | null>();
const kindCache = new Map<string, PlaceKind>();

export type PlaceKind = "city" | "region" | "country";
const KINDS: Record<string, PlaceKind> = { city: "city", county: "region", state: "region", country: "country" };

interface Feature { name: string; type: string; kind: PlaceKind; county?: string; state?: string; country: string; countryCode: string; lat: number; lon: number }

const RANK: Record<PlaceKind, number> = { country: 0, region: 1, city: 2 };
const UA = { "User-Agent": "trip-planner" };

async function photon(q: string, limit: number): Promise<Feature[]> {
  const res = await fetch(`${BASE}?q=${encodeURIComponent(q)}&osm_tag=place&limit=${limit}&lang=en`, { headers: UA });
  if (!res.ok) throw new Error(`Photon failed: ${res.status}`);
  const out: Feature[] = [];
  for (const f of (await res.json()).features ?? []) {
    const p = f.properties ?? {};
    const kind = KINDS[p.type];
    if (!kind || !p.name || !p.country) continue;
    out.push({ name: p.name, type: p.type, kind, county: p.county, state: p.state, country: p.country, countryCode: String(p.countrycode ?? ""), lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] });
  }
  return out;
}

/** Fallback when Photon is down: Open-Meteo (prefix match on cities/countries) + Nominatim (states, counties, exact names). */
async function fallback(q: string, limit: number): Promise<Feature[]> {
  const [om, nom] = await Promise.allSettled([
    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=${limit}&language=en`).then((r) => r.json()),
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=jsonv2&addressdetails=1&limit=${limit}&accept-language=en`, { headers: UA }).then((r) => r.json()),
  ]);
  const out: Feature[] = [];
  if (om.status === "fulfilled") {
    for (const r of om.value.results ?? []) {
      const type = r.feature_code === "PCLI" ? "country" : r.feature_code === "ADM1" ? "state" : r.feature_code === "ADM2" ? "county" : String(r.feature_code).startsWith("PPL") ? "city" : "";
      if (!type || !r.country) continue;
      out.push({ name: r.name, type, kind: KINDS[type], state: r.admin1, county: r.admin2, country: r.country, countryCode: String(r.country_code ?? "").toLowerCase(), lat: r.latitude, lon: r.longitude });
    }
  }
  if (nom.status === "fulfilled" && Array.isArray(nom.value)) {
    const T: Record<string, string> = { city: "city", town: "city", village: "city", municipality: "city", county: "county", state: "state", region: "state", country: "country" };
    for (const r of nom.value) {
      const type = T[r.addresstype];
      const a = r.address ?? {};
      if (r.category !== "place" && r.category !== "boundary") continue; // skip airports, shops, buildings
      if (!type || !a.country) continue;
      out.push({ name: r.name, type, kind: KINDS[type], state: a.state, county: type === "city" ? a.county : undefined, country: a.country, countryCode: String(a.country_code ?? ""), lat: Number(r.lat), lon: Number(r.lon) });
    }
  }
  if (!out.length && om.status === "rejected" && nom.status === "rejected") throw new Error("All geocoders failed");
  return out;
}

/** Cities, counties, states and countries. Photon first (best prefix matching), fallbacks if it is unreachable. */
async function lookup(q: string, limit: number): Promise<Feature[]> {
  try { return await photon(q, limit); }
  catch (e) { console.error("Photon unavailable, using fallback geocoders:", (e as Error).message); return fallback(q, limit); }
}

/** "Kyoto, Kyoto Prefecture, Japan" / "Rajasthan, India" / "Japan". */
const label = (f: Feature) =>
  [f.name, f.type === "city" || f.type === "county" ? f.state : undefined, f.kind === "country" ? undefined : f.country]
    .filter((x, i, a) => x && a.indexOf(x) === i).join(", ");

const subOf = (f: Feature) => ({ city: undefined, county: "County", state: "State / region", country: "Country" })[f.type as "city"];

/** Free, keyless worldwide search by city, county, state/region or country. */
export async function searchPlaces(q: string): Promise<PlaceHit[]> {
  try {
    const seen = new Set<string>();
    const norm = (x: string) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const ql = norm(q.trim());
    // Names starting with what was typed first, then countries, regions, cities (stable within each group).
    const rows = (await lookup(q, 15)).map((f, i) => ({ f, i, pre: norm(f.name).startsWith(ql) ? 0 : 1 })).sort((a, b) => a.pre - b.pre || RANK[a.f.kind] - RANK[b.f.kind] || a.i - b.i).map((x) => x.f);
    return rows.map((f) => ({ value: label(f), sub: subOf(f) }))
      .filter((h) => !seen.has(h.value) && !!seen.add(h.value)).slice(0, 8);
  } catch (e) {
    console.error("Place search failed:", e);
    return [];
  }
}

async function resolve(place: string): Promise<Feature | null> {
  const parts = place.split(",").map((p) => p.trim().toLowerCase());
  const rows = await lookup(parts[0], 15);
  const score = (f: Feature) =>
    (f.name.toLowerCase() === parts[0] ? 4 : 0) +
    (parts.length > 1 && f.country.toLowerCase() === parts[parts.length - 1] ? 3 : 0) +
    (parts.length > 2 && [f.state, f.county].some((x) => x?.toLowerCase() === parts[1]) ? 2 : 0) +
    (label(f).toLowerCase() === place.trim().toLowerCase() ? 4 : 0);
  const best = [...rows].sort((a, b) => score(b) - score(a))[0];
  return best && score(best) >= 4 ? best : null;
}

/** Whether the string names a city, a region (state/county) or a whole country. */
export async function placeKind(place: string): Promise<PlaceKind> {
  if (kindCache.has(place)) return kindCache.get(place)!;
  let kind: PlaceKind = "city";
  try { kind = (await resolve(place))?.kind ?? "city"; } catch { /* treat as a city */ }
  kindCache.set(place, kind);
  return kind;
}

/** Coordinates + country for a place string. */
export async function geocode(place: string): Promise<Geo | null> {
  if (cache.has(place)) return cache.get(place)!;
  let out: Geo | null = null;
  try {
    const f = await resolve(place);
    if (f) out = { lat: f.lat, lon: f.lon, country: f.country, countryCode: f.countryCode };
  } catch (e) {
    console.error("Geocode failed:", e);
  }
  cache.set(place, out);
  return out;
}

export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/**
 * Which modes plausibly serve this route. Flights need an airport near both ends;
 * trains and buses need a land route, approximated as "same country" within a range.
 */
export function availableModes(
  from: Geo | null, to: Geo | null, hasAirports: boolean,
): { modes: Mode[]; reasons: Partial<Record<Mode, string>> } {
  const reasons: Partial<Record<Mode, string>> = {};
  const km = from && to ? distanceKm(from, to) : null;
  const sameCountry = !!from && !!to && from.countryCode === to.countryCode;
  const modes: Mode[] = [];

  if (km !== null && km < 150) reasons.flight = "too close for a flight";
  else if (!hasAirports) reasons.flight = "no airport found near one of the cities";
  else modes.push("flight");

  if (km === null) { reasons.train = reasons.bus = "couldn't locate the cities"; }
  else {
    if (!sameCountry) reasons.train = reasons.bus = "different countries (no direct land service)";
    else {
      if (km > 1800) reasons.train = "too far for a direct train"; else modes.push("train");
      if (km > 1200) reasons.bus = "too far for a direct bus"; else modes.push("bus");
    }
  }
  return { modes, reasons };
}
