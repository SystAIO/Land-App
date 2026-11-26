import type { ListingType, PropertyType } from "../types";

export type BrowseFilters = {
  propertyType: PropertyType | "all";
  listingType: ListingType | "all";
  maxPrice: number | null;
  sort: "newest" | "price_low" | "price_high" | "area_high";
};

export const DEFAULT_FILTERS: BrowseFilters = {
  propertyType: "all",
  listingType: "all",
  maxPrice: null,
  sort: "newest",
};

export const RENT_PRICE_BANDS = [
  { label: "Any rent", max: null },
  { label: "Under ₹15 K", max: 15000 },
  { label: "Under ₹30 K", max: 30000 },
  { label: "Under ₹50 K", max: 50000 },
  { label: "Under ₹1 L", max: 100000 },
] as const;

export const SALE_PRICE_BANDS = [
  { label: "Any price", max: null },
  { label: "Under ₹25 L", max: 2500000 },
  { label: "Under ₹50 L", max: 5000000 },
  { label: "Under ₹1 Cr", max: 10000000 },
  { label: "Under ₹2 Cr", max: 20000000 },
  { label: "Under ₹5 Cr", max: 50000000 },
] as const;
