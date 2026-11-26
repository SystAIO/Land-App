import type { AreaUnit, ListingType, PropertyType } from "../types";

export const PROPERTY_TYPES: {
  id: PropertyType;
  label: string;
  short: string;
}[] = [
  { id: "plot", label: "Plot / Land", short: "Plots" },
  { id: "flat", label: "Apartment", short: "Flats" },
  { id: "house", label: "Independent house", short: "Houses" },
  { id: "commercial", label: "Commercial", short: "Commercial" },
  { id: "agricultural", label: "Agricultural land", short: "Agri land" },
];

export const AREA_UNITS: { id: AreaUnit; label: string; short: string }[] = [
  { id: "sqft", label: "Square feet", short: "sq ft" },
  { id: "sqm", label: "Square metre", short: "sq m" },
  { id: "acre", label: "Acre", short: "Acre" },
  { id: "kattha", label: "Kattha", short: "Kattha" },
  { id: "dismil", label: "Dismil", short: "Dismil" },
  { id: "bigha", label: "Bigha", short: "Bigha" },
];

export const LISTING_TYPES: { id: ListingType; label: string }[] = [
  { id: "sale", label: "For sale" },
  { id: "rent", label: "For rent" },
];

export const CITIES = [
  { city: "Pune", state: "Maharashtra", latitude: 18.5204, longitude: 73.8567 },
  { city: "Mumbai", state: "Maharashtra", latitude: 19.076, longitude: 72.8777 },
  { city: "Nashik", state: "Maharashtra", latitude: 19.9975, longitude: 73.7898 },
  { city: "Nagpur", state: "Maharashtra", latitude: 21.1458, longitude: 79.0882 },
  { city: "Bhagalpur", state: "Bihar", latitude: 25.2425, longitude: 86.9842 },
  { city: "Bengaluru", state: "Karnataka", latitude: 12.9716, longitude: 77.5946 },
  { city: "Hyderabad", state: "Telangana", latitude: 17.385, longitude: 78.4867 },
] as const;

export const NEARBY_SUGGESTIONS = [
  "School",
  "Hospital",
  "Highway",
  "Market",
  "Bus stand",
  "Railway station",
  "Temple",
  "Airport",
];

export const PRICE_BANDS: { label: string; max: number | null }[] = [
  { label: "Any price", max: null },
  { label: "Under ₹25 L", max: 2500000 },
  { label: "Under ₹50 L", max: 5000000 },
  { label: "Under ₹1 Cr", max: 10000000 },
  { label: "Under ₹2 Cr", max: 20000000 },
  { label: "Under ₹5 Cr", max: 50000000 },
];

export const APP_NAME = "SystIO Land";
export const LISTING_FEE_PAISE = 10000;
export const LISTING_FEE_RUPEES = 100;

export const propertyTypeLabel = (type: PropertyType) =>
  PROPERTY_TYPES.find((entry) => entry.id === type)?.label ?? type;

export const propertyTypeShort = (type: PropertyType) =>
  PROPERTY_TYPES.find((entry) => entry.id === type)?.short ?? type;

export const areaUnitLabel = (unit: AreaUnit) =>
  AREA_UNITS.find((entry) => entry.id === unit)?.short ?? unit;
