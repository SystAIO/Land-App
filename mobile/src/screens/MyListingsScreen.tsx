import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ChevronRight,
  Crown,
  Eye,
  LandPlot,
  MapPin,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react-native";

import { EmptyState } from "../components/EmptyState";
import { PaymentModal } from "../components/PaymentModal";
import { Chip } from "../components/Pills";
import { StatusPill } from "../components/Pills";
import { HeaderIcon, PrimaryButton } from "../components/Buttons";
import { colors, radii, shadow, spacing } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { useListings } from "../context/ListingsContext";
import { useToast } from "../context/ToastContext";
import type { RootStackParamList, TabParamList } from "../navigation/types";
import type { Property, PropertyStatus } from "../types";
import { formatArea, formatPrice, timeAgo } from "../utils/format";

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Listings">,
  NativeStackScreenProps<RootStackParamList>
>;

const FILTERS: { id: PropertyStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "declined", label: "Declined" },
  { id: "draft", label: "Drafts" },
];

export function MyListingsScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const { profile, refreshProfile } = useAuth();
  const {
    myProperties,
    loading,
    refreshing,
    refresh,
    removeListing,
  } = useListings();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<PropertyStatus | "all">("all");
  const [payProperty, setPayProperty] = useState<Property | null>(null);
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      all: myProperties.length,
      pending: myProperties.filter((property) => property.status === "pending").length,
      approved: myProperties.filter((property) => property.status === "approved").length,
      declined: myProperties.filter((property) => property.status === "declined").length,
      draft: myProperties.filter((property) => property.status === "draft").length,
    }),
    [myProperties]
  );

  const visible = useMemo(
    () =>
      filter === "all"
        ? myProperties
        : myProperties.filter((property) => property.status === filter),
    [filter, myProperties]
  );

  const confirmDelete = (property: Property) => {
    Alert.alert(
      "Delete listing?",
      `“${property.title}” will be removed permanently. Your free-listing benefit is not reset — the next listing will still cost ₹100 if the free one was already used.`,
      [
        { text: "Keep listing", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingId(property.id);
            try {
              await removeListing(property.id);
              showToast("Listing deleted.");
            } catch (deleteError) {
              showToast(
                deleteError instanceof Error
                  ? deleteError.message
                  : "Could not delete the listing.",
                "error"
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const openPayment = (property: Property) => {
    setPayProperty(property);
    setPaymentVisible(true);
  };

  const canCreate = Boolean(profile);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => refresh(false)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>YOUR PORTFOLIO</Text>
            <Text style={styles.title}>My listings</Text>
            <Text style={styles.subtitle}>
              {myProperties.length
                ? `${myProperties.length} ${
                    myProperties.length === 1 ? "property" : "properties"
                  } · ${counts.approved} live`
                : "Track approvals, edits and payments in one place."}
            </Text>
          </View>
          <HeaderIcon
            label="List a new property"
            onPress={() => navigation.navigate("ListProperty")}
            icon={<Plus size={21} color={colors.primary} strokeWidth={2.6} />}
          />
        </View>

        <Pressable
          onPress={() => navigation.navigate("Subscription")}
          style={({ pressed }) => [{ opacity: pressed ? 0.94 : 1 }]}
        >
          {profile?.free_listing_used ? (
            <LinearGradient
              colors={[colors.violetSoft, "#F7F4FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.planCard}
            >
              <View style={styles.planTop}>
                <View style={[styles.planIcon, { backgroundColor: "#E7E2FF" }]}>
                  <Crown size={20} color={colors.violet} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planTitle}>Free listing used</Text>
                  <Text style={styles.planBody}>
                    Additional listings are ₹100 each. Your free benefit does not reset when
                    you delete a property.
                  </Text>
                </View>
                <ChevronRight size={17} color={colors.violet} />
              </View>
            </LinearGradient>
          ) : (
            <View style={styles.planCardGold}>
              <View style={styles.planTop}>
                <View style={[styles.planIcon, { backgroundColor: "#FBEDC5" }]}>
                  <Sparkles size={20} color={colors.goldDeep} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.freeRow}>
                    <Text style={styles.planTitleGold}>Your first listing is free</Text>
                    <View style={styles.freeBadge}>
                      <Text style={styles.freeBadgeText}>₹0</Text>
                    </View>
                  </View>
                  <Text style={styles.planBodyGold}>
                    List your first property with no payment. After that, every listing is
                    just ₹100.
                  </Text>
                </View>
                <ChevronRight size={17} color={colors.goldDeep} />
              </View>
            </View>
          )}
        </Pressable>

        <View style={styles.statsRow}>
          <Stat label="TOTAL" value={counts.all} tint={colors.ink} />
          <Stat label="PENDING" value={counts.pending} tint={colors.warning} />
          <Stat label="APPROVED" value={counts.approved} tint={colors.success} />
          <Stat label="DECLINED" value={counts.declined} tint={colors.danger} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((entry) => {
            const count = counts[entry.id];
            return (
              <Chip
                key={entry.id}
                label={`${entry.label}${count ? ` · ${count}` : ""}`}
                active={filter === entry.id}
                onPress={() => setFilter(entry.id)}
              />
            );
          })}
        </ScrollView>

        <View style={styles.list}>
          {loading ? (
            [0, 1].map((key) => (
              <View key={key} style={styles.skeleton}>
                <View style={styles.skeletonImage} />
                <View style={styles.skeletonBody}>
                  <View style={[styles.skeletonLine, { width: "80%" }]} />
                  <View style={[styles.skeletonLine, { width: "55%", height: 10 }]} />
                  <View style={[styles.skeletonLine, { width: "42%" }]} />
                </View>
              </View>
            ))
          ) : visible.length ? (
            visible.map((property) => (
              <ListingRow
                key={property.id}
                property={property}
                width={width - spacing.lg * 2}
                deleting={deletingId === property.id}
                onOpen={() => navigation.navigate("PropertyDetail", { id: property.id })}
                onEdit={() =>
                  navigation.navigate("ListProperty", { editId: property.id })
                }
                onDelete={() => confirmDelete(property)}
                onPay={() => openPayment(property)}
              />
            ))
          ) : myProperties.length ? (
            <EmptyState
              compact
              icon={<LandPlot size={27} color={colors.primary} />}
              title={`No ${filter === "all" ? "" : filter} listings`}
              body="Switch to another status filter to see the rest of your portfolio."
            />
          ) : (
            <EmptyState
              icon={<LandPlot size={30} color={colors.primary} strokeWidth={1.8} />}
              title="Put your first property on the map"
              body="Add photos, pin the exact location and draw the plot boundary. Your first listing is completely free."
              actionLabel={canCreate ? "List your first property" : undefined}
              onAction={canCreate ? () => navigation.navigate("ListProperty") : undefined}
            />
          )}
        </View>

        {myProperties.length > 0 ? (
          <PrimaryButton
            label="List another property"
            variant="soft"
            onPress={() => navigation.navigate("ListProperty")}
            icon={<Plus size={17} color={colors.primary} strokeWidth={2.6} />}
            style={{ marginTop: spacing.xl }}
          />
        ) : null}

        <Text style={styles.fineprint}>
          Listings are usually reviewed within 24 hours. You’ll see the admin’s decision here
          and on the property detail page.
        </Text>
      </ScrollView>

      <PaymentModal
        visible={paymentVisible}
        property={payProperty}
        onClose={() => {
          setPaymentVisible(false);
          refresh(true);
        }}
        onSuccess={async () => {
          setPaymentVisible(false);
          setPayProperty(null);
          await refresh(true);
          await refreshProfile();
          showToast("Listing submitted for review.", "success");
        }}
      />
    </SafeAreaView>
  );
}

function Stat({ label, value, tint }: { label: string; value: number; tint: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: tint }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ListingRow({
  property,
  width,
  deleting,
  onOpen,
  onEdit,
  onDelete,
  onPay,
}: {
  property: Property;
  width: number;
  deleting: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPay: () => void;
}) {
  const canEdit = property.status !== "draft";
  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [styles.card, { width, opacity: pressed ? 0.95 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={`${property.title}, ${property.status}`}
    >
      <View style={styles.cardMain}>
        <Image source={{ uri: property.images[0] }} style={styles.thumb} />
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {property.title}
              </Text>
              <View style={styles.cardLocation}>
                <MapPin size={10.5} color={colors.muted} />
                <Text style={styles.cardLocationText} numberOfLines={1}>
                  {property.locality}, {property.city}
                </Text>
              </View>
            </View>
            <StatusPill status={property.status} size="sm" />
          </View>

          <View style={styles.cardMeta}>
            <Text style={styles.cardPrice}>
              {formatPrice(property.price, property.listing_type)}
            </Text>
            <Text style={styles.cardArea}>
              {formatArea(property.area_value, property.area_unit)} ·{" "}
              {timeAgo(property.created_at)}
            </Text>
          </View>

          {property.status === "declined" && property.admin_note ? (
            <View style={styles.note}>
              <Text style={styles.noteLabel}>ADMIN NOTE</Text>
              <Text style={styles.noteText} numberOfLines={3}>
                {property.admin_note}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          style={styles.action}
          accessibilityRole="button"
          accessibilityLabel="Open listing"
        >
          <Eye size={14} color={colors.body} />
          <Text style={styles.actionText}>View</Text>
        </Pressable>

        {property.status === "draft" ? (
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onPay();
            }}
            style={[styles.action, styles.actionPrimary]}
            accessibilityRole="button"
            accessibilityLabel="Complete listing payment"
          >
            <Sparkles size={14} color={colors.white} />
            <Text style={[styles.actionText, { color: colors.white }]}>Complete listing</Text>
          </Pressable>
        ) : null}

        {property.status === "declined" ? (
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            style={[styles.action, styles.actionPrimary]}
            accessibilityRole="button"
            accessibilityLabel="Edit and resubmit"
          >
            <Pencil size={14} color={colors.white} />
            <Text style={[styles.actionText, { color: colors.white }]}>Edit & resubmit</Text>
          </Pressable>
        ) : null}

        {canEdit && property.status !== "declined" ? (
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            style={styles.iconAction}
            accessibilityRole="button"
            accessibilityLabel="Edit listing"
          >
            <Pencil size={15} color={colors.body} />
          </Pressable>
        ) : null}

        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          style={styles.iconAction}
          disabled={deleting}
          accessibilityRole="button"
          accessibilityLabel="Delete listing"
        >
          <Trash2 size={15} color={deleting ? colors.disabled : colors.danger} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 8,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
    color: colors.faint,
  },
  title: {
    fontSize: 29,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -1.1,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 11.5,
    lineHeight: 17,
    color: colors.muted,
    marginTop: 4,
  },
  planCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#E4DEFF",
  },
  planCardGold: {
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#F0DDA8",
    backgroundColor: colors.goldSoft,
  },
  planTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  planIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  planTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.violetDark,
  },
  planTitleGold: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.goldDeep,
  },
  planBody: {
    fontSize: 10,
    lineHeight: 15,
    color: "#6F63A8",
    marginTop: 2,
  },
  planBodyGold: {
    fontSize: 10,
    lineHeight: 15,
    color: "#7A5A12",
    marginTop: 2,
  },
  freeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  freeBadge: {
    backgroundColor: colors.gold,
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  freeBadgeText: {
    fontSize: 8.5,
    fontWeight: "900",
    color: "#4A3403",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    paddingVertical: 13,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: colors.faint,
    letterSpacing: 0.5,
  },
  filterRow: {
    gap: 7,
    paddingVertical: 16,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    overflow: "hidden",
    ...shadow.soft,
  },
  cardMain: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  thumb: {
    width: 94,
    height: 116,
    borderRadius: radii.md,
    backgroundColor: colors.canvasDeep,
  },
  cardBody: {
    flex: 1,
    gap: 5,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  cardTitle: {
    fontSize: 13.5,
    lineHeight: 17.5,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.2,
  },
  cardLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 3,
  },
  cardLocationText: {
    fontSize: 10,
    color: colors.muted,
    flexShrink: 1,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 6,
    marginTop: "auto",
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  cardArea: {
    fontSize: 8.5,
    color: colors.faint,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },
  note: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.sm,
    padding: 7,
    gap: 2,
  },
  noteLabel: {
    fontSize: 7,
    fontWeight: "900",
    color: colors.danger,
    letterSpacing: 0.5,
  },
  noteText: {
    fontSize: 9,
    lineHeight: 13,
    color: "#8F3A44",
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.canvas,
  },
  actionPrimary: {
    backgroundColor: colors.primary,
  },
  actionText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.body,
  },
  iconAction: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  skeleton: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  skeletonImage: {
    width: 94,
    height: 116,
    borderRadius: radii.md,
    backgroundColor: colors.lineSoft,
  },
  skeletonBody: {
    flex: 1,
    gap: 9,
    paddingTop: 4,
  },
  skeletonLine: {
    height: 13,
    backgroundColor: colors.lineSoft,
    borderRadius: 4,
  },
  fineprint: {
    fontSize: 9.5,
    lineHeight: 14,
    color: colors.faint,
    textAlign: "center",
    marginTop: 20,
    paddingHorizontal: 16,
  },
});
