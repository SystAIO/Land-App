import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  BadgeCheck,
  ChevronRight,
  Eye,
  Heart,
  MapPin,
  Ruler,
} from "lucide-react-native";

import { areaUnitLabel, propertyTypeShort } from "../constants/catalog";
import { colors, radii, shadow, spacing } from "../constants/theme";
import type { Property } from "../types";
import { formatArea, formatPrice, timeAgo } from "../utils/format";
import { ImageCarousel } from "./ImageCarousel";

export function PropertyCard({
  property,
  width,
  isFavorite,
  onPress,
  onToggleFavorite,
  compact = false,
}: {
  property: Property;
  width: number;
  isFavorite?: boolean;
  onPress: () => void;
  onToggleFavorite?: () => void;
  compact?: boolean;
}) {
  const imageHeight = compact ? 150 : 212;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${property.title}, ${formatPrice(property.price, property.listing_type)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { width, opacity: pressed ? 0.94 : 1 },
      ]}
    >
      <ImageCarousel
        images={property.images}
        width={width}
        height={imageHeight}
        showDots
        overlay={
          <>
            <View style={styles.topRow} pointerEvents="box-none">
              <View style={styles.badgeStack}>
                <View style={styles.verified}>
                  <BadgeCheck size={13} color={colors.success} strokeWidth={2.6} />
                  <Text style={styles.verifiedText}>VERIFIED</Text>
                </View>
                {property.is_featured ? (
                  <View style={styles.featured}>
                    <Text style={styles.featuredText}>FEATURED</Text>
                  </View>
                ) : null}
              </View>
            </View>
            {onToggleFavorite ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  isFavorite ? "Remove from saved properties" : "Save property"
                }
                onPress={(event) => {
                  event.stopPropagation();
                  onToggleFavorite();
                }}
                hitSlop={8}
                style={[styles.favorite, styles.favoriteCorner]}
              >
                <Heart
                  size={18}
                  color={isFavorite ? colors.primary : colors.ink}
                  fill={isFavorite ? colors.primary : "transparent"}
                  strokeWidth={2.2}
                />
              </Pressable>
            ) : null}
            <View style={styles.listingBadge}>
              <Text style={styles.listingText}>
                {property.listing_type === "sale" ? "FOR SALE" : "FOR RENT"}
              </Text>
            </View>
          </>
        }
      />

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {property.title}
        </Text>

        <View style={styles.locationRow}>
          <MapPin size={12.5} color={colors.muted} strokeWidth={2.2} />
          <Text style={styles.location} numberOfLines={1}>
            {property.locality}, {property.city}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.time}>{timeAgo(property.created_at)}</Text>
        </View>

        {!compact ? (
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Text style={styles.metaText}>{propertyTypeShort(property.property_type)}</Text>
            </View>
            <View style={styles.metaChip}>
              <Ruler size={11} color={colors.body} />
              <Text style={styles.metaText}>
                {formatArea(property.area_value, property.area_unit)}
              </Text>
            </View>
            <View style={styles.metaChip}>
              <Eye size={11} color={colors.body} />
              <Text style={styles.metaText}>{property.views_count}</Text>
            </View>
          </View>
        ) : null}

        {!compact ? (
          <View style={styles.ownerRow}>
            <View
              style={[
                styles.roleTag,
                {
                  backgroundColor:
                    property.owner_role === "broker"
                      ? colors.primarySoft
                      : colors.successSoft,
                },
              ]}
            >
              <Text
                style={[
                  styles.roleText,
                  {
                    color:
                      property.owner_role === "broker"
                        ? colors.primary
                        : colors.success,
                  },
                ]}
              >
                {property.owner_role === "broker" ? "BROKER" : "OWNER"}
              </Text>
            </View>
            <Text style={styles.ownerText} numberOfLines={1}>
              {property.owner_name}
            </Text>
          </View>
        ) : null}

        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {formatPrice(property.price, property.listing_type)}
          </Text>
          <Text style={styles.areaUnit}>
            {formatArea(property.area_value, property.area_unit)}
            {property.area_unit !== "sqft" ? ` · ${areaUnitLabel(property.area_unit)}` : ""}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.viewButton}>
            <Text style={styles.viewText}>View details</Text>
            <ChevronRight size={13} color={colors.primary} strokeWidth={2.6} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.lineSoft,
    ...shadow.card,
  },
  topRow: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    paddingLeft: 10,
  },
  badgeStack: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  favoriteCorner: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  verified: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  verifiedText: {
    fontSize: 9.5,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: 0.4,
  },
  featured: {
    backgroundColor: colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  featuredText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
    color: "#4A3403",
  },
  favorite: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  listingBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    alignItems: "flex-start",
  },
  listingText: {
    backgroundColor: "rgba(24,25,28,0.78)",
    color: colors.white,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.xs,
    overflow: "hidden",
  },
  body: {
    padding: spacing.md,
    gap: 7,
    alignItems: "stretch",
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.35,
    lineHeight: 22,
    textAlign: "left",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 4,
  },
  location: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "500",
    flexShrink: 1,
  },
  dot: {
    color: colors.faint,
    fontSize: 12,
  },
  time: {
    fontSize: 11,
    color: colors.faint,
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    marginTop: 1,
    justifyContent: "flex-start",
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.canvas,
    borderRadius: radii.xs,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  metaText: {
    fontSize: 10.5,
    color: colors.body,
    fontWeight: "700",
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 6,
    marginTop: 1,
  },
  roleTag: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  roleText: {
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  ownerText: {
    fontSize: 10.5,
    color: colors.muted,
    fontWeight: "600",
    flexShrink: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    marginTop: 5,
    paddingTop: 10,
    gap: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  price: {
    fontSize: 19,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.5,
    textAlign: "left",
  },
  areaUnit: {
    fontSize: 9.5,
    color: colors.faint,
    fontWeight: "600",
    marginTop: 1,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    textAlign: "left",
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingBottom: 2,
  },
  viewText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: colors.primary,
  },
});
