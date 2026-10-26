import { NextResponse } from "next/server";
import { findVideo } from "@/lib/youtube";

// Looked up lazily when the user clicks a place, so a search doesn't burn YouTube quota on every stop.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ error: "q is required" }, { status: 400 });
  return NextResponse.json(await findVideo(q));
}
