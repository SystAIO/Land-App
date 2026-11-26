'use strict';

export const INDIAN_MOBILE = /^[6-9]\d{9}$/;
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const PINCODE_RE = /^[1-9][0-9]{5}$/;

export const PROPERTY_TYPES = ['plot', 'flat', 'house', 'commercial', 'agricultural'] as const;
export const LISTING_TYPES = ['sale', 'rent'] as const;
export const AREA_UNITS = ['sqft', 'sqm', 'acre', 'kattha', 'dismil', 'bigha'] as const;
export const SELF_ROLES = ['owner', 'broker', 'browse'] as const;
export const ALL_ROLES = [...SELF_ROLES, 'admin'] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type ListingType = (typeof LISTING_TYPES)[number];
export type AreaUnit = (typeof AREA_UNITS)[number];
export type SelfRole = (typeof SELF_ROLES)[number];
export type AppRole = (typeof ALL_ROLES)[number];

export function isValidUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

export function isValidIndianPhone(value: string): boolean {
  return typeof value === 'string' && INDIAN_MOBILE.test(value);
}

export function normalizePhone(input: unknown): string {
  const digits = String(input ?? '').replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export interface ListingInput {
  title: string;
  description: string;
  listing_type: ListingType;
  property_type: PropertyType;
  price: number;
  area_value: number;
  area_unit: AreaUnit;
  address: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  boundary: unknown[];
  nearby_landmarks: unknown[];
  youtube_url: string | null;
  images: string[];
}

export interface ValidationResult<T> {
  errors: Partial<Record<keyof T | 'body', string>>;
  value: T | null;
}

export function validateListingBody(body: unknown): ValidationResult<ListingInput> {
  const errors: ValidationResult<ListingInput>['errors'] = {};
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: { body: 'Invalid request.' }, value: null };
  }
  const input = body as Record<string, unknown>;
  const price = Number(input.price);
  const area = Number(input.area_value);
  const lat = Number(input.latitude);
  const lng = Number(input.longitude);

  if (
    typeof input.title !== 'string' ||
    input.title.trim().length < 6 ||
    input.title.trim().length > 140
  )
    errors.title = 'Title must be between 6 and 140 characters';
  if (typeof input.description !== 'string' || input.description.length > 5000)
    errors.description = 'Description is required (max 5000 characters)';
  if (!(PROPERTY_TYPES as readonly string[]).includes(input.property_type as string))
    errors.property_type = 'Invalid property type';
  if (!(LISTING_TYPES as readonly string[]).includes(input.listing_type as string))
    errors.listing_type = 'listing_type must be sale or rent';
  if (!Number.isFinite(area) || area <= 0) errors.area_value = 'A valid area is required';
  if (!(AREA_UNITS as readonly string[]).includes(input.area_unit as string))
    errors.area_unit = 'Invalid area unit';
  if (!Number.isFinite(price) || price <= 0) errors.price = 'A valid price is required';
  if (typeof input.address !== 'string' || !input.address.trim())
    errors.address = 'Address is required';
  if (typeof input.locality !== 'string' || !input.locality.trim())
    errors.locality = 'Locality is required';
  if (typeof input.city !== 'string' || !input.city.trim()) errors.city = 'City is required';
  if (typeof input.state !== 'string' || !input.state.trim()) errors.state = 'State is required';
  if (!PINCODE_RE.test(String(input.pincode)))
    errors.pincode = 'A valid 6-digit pincode is required';
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) errors.latitude = 'Invalid latitude';
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) errors.longitude = 'Invalid longitude';

  if (Object.keys(errors).length) return { errors, value: null };

  return {
    errors: {},
    value: {
      title: String(input.title).trim(),
      description: String(input.description ?? ''),
      listing_type: input.listing_type as ListingType,
      property_type: input.property_type as PropertyType,
      price: Number(price),
      area_value: Number(area),
      area_unit: input.area_unit as AreaUnit,
      address: String(input.address).trim(),
      locality: String(input.locality).trim(),
      city: String(input.city).trim(),
      state: String(input.state).trim(),
      pincode: String(input.pincode),
      latitude: Number(lat),
      longitude: Number(lng),
      boundary: Array.isArray(input.boundary) ? input.boundary : [],
      nearby_landmarks: Array.isArray(input.nearby_landmarks) ? input.nearby_landmarks : [],
      youtube_url:
        input.youtube_url && String(input.youtube_url).trim()
          ? String(input.youtube_url).trim()
          : null,
      images: Array.isArray(input.images)
        ? input.images.filter((image): image is string => typeof image === 'string')
        : [],
    },
  };
}
