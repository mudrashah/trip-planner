export interface City { name: string; country: string; code: string; lat: number; lon: number }

export const CITIES: City[] = [
  { name: "Ahmedabad", country: "India", code: "AMD", lat: 23.02, lon: 72.57 }, { name: "Bengaluru", country: "India", code: "BLR", lat: 12.97, lon: 77.59 },
  { name: "Chennai", country: "India", code: "MAA", lat: 13.08, lon: 80.27 }, { name: "Delhi", country: "India", code: "DEL", lat: 28.61, lon: 77.21 },
  { name: "Goa", country: "India", code: "GOI", lat: 15.3, lon: 74.08 }, { name: "Hyderabad", country: "India", code: "HYD", lat: 17.39, lon: 78.49 },
  { name: "Jaipur", country: "India", code: "JAI", lat: 26.91, lon: 75.79 }, { name: "Kochi", country: "India", code: "COK", lat: 9.93, lon: 76.27 },
  { name: "Kolkata", country: "India", code: "CCU", lat: 22.57, lon: 88.36 }, { name: "Manali", country: "India", code: "KUU", lat: 32.24, lon: 77.19 },
  { name: "Mumbai", country: "India", code: "BOM", lat: 19.08, lon: 72.88 }, { name: "Pune", country: "India", code: "PNQ", lat: 18.52, lon: 73.86 },
  { name: "Udaipur", country: "India", code: "UDR", lat: 24.59, lon: 73.71 }, { name: "Varanasi", country: "India", code: "VNS", lat: 25.32, lon: 83.01 },
  { name: "Bangkok", country: "Thailand", code: "BKK", lat: 13.76, lon: 100.5 }, { name: "Dubai", country: "UAE", code: "DXB", lat: 25.2, lon: 55.27 },
  { name: "Singapore", country: "Singapore", code: "SIN", lat: 1.35, lon: 103.82 }, { name: "Amsterdam", country: "Netherlands", code: "AMS", lat: 52.37, lon: 4.9 },
  { name: "Barcelona", country: "Spain", code: "BCN", lat: 41.39, lon: 2.17 }, { name: "London", country: "United Kingdom", code: "LHR", lat: 51.51, lon: -0.13 },
  { name: "Paris", country: "France", code: "CDG", lat: 48.86, lon: 2.35 }, { name: "Rome", country: "Italy", code: "FCO", lat: 41.9, lon: 12.5 },
  { name: "New York", country: "USA", code: "JFK", lat: 40.71, lon: -74.01 }, { name: "San Francisco", country: "USA", code: "SFO", lat: 37.77, lon: -122.42 },
  { name: "Tokyo", country: "Japan", code: "HND", lat: 35.68, lon: 139.69 },
];

export const INTERESTS = [
  "General sightseeing", "Food & cuisine", "History & heritage", "Nature & hiking", "Beaches",
  "Adventure sports", "Nightlife", "Shopping", "Spiritual & wellness", "Art & museums",
  "Wildlife & safari", "Photography", "Road trip", "Family friendly", "Romantic getaway",
];
