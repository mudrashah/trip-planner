import Anthropic from "@anthropic-ai/sdk";
import { YoutubeTranscript } from "youtube-transcript";
import { cityOf } from "./itinerary";
import type { Itinerary, SearchLink, SearchParams, SourceVideo } from "./types";

const TOP_N = 7;
const MAX_TRANSCRIPT_CHARS = 60_000; // ~15k tokens per video

export const ytSearchUrl = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

/** Suggested searches the user can open on YouTube to see other videos. */
export function searchLinks(p: SearchParams): SearchLink[] {
  const c = cityOf(p.to);
  const interest = p.interests?.trim();
  const qs = [
    `${c} ${p.days} day itinerary`,
    `${c} travel guide`,
    `${c} things to do`,
    `${c} food tour`,
    `${c} hidden gems`,
    `${c} travel vlog`,
    `${c} budget travel tips`,
    ...(interest ? [`${c} ${interest}`] : []),
  ];
  return qs.map((label) => ({ label, url: ytSearchUrl(label) }));
}

interface Candidate extends SourceVideo { description: string; durationSec: number }

const isoToSec = (d: string) => {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(d) ?? [];
  return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0);
};

/** Most-viewed itinerary videos via the official YouTube Data API (search + videos.list). */
async function topVideosApi(p: SearchParams, key: string): Promise<Candidate[]> {
  const c = cityOf(p.to);
  const interest = p.interests?.trim();
  const q = `${c} ${p.days} day itinerary${interest ? " " + interest : ""}`;
  const sRes = await fetch(
    "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=viewCount&maxResults=20&relevanceLanguage=en" +
      `&q=${encodeURIComponent(q)}&key=${key}`
  );
  if (!sRes.ok) throw new Error(`YouTube search failed: ${sRes.status} ${await sRes.text()}`);
  const ids: string[] = ((await sRes.json()).items ?? []).map((i: any) => i.id?.videoId).filter(Boolean);
  if (!ids.length) return [];

  const vRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${ids.join(",")}&key=${key}`
  );
  if (!vRes.ok) throw new Error(`YouTube videos failed: ${vRes.status}`);
  const items: any[] = (await vRes.json()).items ?? [];
  return items
    .map((v): Candidate => ({
      id: v.id,
      title: v.snippet.title,
      channel: v.snippet.channelTitle,
      views: Number(v.statistics?.viewCount ?? 0),
      url: `https://www.youtube.com/watch?v=${v.id}`,
      description: v.snippet.description ?? "",
      durationSec: isoToSec(v.contentDetails?.duration ?? ""),
    }))
    .filter((v) => v.durationSec >= 240); // skip Shorts / teasers
}

const parseViews = (t?: string) => Number((t ?? "").replace(/[^\d]/g, "")) || 0;
const parseLen = (t?: string) => (t ?? "").split(":").reduce((a, x) => a * 60 + (+x || 0), 0);

/** Keyless fallback: YouTube's own results page sorted by view count (sp=CAMSAhAB = videos, most viewed). */
async function topVideosScraped(p: SearchParams): Promise<Candidate[]> {
  const c = cityOf(p.to);
  const interest = p.interests?.trim();
  const q = `${c} ${p.days} day itinerary${interest ? " " + interest : ""}`;
  const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=CAMSAhAB`, {
    headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36", "Accept-Language": "en-US,en;q=0.9" },
  });
  if (!res.ok) throw new Error(`YouTube results page failed: ${res.status}`);
  const html = await res.text();
  const m = /var ytInitialData = (\{[\s\S]*?\});<\/script>/.exec(html);
  if (!m) throw new Error("YouTube results page format changed (ytInitialData not found)");
  const out: Candidate[] = [];
  const walk = (n: any) => {
    if (!n || typeof n !== "object") return;
    if (n.videoRenderer?.videoId) {
      const v = n.videoRenderer;
      out.push({
        id: v.videoId,
        title: v.title?.runs?.map((r: any) => r.text).join("") ?? "",
        channel: v.ownerText?.runs?.[0]?.text ?? "",
        views: parseViews(v.viewCountText?.simpleText),
        url: `https://www.youtube.com/watch?v=${v.videoId}`,
        description: (v.detailedMetadataSnippets?.[0]?.snippetText?.runs ?? v.descriptionSnippet?.runs ?? []).map((r: any) => r.text).join(""),
        durationSec: parseLen(v.lengthText?.simpleText),
      });
      return;
    }
    for (const k of Object.keys(n)) walk(n[k]);
  };
  walk(JSON.parse(m[1]));
  return out.filter((v) => v.durationSec >= 240);
}

/** Keep videos whose title/description mention the city (or its country); most-viewed first. */
function relevantTop(vs: Candidate[], p: SearchParams): Candidate[] {
  const parts = p.to.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
  const terms = [parts[0], parts[parts.length - 1]].filter(Boolean);
  const hit = vs.filter((v) => terms.some((t) => `${v.title} ${v.description}`.toLowerCase().includes(t)));
  const pool = hit.length >= 3 ? hit : vs;
  return pool.sort((a, b) => b.views - a.views).slice(0, TOP_N);
}

const stamp = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** Transcript as "[m:ss] text" lines, one per ~20s so Claude can cite timestamps. */
async function transcriptText(id: string): Promise<string> {
  const items = await YoutubeTranscript.fetchTranscript(id);
  const lines: string[] = [];
  let bucket = -1;
  for (const it of items) {
    const sec = it.offset / 1000;
    const b = Math.floor(sec / 20);
    if (b !== bucket) { bucket = b; lines.push(`\n[${stamp(sec)}] `); }
    lines.push(it.text.replace(/\s+/g, " ") + " ");
  }
  return lines.join("").slice(0, MAX_TRANSCRIPT_CHARS);
}

async function extract(client: Anthropic, p: SearchParams, v: Candidate): Promise<Itinerary | null> {
  let body = "";
  try { body = await transcriptText(v.id); } catch { /* no captions: fall back to description */ }
  if (body.length < 500 && v.description.length < 300) return null;

  const city = cityOf(p.to);
  const msg = await client.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 6000,
    messages: [{
      role: "user",
      content:
        `Below is the ${body ? "transcript" : "description"} of a YouTube travel video about ${city}. ` +
        `Extract the trip plan the creator recommends and shape it into EXACTLY ${p.days} day${p.days > 1 ? "s" : ""}.\n` +
        `Rules:\n` +
        `- Use only places the video actually covers; correct auto-caption misspellings of place names. If the video covers fewer days than requested, spread its places across the days; if more, keep the highlights. Do not invent places.\n` +
        `- If this video is not about ${city} or has no usable plan, respond with exactly: null\n` +
        `- Each day has 3-5 stops with a period (Morning, Late Morning, Afternoon, Late Afternoon, Evening) and a clock time (e.g. "8:00 AM"); group stops by area and put the area in the day title, e.g. "Historic Temples & Future Art (East Side)".\n` +
        `- Description: 2 sentences using the creator's advice (what to eat/see/do, how to get from the previous stop, ticket or timing warnings).\n` +
        `- "ts": the integer second in the video where that place starts being discussed (from the [m:ss] markers), or null if unknown.\n` +
        `- "tips": 3 practical tips the video mentions (transport, money, etiquette, etc.).\n` +
        `- "estActivitiesCostPerPerson": USD estimate for whole trip (entry fees + activities) based on the video, or a reasonable guess.\n` +
        `Respond with ONLY JSON: {"title":string,"summary":string,"estActivitiesCostPerPerson":number,` +
        `"days":[{"day":number,"title":string,"places":[{"period":string,"time":string,"name":string,"description":string,"videoQuery":string,"ts":number|null}]}],` +
        `"tips":[{"title":string,"text":string}]}\n\n` +
        `VIDEO TITLE: ${v.title}\nCHANNEL: ${v.channel}\n\n${body || v.description}`,
    }],
  });
  const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  const start = text.indexOf("{");
  if (start < 0) return null;
  const it = JSON.parse(text.slice(start, text.lastIndexOf("}") + 1)) as Omit<Itinerary, "id">;
  const days = (it.days ?? []).filter((d) => d.places?.length).slice(0, p.days);
  if (days.length !== p.days) return null;
  const { description: _d, durationSec: _s, ...source } = v;
  return {
    ...it,
    id: `yt-${v.id}`,
    days: days.map((d, i) => ({ ...d, day: i + 1 })),
    source,
  };
}

const cache = new Map<string, { at: number; value: Itinerary[] }>();
const TTL = 24 * 3600 * 1000;

/** Itineraries extracted from the top-viewed YouTube videos. Throws if keys are missing. */
export async function itinerariesFromVideos(p: SearchParams): Promise<Itinerary[]> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is required");

  const ck = `${p.to}|${p.days}|${p.interests ?? ""}`.toLowerCase();
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < TTL) return hit.value;

  const ytKey = process.env.YOUTUBE_API_KEY;
  let videos: Candidate[] = [];
  if (ytKey) {
    try { videos = await topVideosApi(p, ytKey); } catch (e) { console.error("YouTube API failed, scraping instead:", e); }
  }
  if (!videos.length) videos = await topVideosScraped(p);
  videos = relevantTop(videos, p);
  const client = new Anthropic();
  const results = await Promise.all(
    videos.map((v) => extract(client, p, v).catch((e) => { console.error(`extract failed for ${v.id}:`, e); return null; }))
  );
  const out = results.filter((r): r is Itinerary => r !== null);
  if (out.length) cache.set(ck, { at: Date.now(), value: out });
  return out;
}
