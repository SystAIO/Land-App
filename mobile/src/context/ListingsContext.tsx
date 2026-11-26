import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "./AuthContext";
import type { Property } from "../types";
import {
  deleteProperty,
  fetchFavoriteIds,
  fetchMyProperties,
  fetchProperties,
  setFavorite,
} from "../services/api";

type ListingsContextValue = {
  properties: Property[];
  myProperties: Property[];
  favoriteIds: string[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: (silent?: boolean) => Promise<void>;
  toggleFavorite: (propertyId: string) => Promise<void>;
  removeListing: (propertyId: string) => Promise<void>;
};

const ListingsContext = createContext<ListingsContextValue | null>(null);

export function ListingsProvider({ children }: { children: React.ReactNode }) {
  const { profile, refreshProfile } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!profile || profile.role === "admin") {
        setLoading(false);
        return;
      }
      if (!silent) setRefreshing(true);
      setError(null);
      try {
        const [publicProperties, ownProperties, favorites] = await Promise.all([
          fetchProperties(),
          fetchMyProperties(profile.id),
          fetchFavoriteIds(profile.id),
        ]);
        setProperties(publicProperties);
        setMyProperties(ownProperties);
        setFavoriteIds(favorites);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load properties.");
      } finally {
        setLoading(false);
        if (!silent) setRefreshing(false);
      }
    },
    [profile]
  );

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const refresh = useCallback(
    async (silent = false) => {
      await load(silent);
    },
    [load]
  );

  const toggleFavorite = useCallback(
    async (propertyId: string) => {
      if (!profile) return;
      const wasFavorite = favoriteIds.includes(propertyId);
      setFavoriteIds((current) =>
        wasFavorite ? current.filter((id) => id !== propertyId) : [...current, propertyId]
      );
      try {
        await setFavorite(profile.id, propertyId, !wasFavorite);
      } catch {
        setFavoriteIds((current) =>
          wasFavorite ? [...current, propertyId] : current.filter((id) => id !== propertyId)
        );
      }
    },
    [favoriteIds, profile]
  );

  const removeListing = useCallback(
    async (propertyId: string) => {
      await deleteProperty(propertyId);
      setMyProperties((current) => current.filter((property) => property.id !== propertyId));
      setProperties((current) => current.filter((property) => property.id !== propertyId));
      setFavoriteIds((current) => current.filter((id) => id !== propertyId));
      await refreshProfile();
    },
    [refreshProfile]
  );

  const value = useMemo<ListingsContextValue>(
    () => ({
      properties,
      myProperties,
      favoriteIds,
      loading,
      refreshing,
      error,
      refresh,
      toggleFavorite,
      removeListing,
    }),
    [
      properties,
      myProperties,
      favoriteIds,
      loading,
      refreshing,
      error,
      refresh,
      toggleFavorite,
      removeListing,
    ]
  );

  return <ListingsContext.Provider value={value}>{children}</ListingsContext.Provider>;
}

export function useListings(): ListingsContextValue {
  const context = useContext(ListingsContext);
  if (!context) throw new Error("useListings must be used inside ListingsProvider");
  return context;
}
