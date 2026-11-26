import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Info,
  LandPlot,
  Mail,
  MapPin,
  MapPinned,
  Phone,
  Ruler,
  ShieldCheck,
  Sparkles,
  SquarePlay,
  Star,
  Trash2,
  TriangleAlert,
  UserRound,
} from "lucide-react-native";

import { Avatar } from "../../components/Avatar";
import { PrimaryButton, ScreenTopBar } from "../../components/Buttons";
import { EmptyState } from "../../components/EmptyState";
import { ImageCarousel } from "../../components/ImageCarousel";
import { ImageViewer } from "../../components/ImageViewer";
import { PropertyMap } from "../../components/PropertyMap";
import { AdminPill, DeclineModal } from "../../components/admin/AdminUI";
import { propertyTypeLabel } from "../../constants/catalog";
import { colors, radii, shadow, spacing } from "../../constants/theme";
import { useAdmin } from "../../context/AdminContext";
import { useToast } from "../../context/ToastContext";
import type { AdminStackParamList } from "../../navigation/types";
import type { Property } from "../../types";
import {
  formatArea,
  formatDate,
  formatPhone,
  formatPrice,
  formatPriceFull,
} from "../../utils/format";

type Props = NativeStackScreenProps<AdminStackParamList, "AdminPropertyDetail">;

export function AdminPropertyDetailScreen({ navigation, route }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const {
    data,
    loading,
    profileById,
    setStatus,
    toggleFeatured,
    removeProperty,
  } = useAdmin();
  const { showToast } = useToast();
  const [viewerVisible, setViewerVisible] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [busy, setBusy] = useState(false);
  const [featureBusy, setFeatureBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const property = useMemo(
    () => data.properties.find((entry) => entry.id === route.params.id),
    [data.properties, route.params.id]
  );
  const owner = property ? profileById(property.owner_id) : undefined;
  const payment = property
    ? data.payments.find((entry) => entry.property_id === property.id)
    : undefined;

  if (!property) {
    return (
      <SafeAreaView style={styles.unavailableRoot}>
        <StatusBar style="dark" />
        <ScreenTopBar
          title="Listing review"
          onBack={() => navigation.goBack()}
          border
        />
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading listing…</Text>
          </View>
        ) : (
          <EmptyState
            icon={<LandPlot size={30} color={colors.primary} />}
            title="Listing not found"
            body="This property may have been deleted or is no longer available in the admin workspace."
            actionLabel="Back to listings"
            onAction={() => navigation.goBack()}
          />
        )}
      </SafeAreaView>
    );
  }

  const approve = () => {
    Alert.alert(
      "Approve this listing?",
      `“${property.title}” will go live in the public marketplace immediately.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            setBusy(true);
            try {
              await setStatus(property.id, "approved");
              showToast("Listing approved and published.", "success");
            } catch (error) {
              showToast(
                error instanceof Error ? error.message : "Could not approve the listing.",
                "error"
              );
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  const decline = async (note: string) => {
    setBusy(true);
    try {
      await setStatus(property.id, "declined", note);
      showToast("Listing declined. The seller can edit and resubmit.", "info");
      setDeclining(false);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not decline the listing.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  };

  const feature = async () => {
    setFeatureBusy(true);
    try {
      await toggleFeatured(property.id, !property.is_featured);
      showToast(
        property.is_featured ? "Removed from featured listings." : "Listing featured.",
        "success"
      );
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not update the featured state.",
        "error"
      );
    } finally {
      setFeatureBusy(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete this listing permanently?",
      "The property and its photos will be removed. Payment records are kept for accounting.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await removeProperty(property.id);
              showToast("Listing deleted.", "info");
              navigation.goBack();
            } catch (error) {
              showToast(
                error instanceof Error ? error.message : "Could not delete the listing.",
                "error"
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const callOwner = () => {
    const digits = property.owner_phone.replace(/\D/g, "");
    if (digits.length < 10) {
      showToast("This seller hasn’t added a phone number.", "error");
      return;
    }
    Linking.openURL(`tel:${digits}`).catch(() =>
      showToast("Could not open the phone app.", "error")
    );
  };

  const emailOwner = () => {
    if (!owner?.email) {
      showToast("This seller hasn’t added an email address.", "error");
      return;
    }
    Linking.openURL(
      `mailto:${owner.email}?subject=${encodeURIComponent(
        `About your SystIO Land listing: ${property.title}`
      )}`
    ).catch(() => showToast("Could not open the email app.", "error"));
  };

  const openVideo = () => {
    if (!property.youtube_url) return;
    Linking.openURL(property.youtube_url).catch(() =>
      showToast("Could not open the video link.", "error")
    );
  };

  const checks = [
    {
      label: `${property.images.length} photos uploaded`,
      detail: property.images.length >= 4 ? "Minimum met" : "At least 4 required",
      pass: property.images.length >= 4,
      optional: false,
    },
    {
      label: "Exact map pin",
      detail:
        property.latitude && property.longitude
          ? `${property.latitude.toFixed(5)}, ${property.longitude.toFixed(5)}`
          : "Coordinates missing",
      pass: Boolean(property.latitude && property.longitude),
      optional: false,
    },
    {
      label: "Address is complete",
      detail: [property.address, property.locality, property.pincode].filter(Boolean).join(", "),
      pass: Boolean(property.address && property.locality && property.pincode),
      optional: false,
    },
    {
      label: "Price and area provided",
      detail: `${formatPrice(property.price, property.listing_type)} · ${formatArea(
        property.area_value,
        property.area_unit
      )}`,
      pass: property.price > 0 && property.area_value > 0,
      optional: false,
    },
    {
      label: "Plot boundary",
      detail:
        property.boundary.length >= 3
          ? `${property.boundary.length}-point polygon`
          : "Pin only, no polygon",
      pass: property.boundary.length >= 3,
      optional: true,
    },
    {
      label: "Nearby landmarks",
      detail: property.nearby_landmarks.length
        ? `${property.nearby_landmarks.length} added`
        : "None added",
      pass: property.nearby_landmarks.length > 0,
      optional: true,
    },
    {
      label: "YouTube walkthrough",
      detail: property.youtube_url ? "Video link attached" : "Not added",
      pass: Boolean(property.youtube_url),
      optional: true,
    },
    {
      label: "Listing fee record",
      detail: payment
        ? payment.kind === "free_listing"
          ? "Free listing benefit"
          : `${formatPriceFull(payment.amount / 100)} · ${payment.status}`
        : "No payment record found",
      pass: Boolean(payment),
      optional: false,
    },
  ];
  const requiredChecks = checks.filter((check) => !check.optional);
  const passedRequired = requiredChecks.filter((check) => check.pass).length;

  const canApprove = property.status === "pending" || property.status === "declined";
  const statusLabel =
    property.status === "approved"
      ? "APPROVED"
      : property.status === "pending"
        ? "PENDING REVIEW"
        : property.status === "declined"
          ? "DECLINED"
          : "DRAFT";
  const statusTone =
    property.status === "approved"
      ? "success"
      : property.status === "pending"
        ? "gold"
        : property.status === "declined"
          ? "danger"
          : "neutral";
  const isDraft = property.status === "draft";

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar style="light" />
      <View style={styles.topBarWrap}>
        <ScreenTopBar
          dark
          title="Listing review"
          subtitle={`Ref ${property.id.slice(-8).toUpperCase()}`}
          onBack={() => navigation.goBack()}
          right={<AdminPill label={statusLabel} tone={statusTone} />}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gallery}>
          <ImageCarousel
            images={property.images}
            width={width}
            height={236}
            onPress={() => setViewerVisible(true)}
          />
          <View style={styles.galleryTags} pointerEvents="none">
            <View style={styles.galleryTag}>
              <Text style={styles.galleryTagText}>
                {property.listing_type === "sale" ? "FOR SALE" : "FOR RENT"}
              </Text>
            </View>
            <View style={styles.galleryTagDark}>
              <Text style={styles.galleryTagText}>{property.images.length} PHOTOS</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <AdminPill label={statusLabel} tone={statusTone} />
              <View style={styles.summaryTime}>
                <Clock size={11} color={colors.faint} />
                <Text style={styles.summaryTimeText}>
                  Submitted {formatDate(property.created_at)}
                </Text>
              </View>
            </View>
            <Text style={styles.title}>{property.title}</Text>
            <View style={styles.locationRow}>
              <MapPin size={13} color={colors.primary} />
              <Text style={styles.locationText}>
                {property.locality}, {property.city}, {property.state} · {property.pincode}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.price}>
                {formatPrice(property.price, property.listing_type)}
              </Text>
              <View style={styles.areaPill}>
                <Ruler size={11} color={colors.muted} />
                <Text style={styles.areaPillText}>
                  {formatArea(property.area_value, property.area_unit)}
                </Text>
              </View>
            </View>
            {property.admin_note ? (
              <View style={styles.adminNote}>
                <TriangleAlert size={13} color={colors.danger} />
                <Text style={styles.adminNoteText}>{property.admin_note}</Text>
              </View>
            ) : null}
          </View>

          <SectionHeader
            title="Verification checklist"
            sub={`${passedRequired}/${requiredChecks.length} required checks passed`}
          />
          <View style={styles.checkCard}>
            {checks.map((check) => (
              <View key={check.label} style={styles.checkRow}>
                {check.pass ? (
                  <CheckCircle2 size={15} color={colors.success} />
                ) : check.optional ? (
                  <Info size={15} color={colors.faint} />
                ) : (
                  <Circle size={15} color={colors.danger} />
                )}
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.checkLabel,
                      !check.pass && !check.optional && { color: colors.danger },
                    ]}
                  >
                    {check.label}
                    {check.optional ? <Text style={styles.optionalTag}>  OPTIONAL</Text> : null}
                  </Text>
                  <Text style={styles.checkDetail} numberOfLines={2}>
                    {check.detail}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <SectionHeader title="Property details" />
          <View style={styles.detailsGrid}>
            <DetailTile label="Property type" value={propertyTypeLabel(property.property_type)} />
            <DetailTile
              label="Listing type"
              value={property.listing_type === "sale" ? "For sale" : "For rent"}
            />
            <DetailTile
              label="Area"
              value={formatArea(property.area_value, property.area_unit)}
            />
            <DetailTile label="Price" value={formatPrice(property.price, property.listing_type)} />
            <DetailTile label="Views" value={String(property.views_count)} />
            <DetailTile
              label="Last updated"
              value={property.updated_at ? formatDate(property.updated_at) : formatDate(property.created_at)}
            />
          </View>

          <SectionHeader title="Seller’s description" />
          <View style={styles.descriptionCard}>
            <Text style={styles.description}>{property.description}</Text>
          </View>

          <SectionHeader title="Map pin & boundary" />
          <View style={styles.mapCard}>
            <PropertyMap property={property} height={220} interactive showOpenMaps />
            <View style={styles.addressRow}>
              <MapPinned size={14} color={colors.primary} />
              <Text style={styles.addressText}>
                {[property.address, property.locality, property.city, property.state, property.pincode]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
            </View>
          </View>

          {property.nearby_landmarks.length ? (
            <>
              <SectionHeader title="Nearby landmarks" />
              <View style={styles.landmarkCard}>
                {property.nearby_landmarks.map((landmark, index) => (
                  <View
                    key={`${landmark.name}-${index}`}
                    style={[
                      styles.landmarkRow,
                      index === property.nearby_landmarks.length - 1 && {
                        borderBottomWidth: 0,
                      },
                    ]}
                  >
                    <View style={styles.landmarkIcon}>
                      <MapPin size={12} color={colors.primary} />
                    </View>
                    <Text style={styles.landmarkName}>{landmark.name}</Text>
                    <Text style={styles.landmarkDistance}>{landmark.distance}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {property.youtube_url ? (
            <>
              <SectionHeader title="Video walkthrough" />
              <Pressable
                onPress={openVideo}
                style={styles.videoCard}
                accessibilityRole="button"
                accessibilityLabel="Open YouTube walkthrough"
              >
                <View style={styles.videoIcon}>
                  <SquarePlay size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.videoTitle}>YouTube walkthrough attached</Text>
                  <Text style={styles.videoUrl} numberOfLines={1}>
                    {property.youtube_url}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.faint} />
              </Pressable>
            </>
          ) : null}

          <SectionHeader title="Seller" />
          <View style={styles.ownerCard}>
            <View style={styles.ownerTop}>
              <Avatar
                name={property.owner_name}
                role={property.owner_role}
                size={46}
              />
              <View style={{ flex: 1 }}>
                <View style={styles.ownerNameRow}>
                  <Text style={styles.ownerName}>{property.owner_name}</Text>
                  <AdminPill
                    label={property.owner_role === "broker" ? "BROKER" : "OWNER"}
                    tone={property.owner_role === "broker" ? "danger" : "success"}
                  />
                </View>
                <Text style={styles.ownerPhone}>
                  +91 {formatPhone(property.owner_phone)}
                </Text>
                {owner?.email ? (
                  <Text style={styles.ownerEmail}>{owner.email}</Text>
                ) : null}
              </View>
            </View>
            <View style={styles.ownerActions}>
              <Pressable
                onPress={callOwner}
                style={styles.ownerAction}
                accessibilityRole="button"
                accessibilityLabel="Call seller"
              >
                <Phone size={13} color={colors.success} />
                <Text style={styles.ownerActionText}>Call seller</Text>
              </Pressable>
              <Pressable
                onPress={emailOwner}
                style={styles.ownerAction}
                accessibilityRole="button"
                accessibilityLabel="Email seller"
              >
                <Mail size={13} color={colors.info} />
                <Text style={styles.ownerActionText}>Email</Text>
              </Pressable>
              <View style={styles.ownerSpacer} />
              <View
                style={[
                  styles.freePill,
                  {
                    backgroundColor: owner?.free_listing_used
                      ? colors.lineSoft
                      : colors.goldSoft,
                  },
                ]}
              >
                <Sparkles
                  size={9}
                  color={owner?.free_listing_used ? colors.faint : colors.goldDeep}
                />
                <Text
                  style={[
                    styles.freePillText,
                    {
                      color: owner?.free_listing_used ? colors.faint : colors.goldDeep,
                    },
                  ]}
                >
                  {owner?.free_listing_used ? "FREE USED" : "FREE AVAILABLE"}
                </Text>
              </View>
            </View>
            {owner ? (
              <Text style={styles.ownerJoined}>
                Joined {formatDate(owner.created_at)} ·{" "}
                {data.properties.filter((entry) => entry.owner_id === owner.id).length} total
                properties
              </Text>
            ) : null}
          </View>

          <SectionHeader title="Listing fee" />
          {payment ? (
            <View style={styles.paymentCard}>
              <View
                style={[
                  styles.paymentIcon,
                  {
                    backgroundColor:
                      payment.kind === "free_listing" ? colors.goldSoft : colors.successSoft,
                  },
                ]}
              >
                {payment.kind === "free_listing" ? (
                  <Sparkles size={16} color={colors.goldDeep} />
                ) : (
                  <BadgeCheck size={16} color={colors.success} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentTitle}>
                  {payment.kind === "free_listing"
                    ? "Free listing benefit"
                    : `${formatPriceFull(payment.amount / 100)} listing fee`}
                </Text>
                <Text style={styles.paymentMeta}>
                  {payment.status.toUpperCase()} · {formatDate(payment.paid_at ?? payment.created_at)}
                </Text>
                {payment.razorpay_payment_id ? (
                  <Text style={styles.paymentId} numberOfLines={1}>
                    {payment.razorpay_payment_id}
                  </Text>
                ) : null}
              </View>
              <AdminPill
                label={payment.status.toUpperCase()}
                tone={payment.status === "paid" ? "success" : payment.status === "failed" ? "danger" : "gold"}
              />
            </View>
          ) : (
            <View style={styles.noPaymentCard}>
              <TriangleAlert size={15} color={colors.goldDeep} />
              <Text style={styles.noPaymentText}>
                No payment record is linked to this property. Confirm the fee before approving a
                paid listing.
              </Text>
            </View>
          )}

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Ref {property.id}</Text>
            <Text style={styles.metaText}>
              Seller ID {property.owner_id}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {isDraft ? (
          <>
            <View style={styles.draftNote}>
              <Info size={14} color={colors.muted} />
              <Text style={styles.draftNoteText}>
                This is an unfinished draft. The seller has not submitted or paid for it yet.
              </Text>
            </View>
            <Pressable
              onPress={confirmDelete}
              style={styles.deleteFull}
              accessibilityRole="button"
              accessibilityLabel="Delete draft"
            >
              <Trash2 size={14} color={colors.danger} />
              <Text style={styles.deleteFullText}>Delete draft</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.footerTools}>
              {property.status === "approved" ? (
                <Pressable
                  onPress={feature}
                  disabled={featureBusy}
                  style={[
                    styles.featureButton,
                    property.is_featured && styles.featureButtonActive,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={
                    property.is_featured ? "Remove from featured" : "Feature listing"
                  }
                >
                  <Star
                    size={14}
                    color={property.is_featured ? colors.goldDeep : colors.muted}
                    fill={property.is_featured ? colors.gold : "transparent"}
                  />
                  <Text
                    style={[
                      styles.featureText,
                      property.is_featured && { color: colors.goldDeep },
                    ]}
                  >
                    {featureBusy
                      ? "Updating…"
                      : property.is_featured
                        ? "Featured"
                        : "Feature"}
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.checksCompact}>
                  <ShieldCheck size={14} color={colors.success} />
                  <Text style={styles.checksCompactText}>
                    {passedRequired}/{requiredChecks.length} required checks
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }} />
              <Pressable
                onPress={confirmDelete}
                disabled={deleting}
                style={styles.deleteButton}
                accessibilityRole="button"
                accessibilityLabel="Delete listing"
              >
                <Trash2 size={15} color={colors.danger} />
              </Pressable>
            </View>

            <View style={styles.footerActions}>
              {canApprove ? (
                <PrimaryButton
                  label="Approve listing"
                  variant="success"
                  loading={busy && !declining}
                  disabled={declining || deleting}
                  onPress={approve}
                  style={{ flex: 1 }}
                />
              ) : null}
              <PrimaryButton
                label={property.status === "approved" ? "Unpublish" : "Decline"}
                variant="danger"
                loading={busy && declining}
                disabled={deleting}
                onPress={() => setDeclining(true)}
                style={{ flex: canApprove ? 0.8 : 1 }}
              />
            </View>
          </>
        )}
      </View>

      <ImageViewer
        visible={viewerVisible}
        images={property.images}
        title={property.title}
        onClose={() => setViewerVisible(false)}
      />
      <DeclineModal
        visible={declining}
        property={property}
        submitting={busy}
        onClose={() => setDeclining(false)}
        onConfirm={decline}
      />
    </SafeAreaView>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {sub ? <Text style={styles.sectionSub}>{sub}</Text> : null}
    </View>
  );
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailTile}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  topBarWrap: {
    backgroundColor: colors.dark,
  },
  content: {
    paddingBottom: 24,
  },
  unavailableRoot: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 10.5,
    color: colors.muted,
  },
  gallery: {
    backgroundColor: colors.canvasDeep,
  },
  galleryTags: {
    position: "absolute",
    left: 12,
    bottom: 12,
    flexDirection: "row",
    gap: 5,
  },
  galleryTag: {
    backgroundColor: colors.primary,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2.5,
  },
  galleryTagDark: {
    backgroundColor: "rgba(24,25,28,0.76)",
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2.5,
  },
  galleryTagText: {
    fontSize: 6.5,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: 0.4,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 13,
    ...shadow.card,
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  summaryTimeText: {
    fontSize: 7.5,
    color: colors.faint,
    fontWeight: "500",
  },
  title: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
    color: colors.ink,
    marginTop: 7,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  locationText: {
    flex: 1,
    fontSize: 9,
    color: colors.muted,
    fontWeight: "500",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 7,
  },
  price: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.7,
  },
  areaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.canvas,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  areaPillText: {
    fontSize: 8.5,
    color: colors.muted,
    fontWeight: "700",
  },
  adminNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.sm,
    padding: 9,
    marginTop: 9,
  },
  adminNoteText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 13,
    color: colors.danger,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: spacing.xxl,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.4,
  },
  sectionSub: {
    flex: 1,
    fontSize: 8.5,
    color: colors.muted,
    textAlign: "right",
  },
  checkCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 6,
  },
  checkLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.ink,
  },
  checkDetail: {
    fontSize: 8,
    color: colors.muted,
    marginTop: 1,
  },
  optionalTag: {
    fontSize: 6,
    fontWeight: "900",
    letterSpacing: 0.3,
    color: colors.faint,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  detailTile: {
    width: "48.5%",
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 10,
  },
  detailLabel: {
    fontSize: 7.5,
    color: colors.faint,
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 11,
    color: colors.ink,
    fontWeight: "800",
    marginTop: 3,
  },
  descriptionCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 12,
  },
  description: {
    fontSize: 10.5,
    lineHeight: 16,
    color: colors.body,
  },
  mapCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    overflow: "hidden",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    padding: 11,
  },
  addressText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 14,
    color: colors.body,
  },
  landmarkCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    paddingHorizontal: 11,
  },
  landmarkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  landmarkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  landmarkName: {
    flex: 1,
    fontSize: 10,
    fontWeight: "600",
    color: colors.ink,
  },
  landmarkDistance: {
    fontSize: 8.5,
    color: colors.muted,
    fontWeight: "700",
  },
  videoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 10,
  },
  videoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  videoTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.ink,
  },
  videoUrl: {
    fontSize: 8,
    color: colors.muted,
    marginTop: 2,
  },
  ownerCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 11,
  },
  ownerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  ownerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ownerName: {
    fontSize: 11.5,
    fontWeight: "900",
    color: colors.ink,
  },
  ownerPhone: {
    fontSize: 8.5,
    color: colors.muted,
    marginTop: 2,
  },
  ownerEmail: {
    fontSize: 8,
    color: colors.faint,
    marginTop: 1,
  },
  ownerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 9,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    paddingTop: 9,
  },
  ownerAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.canvas,
    borderRadius: radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  ownerActionText: {
    fontSize: 8.5,
    fontWeight: "800",
    color: colors.body,
  },
  ownerSpacer: {
    flex: 1,
  },
  freePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  freePillText: {
    fontSize: 6.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  ownerJoined: {
    fontSize: 7.5,
    color: colors.faint,
    marginTop: 7,
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 10,
  },
  paymentIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentTitle: {
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.ink,
  },
  paymentMeta: {
    fontSize: 8,
    color: colors.muted,
    marginTop: 1,
  },
  paymentId: {
    fontSize: 7,
    color: colors.faint,
    marginTop: 2,
  },
  noPaymentCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    backgroundColor: colors.goldSoft,
    borderRadius: radii.md,
    padding: 11,
  },
  noPaymentText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 13,
    color: "#7A5A12",
  },
  metaRow: {
    marginTop: 18,
    gap: 2,
  },
  metaText: {
    fontSize: 6.5,
    color: colors.faint,
  },
  footer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    ...shadow.raised,
  },
  footerTools: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  featureButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  featureButtonActive: {
    borderColor: "#EBD28C",
    backgroundColor: colors.goldSoft,
  },
  featureText: {
    fontSize: 8.5,
    fontWeight: "800",
    color: colors.muted,
  },
  checksCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  checksCompactText: {
    fontSize: 8.5,
    fontWeight: "700",
    color: colors.success,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  footerActions: {
    flexDirection: "row",
    gap: 8,
  },
  draftNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: colors.canvas,
    borderRadius: radii.sm,
    padding: 9,
    marginBottom: 8,
  },
  draftNoteText: {
    flex: 1,
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.muted,
  },
  deleteFull: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.md,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.dangerSoft,
  },
  deleteFullText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.danger,
  },
});
