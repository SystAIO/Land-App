import { DEMO_MODE, LISTING_FEE_RUPEES } from "../lib/env";
import { apiFetch } from "../lib/api";
import type {
  AdminData,
  CheckoutSession,
  NewProperty,
  Payment,
  Profile,
  Property,
  PropertyImage,
  PropertyStatus,
} from "../types";
import {
  demoFindProfileByPhone,
  demoGetAllProfiles,
  demoGetCurrentProfile,
  demoGetFavorites,
  demoGetPayments,
  demoGetProperties,
  demoSetFavorites,
  demoSetPayments,
  demoSetProperties,
  demoUpdateProfile,
} from "./demoStore";

export type PropertyDraftInput = Omit<NewProperty, "images"> & {
  images: PropertyImage[];
};

const mapProfile = (row: Record<string, unknown>): Profile => ({
  id: String(row.id),
  phone: (row.phone as string | null) ?? null,
  email: (row.email as string | null) ?? null,
  name: (row.name as string | null) ?? "",
  role: (row.role as Profile["role"]) ?? "owner",
  avatar_url: (row.avatar_url as string | null) ?? null,
  free_listing_used: Boolean(row.free_listing_used),
  created_at: (row.created_at as string) ?? new Date().toISOString(),
  onboarding_completed: Boolean(row.onboarding_completed),
  phone_verified: Boolean(row.phone_verified),
});

const mapProperty = (row: Record<string, unknown>): Property => {
  const asArray = (value: unknown, fallback: unknown[]): unknown[] =>
    Array.isArray(value) ? value : fallback;
  return {
    ...(row as unknown as Property),
    images: asArray(row.images, []).filter((image): image is string => typeof image === "string"),
    boundary: asArray(row.boundary, []) as Property["boundary"],
    nearby_landmarks: asArray(row.nearby_landmarks, []) as Property["nearby_landmarks"],
    price: Number(row.price ?? 0),
    area_value: Number(row.area_value ?? 0),
    latitude: Number(row.latitude ?? 0),
    longitude: Number(row.longitude ?? 0),
    views_count: Number(row.views_count ?? 0),
    owner_role: row.owner_role === "broker" ? "broker" : "owner",
    is_featured: Boolean(row.is_featured),
  };
};

const mapPayment = (row: Record<string, unknown>): Payment => ({
  ...(row as unknown as Payment),
  amount: Number(row.amount ?? 0),
});

async function currentUserId(): Promise<string> {
  if (DEMO_MODE) {
    const profile = await demoGetCurrentProfile();
    if (!profile) throw new Error("Please sign in again.");
    return profile.id;
  }
  const { profile } = await apiFetch<{ profile: Profile }>("/profile");
  return profile.id;
}

async function currentProfile(): Promise<Profile> {
  if (DEMO_MODE) {
    const profile = await demoGetCurrentProfile();
    if (!profile) throw new Error("Please sign in again.");
    return profile;
  }
  const { profile } = await apiFetch<{ profile: Profile }>("/profile");
  return profile;
}

async function uploadImages(
  images: PropertyImage[],
  _userId: string
): Promise<string[]> {
  if (DEMO_MODE) return images.map((image) => image.uri);

  const { CLOUDINARY_CONFIGURED, uploadToCloudinary } = await import("./cloudinary");
  if (!CLOUDINARY_CONFIGURED) {
    throw new Error(
      "Photo upload is not configured. Set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET in mobile/.env."
    );
  }
  return Promise.all(images.map((image) => uploadToCloudinary(image)));
}

export async function fetchProperties(): Promise<Property[]> {
  if (DEMO_MODE) {
    const properties = await demoGetProperties();
    return properties
      .filter((property) => property.status === "approved")
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }
  const data = await apiFetch<Record<string, unknown>[]>("/listings");
  return data.map(mapProperty);
}

export async function fetchMyProperties(_userId: string): Promise<Property[]> {
  if (DEMO_MODE) {
    const properties = await demoGetProperties();
    return properties
      .filter((property) => property.owner_id === _userId)
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }
  const data = await apiFetch<Record<string, unknown>[]>("/listings/my");
  return data.map(mapProperty);
}

const buildNewProperty = (
  input: PropertyDraftInput,
  images: string[],
  profile: Profile
): Property => {
  const now = new Date().toISOString();
  return {
    ...input,
    images,
    id: "",
    owner_id: profile.id,
    owner_name: profile.name,
    owner_phone: profile.phone ?? "",
    owner_role: profile.role === "broker" ? "broker" : "owner",
    owner_avatar_url: profile.avatar_url ?? null,
    status: "draft",
    admin_note: null,
    is_featured: false,
    views_count: 0,
    created_at: now,
    updated_at: now,
  };
};

export async function createProperty(input: PropertyDraftInput): Promise<Property> {
  const userId = await currentUserId();
  const profile = await currentProfile();
  const images = await uploadImages(input.images, userId);

  if (DEMO_MODE) {
    const properties = await demoGetProperties();
    const property: Property = {
      ...buildNewProperty(input, images, profile),
      id: `demo-prop-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    };
    await demoSetProperties([property, ...properties]);
    return property;
  }

  const payload = {
    ...input,
    images,
    boundary: input.boundary ?? [],
    nearby_landmarks: input.nearby_landmarks ?? [],
    youtube_url: input.youtube_url || null,
  };
  const data = await apiFetch<Record<string, unknown>>("/listings", {
    method: "POST",
    body: payload,
  });
  return mapProperty(data);
}

export async function updateProperty(
  propertyId: string,
  input: PropertyDraftInput
): Promise<Property> {
  const userId = await currentUserId();
  const images = await uploadImages(input.images, userId);

  if (DEMO_MODE) {
    const properties = await demoGetProperties();
    const index = properties.findIndex(
      (property) => property.id === propertyId && property.owner_id === userId
    );
    if (index < 0) throw new Error("Property not found.");
    const next: Property = {
      ...properties[index],
      ...input,
      images,
      boundary: input.boundary ?? [],
      nearby_landmarks: input.nearby_landmarks ?? [],
      youtube_url: input.youtube_url || null,
      updated_at: new Date().toISOString(),
    };
    const updated = [...properties];
    updated[index] = next;
    await demoSetProperties(updated);
    return next;
  }

  const payload = {
    ...input,
    images,
    boundary: input.boundary ?? [],
    nearby_landmarks: input.nearby_landmarks ?? [],
    youtube_url: input.youtube_url || null,
  };
  const data = await apiFetch<Record<string, unknown>>(`/listings/${propertyId}`, {
    method: "PUT",
    body: payload,
  });
  return mapProperty(data);
}

export async function resubmitProperty(propertyId: string): Promise<void> {
  if (DEMO_MODE) {
    const userId = await currentUserId();
    const properties = await demoGetProperties();
    const index = properties.findIndex(
      (property) => property.id === propertyId && property.owner_id === userId
    );
    if (index < 0) throw new Error("Property not found.");
    if (properties[index].status === "draft") {
      throw new Error("Publish this property before editing it.");
    }
    const updated = [...properties];
    updated[index] = {
      ...updated[index],
      status: "pending",
      admin_note: null,
      updated_at: new Date().toISOString(),
    };
    await demoSetProperties(updated);
    return;
  }
  await apiFetch(`/listings/${propertyId}/resubmit`, { method: "POST" });
}

export async function deleteProperty(propertyId: string): Promise<void> {
  const userId = await currentUserId();
  if (DEMO_MODE) {
    const properties = await demoGetProperties();
    await demoSetProperties(
      properties.filter(
        (property) => !(property.id === propertyId && property.owner_id === userId)
      )
    );
    return;
  }
  await apiFetch(`/listings/${propertyId}`, { method: "DELETE" });
}

export async function startListingCheckout(propertyId: string): Promise<CheckoutSession> {
  const profile = await currentProfile();

  if (DEMO_MODE) {
    const properties = await demoGetProperties();
    const property = properties.find(
      (entry) => entry.id === propertyId && entry.owner_id === profile.id
    );
    if (!property) throw new Error("Property not found.");
    if (property.status !== "draft") throw new Error("This property has already been submitted.");

    if (!profile.free_listing_used) {
      await demoUpdateProfile({ ...profile, free_listing_used: true });
      const updatedProperties = properties.map((entry) =>
        entry.id === propertyId
          ? {
              ...entry,
              status: "pending" as const,
              updated_at: new Date().toISOString(),
            }
          : entry
      );
      await demoSetProperties(updatedProperties);
      const payments = await demoGetPayments();
      const payment: Payment = {
        id: `demo-pay-${Date.now()}`,
        user_id: profile.id,
        user_name: profile.name,
        property_id: property.id,
        property_title: property.title,
        razorpay_order_id: null,
        razorpay_payment_id: null,
        amount: 0,
        currency: "INR",
        status: "paid",
        kind: "free_listing",
        created_at: new Date().toISOString(),
        paid_at: new Date().toISOString(),
      };
      await demoSetPayments([payment, ...payments]);
      return { mode: "free", propertyId };
    }

    return {
      mode: "demo",
      propertyId,
      amount: LISTING_FEE_RUPEES * 100,
      currency: "INR",
    };
  }

  const data = await apiFetch<Record<string, unknown>>(`/listings/${propertyId}/submit`, {
    method: "POST",
  });
  if (data.already_paid === true) return { mode: "already_paid", propertyId };
  if (data.mode === "free") return { mode: "free", propertyId };
  return {
    mode: "razorpay",
    propertyId,
    orderId: String(data.orderId),
    keyId: String(data.keyId),
    amount: Number(data.amount),
    currency: String(data.currency ?? "INR"),
  };
}

export async function verifyListingPayment(input: {
  propertyId: string;
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<void> {
  if (DEMO_MODE) {
    const userId = await currentUserId();
    const profile = await currentProfile();
    const properties = await demoGetProperties();
    const property = properties.find(
      (entry) => entry.id === input.propertyId && entry.owner_id === userId
    );
    if (!property) throw new Error("Property not found.");
    const updated = properties.map((entry) =>
      entry.id === input.propertyId
        ? {
            ...entry,
            status: "pending" as const,
            updated_at: new Date().toISOString(),
          }
        : entry
    );
    await demoSetProperties(updated);
    const payments = await demoGetPayments();
    const payment: Payment = {
      id: `demo-pay-${Date.now()}`,
      user_id: profile.id,
      user_name: profile.name,
      property_id: property.id,
      property_title: property.title,
      razorpay_order_id: input.orderId,
      razorpay_payment_id: input.paymentId,
      amount: LISTING_FEE_RUPEES * 100,
      currency: "INR",
      status: "paid",
      kind: "listing_fee",
      created_at: new Date().toISOString(),
      paid_at: new Date().toISOString(),
    };
    await demoSetPayments([payment, ...payments]);
    return;
  }

  await apiFetch(`/payments/verify`, {
    method: "POST",
    body: {
      propertyId: input.propertyId,
      orderId: input.orderId,
      paymentId: input.paymentId,
      signature: input.signature,
    },
  });
}

export async function fetchFavoriteIds(_userId: string): Promise<string[]> {
  if (DEMO_MODE) return demoGetFavorites();
  const data = await apiFetch<string[]>(`/favorites`);
  return data.map(String);
}

export async function setFavorite(
  _userId: string,
  propertyId: string,
  favorite: boolean
): Promise<void> {
  if (DEMO_MODE) {
    const current = await demoGetFavorites();
    const next = favorite
      ? Array.from(new Set([...current, propertyId]))
      : current.filter((id) => id !== propertyId);
    await demoSetFavorites(next);
    return;
  }
  if (favorite) {
    await apiFetch(`/favorites/${propertyId}`, { method: "PUT" });
  } else {
    await apiFetch(`/favorites/${propertyId}`, { method: "DELETE" });
  }
}

export async function fetchPaymentHistory(_userId: string): Promise<Payment[]> {
  if (DEMO_MODE) {
    const payments = await demoGetPayments();
    return payments
      .filter((payment) => payment.user_id === _userId)
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }
  const data = await apiFetch<Record<string, unknown>[]>(`/payments/history`);
  return data.map(mapPayment);
}

export async function fetchAdminData(): Promise<AdminData> {
  if (DEMO_MODE) {
    const [properties, profiles, payments] = await Promise.all([
      demoGetProperties(),
      demoGetAllProfiles(),
      demoGetPayments(),
    ]);
    return {
      properties: [...properties].sort(
        (a, b) => +new Date(b.created_at) - +new Date(a.created_at)
      ),
      profiles,
      payments: [...payments].sort(
        (a, b) => +new Date(b.created_at) - +new Date(a.created_at)
      ),
    };
  }
  const data = await apiFetch<{
    profiles: Record<string, unknown>[];
    properties: Record<string, unknown>[];
    payments: Record<string, unknown>[];
  }>(`/admin/data`);
  return {
    profiles: data.profiles.map(mapProfile),
    properties: data.properties.map(mapProperty),
    payments: data.payments.map(mapPayment),
  };
}

export async function adminSetPropertyStatus(
  propertyId: string,
  status: Extract<PropertyStatus, "approved" | "declined" | "pending">,
  note?: string
): Promise<void> {
  if (DEMO_MODE) {
    const properties = await demoGetProperties();
    await demoSetProperties(
      properties.map((property) =>
        property.id === propertyId
          ? {
              ...property,
              status,
              admin_note: status === "declined" ? note ?? null : null,
              updated_at: new Date().toISOString(),
            }
          : property
      )
    );
    return;
  }
  await apiFetch(`/admin/properties/${propertyId}/status`, {
    method: "POST",
    body: { status, note: note ?? null },
  });
}

export async function adminToggleFeatured(
  propertyId: string,
  featured: boolean
): Promise<void> {
  if (DEMO_MODE) {
    const properties = await demoGetProperties();
    await demoSetProperties(
      properties.map((property) =>
        property.id === propertyId
          ? { ...property, is_featured: featured, updated_at: new Date().toISOString() }
          : property
      )
    );
    return;
  }
  await apiFetch(`/admin/properties/${propertyId}/featured`, {
    method: "POST",
    body: { featured },
  });
}

export async function adminDeleteProperty(propertyId: string): Promise<void> {
  if (DEMO_MODE) {
    const properties = await demoGetProperties();
    await demoSetProperties(properties.filter((property) => property.id !== propertyId));
    return;
  }
  await apiFetch(`/admin/properties/${propertyId}`, { method: "DELETE" });
}

export { demoFindProfileByPhone as lookupDemoProfileByPhone };
