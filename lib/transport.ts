import type { Mode, TransportOption } from "./types";

// Deterministic mock provider. Replace each generator with a real API client
// (Amadeus for flights; region-specific partner for trains/buses).
function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

const SPEC: Record<Mode, { providers: string[]; classes: string[]; speed: number; perKm: number; min: number }> = {
  flight: { providers: ["SkyJet", "AirWays", "BlueWing"], classes: ["Economy", "Premium"], speed: 700, perKm: 0.11, min: 40 },
  train: { providers: ["RailExpress", "InterCity"], classes: ["Standard", "First"], speed: 110, perKm: 0.06, min: 10 },
  bus: { providers: ["RoadLine", "GoBus"], classes: ["Seater", "Sleeper"], speed: 60, perKm: 0.04, min: 6 },
};

const fmt = (d: Date) => d.toISOString().slice(0, 16).replace("T", " ");

export function searchTransport(from: string, to: string, date: string, modes: Mode[], codes?: { from?: string; to?: string }): TransportOption[] {
  const km = 200 + (hash(from.toLowerCase() + to.toLowerCase()) % 1800);
  const out: TransportOption[] = [];
  for (const mode of modes) {
    const s = SPEC[mode];
    const overhead = mode === "flight" ? 150 : 20; // airport / boarding time
    const durationMin = Math.round((km / s.speed) * 60) + overhead;
    for (let i = 0; i < 3; i++) {
      const seed = hash(`${from}${to}${date}${mode}${i}`);
      const dep = new Date(`${date}T00:00:00Z`);
      dep.setUTCMinutes(6 * 60 + (seed % 14) * 60);
      const arr = new Date(dep.getTime() + durationMin * 60000);
      const cls = s.classes[i % s.classes.length];
      const fare = Math.max(s.min, Math.round(km * s.perKm * (cls === s.classes[0] ? 1 : 1.6) * (0.9 + (seed % 30) / 100)));
      out.push({
        id: `${mode}-${seed}`,
        mode,
        provider: s.providers[seed % s.providers.length],
        departure: fmt(dep),
        arrival: fmt(arr),
        durationMin,
        baseFare: fare,
        class: cls,
        ...(mode === "flight" ? { fromCode: codes?.from, toCode: codes?.to } : {}),
      });
    }
  }
  return out.sort((a, b) => a.baseFare - b.baseFare);
}
