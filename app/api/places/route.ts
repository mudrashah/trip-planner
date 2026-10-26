import { NextResponse } from "next/server";
import { CITIES } from "@/lib/options";
import { searchPlaces } from "@/lib/geo";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const session = searchParams.get("session") || undefined;
  if (q.length < 2) return NextResponse.json({ suggestions: [] });

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    // Fallback: small built-in list so the app works without a key.
    // Fallback: built-in list first, then free worldwide city search (any city, not just airports).
    const l = q.toLowerCase();
    const local = CITIES.filter((c) => c.name.toLowerCase().includes(l)).map((c) => ({
      value: `${c.name}, ${c.country}`,
      sub: c.code,
    }));
    const seen = new Set(local.map((s) => s.value.split(",")[0].toLowerCase() + "|" + s.value.split(",").pop()!.trim().toLowerCase()));
    const world = (await searchPlaces(q)).filter((s) => !seen.has(s.value.split(",")[0].toLowerCase() + "|" + s.value.split(",").pop()!.trim().toLowerCase()));
    return NextResponse.json({ suggestions: [...local, ...world].slice(0, 8), source: "local" });
  }

  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key },
    body: JSON.stringify({ input: q, includedPrimaryTypes: ["locality", "administrative_area_level_1", "administrative_area_level_2", "postal_town", "country"], sessionToken: session }),
  });
  if (!res.ok) {
    console.error("Places autocomplete failed:", res.status, await res.text());
    return NextResponse.json({ suggestions: [], error: "Places lookup failed" }, { status: 502 });
  }
  const json = await res.json();
  const suggestions = (json.suggestions ?? [])
    .map((s: any) => s.placePrediction)
    .filter(Boolean)
    .map((p: any) => ({
      value: p.text?.text as string,
      sub: p.structuredFormat?.secondaryText?.text as string | undefined,
    }));
  return NextResponse.json({ suggestions, source: "google" });
}
