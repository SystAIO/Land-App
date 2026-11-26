import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "./AuthContext";
import type { AdminData, AdminStats, Profile, Property, PropertyStatus } from "../types";
import {
  adminDeleteProperty,
  adminSetPropertyStatus,
  adminToggleFeatured,
  fetchAdminData,
} from "../services/api";

type AdminContextValue = {
  data: AdminData;
  stats: AdminStats;
  pending: Property[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setStatus: (
    propertyId: string,
    status: Extract<PropertyStatus, "approved" | "declined">,
    note?: string
  ) => Promise<void>;
  toggleFeatured: (propertyId: string, featured: boolean) => Promise<void>;
  removeProperty: (propertyId: string) => Promise<void>;
  profileById: (id: string) => Profile | undefined;
};

const EMPTY: AdminData = { properties: [], profiles: [], payments: [] };

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { profile, refreshProfile } = useAuth();
  const [data, setData] = useState<AdminData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setRefreshing(true);
      setError(null);
      try {
        const next = await fetchAdminData();
        setData(next);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load admin data.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    if (profile?.role === "admin") load();
  }, [load, profile?.role]);

  const refresh = useCallback(async () => {
    await load(true);
  }, [load]);

  const setStatus = useCallback(
    async (
      propertyId: string,
      status: Extract<PropertyStatus, "approved" | "declined">,
      note?: string
    ) => {
      await adminSetPropertyStatus(propertyId, status, note);
      setData((current) => ({
        ...current,
        properties: current.properties.map((property) =>
          property.id === propertyId
            ? {
                ...property,
                status,
                admin_note: status === "declined" ? note ?? null : null,
              }
            : property
        ),
      }));
      refresh();
      refreshProfile();
    },
    [refresh, refreshProfile]
  );

  const toggleFeatured = useCallback(
    async (propertyId: string, featured: boolean) => {
      await adminToggleFeatured(propertyId, featured);
      setData((current) => ({
        ...current,
        properties: current.properties.map((property) =>
          property.id === propertyId ? { ...property, is_featured: featured } : property
        ),
      }));
    },
    []
  );

  const removeProperty = useCallback(
    async (propertyId: string) => {
      await adminDeleteProperty(propertyId);
      setData((current) => ({
        ...current,
        properties: current.properties.filter((property) => property.id !== propertyId),
      }));
    },
    []
  );

  const stats = useMemo<AdminStats>(() => {
    const approved = data.properties.filter((property) => property.status === "approved").length;
    const pending = data.properties.filter((property) => property.status === "pending").length;
    const declined = data.properties.filter((property) => property.status === "declined").length;
    const owners = data.profiles.filter((entry) => entry.role === "owner").length;
    const brokers = data.profiles.filter((entry) => entry.role === "broker").length;
    const browsers = data.profiles.filter((entry) => entry.role === "browse").length;
    const paid = data.payments.filter((payment) => payment.status === "paid");
    return {
      totalListings: data.properties.length,
      pending,
      approved,
      declined,
      totalUsers: owners + brokers + browsers,
      owners,
      brokers,
      browsers,
      revenue: paid.reduce((sum, payment) => sum + payment.amount, 0) / 100,
      paidListings: paid.filter((payment) => payment.kind === "listing_fee").length,
      freeListings: paid.filter((payment) => payment.kind === "free_listing").length,
    };
  }, [data]);

  const pending = useMemo(
    () =>
      data.properties
        .filter((property) => property.status === "pending")
        .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)),
    [data.properties]
  );

  const profileById = useCallback(
    (id: string) => data.profiles.find((entry) => entry.id === id),
    [data.profiles]
  );

  const value = useMemo<AdminContextValue>(
    () => ({
      data,
      stats,
      pending,
      loading,
      refreshing,
      error,
      refresh,
      setStatus,
      toggleFeatured,
      removeProperty,
      profileById,
    }),
    [
      data,
      stats,
      pending,
      loading,
      refreshing,
      error,
      refresh,
      setStatus,
      toggleFeatured,
      removeProperty,
      profileById,
    ]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminContextValue {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdmin must be used inside AdminProvider");
  return context;
}
