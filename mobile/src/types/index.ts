export type UserRole = "owner" | "broker" | "browse" | "admin";
export type ListingRole = "owner" | "broker";
/** Roles a user may pick for their own account (admin is assigned manually). */
export type AccountRole = "owner" | "broker" | "browse";

export type Profile = {
  id: string;
  phone: string | null;
  email?: string | null;
  name: string;
  role: UserRole;
  avatar_url?: string | null;
  free_listing_used: boolean;
  created_at: string;
  onboarding_completed?: boolean;
  phone_verified?: boolean;
};

export type ListingType = "sale" | "rent";
export type PropertyType = "plot" | "flat" | "house" | "commercial" | "agricultural";
export type AreaUnit = "sqft" | "sqm" | "acre" | "kattha" | "dismil" | "bigha";
export type PropertyStatus = "draft" | "pending" | "approved" | "declined";

export type LatLng = { latitude: number; longitude: number };

export type NearbyLandmark = {
  name: string;
  distance: string;
};

export type PropertyImage = {
  id: string;
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  /** Only present for photos just picked from the device. */
  base64?: string | null;
};

export type Property = {
  id: string;
  owner_id: string;
  owner_name: string;
  owner_phone: string;
  owner_role: ListingRole;
  owner_avatar_url?: string | null;
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
  boundary: LatLng[];
  images: string[];
  youtube_url?: string | null;
  nearby_landmarks: NearbyLandmark[];
  status: PropertyStatus;
  admin_note?: string | null;
  is_featured: boolean;
  views_count: number;
  created_at: string;
  updated_at?: string | null;
};

export type NewProperty = Omit<
  Property,
  | "id"
  | "owner_id"
  | "owner_name"
  | "owner_phone"
  | "owner_role"
  | "owner_avatar_url"
  | "status"
  | "admin_note"
  | "is_featured"
  | "views_count"
  | "created_at"
  | "updated_at"
>;

export type PropertyFilters = {
  query?: string;
  city?: string;
  propertyType?: PropertyType | "all";
  listingType?: ListingType | "all";
  maxPrice?: number | null;
  minPrice?: number | null;
  sort?: "newest" | "price_low" | "price_high" | "area_high";
};

export type PaymentStatus = "created" | "paid" | "failed" | "refunded";

export type Payment = {
  id: string;
  user_id: string;
  user_name?: string;
  property_id: string | null;
  property_title?: string;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  kind: "free_listing" | "listing_fee";
  created_at: string;
  paid_at?: string | null;
};

export type CheckoutSession =
  | { mode: "free"; propertyId: string }
  | { mode: "already_paid"; propertyId: string }
  | { mode: "demo"; propertyId: string; amount: number; currency: string }
  | {
      mode: "razorpay";
      propertyId: string;
      orderId: string;
      keyId: string;
      amount: number;
      currency: string;
    };

export type AdminData = {
  properties: Property[];
  profiles: Profile[];
  payments: Payment[];
};

export type AdminStats = {
  totalListings: number;
  pending: number;
  approved: number;
  declined: number;
  totalUsers: number;
  owners: number;
  brokers: number;
  browsers: number;
  revenue: number;
  paidListings: number;
  freeListings: number;
};
