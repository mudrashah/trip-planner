import type { Video } from "./types";

const cache = new Map<string, Video>();

export async function findVideo(query: string): Promise<Video> {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const hit = cache.get(query);
  if (hit) return hit;

  const key = process.env.YOUTUBE_API_KEY;
  let video: Video = { id: null, title: query, searchUrl };
  if (key) {
    try {
      const url =
        "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=1" +
        `&q=${encodeURIComponent(query)}&key=${key}`;
      const res = await fetch(url);
      const json = await res.json();
      const item = json.items?.[0];
      if (item) video = { id: item.id.videoId, title: item.snippet.title, searchUrl };
    } catch {
      /* fall through to search link */
    }
  }
  cache.set(query, video);
  return video;
}
