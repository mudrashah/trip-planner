export interface Attraction {
  name: string;
  description?: string;
  lat?: number;
  lng?: number;
  rating?: number;
  reviews?: number;
}

const cache = new Map<string, Attraction[]>();

/** Google Places (New) Text Search. Returns [] when no key or on any failure. */
export async function searchAttractions(query: string, limit = 20): Promise<Attraction[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return [];
  const hit = cache.get(query);
  if (hit) return hit;
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "places.displayName,places.location,places.rating,places.userRatingCount,places.editorialSummary,places.primaryTypeDisplayName",
      },
      body: JSON.stringify({ textQuery: query, pageSize: limit, languageCode: "en" }),
    });
    if (!res.ok) {
      console.error("Places text search failed:", res.status, await res.text());
      return [];
    }
    const json = await res.json();
    const out: Attraction[] = (json.places ?? []).map((p: any) => ({
      name: p.displayName?.text,
      description: p.editorialSummary?.text ?? p.primaryTypeDisplayName?.text,
      lat: p.location?.latitude,
      lng: p.location?.longitude,
      rating: p.rating,
      reviews: p.userRatingCount,
    })).filter((a: Attraction) => a.name);
    cache.set(query, out);
    return out;
  } catch (e) {
    console.error("Places text search error:", e);
    return [];
  }
}

const dist = (a: Attraction, b: Attraction) =>
  a.lat == null || b.lat == null ? 0 : Math.hypot(a.lat - b.lat!, ((a.lng ?? 0) - (b.lng ?? 0)) * Math.cos((a.lat * Math.PI) / 180));

/**
 * Pick the best `count` places (rating weighted by review volume), then chain them
 * nearest-neighbour so consecutive places (= same day) are close together.
 */
export function pickAndOrder(places: Attraction[], count: number): Attraction[] {
  const seen = new Set<string>();
  const unique = places.filter((p) => !seen.has(p.name.toLowerCase()) && seen.add(p.name.toLowerCase()));
  const score = (p: Attraction) => (p.rating ?? 3.5) * Math.log10((p.reviews ?? 10) + 10);
  const pool = [...unique].sort((a, b) => score(b) - score(a)).slice(0, count);
  if (pool.length <= 1) return pool;
  const ordered = [pool.shift()!];
  while (pool.length) {
    const last = ordered[ordered.length - 1];
    let bi = 0;
    pool.forEach((p, i) => { if (dist(last, p) < dist(last, pool[bi])) bi = i; });
    ordered.push(pool.splice(bi, 1)[0]);
  }
  return ordered;
}
