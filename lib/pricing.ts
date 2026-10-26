import type { PriceBreakdown, TransportOption } from "./types";

export function priceTrip(opt: TransportOption, travelers: number, activitiesPerPerson: number): PriceBreakdown {
  const fare = opt.baseFare * travelers;
  const taxRate = opt.mode === "flight" ? 0.12 : 0.05;
  const taxes = Math.round(fare * taxRate);
  const fee = opt.mode === "flight" ? 8 * travelers : 3 * travelers;
  const activities = Math.round(activitiesPerPerson * travelers);
  const lines = [
    { label: `${opt.provider} ${opt.mode} (${opt.class}) × ${travelers}`, amount: fare },
    { label: "Taxes", amount: taxes },
    { label: "Service fee", amount: fee },
    { label: "Estimated activities", amount: activities },
  ];
  return { lines, total: lines.reduce((s, l) => s + l.amount, 0), currency: "USD" };
}
