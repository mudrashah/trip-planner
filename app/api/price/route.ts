import { NextResponse } from "next/server";
import { priceTrip } from "@/lib/pricing";
import type { TransportOption } from "@/lib/types";

export async function POST(req: Request) {
  const { option, travelers, activitiesPerPerson } = (await req.json()) as {
    option: TransportOption;
    travelers: number;
    activitiesPerPerson: number;
  };
  return NextResponse.json(priceTrip(option, Math.max(1, travelers || 1), activitiesPerPerson || 0));
}
