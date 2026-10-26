export type Mode = "flight" | "train" | "bus";

export interface SearchParams {
  from: string;
  to: string;
  date: string;
  days: number;
  travelers: number;
  budget: "budget" | "mid" | "luxury";
  interests: string;
  modes: Mode[];
  country?: boolean; // destination is a country or region (state/county): plan a multi-city route
}

export interface Video {
  id: string | null; // null => no API key, use searchUrl
  title: string;
  searchUrl: string;
}

export interface Place {
  period?: string; // "Morning", "Late Morning", "Afternoon", ...
  time?: string; // "8:00 AM"
  ts?: number; // seconds into the source video where this place is discussed
  name: string;
  description: string;
  videoQuery: string;
  video?: Video;
}

export interface Day {
  day: number;
  city?: string; // country trips: the city this day is spent in
  title: string;
  places: Place[];
}

export interface Tip {
  title: string;
  text: string;
}

export interface SourceVideo {
  id: string;
  title: string;
  channel: string;
  views: number;
  url: string;
}

export interface SearchLink {
  label: string;
  url: string;
}

export interface Itinerary {
  id: string;
  title: string;
  summary: string;
  estActivitiesCostPerPerson: number;
  days: Day[];
  tips?: Tip[];
  source?: SourceVideo; // set when the itinerary was extracted from this video
}

export interface TransportOption {
  id: string;
  mode: Mode;
  provider: string;
  departure: string;
  arrival: string;
  durationMin: number;
  baseFare: number; // per person
  class: string;
  fromCode?: string; // IATA, flights only
  toCode?: string;
}

export interface PriceBreakdown {
  lines: { label: string; amount: number }[];
  total: number;
  currency: string;
}
