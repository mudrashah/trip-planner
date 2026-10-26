import { NextResponse } from "next/server";

// USD-based exchange rates from a free, keyless provider; cached for 12h on the server.
export async function GET() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { next: { revalidate: 43200 } });
    if (!res.ok) throw new Error(`rates ${res.status}`);
    const j = await res.json();
    return NextResponse.json({ rates: j.rates as Record<string, number>, updated: j.time_last_update_utc as string });
  } catch (e) {
    console.error("Exchange rates failed:", e);
    return NextResponse.json({ rates: { USD: 1 }, updated: null }, { status: 502 });
  }
}
