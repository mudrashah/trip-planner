import Anthropic from "@anthropic-ai/sdk";
import { attractionsFor } from "./attractions";
import { pickAndOrder, searchAttractions, type Attraction } from "./placesAttractions";
import { circuitFor } from "./countries";
import type { Day, Itinerary, Place, SearchParams, Tip } from "./types";

const SLOTS = [
  { period: "Morning", time: "8:00 AM" },
  { period: "Late Morning", time: "10:00 AM" },
  { period: "Afternoon", time: "1:30 PM" },
  { period: "Late Afternoon", time: "4:00 PM" },
  { period: "Evening", time: "7:30 PM" },
];
const GENERIC_TIPS: Tip[] = [
  { title: "Transportation", text: "Check local transit passes or ride-hailing apps before you arrive; they are usually cheaper than single tickets or street taxis." },
  { title: "Cash & cards", text: "Carry some local cash for small vendors, entrance fees and tips, even if cards are widely accepted." },
  { title: "Book ahead", text: "Reserve tickets for popular attractions in advance, and start early to beat the crowds and the midday heat." },
];
export const cityOf = (place: string) => place.split(",")[0].trim();

/** Spread n stops across the day (always keep a morning start and an evening finish). */
function pickSlots(n: number) {
  const idx = { 1: [0], 2: [0, 4], 3: [0, 2, 4], 4: [0, 1, 2, 4], 5: [0, 1, 2, 3, 4] }[Math.min(n, 5) as 1 | 2 | 3 | 4 | 5];
  return idx.map((i) => SLOTS[i]);
}

async function offlinePlans(p: SearchParams): Promise<Itinerary[]> {
  const city = cityOf(p.to);
  const interest = p.interests?.trim();
  const themes = [
    { t: "Classic Highlights", s: "The must-see sights, done at an easy pace.", c: 60, offset: 0, q: `top tourist attractions in ${p.to}` },
    { t: interest ? `${interest}` : "Local Flavours & Culture", s: interest ? `Built around your interest: ${interest}.` : "Markets, food streets and neighbourhood life.", c: 45, offset: 3, q: interest ? `${interest} in ${p.to}` : `local markets food and culture in ${p.to}` },
    { t: "Off the Beaten Path", s: "Quieter spots further from the crowds.", c: 70, offset: 6, q: `hidden gems and offbeat places in ${p.to}` },
  ];
  const curated = attractionsFor(city);
  const want = p.days * SLOTS.length;

  return Promise.all(themes.map(async (th, i): Promise<Itinerary> => {
    // 1) live Google Places results (ratings + proximity), 2) curated list, 3) generic placeholders
    let list: Attraction[] = pickAndOrder(await searchAttractions(th.q), want);
    if (!list.length && curated) {
      list = Array.from({ length: Math.min(want, curated.length) }, (_, k) => ({ name: curated[(th.offset + k) % curated.length] }));
    }
    // Never repeat a place within one itinerary: if the list is short, visit fewer places per day.
    const perDay = list.length ? Math.max(1, Math.min(SLOTS.length, Math.floor(list.length / p.days))) : 3;
    const days: Day[] = Array.from({ length: p.days }, (_, d) => ({
      day: d + 1,
      title: `Day ${d + 1}`,
      places: pickSlots(perDay).map((slot, n): Place => {
        const a = list[d * perDay + n];
        const name = a?.name ?? `${city} ${th.t} stop ${d * perDay + n + 1}`;
        return {
          ...slot,
          name,
          description: a?.description ?? `${slot.period} visit to ${name}.`,
          videoQuery: `${name} ${city} travel guide`,
        };
      }),
    }));
    return { id: `mock-${i}`, title: `${city}: ${th.t}`, summary: th.s, estActivitiesCostPerPerson: th.c * p.days, days, tips: GENERIC_TIPS };
  }));
}

/** Make the day list exactly p.days long, numbered 1..N, no empty days. */
function normalise(it: Omit<Itinerary, "id">, p: SearchParams): Omit<Itinerary, "id"> | null {
  const days = (it.days ?? []).filter((d) => d.places?.length).slice(0, p.days);
  if (days.length !== p.days) return null;
  return { ...it, days: days.map((d, i) => ({ ...d, day: i + 1 })) };
}

/** Offline country trips: split the days across a curated city circuit (rotated per itinerary). */
function offlineCountryPlans(p: SearchParams): Itinerary[] {
  const country = cityOf(p.to);
  const circuit = circuitFor(country);
  if (!circuit) return [];
  const n = Math.min(circuit.length, Math.min(p.days, Math.max(2, Math.ceil(p.days / 2)), 4));
  const themes = [
    { t: "Classic Circuit", s: "The headline cities, in a sensible order.", c: 60 },
    { t: "Culture & Cuisine", s: "Slower days built around local life and food.", c: 45 },
    { t: "Beyond the Highlights", s: "A different mix of cities, with room to wander.", c: 70 },
  ];
  return themes.map((th, i) => {
    const cities = Array.from({ length: n }, (_, k) => circuit[(i + k) % circuit.length]);
    const days: Day[] = [];
    cities.forEach((c, ci) => {
      const stay = Math.floor(p.days / n) + (ci < p.days % n ? 1 : 0);
      const list = attractionsFor(c) ?? [];
      const perDay = Math.max(1, Math.min(3, Math.floor(list.length / stay) || 1));
      for (let d = 0; d < stay; d++) {
        days.push({
          day: days.length + 1, city: c,
          title: `${c}${ci > 0 && d === 0 ? " (arrival day)" : ""}`,
          places: pickSlots(perDay).map((slot, k): Place => {
            const name = list[d * perDay + k] ?? `${c} ${th.t} stop ${d * perDay + k + 1}`;
            return { ...slot, name, description: `${slot.period} visit to ${name}.`, videoQuery: `${name} ${c} travel guide` };
          }),
        });
      }
    });
    return { id: `country-${i}`, title: `${country}: ${cities.join(" → ")}`, summary: th.s, estActivitiesCostPerPerson: th.c * p.days, days, tips: GENERIC_TIPS };
  });
}

async function claudeCountryPlans(p: SearchParams): Promise<Itinerary[]> {
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 12000,
    messages: [{
      role: "user",
      content:
        `Plan 3 distinct multi-city trip itineraries covering ${p.to} as a whole country. Each must have EXACTLY ${p.days} day${p.days > 1 ? "s" : ""}.\n` +
        `Traveller: ${p.travelers} person(s), ${p.budget} budget, main interest: ${p.interests || "general sightseeing"}.\n` +
        `Rules:\n` +
        `- Pick ${p.days < 4 ? "1-2" : p.days < 7 ? "2-3" : "3-4"} real cities/regions per itinerary, ordered geographically so travel between them is short; the 3 itineraries should use different routes or themes.\n` +
        `- Spend consecutive days in the same city. Every day has a "city" field: just the city name, no country.\n` +
        `- Each day has 3-5 real, specific stops with a clock time and period (Morning ~8:00 AM, Late Morning ~10:00 AM, Afternoon ~1:30 PM, Late Afternoon ~4:00 PM, Evening ~7:30 PM). On a day you change city, keep fewer stops.\n` +
        `- Day title names the area, e.g. "Historic Temples (East Kyoto)". Descriptions are 2 sentences incl. how to get there from the previous stop.\n` +
        `- Never repeat a place. "videoQuery" is a YouTube search query for that place. "tips": 3 practical tips for the country.\n` +
        `Respond with ONLY a JSON array: ` +
        `[{"title":string (e.g. "Japan: Tokyo → Kyoto → Osaka"),"summary":string,"estActivitiesCostPerPerson":number (USD, whole trip),` +
        `"days":[{"day":number,"city":string,"title":string,"places":[{"period":string,"time":string,"name":string,"description":string,"videoQuery":string}]}],` +
        `"tips":[{"title":string,"text":string}]}]`,
    }],
  });
  const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  const arr = (JSON.parse(text.slice(text.indexOf("["), text.lastIndexOf("]") + 1)) as Omit<Itinerary, "id">[])
    .map((it) => normalise(it, p))
    .filter((x): x is Omit<Itinerary, "id"> => !!x && x.days.every((d) => !!d.city));
  if (!arr.length) throw new Error(`model returned no usable ${p.days}-day country itinerary`);
  return arr.map((it, i) => ({ ...it, id: `country-${i}` }));
}

export async function generateItineraries(p: SearchParams): Promise<Itinerary[]> {
  if (p.country) {
    if (process.env.ANTHROPIC_API_KEY) {
      try { return await claudeCountryPlans(p); }
      catch (e) { console.error("Claude country itinerary failed, using offline plan:", e); }
    }
    return offlineCountryPlans(p);
  }
  if (!process.env.ANTHROPIC_API_KEY) return offlinePlans(p);
  const city = cityOf(p.to);
  try {
    const client = new Anthropic();
    const msg = await client.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 12000,
      messages: [
        {
          role: "user",
          content:
            `Plan 3 distinct trip itineraries for a visitor to ${p.to}. Each must have EXACTLY ${p.days} day${p.days > 1 ? "s" : ""}.\n` +
            `Traveller: ${p.travelers} person(s), ${p.budget} budget, main interest: ${p.interests || "general sightseeing"}.\n` +
            `Rules:\n` +
            `- Use only real, specific, well-known places in or very near ${city}; name the actual attraction.\n` +
            `- Each day has 4-5 stops with a clock time, in order, using these periods: Morning (~8:00 AM), Late Morning (~10:00 AM), Afternoon (~1:30 PM), Late Afternoon (~4:00 PM), Evening (~7:30 PM). Adjust times sensibly to opening hours.\n` +
            `- Group each day by area, and put the area in the day title, e.g. "Historic Temples & Future Art (East Side)". Keep stops in a day close together.\n` +
            `- Each description is 2 sentences: what to eat/see/do there, and how to get there from the previous stop (e.g. "Take the subway to ..."). Add booking or ticket warnings where relevant.\n` +
            `- Never repeat a place within one itinerary. Make the 3 itineraries differ in theme.\n` +
            `- "videoQuery" is a YouTube search query that finds a travel video about that specific place.\n` +
            `- "tips": 3 essential practical tips for this destination (transport, money, luggage/etiquette, etc.).\n` +
            `Respond with ONLY a JSON array, no prose: ` +
            `[{"title":string,"summary":string,"estActivitiesCostPerPerson":number (USD, whole trip, entry fees + local activities),` +
            `"days":[{"day":number,"title":string,"places":[{"period":string,"time":string (e.g. "8:00 AM"),"name":string,"description":string,"videoQuery":string}]}],` +
            `"tips":[{"title":string,"text":string}]}]`,
        },
      ],
    });
    const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const json = text.slice(text.indexOf("["), text.lastIndexOf("]") + 1);
    const arr = (JSON.parse(json) as Omit<Itinerary, "id">[])
      .map((it) => normalise(it, p))
      .filter((x): x is Omit<Itinerary, "id"> => x !== null);
    if (!arr.length) throw new Error(`model returned no itinerary with exactly ${p.days} days`);
    return arr.map((it, i) => ({ ...it, id: `it-${i}` }));
  } catch (e) {
    console.error("Claude itinerary generation failed, using offline plan:", e);
    return offlinePlans(p);
  }
}
