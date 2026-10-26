import { CITIES } from "./options";
import { distanceKm, geocode, placeKind } from "./geo";

export interface Resolved { code: string; name: string }

let token: { value: string; exp: number } | null = null;

async function amadeusToken(base: string, id: string, secret: string) {
  if (token && token.exp > Date.now() + 30_000) return token.value;
  const res = await fetch(`${base}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: id, client_secret: secret }),
  });
  if (!res.ok) throw new Error(`Amadeus auth failed: ${res.status}`);
  const j = await res.json();
  token = { value: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return token.value;
}

const MAIN = new Set(["DEL", "HND", "LHR", "CDG", "FCO", "BKK", "DXB", "JFK", "SIN", "AMS", "BCN"]); // preferred gateway per country
const cache = new Map<string, Resolved | null>();
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

/** Turn a Places string like "Mumbai, Maharashtra, India" into an IATA city code (e.g. BOM). */
export async function resolveIata(place: string): Promise<Resolved | null> {
  if (cache.has(place)) return cache.get(place)!;
  const parts = place.split(",").map((p) => p.trim());
  const city = parts[0];
  const country = parts[parts.length - 1];
  let out: Resolved | null = null;

  const id = process.env.AMADEUS_CLIENT_ID;
  const secret = process.env.AMADEUS_CLIENT_SECRET;
  if (id && secret) {
    try {
      const base = process.env.AMADEUS_BASE_URL || "https://test.api.amadeus.com";
      const t = await amadeusToken(base, id, secret);
      const url = `${base}/v1/reference-data/locations?subType=CITY,AIRPORT&view=LIGHT&keyword=${encodeURIComponent(city)}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${t}` } });
      if (res.ok) {
        const data: any[] = (await res.json()).data ?? [];
        // Prefer an exact city-name match in the right country, then any city, then an airport.
        const score = (d: any) =>
          (norm(d.address?.countryName ?? "") === norm(country) ? 4 : 0) +
          (norm(d.name) === norm(city) ? 2 : 0) +
          (d.subType === "CITY" ? 1 : 0);
        const best = [...data].sort((a, b) => score(b) - score(a))[0];
        if (best && score(best) >= 2) out = { code: best.iataCode, name: best.name };
      } else console.error("Amadeus locations failed:", res.status);
    } catch (e) {
      console.error("IATA lookup failed:", e);
    }
  }

  if (!out) {
    const c = CITIES.find((x) => norm(x.name) === norm(city));
    if (c) out = { code: c.code, name: c.name };
  }

  if (!out) {
    // Any other city: use the nearest known airport city within driving distance.
    const g = await geocode(place);
    const kind = g ? await placeKind(place) : "city";
    if (g && kind === "country") {
      // Whole country: use its main listed airport city.
      const inCountry = CITIES.filter((x) => norm(x.country) === norm(g.country));
      const c = inCountry.find((x) => MAIN.has(x.code)) ?? inCountry[0];
      if (c) out = { code: c.code, name: c.name };
    } else if (g) {
      const near = CITIES.map((c) => ({ c, d: distanceKm(g, c) })).sort((a, b) => a.d - b.d)[0];
      if (near && near.d <= (kind === "region" ? 400 : 200)) out = { code: near.c.code, name: near.c.name };
    }
  }
  cache.set(place, out);
  return out;
}
