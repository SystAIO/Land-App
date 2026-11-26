import AsyncStorage from "@react-native-async-storage/async-storage";

import { SEED_OWNER_PROFILES, SEED_PAYMENTS, SEED_PROPERTIES } from "../data/demoData";
import type { AccountRole, Payment, Profile, Property } from "../types";
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD } from "../lib/env";

const KEYS = {
  properties: "systio.demo.properties.v1",
  accounts: "systio.demo.accounts.v1",
  payments: "systio.demo.payments.v1",
  favorites: "systio.demo.favorites.v1",
  session: "systio.demo.session.v1",
  pendingPhone: "systio.demo.pending-phone.v1",
  adminSession: "systio.demo.admin-session.v1",
} as const;

export const DEMO_ADMIN_PROFILE: Profile = {
  id: "demo-admin",
  phone: null,
  email: DEMO_ADMIN_EMAIL,
  name: "SystIO Admin",
  role: "admin",
  avatar_url: null,
  free_listing_used: true,
  created_at: new Date("2025-01-01T00:00:00.000Z").toISOString(),
};

let seedPromise: Promise<void> | null = null;

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function ensureDemoSeed(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const [properties, payments, favorites] = await Promise.all([
        AsyncStorage.getItem(KEYS.properties),
        AsyncStorage.getItem(KEYS.payments),
        AsyncStorage.getItem(KEYS.favorites),
      ]);
      const writes: Promise<void>[] = [];
      if (!properties) writes.push(writeJson(KEYS.properties, SEED_PROPERTIES));
      if (!payments) writes.push(writeJson(KEYS.payments, SEED_PAYMENTS));
      if (!favorites) writes.push(writeJson(KEYS.favorites, []));
      await Promise.all(writes);
    })();
  }
  return seedPromise;
}

export async function demoGetProperties(): Promise<Property[]> {
  await ensureDemoSeed();
  return readJson<Property[]>(KEYS.properties, SEED_PROPERTIES);
}

export async function demoSetProperties(properties: Property[]): Promise<void> {
  await writeJson(KEYS.properties, properties);
}

export async function demoGetPayments(): Promise<Payment[]> {
  await ensureDemoSeed();
  return readJson<Payment[]>(KEYS.payments, SEED_PAYMENTS);
}

export async function demoSetPayments(payments: Payment[]): Promise<void> {
  await writeJson(KEYS.payments, payments);
}

export async function demoGetFavorites(): Promise<string[]> {
  await ensureDemoSeed();
  return readJson<string[]>(KEYS.favorites, []);
}

export async function demoSetFavorites(ids: string[]): Promise<void> {
  await writeJson(KEYS.favorites, ids);
}

async function demoGetAccounts(): Promise<Profile[]> {
  return readJson<Profile[]>(KEYS.accounts, []);
}

async function demoSetAccounts(accounts: Profile[]): Promise<void> {
  await writeJson(KEYS.accounts, accounts);
}

/** Seed owners + real demo accounts, de-duplicated by id. */
export async function demoGetAllProfiles(): Promise<Profile[]> {
  const accounts = await demoGetAccounts();
  const seen = new Set<string>();
  return [...SEED_OWNER_PROFILES, ...accounts].filter((profile) => {
    if (seen.has(profile.id)) return false;
    seen.add(profile.id);
    return true;
  });
}

export async function demoGetCurrentProfile(): Promise<Profile | null> {
  const isAdmin = await AsyncStorage.getItem(KEYS.adminSession);
  if (isAdmin === "true") return DEMO_ADMIN_PROFILE;

  const sessionId = await AsyncStorage.getItem(KEYS.session);
  if (!sessionId) return null;
  const accounts = await demoGetAccounts();
  return accounts.find((profile) => profile.id === sessionId) ?? null;
}

export async function demoFindProfileByPhone(phone: string): Promise<Profile | null> {
  const accounts = await demoGetAccounts();
  return accounts.find((profile) => profile.phone === phone) ?? null;
}

export async function demoCreateProfile(input: {
  name: string;
  phone: string;
  role: AccountRole;
}): Promise<Profile> {
  const existing = await demoFindProfileByPhone(input.phone);
  if (existing) {
    const updated: Profile = { ...existing, name: input.name, role: input.role };
    await demoUpdateProfile(updated);
    await AsyncStorage.setItem(KEYS.session, updated.id);
    await AsyncStorage.removeItem(KEYS.pendingPhone);
    return updated;
  }

  const accounts = await demoGetAccounts();
  const profile: Profile = {
    id: `demo-user-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    phone: input.phone,
    email: null,
    name: input.name.trim(),
    role: input.role,
    avatar_url: null,
    free_listing_used: false,
    created_at: new Date().toISOString(),
  };
  await demoSetAccounts([...accounts, profile]);
  await AsyncStorage.setItem(KEYS.session, profile.id);
  await AsyncStorage.removeItem(KEYS.pendingPhone);
  return profile;
}

export async function demoUpdateProfile(profile: Profile): Promise<Profile> {
  const accounts = await demoGetAccounts();
  const next = accounts.map((entry) => (entry.id === profile.id ? profile : entry));
  await demoSetAccounts(next);
  return profile;
}

export async function demoSetSession(profileId: string | null): Promise<void> {
  if (profileId) await AsyncStorage.setItem(KEYS.session, profileId);
  else await AsyncStorage.removeItem(KEYS.session);
}

export async function demoSetPendingPhone(phone: string | null): Promise<void> {
  if (phone) await AsyncStorage.setItem(KEYS.pendingPhone, phone);
  else await AsyncStorage.removeItem(KEYS.pendingPhone);
}

export async function demoGetPendingPhone(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.pendingPhone);
}

export async function demoSignInAdmin(email: string, password: string): Promise<Profile> {
  if (
    email.trim().toLowerCase() !== DEMO_ADMIN_EMAIL ||
    password !== DEMO_ADMIN_PASSWORD
  ) {
    throw new Error("Incorrect admin email or password.");
  }
  await AsyncStorage.setItem(KEYS.adminSession, "true");
  return DEMO_ADMIN_PROFILE;
}

export async function demoSignOut(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.session, KEYS.adminSession, KEYS.pendingPhone]);
}

export async function demoReset(): Promise<void> {
  seedPromise = null;
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
