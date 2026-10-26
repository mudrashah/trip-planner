import { NextResponse } from "next/server";
import { searchTransport } from "@/lib/transport";
import { resolveIata } from "@/lib/airports";
import { availableModes, geocode } from "@/lib/geo";
import type { Mode } from "@/lib/types";

export async function POST(req: Request) {
  const { from, to, date, modes } = (await req.json()) as { from: string; to: string; date: string; modes: Mode[] };
  if (!from || !to || !date) return NextResponse.json({ error: "from, to and date are required" }, { status: 400 });
  const requested: Mode[] = modes?.length ? modes : ["flight", "train", "bus"];
  const warnings: string[] = [];

  const [f, t, gf, gt] = await Promise.all([resolveIata(from), resolveIata(to), geocode(from), geocode(to)]);
  const avail = availableModes(gf, gt, !!f && !!t);
  const m = requested.filter((x) => avail.modes.includes(x));
  for (const x of requested) {
    if (!avail.modes.includes(x)) warnings.push(`No ${x} for ${from.split(",")[0]} → ${to.split(",")[0]}: ${avail.reasons[x]}.`);
  }

  return NextResponse.json({
    options: searchTransport(from, to, date, m, { from: f?.code, to: t?.code }),
    codes: { from: f?.code ?? null, to: t?.code ?? null },
    warnings,
    available: avail.modes,
  });
}
