import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ChevronRight,
  Clock,
  LandPlot,
  MapPin,
  Star,
} from "lucide-react-native";

import {
  AdminFilterChip,
  AdminPill,
  AdminSearch,
  AdminShell,
} from "../../components/admin/AdminUI";
import { EmptyState } from "../../components/EmptyState";
import { colors, radii, shadow, spacing } from "../../constants/theme";
import { useAdmin } from "../../context/AdminContext";
import type { AdminStackParamList, AdminTabParamList } from "../../navigation/types";
import type { PropertyStatus } from "../../types";
import { formatArea, formatPrice, timeAgo } from "../../utils/format";

type Props = CompositeScreenProps<
  BottomTabScreenProps<AdminTabParamList, "AdminListings">,
  NativeStackScreenProps<AdminStackParamList>
>;

type Filter = "all" | PropertyStatus;

const FILTERS: { id: Filter; label: string; tone: "neutral" | "gold" | "success" | "danger" }[] = [
  { id: "all", label: "All", tone: "neutral" },
  { id: "pending", label: "Pending", tone: "gold" },
  { id: "approved", label: "Approved", tone: "success" },
  { id: "declined", label: "Declined", tone: "danger" },
  { id: "draft", label: "Drafts", tone: "neutral" },
];

function statusTone(status: PropertyStatus): "neutral" | "gold" | "success" | "danger" | "info" {
  if (status === "approved") return "success";
  if (status === "pending") return "gold";
  if (status === "declined") return "danger";
  return "info";
}

function statusLabel(status: PropertyStatus) {
  if (status === "approved") return "APPROVED";
  if (status === "pending") return "PENDING";
  if (status === "declined") return "DECLINED";
  return "DRAFT";
}

export function AdminListingsScreen({ navigation }: Props) {
  const { data, loading, refreshing, refresh, error } = useAdmin();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const next: Record<Filter, number> = {
      all: data.properties.length,
      pending: 0,
      approved: 0,
      declined: 0,
      draft: 0,
    };
    data.properties.forEach((property) => {
      next[property.status] += 1;
    });
    return next;
  }, [data.properties]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return data.properties.filter((property) => {
      if (filter !== "all" && property.status !== filter) return false;
      if (!term) return true;
      return [property.title, property.owner_name, property.city, property.locality, property.pincode]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [data.properties, filter, search]);

  return (
    <AdminShell
      title="All listings"
      subtitle="Search the catalogue, jump into any listing and moderate it."
      right={
        <View style={styles.countPill}>
          <LandPlot size={12} color={colors.gold} />
          <Text style={styles.countText}>{data.properties.length} TOTAL</Text>
        </View>
      }
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <AdminSearch
          value={search}
          onChangeText={setSearch}
          placeholder="Search title, owner, city or PIN code"
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map((entry) => (
            <AdminFilterChip
              key={entry.id}
              label={entry.label}
              count={counts[entry.id]}
              tone={entry.tone}
              active={filter === entry.id}
              onPress={() => setFilter(entry.id)}
            />
          ))}
        </ScrollView>

        <View style={styles.resultRow}>
          <Text style={styles.resultText}>
            {filtered.length} {filtered.length === 1 ? "listing" : "listings"}
            {filter !== "all" ? ` · ${FILTERS.find((entry) => entry.id === filter)?.label}` : ""}
          </Text>
          <View style={styles.sortPill}>
            <Clock size={11} color={colors.muted} />
            <Text style={styles.sortText}>Newest first</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={refresh} accessibilityRole="button">
              <Text style={styles.errorRetry}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {loading && !data.properties.length ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading listings…</Text>
          </View>
        ) : filtered.length ? (
          <View style={styles.list}>
            {filtered.map((property) => (
              <Pressable
                key={property.id}
                onPress={() => navigation.navigate("AdminPropertyDetail", { id: property.id })}
                style={({ pressed }) => [
                  styles.row,
                  property.status === "pending" && styles.rowPending,
                  pressed && { opacity: 0.85 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${property.title}, ${property.status}`}
              >
                <Image source={{ uri: property.images[0] }} style={styles.image} />
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={2}>
                      {property.title}
                    </Text>
                    {property.is_featured ? (
                      <Star size={12} color={colors.goldDeep} fill={colors.gold} />
                    ) : null}
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.owner} numberOfLines={1}>
                      {property.owner_name}
                    </Text>
                    <Text style={styles.metaDot}>·</Text>
                    <MapPin size={9} color={colors.faint} />
                    <Text style={styles.city} numberOfLines={1}>
                      {property.city}
                    </Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>
                      {formatPrice(property.price, property.listing_type)}
                    </Text>
                    <Text style={styles.area}>
                      {formatArea(property.area_value, property.area_unit)}
                    </Text>
                  </View>
                  <View style={styles.bottomRow}>
                    <AdminPill
                      label={statusLabel(property.status)}
                      tone={statusTone(property.status)}
                    />
                    <Text style={styles.time}>{timeAgo(property.created_at)}</Text>
                  </View>
                </View>
                <ChevronRight size={16} color={colors.faint} />
              </Pressable>
            ))}
          </View>
        ) : (
          <EmptyState
            compact
            icon={<LandPlot size={26} color={colors.primary} />}
            title={search || filter !== "all" ? "No matching listings" : "No listings yet"}
            body={
              search || filter !== "all"
                ? "Try a different search term or clear the status filter."
                : "Sellers’ properties will appear here as soon as the first listing is created."
            }
            actionLabel={search || filter !== "all" ? "Clear filters" : undefined}
            onAction={
              search || filter !== "all"
                ? () => {
                    setSearch("");
                    setFilter("all");
                  }
                : undefined
            }
          />
        )}
      </ScrollView>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 14,
    paddingBottom: 36,
  },
  countPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(246,196,106,0.13)",
    borderRadius: radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  countText: {
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: colors.gold,
  },
  filters: {
    gap: 6,
    paddingVertical: 10,
    paddingRight: 6,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
  },
  resultText: {
    fontSize: 9,
    color: colors.muted,
    fontWeight: "600",
  },
  sortPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sortText: {
    fontSize: 8,
    color: colors.muted,
    fontWeight: "600",
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.md,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 9,
  },
  errorText: {
    flex: 1,
    fontSize: 9.5,
    color: colors.danger,
    lineHeight: 14,
  },
  errorRetry: {
    fontSize: 9.5,
    fontWeight: "900",
    color: colors.danger,
    textDecorationLine: "underline",
  },
  loading: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  loadingText: {
    fontSize: 10,
    color: colors.muted,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 9,
    ...shadow.soft,
  },
  rowPending: {
    borderColor: "#F0DDA8",
    backgroundColor: "#FFFDF8",
  },
  image: {
    width: 68,
    height: 78,
    borderRadius: radii.sm,
    backgroundColor: colors.canvasDeep,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
  },
  title: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  owner: {
    fontSize: 8,
    color: colors.muted,
    fontWeight: "600",
    maxWidth: 100,
  },
  metaDot: {
    fontSize: 8,
    color: colors.faint,
  },
  city: {
    flex: 1,
    fontSize: 8,
    color: colors.muted,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginTop: 4,
  },
  price: {
    fontSize: 12.5,
    fontWeight: "900",
    color: colors.ink,
  },
  area: {
    fontSize: 8,
    color: colors.faint,
    fontWeight: "600",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 5,
  },
  time: {
    fontSize: 7.5,
    color: colors.faint,
    fontWeight: "500",
  },
});
