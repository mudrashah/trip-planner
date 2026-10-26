// Curated multi-city circuits for country/region trips in offline mode (no ANTHROPIC_API_KEY).
// Cities are listed in a sensible travel order; each has attractions in ./attractions.
export const CIRCUITS: Record<string, string[]> = {
  india: ["Delhi", "Jaipur", "Udaipur", "Mumbai", "Goa", "Kochi", "Varanasi", "Kolkata"],
  japan: ["Tokyo", "Kyoto", "Osaka"],
  italy: ["Rome", "Florence", "Venice"],
  spain: ["Barcelona", "Madrid"],
  france: ["Paris", "Lyon", "Nice"],
  "united kingdom": ["London", "Edinburgh"],
  thailand: ["Bangkok", "Chiang Mai", "Phuket"],
  "united arab emirates": ["Dubai", "Abu Dhabi"],
  rajasthan: ["Jaipur", "Udaipur"],
  "united states": ["New York", "San Francisco"],
};

export const circuitFor = (country: string): string[] | null => CIRCUITS[country.trim().toLowerCase()] ?? null;
