import { MAP_PROVIDER } from "../constants/mapStyle";
import React, { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import MapView, { Marker } from "react-native-maps";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  MapPin,
  Search,
  SearchX,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react-native";

import { Avatar } from "../components/Avatar";
import { HeaderIcon } from "../components/Buttons";
import { EmptyState } from "../components/EmptyState";
import { FilterSheet } from "../components/FilterSheet";
import { LocationSheet } from "../components/LocationSheet";
import { Chip, SectionHeader } from "../components/Pills";
import { PropertyCard } from "../components/PropertyCard";
import { CITIES } from "../constants/catalog";
import { DEFAULT_FILTERS, type BrowseFilters } from "../constants/filters";
import { colors, radii, shadow, spacing } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { useListings } from "../context/ListingsContext";
import { useToast } from "../context/ToastContext";
import type { RootStackParamList, TabParamList } from "../navigation/types";

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const { profile } = useAuth();
  const { properties, favoriteIds, toggleFavorite, loading, refreshing, refresh } =
    useListings();
  const { showToast } = useToast();

  const [city, setCity] = useState("Pune");
  const [citySheet, setCitySheet] = useState(false);
  const [filterSheet, setFilterSheet] = useState(false);
  const [filters, setFilters] = useState<BrowseFilters>(DEFAULT_FILTERS);
  const [query, setQuery] = useState("");

  const cardWidth = width - spacing.lg * 2;
  const cityEntry = CITIES.find((entry) => entry.city === city);

  const mapProperties = useMemo(
    () => (city === "All cities" ? properties : properties.filter((p) => p.city === city)),
    [city, properties]
  );

  const mapRegion = useMemo(() => {
    const first = mapProperties[0];
    const fallback = cityEntry ?? CITIES[0];
    return {
      latitude: first?.latitude ?? fallback.latitude,
      longitude: first?.longitude ?? fallback.longitude,
      latitudeDelta: 0.09,
      longitudeDelta: 0.09,
    };
  }, [cityEntry, mapProperties]);

  const filtered = useMemo(() => {
    let list = [...properties];

    if (city !== "All cities") list = list.filter((property) => property.city === city);
    if (filters.listingType !== "all") {
      list = list.filter((property) => property.listing_type === filters.listingType);
    }
    if (filters.propertyType !== "all") {
      list = list.filter((property) => property.property_type === filters.propertyType);
    }
    if (filters.maxPrice !== null) {
      list = list.filter((property) => property.price <= filters.maxPrice!);
    }
    const needle = query.trim().toLowerCase();
    if (needle) {
      list = list.filter((property) =>
        [property.title, property.locality, property.city, property.address, property.owner_name]
          .join(" ")
          .toLowerCase()
          .includes(needle)
      );
    }

    switch (filters.sort) {
      case "price_low":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price_high":
        list.sort((a, b) => b.price - a.price);
        break;
      case "area_high":
        list.sort((a, b) => b.area_value - a.area_value);
        break;
      default:
        list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    }
    return list;
  }, [city, filters, properties, query]);

  const hasActiveFilters =
    filters.listingType !== "all" ||
    filters.propertyType !== "all" ||
    filters.maxPrice !== null ||
    filters.sort !== "newest";
  const isSearching = Boolean(query.trim()) || hasActiveFilters;
  const stateLabel = city === "All cities" ? "Everywhere in India" : cityEntry?.state ?? "India";

  const resetSearch = () => {
    setQuery("");
    setFilters({ ...DEFAULT_FILTERS });
  };

  const goToDetail = (id: string) => {
    navigation.navigate("PropertyDetail", { id });
  };

  const openMap = () => {
    navigation.navigate("Explore", { city });
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
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
          <Pressable
            onPress={() => setCitySheet(true)}
            accessibilityRole="button"
            accessibilityLabel="Choose city"
            style={styles.locationButton}
          >
            <Text style={styles.eyebrow}>LOCATION</Text>
            <View style={styles.locationLine}>
              <MapPin size={16} color={colors.primary} strokeWidth={2.6} />
              <Text style={styles.city} numberOfLines={1}>
                {city === "All cities" ? "All cities" : city}
              </Text>
              <ChevronDown size={16} color={colors.ink} strokeWidth={2.3} />
            </View>
            <Text style={styles.state}>{stateLabel}</Text>
          </Pressable>

          <View style={styles.headerActions}>
            <HeaderIcon
              label="Notifications"
              onPress={() => showToast("You’re all caught up. No new notifications.", "info")}
              icon={<Bell size={19} color={colors.ink} strokeWidth={2.1} />}
            />
            <Pressable
              onPress={() => navigation.navigate("Profile")}
              accessibilityRole="button"
              accessibilityLabel="Open profile"
            >
              <Avatar name={profile?.name ?? "SystIO"} size={40} tone="gold" />
            </Pressable>
          </View>
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>Find your next address.</Text>
          <Text style={styles.heroSub}>
            Verified plots, homes and farm land — direct from owners and brokers.
          </Text>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={18} color={colors.faint} strokeWidth={2.2} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search locality, project or owner"
              placeholderTextColor={colors.faint}
              style={styles.searchInput}
              returnKeyType="search"
              autoCorrect={false}
            />
            {query ? (
              <Pressable
                onPress={() => setQuery("")}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <X size={16} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={() => setFilterSheet(true)}
            accessibilityRole="button"
            accessibilityLabel="Open filters"
            style={styles.filterButton}
          >
            <SlidersHorizontal size={19} color={colors.ink} strokeWidth={2.2} />
            {hasActiveFilters ? <View style={styles.filterDot} /> : null}
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickRow}
        >
          <Chip
            label="Filters"
            active={hasActiveFilters}
            onPress={() => setFilterSheet(true)}
            icon={
              <SlidersHorizontal
                size={13}
                color={hasActiveFilters ? colors.white : colors.ink}
                strokeWidth={2.2}
              />
            }
          />
          <Chip
            label="For sale"
            active={filters.listingType === "sale"}
            onPress={() =>
              setFilters((current) => ({
                ...current,
                listingType: current.listingType === "sale" ? "all" : "sale",
              }))
            }
          />
          <Chip
            label="For rent"
            active={filters.listingType === "rent"}
            onPress={() =>
              setFilters((current) => ({
                ...current,
                listingType: current.listingType === "rent" ? "all" : "rent",
                maxPrice: null,
              }))
            }
          />
          <Chip
            label="Plots"
            active={filters.propertyType === "plot"}
            onPress={() =>
              setFilters((current) => ({
                ...current,
                propertyType: current.propertyType === "plot" ? "all" : "plot",
              }))
            }
          />
          <Chip
            label="Under ₹50 L"
            active={filters.listingType === "sale" && filters.maxPrice === 5000000}
            onPress={() =>
              setFilters((current) =>
                current.listingType === "sale" && current.maxPrice === 5000000
                  ? { ...current, listingType: "all", maxPrice: null }
                  : { ...current, listingType: "sale", maxPrice: 5000000 }
              )
            }
          />
          {hasActiveFilters || query ? (
            <Chip label="Clear" icon={<X size={13} color={colors.ink} />} onPress={resetSearch} />
          ) : null}
        </ScrollView>

        <Pressable
          onPress={openMap}
          accessibilityRole="button"
          accessibilityLabel="Explore properties on the map"
          style={({ pressed }) => [styles.mapTeaser, { opacity: pressed ? 0.94 : 1 }]}
        >
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <MapView
provider={MAP_PROVIDER}
                      style={StyleSheet.absoluteFill}
              initialRegion={mapRegion}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              toolbarEnabled={false}
              showsCompass={false}
              showsMyLocationButton={false}
              showsUserLocation={false}
            >
              {mapProperties.slice(0, 4).map((property) => (
                <Marker
                  key={property.id}
                  coordinate={{
                    latitude: property.latitude,
                    longitude: property.longitude,
                  }}
                  pinColor={colors.primary}
                />
              ))}
            </MapView>
          </View>
          <LinearGradient
            colors={["rgba(18,17,16,0.02)", "rgba(18,17,16,0.82)"]}
            style={styles.mapGradient}
          />
          <View style={styles.mapTopRow}>
            <View style={styles.mapPill}>
              <MapPin size={11} color={colors.ink} />
              <Text style={styles.mapPillText}>MAP VIEW</Text>
            </View>
          </View>
          <View style={styles.mapBottomRow}>
            <View style={styles.mapBottomCopy}>
              <Text style={styles.mapTitle}>Explore on the map</Text>
              <Text style={styles.mapSub}>
                Exact positions and plot boundaries across {city === "All cities" ? "India" : city}
              </Text>
            </View>
            <View style={styles.mapArrow}>
              <ChevronRight size={19} color={colors.ink} strokeWidth={2.5} />
            </View>
          </View>
        </Pressable>

        <SectionHeader
          title={isSearching ? "Search results" : "Properties for you"}
          subtitle={`${filtered.length} approved ${
            filtered.length === 1 ? "property" : "properties"
          }${city !== "All cities" ? ` in ${city}` : ""}`}
          actionLabel="See on map"
          onAction={openMap}
          center
        />

        {loading ? (
          <View style={styles.cardList}>
            {[0, 1].map((key) => (
              <View key={key} style={[styles.skeletonCard, { width: cardWidth }]}>
                <View style={styles.skeletonImage} />
                <View style={styles.skeletonBody}>
                  <View style={[styles.skeletonLine, { width: "82%" }]} />
                  <View style={[styles.skeletonLine, { width: "55%", height: 10 }]} />
                  <View style={[styles.skeletonLine, { width: "38%", height: 14 }]} />
                </View>
              </View>
            ))}
          </View>
        ) : filtered.length ? (
          <View style={styles.cardList}>
            {filtered.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                width={cardWidth}
                isFavorite={favoriteIds.includes(property.id)}
                onToggleFavorite={() => toggleFavorite(property.id)}
                onPress={() => goToDetail(property.id)}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon={<SearchX size={28} color={colors.primary} strokeWidth={1.8} />}
            title={query ? "No properties match that search" : "No approved properties here yet"}
            body="Try another city, clear a filter, or list your property and be the first in this area."
            actionLabel="Clear search"
            onAction={resetSearch}
          />
        )}

        <Pressable
          onPress={() => navigation.navigate("ListProperty")}
          accessibilityRole="button"
          accessibilityLabel="List your property"
          style={({ pressed }) => [styles.sellCard, { opacity: pressed ? 0.94 : 1 }]}
        >
          <LinearGradient
            colors={["#26272B", "#191A1D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.sellGlow} />
          <View style={styles.sellTop}>
            <View style={styles.sellPill}>
              <Sparkles size={11} color={colors.gold} />
              <Text style={styles.sellPillText}>FIRST LISTING FREE</Text>
            </View>
          </View>
          <Text style={styles.sellTitle}>Have land to sell?</Text>
          <Text style={styles.sellBody}>
            Put it on the map in minutes. Add photos, pin the plot and reach verified buyers.
          </Text>
          <View style={styles.sellFooter}>
            <Text style={styles.sellLink}>List a property</Text>
            <View style={styles.sellArrow}>
              <ChevronRight size={15} color={colors.ink} strokeWidth={2.6} />
            </View>
          </View>
        </Pressable>

        <View style={styles.footer}>
          <Image
            source={require("../../assets/icon.png")}
            style={styles.footerMark}
            accessibilityIgnoresInvertColors
          />
          <Text style={styles.footerText}>
            SystIO Land · Verified listings, direct conversations.
          </Text>
          <Text style={styles.footerFine}>
            Every listing is reviewed before it goes live. Prices are set by the seller.
          </Text>
        </View>
      </ScrollView>

      <LocationSheet
        visible={citySheet}
        selectedCity={city}
        onSelect={setCity}
        onClose={() => setCitySheet(false)}
      />
      <FilterSheet
        visible={filterSheet}
        filters={filters}
        onApply={(next) => setFilters(next)}
        onClose={() => setFilterSheet(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: 8,
    gap: 12,
  },
  locationButton: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: "900",
    color: colors.faint,
    letterSpacing: 1.3,
  },
  locationLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  city: {
    fontSize: 21,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.6,
    maxWidth: 210,
  },
  state: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: "500",
    marginLeft: 21,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroCopy: {
    paddingHorizontal: spacing.lg,
    marginTop: 22,
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 29,
    lineHeight: 34,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -1.1,
    textAlign: "center",
  },
  heroSub: {
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.muted,
    marginTop: 6,
    maxWidth: 330,
    textAlign: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing.lg,
    marginTop: 18,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    height: 50,
    paddingHorizontal: 13,
    ...shadow.soft,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: colors.ink,
    fontWeight: "500",
    paddingVertical: 0,
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  filterDot: {
    position: "absolute",
    top: 11,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  quickRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 8,
  },
  mapTeaser: {
    height: 158,
    marginHorizontal: spacing.lg,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.canvasDeep,
    ...shadow.card,
  },
  mapGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 105,
  },
  mapTopRow: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  mapPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  mapPillText: {
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: colors.ink,
  },
  mapBottomRow: {
    position: "absolute",
    left: 13,
    right: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  mapBottomCopy: {
    alignItems: "center",
  },
  mapTitle: {
    fontSize: 16.5,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  mapSub: {
    fontSize: 10.5,
    color: "rgba(255,255,255,0.78)",
    marginTop: 2,
    textAlign: "center",
  },
  mapArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  cardList: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  skeletonCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  skeletonImage: {
    height: 210,
    backgroundColor: colors.lineSoft,
  },
  skeletonBody: {
    padding: spacing.md,
    gap: 9,
  },
  skeletonLine: {
    height: 13,
    borderRadius: 4,
    backgroundColor: colors.lineSoft,
  },
  sellCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xxl,
    borderRadius: radii.xl,
    overflow: "hidden",
    padding: spacing.lg,
    minHeight: 200,
    justifyContent: "space-between",
  },
  sellGlow: {
    position: "absolute",
    right: -60,
    top: -70,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(23,58,94,0.28)",
  },
  sellTop: {
    flexDirection: "row",
    justifyContent: "center",
  },
  sellPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(246,196,106,0.35)",
    backgroundColor: "rgba(246,196,106,0.1)",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  sellPillText: {
    color: colors.gold,
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  sellTitle: {
    color: colors.white,
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.8,
    marginTop: 14,
    textAlign: "center",
  },
  sellBody: {
    color: "#A8A9AD",
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: 6,
    maxWidth: 290,
    textAlign: "center",
    alignSelf: "center",
  },
  sellFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 18,
  },
  sellLink: {
    color: colors.white,
    fontSize: 12.5,
    fontWeight: "800",
  },
  sellArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: spacing.xxl,
    paddingTop: 34,
    gap: 7,
  },
  footerMark: {
    width: 30,
    height: 30,
    borderRadius: 9,
    opacity: 0.6,
  },
  footerText: {
    fontSize: 10.5,
    color: colors.muted,
    fontWeight: "600",
    textAlign: "center",
  },
  footerFine: {
    fontSize: 9.5,
    color: colors.faint,
    textAlign: "center",
    lineHeight: 14,
  },
});
