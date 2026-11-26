import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { WebView } from "react-native-webview";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Heart,
  ImageIcon,
  LandPlot,
  MapPin,
  MessageCircle,
  Phone,
  Play,
  Ruler,
  Share2,
  ShieldCheck,
  SquarePlay,
  UserRound,
} from "lucide-react-native";

import { Avatar } from "../components/Avatar";
import { PrimaryButton, RoundIconButton } from "../components/Buttons";
import { EmptyState } from "../components/EmptyState";
import { ImageCarousel } from "../components/ImageCarousel";
import { ImageViewer } from "../components/ImageViewer";
import { PaymentModal } from "../components/PaymentModal";
import { StatusPill, VerifiedPill } from "../components/Pills";
import { PropertyMap } from "../components/PropertyMap";
import { propertyTypeLabel } from "../constants/catalog";
import { colors, radii, shadow, spacing } from "../constants/theme";
import { youtubeEmbedUrl } from "../utils/youtube";
import { useAuth } from "../context/AuthContext";
import { useListings } from "../context/ListingsContext";
import { useToast } from "../context/ToastContext";
import type { RootStackParamList } from "../navigation/types";
import type { Property } from "../types";
import {
  formatArea,
  formatDate,
  formatPhone,
  formatPrice,
  formatPriceFull,
  timeAgo,
} from "../utils/format";

type Props = NativeStackScreenProps<RootStackParamList, "PropertyDetail">;

export function PropertyDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { profile, refreshProfile } = useAuth();
  const {
    properties,
    myProperties,
    favoriteIds,
    toggleFavorite,
    loading,
    refresh,
  } = useListings();
  const { showToast } = useToast();
  const [viewerVisible, setViewerVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [paymentVisible, setPaymentVisible] = useState(false);

  const property: Property | undefined = useMemo(() => {
    const own = myProperties.find((entry) => entry.id === route.params.id);
    return own ?? properties.find((entry) => entry.id === route.params.id);
  }, [myProperties, properties, route.params.id]);

  const isOwner = Boolean(property && profile?.id === property.owner_id);
  const isFavorite = property ? favoriteIds.includes(property.id) : false;

  if (loading && !property) {
    return (
      <SafeAreaView style={styles.loadingRoot}>
        <StatusBar style="dark" />
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Loading property…</Text>
      </SafeAreaView>
    );
  }

  if (!property) {
    return (
      <SafeAreaView style={styles.loadingRoot}>
        <StatusBar style="dark" />
        <EmptyState
          icon={<LandPlot size={30} color={colors.primary} />}
          title="This listing is unavailable"
          body="It may have been removed or is still awaiting approval. Browse other verified properties instead."
          actionLabel="Go back"
          onAction={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  const fullAddress = [property.address, property.locality, property.city, property.state, property.pincode]
    .filter(Boolean)
    .join(", ");

  const callOwner = () => {
    if (!property.owner_phone) {
      showToast("The seller hasn’t shared a phone number yet.", "error");
      return;
    }
    Linking.openURL(`tel:${property.owner_phone.replace(/\s/g, "")}`).catch(() =>
      showToast("Could not open the phone app.", "error")
    );
  };

  const messageOwner = () => {
    const digits = property.owner_phone.replace(/\D/g, "");
    const local = digits.length > 10 ? digits.slice(-10) : digits;
    if (local.length !== 10) {
      showToast("The seller hasn’t shared a phone number yet.", "error");
      return;
    }
    const text = encodeURIComponent(
      `Hi ${property.owner_name}, I’m interested in “${property.title}” listed on SystIO Land.`
    );
    Linking.openURL(`https://wa.me/91${local}?text=${text}`).catch(() =>
      showToast("Could not open WhatsApp.", "error")
    );
  };

  const shareListing = async () => {
    try {
      await Share.share({
        message: `${property.title}\n${formatPrice(property.price, property.listing_type)} · ${formatArea(
          property.area_value,
          property.area_unit
        )}\n${property.locality}, ${property.city}\n\nListed on SystIO Land`,
      });
    } catch {
      showToast("Could not open the share sheet.", "error");
    }
  };

  const openVideo = () => {
    if (!property.youtube_url) return;
    Linking.openURL(property.youtube_url).catch(() =>
      showToast("Could not open the video link.", "error")
    );
  };

  const openPayment = () => setPaymentVisible(true);

  const ownerAction = () => {
    if (property.status === "draft") {
      openPayment();
      return;
    }
    navigation.navigate("ListProperty", { editId: property.id });
  };

  const ownerActionLabel =
    property.status === "draft"
      ? "Complete listing"
      : property.status === "declined"
        ? "Edit & resubmit"
        : "Edit listing";

  return (
    <View style={styles.root}>
      <StatusBar style={scrolled ? "dark" : "light"} />

      {scrolled ? (
        <View style={[styles.stickyTop, { paddingTop: insets.top + 4 }]}>
          <RoundIconButton
            accessibilityLabel="Go back"
            onPress={() => navigation.goBack()}
            icon={<ArrowLeft size={19} color={colors.ink} />}
          />
          <Text style={styles.stickyTitle} numberOfLines={1}>
            {property.title}
          </Text>
          <RoundIconButton
            accessibilityLabel={isFavorite ? "Remove from saved" : "Save property"}
            onPress={() => toggleFavorite(property.id)}
            icon={
              <Heart
                size={18}
                color={isFavorite ? colors.primary : colors.ink}
                fill={isFavorite ? colors.primary : "transparent"}
              />
            }
          />
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => {
          const next = event.nativeEvent.contentOffset.y > 250;
          if (next !== scrolled) setScrolled(next);
        }}
        scrollEventThrottle={24}
      >
        <ImageCarousel
          images={property.images}
          width={width}
          height={306}
          showDots
          overlay={
            <>
              <View style={[styles.imageTop, { paddingTop: insets.top + 8 }]}>
                <RoundIconButton
                  accessibilityLabel="Go back"
                  onPress={() => navigation.goBack()}
                  icon={<ArrowLeft size={20} color={colors.ink} />}
                />
                <View style={styles.imageActions}>
                  <RoundIconButton
                    accessibilityLabel="Share property"
                    onPress={shareListing}
                    icon={<Share2 size={18} color={colors.ink} />}
                  />
                  <RoundIconButton
                    accessibilityLabel={isFavorite ? "Remove from saved" : "Save property"}
                    onPress={() => toggleFavorite(property.id)}
                    icon={
                      <Heart
                        size={19}
                        color={isFavorite ? colors.primary : colors.ink}
                        fill={isFavorite ? colors.primary : "transparent"}
                        strokeWidth={2.1}
                      />
                    }
                  />
                </View>
              </View>
              <Pressable
                style={styles.photoPill}
                onPress={() => setViewerVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="View all photos"
              >
                <ImageIcon size={12} color={colors.white} />
                <Text style={styles.photoPillText}>{property.images.length} photos</Text>
              </Pressable>
            </>
          }
        />

        <View style={styles.sheet}>
          <View style={styles.tagRow}>
            <View
              style={[
                styles.saleTag,
                {
                  backgroundColor:
                    property.listing_type === "sale"
                      ? colors.primarySoft
                      : colors.violetSoft,
                },
              ]}
            >
              <Text
                style={[
                  styles.saleTagText,
                  { color: property.listing_type === "sale" ? colors.primary : colors.violet },
                ]}
              >
                {property.listing_type === "sale" ? "FOR SALE" : "FOR RENT"}
              </Text>
            </View>
            <VerifiedPill />
            <Text style={styles.posted}>Posted {timeAgo(property.created_at)}</Text>
          </View>

          <Text style={styles.title}>{property.title}</Text>

          <View style={styles.addressRow}>
            <MapPin size={14} color={colors.primary} strokeWidth={2.3} />
            <Text style={styles.address} numberOfLines={2}>
              {fullAddress}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.price}>
                {formatPrice(property.price, property.listing_type)}
              </Text>
              <Text style={styles.fullPrice}>
                {formatPriceFull(property.price, property.listing_type)} ·{" "}
                {formatArea(property.area_value, property.area_unit)}
              </Text>
            </View>
            <View style={styles.areaBox}>
              <Ruler size={14} color={colors.body} />
              <Text style={styles.areaBoxValue}>
                {formatArea(property.area_value, property.area_unit)}
              </Text>
              <Text style={styles.areaBoxLabel}>TOTAL AREA</Text>
            </View>
          </View>

          {isOwner ? (
            <View
              style={[
                styles.ownerBanner,
                {
                  backgroundColor:
                    property.status === "approved"
                      ? colors.successSoft
                      : property.status === "declined"
                        ? colors.dangerSoft
                        : colors.warningSoft,
                },
              ]}
            >
              <View style={styles.ownerBannerTop}>
                <StatusPill status={property.status} />
                <Text style={styles.ownerBannerText}>
                  {property.status === "approved"
                    ? "Your listing is live on the marketplace."
                    : property.status === "pending"
                      ? "Your listing is being reviewed by the admin team."
                      : property.status === "declined"
                        ? "Changes are needed before this can go live."
                        : "Complete the listing payment to submit for review."}
                </Text>
              </View>
              {property.status === "declined" && property.admin_note ? (
                <Text style={styles.adminNote}>{property.admin_note}</Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.factsGrid}>
            <Fact
              icon={<LandPlot size={16} color={colors.primary} />}
              label="Property type"
              value={propertyTypeLabel(property.property_type)}
            />
            <Fact
              icon={<Ruler size={16} color={colors.violet} />}
              label="Area"
              value={formatArea(property.area_value, property.area_unit)}
            />
            <Fact
              icon={<UserRound size={16} color={colors.info} />}
              label="Listed by"
              value={property.owner_role === "broker" ? "Broker" : "Owner"}
            />
            <Fact
              icon={<CalendarDays size={16} color={colors.warning} />}
              label="Posted on"
              value={formatDate(property.created_at)}
            />
          </View>

          <Section title="About this property">
            <Text style={styles.description}>{property.description}</Text>
          </Section>

          {property.nearby_landmarks.length ? (
            <Section title="What’s nearby">
              <View style={styles.landmarks}>
                {property.nearby_landmarks.map((landmark, index) => (
                  <View
                    key={`${landmark.name}-${index}`}
                    style={[
                      styles.landmarkRow,
                      index === property.nearby_landmarks.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View style={styles.landmarkIcon}>
                      <MapPin size={13} color={colors.primary} />
                    </View>
                    <Text style={styles.landmarkName}>{landmark.name}</Text>
                    <Text style={styles.landmarkDistance}>{landmark.distance}</Text>
                  </View>
                ))}
              </View>
            </Section>
          ) : null}

          {property.youtube_url ? (
            <Section title="Walkthrough">
              <View style={styles.videoEmbedWrap}>
                <WebView
                  source={{
                    uri: youtubeEmbedUrl(property.youtube_url) ?? property.youtube_url,
                  }}
                  style={[styles.videoEmbed, { height: Math.round(width * 0.56) }]}
                  allowsFullscreenVideo
                  javaScriptEnabled
                  domStorageEnabled
                  mediaPlaybackRequiresUserAction={false}
                  startInLoadingState
                  renderLoading={() => (
                    <ActivityIndicator
                      style={styles.videoLoading}
                      color={colors.primary}
                    />
                  )}
                />
                <View style={styles.videoFooterRow}>
                  <View style={styles.videoMeta}>
                    <SquarePlay size={13} color={colors.primary} />
                    <Text style={styles.videoSub}>Property walkthrough video</Text>
                  </View>
                  <Pressable
                    onPress={openVideo}
                    style={styles.videoOpen}
                    accessibilityRole="button"
                    accessibilityLabel="Open in YouTube"
                  >
                    <Play size={11} color={colors.primary} fill={colors.primary} />
                    <Text style={styles.videoOpenText}>Open in YouTube</Text>
                  </Pressable>
                </View>
              </View>
            </Section>
          ) : null}

          <Section title="Location">
            <PropertyMap property={property} height={212} />
            <View style={styles.locationFooter}>
              <View style={styles.locationDot} />
              <Text style={styles.locationText}>{fullAddress}</Text>
            </View>
            {property.boundary.length >= 3 ? (
              <View style={styles.boundaryNote}>
                <CheckCircle2 size={14} color={colors.success} />
                <Text style={styles.boundaryNoteText}>
                  Plot boundary drawn by the seller. Use satellite view to inspect surroundings.
                </Text>
              </View>
            ) : null}
          </Section>

          <Section title="Listed by">
            <View style={styles.sellerCard}>
              <Avatar
                name={property.owner_name}
                size={50}
                role={property.owner_role}
                tone="gold"
              />
              <View style={{ flex: 1 }}>
                <View style={styles.sellerNameRow}>
                  <Text style={styles.sellerName}>{property.owner_name}</Text>
                  <BadgeCheck size={16} color={colors.success} strokeWidth={2.6} />
                </View>
                <Text style={styles.sellerRole}>
                  {property.owner_role === "broker" ? "Verified broker" : "Property owner"} ·{" "}
                  +91 {formatPhone(property.owner_phone)}
                </Text>
              </View>
              <ShieldCheck size={19} color={colors.success} />
            </View>
            <Text style={styles.sellerHint}>
              Speak directly with the seller. SystIO Land does not charge buyers any brokerage.
            </Text>
          </Section>

          <View style={styles.referenceRow}>
            <Text style={styles.reference}>
              LISTING ID · SYS-{property.id.slice(-6).toUpperCase()}
            </Text>
            <Pressable
              onPress={() => showToast("Thanks — our trust team will review this listing.", "success")}
              accessibilityRole="button"
              accessibilityLabel="Report listing"
            >
              <Text style={styles.report}>Report listing</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 10) + 6 }]}>
        {isOwner ? (
          <>
            <View style={{ flex: 1 }}>
              <StatusPill status={property.status} />
              <Text style={styles.bottomSub}>Owner view</Text>
            </View>
            <PrimaryButton
              label={ownerActionLabel}
              onPress={ownerAction}
              compact
              style={styles.ownerButton}
            />
          </>
        ) : (
          <>
            <View style={styles.bottomPrice}>
              <Text style={styles.bottomPriceValue}>
                {formatPrice(property.price, property.listing_type)}
              </Text>
              <Text style={styles.bottomSub} numberOfLines={1}>
                {formatArea(property.area_value, property.area_unit)}
              </Text>
            </View>
            <Pressable
              onPress={messageOwner}
              accessibilityRole="button"
              accessibilityLabel="Message seller on WhatsApp"
              style={styles.whatsapp}
            >
              <MessageCircle size={19} color={colors.success} strokeWidth={2.1} />
            </Pressable>
            <PrimaryButton
              label="Call owner"
              onPress={callOwner}
              compact
              icon={<Phone size={15} color={colors.white} />}
              style={styles.callButton}
            />
          </>
        )}
      </View>

      <ImageViewer
        visible={viewerVisible}
        images={property.images}
        title={property.title}
        onClose={() => setViewerVisible(false)}
      />
      <PaymentModal
        visible={paymentVisible}
        property={property}
        onClose={() => {
          setPaymentVisible(false);
          refresh(true);
        }}
        onSuccess={async () => {
          setPaymentVisible(false);
          await refresh(true);
          await refreshProfile();
          showToast("Listing submitted for review.", "success");
        }}
      />
    </View>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.fact}>
      <View style={styles.factIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.factLabel}>{label}</Text>
        <Text style={styles.factValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
  },
  scrollContent: {
    backgroundColor: colors.canvas,
  },
  stickyTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    zIndex: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingBottom: 8,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
    ...shadow.soft,
  },
  stickyTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  imageTop: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    top: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  imageActions: {
    flexDirection: "row",
    gap: 8,
  },
  photoPill: {
    position: "absolute",
    left: spacing.md,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: radii.pill,
    backgroundColor: "rgba(24,25,28,0.72)",
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  photoPillText: {
    color: colors.white,
    fontSize: 9.5,
    fontWeight: "700",
  },
  sheet: {
    marginTop: -22,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  saleTag: {
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  saleTagText: {
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  posted: {
    fontSize: 9.5,
    color: colors.faint,
    marginLeft: "auto",
  },
  title: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.9,
    marginTop: 12,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 9,
  },
  address: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17.5,
    color: colors.muted,
    fontWeight: "500",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: colors.canvas,
    borderRadius: radii.md,
    padding: 13,
    marginTop: 16,
  },
  price: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.8,
  },
  fullPrice: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
    fontWeight: "500",
  },
  areaBox: {
    alignItems: "flex-end",
    gap: 1,
  },
  areaBoxValue: {
    fontSize: 12.5,
    fontWeight: "900",
    color: colors.ink,
  },
  areaBoxLabel: {
    fontSize: 7.5,
    color: colors.faint,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  ownerBanner: {
    borderRadius: radii.md,
    padding: 12,
    marginTop: 14,
    gap: 7,
  },
  ownerBannerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ownerBannerText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
    color: colors.body,
  },
  adminNote: {
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.danger,
    fontWeight: "600",
  },
  factsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  fact: {
    width: "48.5%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    borderRadius: radii.md,
    padding: 10,
    backgroundColor: colors.white,
  },
  factIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  factLabel: {
    fontSize: 8.5,
    color: colors.faint,
    fontWeight: "600",
  },
  factValue: {
    fontSize: 11,
    color: colors.ink,
    fontWeight: "800",
    marginTop: 1,
  },
  section: {
    marginTop: spacing.xxl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  description: {
    fontSize: 12.5,
    lineHeight: 20,
    color: colors.body,
    fontWeight: "400",
  },
  landmarks: {
    borderWidth: 1,
    borderColor: colors.lineSoft,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
  },
  landmarkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  landmarkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  landmarkName: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: "600",
    color: colors.ink,
  },
  landmarkDistance: {
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.muted,
  },
  videoEmbedWrap: {
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.dark,
  },
  videoEmbed: {
    width: "100%",
    backgroundColor: colors.dark,
  },
  videoLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  videoFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  videoMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 1,
  },
  videoSub: {
    fontSize: 10,
    color: colors.ink,
    fontWeight: "600",
  },
  videoOpen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  videoOpenText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: colors.primary,
  },
  locationFooter: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    marginTop: 10,
  },
  locationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 5,
  },
  locationText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: colors.muted,
    fontWeight: "500",
  },
  boundaryNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.successSoft,
    borderRadius: radii.sm,
    padding: 9,
    marginTop: 9,
  },
  boundaryNoteText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 14,
    color: "#1B6C42",
    fontWeight: "600",
  },
  sellerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    borderRadius: radii.lg,
    padding: 12,
    backgroundColor: colors.white,
    ...shadow.soft,
  },
  sellerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.ink,
  },
  sellerRole: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
    fontWeight: "500",
  },
  sellerHint: {
    fontSize: 9.5,
    lineHeight: 14,
    color: colors.faint,
    marginTop: 8,
  },
  referenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    marginTop: spacing.xxl,
    paddingTop: 14,
    gap: 10,
  },
  reference: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: colors.faint,
  },
  report: {
    fontSize: 9.5,
    color: colors.muted,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    ...shadow.raised,
  },
  bottomPrice: {
    minWidth: 94,
    maxWidth: 132,
  },
  bottomPriceValue: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  bottomSub: {
    fontSize: 9,
    color: colors.muted,
    marginTop: 2,
    fontWeight: "600",
  },
  whatsapp: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: colors.successSoft,
    backgroundColor: colors.successSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  callButton: {
    flex: 1,
    minHeight: 46,
  },
  ownerButton: {
    minWidth: 150,
  },
});
