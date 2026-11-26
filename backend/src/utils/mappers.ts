export interface ProfileRow {
  id: string;
  phone: string | null;
  email: string | null;
  name: string | null;
  role: string;
  avatar_url: string | null;
  free_listing_used: boolean | null;
  onboarding_completed: boolean | null;
  phone_verified: boolean | null;
  created_at: string;
}

export interface PropertyRow {
  id: string;
  owner_id: string | null;
  title: string;
  description: string | null;
  listing_type: string;
  property_type: string;
  price: string | number;
  area_value: string | number;
  area_unit: string;
  address: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  latitude: string | number;
  longitude: string | number;
  boundary: unknown;
  images: unknown;
  nearby_landmarks: unknown;
  status: string;
  admin_note: string | null;
  is_featured: boolean | null;
  views_count: string | number;
  created_at: string;
  updated_at: string | null;
  owner_name?: string | null;
  owner_phone?: string | null;
  owner_role?: string | null;
  owner_avatar_url?: string | null;
}

export interface PaymentRow {
  id: string;
  user_id: string | null;
  property_id: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  amount: string | number;
  currency: string;
  status: string;
  kind: string;
  created_at: string;
  paid_at: string | null;
  user_name?: string | null;
  property_title?: string | null;
}

export function publicProfile(row: ProfileRow) {
  return {
    id: row.id,
    phone: row.phone ?? null,
    email: row.email ?? null,
    name: row.name ?? '',
    role: row.role,
    avatar_url: row.avatar_url ?? null,
    free_listing_used: row.free_listing_used ?? false,
    onboarding_completed: row.onboarding_completed ?? false,
    phone_verified: row.phone_verified ?? false,
    created_at: row.created_at,
  };
}

export function publicProperty(row: PropertyRow) {
  const hasOwner = row.owner_id != null;
  const owner = hasOwner
    ? {
        id: row.owner_id,
        name: row.owner_name ?? 'SystIO seller',
        phone: row.owner_phone ?? null,
        role: row.owner_role ?? 'owner',
        avatar_url: row.owner_avatar_url ?? null,
      }
    : undefined;

  const imagesRaw = row.images;
  const boundaryRaw = row.boundary;
  const landmarksRaw = row.nearby_landmarks;

  return {
    ...row,
    price: Number(row.price ?? 0),
    area_value: Number(row.area_value ?? 0),
    latitude: Number(row.latitude ?? 0),
    longitude: Number(row.longitude ?? 0),
    views_count: Number(row.views_count ?? 0),
    images: Array.isArray(imagesRaw)
      ? imagesRaw.filter((image): image is string => typeof image === 'string')
      : [],
    boundary: Array.isArray(boundaryRaw) ? boundaryRaw : [],
    nearby_landmarks: Array.isArray(landmarksRaw) ? landmarksRaw : [],
    owner,
    owner_name: owner?.name,
    owner_phone: owner?.phone,
    owner_role: owner?.role === 'broker' ? ('broker' as const) : ('owner' as const),
    owner_avatar_url: owner?.avatar_url ?? null,
  };
}

export function mapPayment(row: PaymentRow) {
  return {
    ...row,
    amount: Number(row.amount ?? 0),
    user_name: row.user_name,
    property_title: row.property_title,
  };
}

export const LISTING_SQL = `
  SELECT p.*,
         o.name AS owner_name,
         o.phone AS owner_phone,
         o.role AS owner_role,
         o.avatar_url AS owner_avatar_url
  FROM properties p
  JOIN profiles o ON o.id = p.owner_id
`;
