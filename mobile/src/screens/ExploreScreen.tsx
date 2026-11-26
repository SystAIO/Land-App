import { MAP_PROVIDER } from "../constants/mapStyle";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import MapView, { Marker, Polygon, Polyline } from "react-native-maps";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ChevronDown,
  ChevronRight,
  Layers,
  LocateFixed,
  MapPin,
  Navigation,
  SearchX,
  X,
} from "lucide-react-native";

import { EmptyState } from "../components/EmptyState";
import { LocationSheet } from "../components/LocationSheet";
import { Chip } from "../components/Pills";
import { CITIES, PROPERTY_TYPES, propertyTypeShort } from "../constants/catalog";
import { colors, radii, shadow, spacing } from "../constants/theme";
import { useListings } from "../context/ListingsContext";
import type { RootStackParamList, TabParamList } from "../navigation/types";
import type { PropertyType } from "../types";
import { formatArea, formatPrice, formatShortPrice } from "../utils/format";

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Explore">,
  NativeStackScreenProps<RootStackParamList>
>;

export function ExploreScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { properties, loading } = useListings();
  const mapRef = useRef<MapView | null>(null);

  const [city, setCity] = useState(route.params?.city ?? "Pune");
  const [citySheet, setCitySheet] = useState(false);
  const [type, setType] = useState<PropertyType | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [satellite, setSatellite] = useState(false);

  useEffect(() => {
    if (route.params?.city) setCity(route.params.city);
  }, [route.params?.city]);

  const cityEntry = CITIES.find((entry) => entry.city === city) ?? CITIES[0];

  const visible = useMemo(() => {
    let list = properties;
    if (city !== "All cities") list = list.filter((property) => property.city === city);
    if (type !== "all") list = list.filter((property) => property.property_type === type);
    return list;
  }, [city, properties, type]);

  const selected = visible.find((property) => property.id === selectedId) ?? null;

  const regionForCity = () => ({
    latitude: cityEntry.latitude,
    longitude: cityEntry.longitude,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  useEffect(() => {
    mapRef.current?.animateToRegion(regionForCity(), 350);
    setSelectedId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  const focusProperty = (id: string) => {
    const property = visible.find((entry) => entry.id === id);
    if (!property) return;
    setSelectedId(id);
    mapRef.current?.animateToRegion(
      {
        latitude: property.latitude,
        longitude: property.longitude,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      },
      300
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style={satellite ? "light" : "dark"} />
      <MapView
provider={MAP_PROVIDER}
                ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={regionForCity()}
        mapType={satellite ? "satellite" : "standard"}
        showsCompass={false}
        showsMyLocationButton={false}
        showsUserLocation={false}
        toolbarEnabled={false}
        onPress={() => setSelectedId(null)}
      >
        {visible.map((property) => {
          const active = property.id === selectedId;
          return (
            <Marker
              key={property.id}
              coordinate={{
                latitude: property.latitude,
                longitude: property.longitude,
              }}
              onPress={() => focusProperty(property.id)}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges
            >
              <View style={styles.pinWrap}>
                <View style={[styles.pin, active && styles.pinActive]}>
                  <Text style={[styles.pinText, active && styles.pinTextActive]}>
                    {formatShortPrice(property.price)}
                  </Text>
                  {property.listing_type === "rent" ? (
                    <Text style={[styles.pinRent, active && styles.pinTextActive]}>/mo</Text>
                  ) : null}
                </View>
                <View style={[styles.pinCaret, active && styles.pinCaretActive]} />
              </View>
            </Marker>
          );
        })}
        {selected && selected.boundary.length >= 3 ? (
          <Polygon
            coordinates={selected.boundary}
            strokeColor="transparent"
            strokeWidth={0}
            fillColor="rgba(23,58,94,0.14)"
          />
        ) : null}
        {selected && selected.boundary.length >= 2 ? (
          <Polyline
            coordinates={[...selected.boundary, selected.boundary[0]]}
            strokeColor={colors.primary}
            strokeWidth={2.5}
            lineDashPattern={[9, 7]}
          />
        ) : null}
      </MapView>

      <View style={[styles.top, { top: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.topRow}>
          <Pressable
            onPress={() => setCitySheet(true)}
            style={styles.locationPill}
            accessibilityRole="button"
            accessibilityLabel="Choose city on map"
          >
            <MapPin size={15} color={colors.primary} strokeWidth={2.5} />
            <Text style={styles.locationText} numberOfLines={1}>
              {city === "All cities" ? "All cities" : city}
            </Text>
            <ChevronDown size={14} color={colors.ink} />
          </Pressable>
          <View style={styles.countPill}>
            <Text style={styles.countNumber}>{visible.length}</Text>
            <Text style={styles.countLabel}>
              {visible.length === 1 ? "listing" : "listings"}
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          <Chip label="All" active={type === "all"} onPress={() => setType("all")} />
          {PROPERTY_TYPES.map((entry) => (
            <Chip
              key={entry.id}
              label={entry.short}
              active={type === entry.id}
              onPress={() => setType((current) => (current === entry.id ? "all" : entry.id))}
            />
          ))}
        </ScrollView>
      </View>

      <View style={[styles.controls, { top: insets.top + 126 }]}>
        <Pressable
          onPress={() => {
            mapRef.current?.animateToRegion(regionForCity(), 350);
            setSelectedId(null);
          }}
          style={styles.control}
          accessibilityRole="button"
          accessibilityLabel="Recenter map"
        >
          <LocateFixed size={19} color={colors.ink} strokeWidth={2.1} />
        </Pressable>
        <Pressable
          onPress={() => setSatellite((current) => !current)}
          style={styles.control}
          accessibilityRole="button"
          accessibilityLabel="Toggle satellite view"
        >
          <Layers size={19} color={satellite ? colors.primary : colors.ink} strokeWidth={2.1} />
        </Pressable>
      </View>

      {!loading && visible.length === 0 ? (
        <View style={styles.emptyOverlay}>
          <View style={styles.emptyCard}>
            <EmptyState
              compact
              icon={<SearchX size={26} color={colors.primary} />}
              title="No pins in this view"
              body="Try another city or property type. You can also be the first to list here."
              actionLabel="All cities"
              onAction={() => {
                setCity("All cities");
                setType("all");
              }}
            />
          </View>
        </View>
      ) : null}

      {selected ? (
        <Pressable
          onPress={() => navigation.navigate("PropertyDetail", { id: selected.id })}
          style={styles.selectedCard}
          accessibilityRole="button"
          accessibilityLabel={`Open ${selected.title}`}
        >
          <Image source={{ uri: selected.images[0] }} style={styles.selectedImage} />
          <View style={styles.selectedBody}>
            <View style={styles.selectedTitleRow}>
              <Text style={styles.selectedTitle} numberOfLines={2}>
                {selected.title}
              </Text>
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  setSelectedId(null);
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close preview"
              >
                <X size={15} color={colors.faint} />
              </Pressable>
            </View>
            <View style={styles.selectedLocation}>
              <MapPin size={11} color={colors.muted} />
              <Text style={styles.selectedLocationText} numberOfLines={1}>
                {selected.locality}, {selected.city}
              </Text>
            </View>
            <View style={styles.selectedMeta}>
              <Text style={styles.selectedPrice}>
                {formatPrice(selected.price, selected.listing_type)}
              </Text>
              <Text style={styles.selectedArea}>
                {formatArea(selected.area_value, selected.area_unit)}
              </Text>
            </View>
            <View style={styles.selectedFooter}>
              <Text style={styles.selectedType}>
                {propertyTypeShort(selected.property_type)} · {selected.owner_name}
              </Text>
              <View style={styles.openArrow}>
                <ChevronRight size={13} color={colors.white} strokeWidth={2.7} />
              </View>
            </View>
          </View>
        </Pressable>
      ) : (
        <View style={styles.hintWrap} pointerEvents="none">
          <View style={styles.hint}>
            <Navigation size={13} color={colors.white} />
            <Text style={styles.hintText}>Tap a price pin to preview the property</Text>
          </View>
        </View>
      )}

      <LocationSheet
        visible={citySheet}
        selectedCity={city}
        onSelect={(next) => {
          setCity(next);
          setSelectedId(null);
        }}
        onClose={() => setCitySheet(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvasDeep,
  },
  top: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    gap: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    paddingHorizontal: 13,
    paddingVertical: 10,
    maxWidth: 230,
    ...shadow.raised,
  },
  locationText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: colors.ink,
    flexShrink: 1,
  },
  countPill: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
    backgroundColor: "rgba(24,25,28,0.88)",
    borderRadius: radii.pill,
    paddingHorizontal: 11,
    paddingVertical: 9,
    ...shadow.soft,
  },
  countNumber: {
    fontSize: 12.5,
    fontWeight: "900",
    color: colors.white,
  },
  countLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "rgba(255,255,255,0.72)",
  },
  chipRow: {
    gap: 7,
    paddingRight: 8,
  },
  controls: {
    position: "absolute",
    right: spacing.lg,
    gap: 9,
  },
  control: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.raised,
  },
  pinWrap: {
    alignItems: "center",
  },
  pin: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 1,
    backgroundColor: colors.white,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "rgba(24,25,28,0.09)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  pinActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  pinText: {
    fontSize: 11,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.2,
  },
  pinTextActive: {
    color: colors.white,
  },
  pinRent: {
    fontSize: 7.5,
    fontWeight: "700",
    color: colors.muted,
  },
  pinCaret: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.white,
    marginTop: -1,
  },
  pinCaretActive: {
    borderTopColor: colors.primary,
  },
  emptyOverlay: {
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    top: "32%",
    alignItems: "center",
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    ...shadow.raised,
    width: "100%",
  },
  selectedCard: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    overflow: "hidden",
    minHeight: 122,
    ...shadow.raised,
  },
  selectedImage: {
    width: 112,
    height: "100%",
    backgroundColor: colors.canvasDeep,
  },
  selectedBody: {
    flex: 1,
    padding: spacing.md,
    gap: 5,
  },
  selectedTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  selectedTitle: {
    flex: 1,
    fontSize: 14.5,
    lineHeight: 18,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  selectedLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  selectedLocationText: {
    fontSize: 10.5,
    color: colors.muted,
    flexShrink: 1,
  },
  selectedMeta: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 1,
  },
  selectedPrice: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.4,
  },
  selectedArea: {
    fontSize: 9.5,
    color: colors.faint,
    fontWeight: "600",
  },
  selectedFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    paddingTop: 6,
    marginTop: 1,
    gap: 6,
  },
  selectedType: {
    fontSize: 9.5,
    color: colors.muted,
    fontWeight: "600",
    flex: 1,
  },
  openArrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  hintWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: spacing.xl,
    alignItems: "center",
  },
  hint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(24,25,28,0.86)",
    borderRadius: radii.pill,
    paddingHorizontal: 13,
    paddingVertical: 9,
    ...shadow.soft,
  },
  hintText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: "600",
  },
});
