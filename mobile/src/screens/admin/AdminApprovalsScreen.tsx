import React, { useState } from "react";
import {
  Alert,
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
  Check,
  ChevronRight,
  Clock,
  Eye,
  Images,
  MapPin,
  MapPinned,
  ShieldCheck,
  SquarePlay,
  X,
} from "lucide-react-native";

import { PrimaryButton } from "../../components/Buttons";
import { AdminPill, AdminShell, DeclineModal } from "../../components/admin/AdminUI";
import { colors, radii, shadow, spacing } from "../../constants/theme";
import { useAdmin } from "../../context/AdminContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import type { AdminStackParamList, AdminTabParamList } from "../../navigation/types";
import type { Property } from "../../types";
import { formatArea, formatPrice, timeAgo } from "../../utils/format";

type Props = CompositeScreenProps<
  BottomTabScreenProps<AdminTabParamList, "Approvals">,
  NativeStackScreenProps<AdminStackParamList>
>;

export function AdminApprovalsScreen({ navigation }: Props) {
  const { pending, refreshing, refresh, error, setStatus } = useAdmin();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [declining, setDeclining] = useState<Property | null>(null);
  const [declineBusy, setDeclineBusy] = useState(false);

  const approve = (property: Property) => {
    Alert.alert(
      "Approve this listing?",
      `“${property.title}” will go live in the public feed immediately.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            setApprovingId(property.id);
            try {
              await setStatus(property.id, "approved");
              showToast("Listing approved and published.", "success");
            } catch (approveError) {
              showToast(
                approveError instanceof Error
                  ? approveError.message
                  : "Could not approve this listing.",
                "error"
              );
            } finally {
              setApprovingId(null);
            }
          },
        },
      ]
    );
  };

  const decline = async (note: string) => {
    if (!declining) return;
    setDeclineBusy(true);
    try {
      await setStatus(declining.id, "declined", note);
      showToast("Listing declined. The seller can edit and resubmit.", "info");
      setDeclining(null);
    } catch (declineError) {
      showToast(
        declineError instanceof Error ? declineError.message : "Could not decline this listing.",
        "error"
      );
    } finally {
      setDeclineBusy(false);
    }
  };

  return (
    <AdminShell
      title="Approval queue"
      subtitle="Oldest submissions first. Approve carefully — the feed is public."
      right={
        <View style={styles.queuePill}>
          <Clock size={11} color={colors.gold} />
          <Text style={styles.queuePillText}>
            {pending.length} {pending.length === 1 ? "WAITING" : "WAITING"}
          </Text>
        </View>
      }
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.reviewerRow}>
          <View style={styles.reviewerAvatar}>
            <Text style={styles.reviewerInitial}>
              {(profile?.name ?? "A").slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.reviewerTitle}>Reviewing as {profile?.name ?? "Admin"}</Text>
            <Text style={styles.reviewerSub}>
              Listings are checked for photos, price, map accuracy and duplication.
            </Text>
          </View>
          <AdminPill label="ADMIN" tone="gold" />
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={refresh} accessibilityRole="button">
              <Text style={styles.errorRetry}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {pending.length ? (
          <View style={styles.list}>
            {pending.map((property) => {
              const waitingHours =
                (Date.now() - new Date(property.created_at).getTime()) / (1000 * 60 * 60);
              const urgent = waitingHours >= 24;
              return (
                <View key={property.id} style={styles.card}>
                  <Pressable
                    onPress={() =>
                      navigation.navigate("AdminPropertyDetail", { id: property.id })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${property.title}`}
                  >
                    <View style={styles.imageWrap}>
                      <Image source={{ uri: property.images[0] }} style={styles.image} />
                      <View style={styles.imageOverlay} />
                      <View style={styles.imageTop}>
                        <AdminPill label="PENDING REVIEW" tone="gold" />
                        <View
                          style={[
                            styles.waitPill,
                            urgent && { backgroundColor: colors.danger },
                          ]}
                        >
                          <Clock size={9} color={colors.white} />
                          <Text style={styles.waitText}>{timeAgo(property.created_at)}</Text>
                        </View>
                      </View>
                      <View style={styles.imageBottom}>
                        <Text style={styles.typePill}>
                          {property.listing_type === "sale" ? "FOR SALE" : "FOR RENT"}
                        </Text>
                        <Text style={styles.photoPill}>{property.images.length} PHOTOS</Text>
                      </View>
                    </View>

                    <View style={styles.cardBody}>
                      <Text style={styles.title} numberOfLines={2}>
                        {property.title}
                      </Text>
                      <View style={styles.locationRow}>
                        <MapPin size={12} color={colors.primary} />
                        <Text style={styles.location} numberOfLines={1}>
                          {property.locality}, {property.city} · {property.pincode}
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

                      <View style={styles.ownerRow}>
                        <View style={styles.ownerAvatar}>
                          <Text style={styles.ownerInitial}>
                            {property.owner_name.slice(0, 1).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.ownerName}>
                            {property.owner_name}
                            <Text style={styles.ownerRole}>
                              {"  "}
                              {property.owner_role === "broker" ? "Broker" : "Owner"}
                            </Text>
                          </Text>
                          <Text style={styles.ownerPhone}>{property.owner_phone}</Text>
                        </View>
                        <View style={styles.detailLink}>
                          <Eye size={13} color={colors.primary} />
                          <Text style={styles.detailText}>Details</Text>
                          <ChevronRight size={12} color={colors.primary} />
                        </View>
                      </View>

                      <View style={styles.facts}>
                        <Fact
                          icon={<Images size={12} color={colors.muted} />}
                          label={`${property.images.length} photos`}
                          ok={property.images.length >= 4}
                        />
                        <Fact
                          icon={<MapPinned size={12} color={colors.muted} />}
                          label={
                            property.boundary.length >= 3
                              ? `Boundary · ${property.boundary.length} pts`
                              : "Pin only"
                          }
                          ok={property.boundary.length >= 3}
                        />
                        {property.youtube_url ? (
                          <Fact
                            icon={<SquarePlay size={12} color={colors.muted} />}
                            label="Video"
                            ok
                          />
                        ) : null}
                        <Fact
                          icon={<MapPin size={12} color={colors.muted} />}
                          label={`${property.nearby_landmarks.length} landmarks`}
                          ok={property.nearby_landmarks.length > 0}
                        />
                      </View>
                    </View>
                  </Pressable>

                  <View style={styles.actions}>
                    <PrimaryButton
                      label="Decline"
                      variant="danger"
                      compact
                      onPress={() => setDeclining(property)}
                      disabled={approvingId === property.id}
                      icon={<X size={14} color={colors.danger} strokeWidth={2.5} />}
                      style={{ flex: 0.72 }}
                    />
                    <PrimaryButton
                      label="View full listing"
                      variant="outline"
                      compact
                      onPress={() =>
                        navigation.navigate("AdminPropertyDetail", { id: property.id })
                      }
                      disabled={approvingId === property.id}
                      style={{ flex: 1 }}
                    />
                    <PrimaryButton
                      label="Approve"
                      variant="success"
                      compact
                      loading={approvingId === property.id}
                      onPress={() => approve(property)}
                      icon={<Check size={14} color={colors.white} strokeWidth={2.8} />}
                      style={{ flex: 0.95 }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <ShieldCheck size={30} color={colors.success} strokeWidth={1.9} />
            </View>
            <Text style={styles.emptyTitle}>Everything is reviewed</Text>
            <Text style={styles.emptyBody}>
              There are no listings waiting for approval. New submissions appear here as soon as
              the seller completes the listing fee.
            </Text>
            <View style={styles.emptyTip}>
              <Clock size={14} color={colors.goldDeep} />
              <Text style={styles.emptyTipText}>
                Aim to review new listings within 24 hours so buyers always see a fresh feed.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.guidelineCard}>
          <Text style={styles.guidelineTitle}>Before you approve</Text>
          {[
            "At least 4 real photos, with a clear cover photo.",
            "Map pin and address match the property locality.",
            "Price, area unit and property type look reasonable.",
            "Listing is not a duplicate of an existing property.",
          ].map((line) => (
            <View key={line} style={styles.guidelineRow}>
              <View style={styles.guidelineDot} />
              <Text style={styles.guidelineText}>{line}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <DeclineModal
        visible={Boolean(declining)}
        property={declining}
        submitting={declineBusy}
        onClose={() => setDeclining(null)}
        onConfirm={decline}
      />
    </AdminShell>
  );
}

function Fact({
  icon,
  label,
  ok = false,
}: {
  icon: React.ReactNode;
  label: string;
  ok?: boolean;
}) {
  return (
    <View style={[styles.fact, ok ? styles.factOk : null]}>
      {icon}
      <Text style={[styles.factText, ok && { color: colors.success }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 14,
    paddingBottom: 36,
  },
  queuePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(246,196,106,0.13)",
    borderRadius: radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  queuePillText: {
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: colors.gold,
  },
  reviewerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 11,
    marginBottom: 12,
  },
  reviewerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewerInitial: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.gold,
  },
  reviewerTitle: {
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.ink,
  },
  reviewerSub: {
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.muted,
    marginTop: 1,
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.md,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
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
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.lineSoft,
    ...shadow.card,
  },
  imageWrap: {
    height: 168,
    backgroundColor: colors.canvasDeep,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(18,18,20,0.12)",
  },
  imageTop: {
    position: "absolute",
    top: 9,
    left: 9,
    right: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  waitPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(24,25,28,0.72)",
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  waitText: {
    fontSize: 7.5,
    fontWeight: "800",
    color: colors.white,
  },
  imageBottom: {
    position: "absolute",
    left: 9,
    bottom: 9,
    flexDirection: "row",
    gap: 5,
  },
  typePill: {
    fontSize: 6.5,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: 0.4,
    backgroundColor: colors.primary,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2.5,
  },
  photoPill: {
    fontSize: 6.5,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: 0.4,
    backgroundColor: "rgba(24,25,28,0.72)",
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2.5,
  },
  cardBody: {
    padding: 12,
    gap: 3,
  },
  title: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  location: {
    flex: 1,
    fontSize: 9,
    color: colors.muted,
    fontWeight: "500",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 2,
  },
  price: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.4,
  },
  area: {
    fontSize: 9,
    color: colors.muted,
    fontWeight: "600",
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    marginTop: 7,
    paddingTop: 8,
  },
  ownerAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  ownerInitial: {
    fontSize: 10,
    fontWeight: "900",
    color: colors.primary,
  },
  ownerName: {
    fontSize: 9.5,
    fontWeight: "800",
    color: colors.ink,
  },
  ownerRole: {
    fontSize: 8,
    fontWeight: "600",
    color: colors.faint,
  },
  ownerPhone: {
    fontSize: 8,
    color: colors.muted,
    marginTop: 1,
  },
  detailLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  detailText: {
    fontSize: 8.5,
    fontWeight: "800",
    color: colors.primary,
  },
  facts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 6,
  },
  fact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.canvas,
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  factOk: {
    backgroundColor: colors.successSoft,
  },
  factText: {
    fontSize: 7.5,
    fontWeight: "700",
    color: colors.muted,
  },
  actions: {
    flexDirection: "row",
    gap: 6,
    padding: 10,
    paddingTop: 0,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 34,
    paddingHorizontal: 18,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.successSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.4,
    marginTop: 12,
  },
  emptyBody: {
    fontSize: 10.5,
    lineHeight: 16,
    color: colors.muted,
    textAlign: "center",
    marginTop: 5,
    maxWidth: 300,
  },
  emptyTip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    backgroundColor: colors.goldSoft,
    borderRadius: radii.md,
    padding: 11,
    marginTop: 16,
  },
  emptyTipText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 13,
    color: "#7A5A12",
  },
  guidelineCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 13,
    marginTop: spacing.xxl,
    gap: 6,
  },
  guidelineTitle: {
    fontSize: 11.5,
    fontWeight: "900",
    color: colors.ink,
    marginBottom: 1,
  },
  guidelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },
  guidelineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  guidelineText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 13,
    color: colors.muted,
  },
});
