import { NextResponse } from "next/server";
import { generateItineraries } from "@/lib/itinerary";
import { itinerariesFromVideos, searchLinks } from "@/lib/videoItineraries";
import { placeKind } from "@/lib/geo";
import type { Itinerary, SearchParams } from "@/lib/types";

export async function POST(req: Request) {
  const p = (await req.json()) as SearchParams;
  if (!p.to || !p.from || !p.date) return NextResponse.json({ error: "from, to and date are required" }, { status: 400 });
  p.days = Math.min(Math.max(Number(p.days) || 3, 1), 10);

  const notes: string[] = [];
  let itineraries: Itinerary[] = [];
  const haveKeys = !!process.env.ANTHROPIC_API_KEY;
  p.country = (await placeKind(p.to)) !== "city";
  if (p.country) {
    itineraries = await generateItineraries(p);
    if (!itineraries.length) return NextResponse.json({ error: `Country trips for ${p.to} need ANTHROPIC_API_KEY, or pick a specific city.` }, { status: 400 });
    if (!haveKeys) notes.push(`Multi-city route for ${p.to}. Set ANTHROPIC_API_KEY for custom routes.`);
    return NextResponse.json({ itineraries, searchLinks: searchLinks(p), notes, country: true });
  }
  if (haveKeys) {
    try {
      itineraries = await itinerariesFromVideos(p);
      if (!itineraries.length) notes.push("No usable plans could be extracted from the top videos, showing generated plans instead.");
    } catch (e) {
      console.error("Video itineraries failed:", e);
      notes.push("Could not read YouTube videos right now, showing generated plans instead.");
    }
  } else {
    notes.push("Set ANTHROPIC_API_KEY in .env.local to build itineraries from the top YouTube videos. Showing generated plans for now.");
  }
  if (!itineraries.length) itineraries = await generateItineraries(p);

  return NextResponse.json({ itineraries, searchLinks: searchLinks(p), notes, country: false });
}
