import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  DEMO_MODE,
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
  DEMO_OTP,
} from "../lib/env";
import { apiFetch, getToken, setToken } from "../lib/api";
import { normalisePhone } from "../utils/format";
import type { AccountRole, Profile } from "../types";

// ============================================================
// Auth Context Value
// ============================================================

type AuthContextValue = {
  ready: boolean;
  profile: Profile | null;
  pendingPhone: string | null;
  needsProfile: boolean;
  isDemo: boolean;
  isAdmin: boolean;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, token: string) => Promise<{ needsProfile: boolean }>;
  saveProfile: (input: { name: string; role: AccountRole }) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  updateProfile: (patch: {
    name?: string;
    role?: AccountRole;
    avatar_url?: string | null;
  }) => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  resetDemoAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ============================================================
// Profile mapper (keep shape simple to avoid over-type machinery)
// ============================================================

function mapProfile(row: Record<string, unknown>): Profile {
  return {
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
  };
}

/** Loads the current user's profile from the backend (requires stored JWT). */
async function fetchCurrentProfile(): Promise<Profile | null> {
  if (!(await getToken())) return null;
  try {
    const { profile } = await apiFetch<{ profile: Record<string, unknown> }>("/profile");
    return mapProfile(profile);
  } catch {
    await setToken(null);
    return null;
  }
}

// ============================================================
// AuthProvider
// ============================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [otpRequestId, setOtpRequestId] = useState<string | null>(null);
  const mounted = useRef(true);

  const applyProfile = useCallback((nextProfile: Profile | null) => {
    setProfile(nextProfile);
    if (!nextProfile) {
      setNeedsProfile(false);
      return;
    }
    if (nextProfile.role === "admin") {
      setNeedsProfile(false);
      setPendingPhone(null);
      return;
    }
    const incomplete = nextProfile.name.trim().length === 0;
    setNeedsProfile(incomplete);
    if (incomplete && nextProfile.phone) setPendingPhone(nextProfile.phone);
  }, []);

  // === 1. refreshProfile — reload profile from backend ===
  const refreshProfile = useCallback(async () => {
    if (DEMO_MODE) {
      const { demoGetCurrentProfile } = await import("../services/demoStore");
      const current = await demoGetCurrentProfile();
      if (current) applyProfile(current);
      return;
    }
    const next = await fetchCurrentProfile();
    if (next) applyProfile(next);
  }, [applyProfile]);

  // === 2. Initialize auth state on mount ===
  useEffect(() => {
    mounted.current = true;

    if (DEMO_MODE) {
      (async () => {
        try {
          const { demoGetCurrentProfile } = await import("../services/demoStore");
          const current = await demoGetCurrentProfile();
          if (mounted.current && current) {
            applyProfile(current);
          }
          if (mounted.current && !current) {
            setNeedsProfile(true);
          }
        } catch {
          // Keep going; onboarding screen will handle
        } finally {
          if (mounted.current) setReady(true);
        }
      })();
      return () => {
        mounted.current = false;
      };
    }

    // Real mode: restore the persisted backend token
    (async () => {
      try {
        const next = await fetchCurrentProfile();
        if (mounted.current && next) applyProfile(next);
      } catch (err) {
        console.error("restore session error:", err);
      } finally {
        if (mounted.current) setReady(true);
      }
    })();

    return () => {
      mounted.current = false;
    };
  }, [applyProfile]);

  // === 3. requestOtp — send SMS OTP (or simulate in demo) ===
  const requestOtp = useCallback(async (phone: string) => {
    if (DEMO_MODE) {
      await sleep(650); // simulate network lag
      return;
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      throw new Error("Enter a valid 10-digit mobile number.");
    }
    const { requestId } = await apiFetch<{ message: string; requestId: string | null }>(
      "/auth/request-otp",
      { method: "POST", body: { phone }, auth: false }
    );
    setOtpRequestId(requestId ?? null);
    setPendingPhone(phone);
  }, []);

  // === 4. verifyOtp — verify the SMS code and establish a real session ===
  const verifyOtp = useCallback(
    async (phone: string, token: string): Promise<{ needsProfile: boolean }> => {
      if (DEMO_MODE) {
        if (token !== DEMO_OTP) {
          throw new Error("That OTP is incorrect. Try 123456 in demo mode.");
        }
        const { demoFindProfileByPhone } = await import("../services/demoStore");
        const existing = await demoFindProfileByPhone(phone);
        if (existing) {
          const next = mapProfile({
            id: existing.id,
            phone: existing.phone,
            name: existing.name,
            role: existing.role,
            avatar_url: existing.avatar_url,
            free_listing_used: existing.free_listing_used ?? false,
            onboarding_completed: true,
            phone_verified: true,
          });
          applyProfile(next);
          return { needsProfile: false };
        }
        await import("../services/demoStore").then((mod) => mod.demoSetPendingPhone(phone));
        setPendingPhone(phone);
        setNeedsProfile(true);
        return { needsProfile: true };
      }

      // Real mode: verify with the backend, which also mints the session token
      if (!otpRequestId) {
        throw new Error("Please request an OTP first.");
      }

      const { token: nextToken, profile } = await apiFetch<{
        token: string;
        profile: Record<string, unknown>;
      }>("/auth/verify-otp", {
        method: "POST",
        body: { phone, otp: token, requestId: otpRequestId },
        auth: false,
      });
      setOtpRequestId(null);

      await setToken(nextToken);
      const next = mapProfile(profile);
      setPendingPhone(phone);
      applyProfile(next);
      return { needsProfile: next.name.trim().length === 0 };
    },
    [applyProfile, otpRequestId]
  );

  // === 5. saveProfile — finish onboarding (name + role) ===
  const saveProfile = useCallback(
    async (input: { name: string; role: AccountRole }) => {
      const name = input.name.trim();
      if (name.length < 2) throw new Error("Please enter your full name.");

      if (DEMO_MODE) {
        if (!pendingPhone) throw new Error("Your phone number is missing. Please start again.");
        const { demoCreateProfile } = await import("../services/demoStore");
        const created = await demoCreateProfile({ name, phone: pendingPhone, role: input.role });
        applyProfile(created);
        setPendingPhone(null);
        setNeedsProfile(false);
        return;
      }

      const { token: nextToken, profile } = await apiFetch<{
        token: string;
        profile: Record<string, unknown>;
        message?: string;
      }>("/auth/save-profile", {
        method: "POST",
        body: { name, role: input.role },
      });

      await setToken(nextToken);
      const next = mapProfile(profile);
      applyProfile(next);
      setPendingPhone(null);
      setNeedsProfile(false);
    },
    [applyProfile, pendingPhone]
  );

  // === 6. adminLogin — admin email/password sign-in ===
  const adminLogin = useCallback(
    async (email: string, password: string) => {
      if (DEMO_MODE) {
        if (!email.trim() || !password) throw new Error("Enter the admin credentials.");
        const admin: Profile = {
          id: "admin-1",
          phone: null,
          email: DEMO_ADMIN_EMAIL,
          name: "SystIO Admin",
          role: "admin" as const,
          avatar_url: null,
          free_listing_used: false,
          created_at: new Date().toISOString(),
          onboarding_completed: true,
          phone_verified: true,
        };
        applyProfile(admin);
        setNeedsProfile(false);
        return;
      }

      const { token: nextToken, profile } = await apiFetch<{
        token: string;
        profile: Record<string, unknown>;
        message?: string;
      }>("/auth/admin-login", {
        method: "POST",
        body: { email: email.trim().toLowerCase(), password },
        auth: false,
      });

      await setToken(nextToken);
      const next = mapProfile(profile);
      if (next.role !== "admin") {
        await setToken(null);
        throw new Error("This account is not an admin account.");
      }
      applyProfile(next);
      setNeedsProfile(false);
    },
    [applyProfile]
  );

  // === 7. updateProfile — patch name/role/avatar ===
  const updateProfile = useCallback(
    async (patch: { name?: string; role?: AccountRole; avatar_url?: string | null }) => {
      if (!profile) throw new Error("Please sign in.");

      if (patch.role && !["owner", "broker", "browse"].includes(patch.role)) {
        throw new Error("Invalid account type.");
      }

      if (DEMO_MODE) {
        const { demoUpdateProfile } = await import("../services/demoStore");
        const saved = await demoUpdateProfile({ ...profile, ...patch });
        applyProfile(saved);
        return;
      }

      const { token: nextToken, profile: nextProfile } = await apiFetch<{
        token: string;
        profile: Record<string, unknown>;
        message?: string;
      }>("/auth/update-profile", {
        method: "POST",
        body: patch,
      });

      await setToken(nextToken);
      applyProfile(mapProfile(nextProfile));
    },
    [applyProfile, profile]
  );

  // === 8. signOut — clear session and local state ===
  const signOut = useCallback(async () => {
    if (DEMO_MODE) {
      const { demoSignOut } = await import("../services/demoStore");
      await demoSignOut();
    } else {
      try {
        await apiFetch("/auth/signout", { method: "POST", auth: true });
      } catch {
        // ignore
      }
    }
    await setToken(null);
    setProfile(null);
    setPendingPhone(null);
    setNeedsProfile(false);
    setOtpRequestId(null);
  }, []);

  // === 9. resetDemoAccount — reset demo state ===
  const resetDemoAccount = useCallback(async () => {
    if (!DEMO_MODE) return;
    const { demoReset } = await import("../services/demoStore");
    await demoReset();
    setProfile(null);
    setPendingPhone(null);
    setNeedsProfile(false);
    setOtpRequestId(null);
  }, []);

  // === 10. Context value memo ===
  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      profile,
      pendingPhone,
      needsProfile,
      isDemo: DEMO_MODE,
      isAdmin: profile?.role === "admin",
      requestOtp,
      verifyOtp,
      saveProfile,
      adminLogin,
      updateProfile,
      refreshProfile,
      signOut,
      resetDemoAccount,
    }),
    [
      ready,
      profile,
      pendingPhone,
      needsProfile,
      requestOtp,
      verifyOtp,
      saveProfile,
      adminLogin,
      updateProfile,
      refreshProfile,
      signOut,
      resetDemoAccount,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// -------------------------------------------------------------------------
// Hook
// -------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

// -------------------------------------------------------------------------
// Demo credentials (kept for reference)
// -------------------------------------------------------------------------

export const DEMO_CREDENTIALS = {
  email: DEMO_ADMIN_EMAIL,
  password: DEMO_ADMIN_PASSWORD,
};
