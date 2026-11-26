import { MAP_PROVIDER } from "../constants/mapStyle";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Location from "expo-location";
import MapView, { Marker, Polygon, Polyline } from "react-native-maps";
import {
  Check,
  Compass,
  LocateFixed,
  MapPin,
  Pentagon,
  Satellite,
  Search,
  Undo2,
  X,
} from "lucide-react-native";

import { colors, radii, shadow, spacing } from "../constants/theme";
import type { LatLng } from "../types";

export type PickedPlace = {
  address?: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

const DIRECTIONS = [
  { key: "N", label: "North", bearing: 0 },
  { key: "NE", label: "Northeast", bearing: 45 },
  { key: "E", label: "East", bearing: 90 },
  { key: "SE", label: "Southeast", bearing: 135 },
  { key: "S", label: "South", bearing: 180 },
  { key: "SW", label: "Southwest", bearing: 225 },
  { key: "W", label: "West", bearing: 270 },
  { key: "NW", label: "Northwest", bearing: 315 },
] as const;

type DirectionKey = (typeof DIRECTIONS)[number]["key"];

const EMPTY_EXTENTS: Record<DirectionKey, string> = {
  N: "",
  NE: "",
  E: "",
  SE: "",
  S: "",
  SW: "",
  W: "",
  NW: "",
};

const EARTH_RADIUS_M = 6378137;
const EARTH_METERS_PER_LAT = 111320;

/** Point at `distanceM` metres from (lat, lng) along `bearingDeg`. */
function destinationPoint(
  lat: number,
  lng: number,
  bearingDeg: number,
  distanceM: number
): LatLng {
  const delta = distanceM / EARTH_RADIUS_M;
  const brng = (bearingDeg * Math.PI) / 180;
  const phi1 = (lat * Math.PI) / 180;
  const lambda1 = (lng * Math.PI) / 180;
  const phi2 = Math.asin(
    Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(brng)
  );
  const lambda2 =
    lambda1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(delta) * Math.cos(phi1),
      Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2)
    );
  return { latitude: (phi2 * 180) / Math.PI, longitude: (lambda2 * 180) / Math.PI };
}

/** Approximate boundary area (shoelace formula, equirectangular projection). */
function boundaryAreaM2(points: LatLng[]): number {
  if (points.length < 3) return 0;
  const originLat =
    points.reduce((sum, point) => sum + point.latitude, 0) / points.length;
  const cosLat = Math.cos((originLat * Math.PI) / 180);
  const originLng = points[0].longitude;
  const projected = points.map((point) => ({
    x: (point.longitude - originLng) * cosLat * EARTH_METERS_PER_LAT,
    y: point.latitude * EARTH_METERS_PER_LAT,
  }));
  let twice = 0;
  for (let i = 0; i < projected.length; i += 1) {
    const current = projected[i];
    const next = projected[(i + 1) % projected.length];
    twice += current.x * next.y - next.x * current.y;
  }
  return Math.abs(twice) / 2;
}

function sanitizeExtent(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const dot = cleaned.indexOf(".");
  if (dot === -1) return cleaned;
  return `${cleaned.slice(0, dot + 1)}${cleaned.slice(dot + 1).replace(/\./g, "")}`;
}

type NominatimAddress = {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  village?: string;
  town?: string;
  city?: string;
  city_district?: string;
  county?: string;
  state?: string;
  postcode?: string;
};

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
};

type Props = {
  latitude: number | null;
  longitude: number | null;
  boundary: LatLng[];
  defaultCenter: LatLng;
  onPinChange: (latitude: number, longitude: number, place?: PickedPlace) => void;
  onBoundaryChange: (points: LatLng[]) => void;
};

export function LocationPicker({
  latitude,
  longitude,
  boundary,
  defaultCenter,
  onPinChange,
  onBoundaryChange,
}: Props) {
  const mapRef = useRef<MapView | null>(null);
  const [mode, setMode] = useState<"pin" | "boundary" | "measure">("pin");
  const [satellite, setSatellite] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [extents, setExtents] = useState<Record<DirectionKey, string>>({ ...EMPTY_EXTENTS });

  const hasPin = latitude !== null && longitude !== null;
  const region = useMemo(
    () => ({
      latitude: latitude ?? defaultCenter.latitude,
      longitude: longitude ?? defaultCenter.longitude,
      latitudeDelta: 0.03,
      longitudeDelta: 0.03,
    }),
    [defaultCenter.latitude, defaultCenter.longitude, latitude, longitude]
  );

  const extentPoints = useMemo(() => {
    if (!hasPin) return [] as LatLng[];
    const points: LatLng[] = [];
    for (const direction of DIRECTIONS) {
      const raw = extents[direction.key].trim();
      if (!raw) continue;
      const distance = Number(raw);
      if (!Number.isFinite(distance) || distance <= 0) continue;
      points.push(
        destinationPoint(latitude as number, longitude as number, direction.bearing, distance)
      );
    }
    return points;
  }, [extents, hasPin, latitude, longitude]);

  // In measure mode the extents drive the actual boundary automatically.
  const onBoundaryChangeRef = useRef(onBoundaryChange);
  onBoundaryChangeRef.current = onBoundaryChange;
  useEffect(() => {
    if (mode !== "measure") return;
    onBoundaryChangeRef.current(extentPoints.length >= 3 ? extentPoints : []);
  }, [mode, extentPoints]);

  const boundaryArea = useMemo(() => boundaryAreaM2(boundary), [boundary]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const addresses = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const entry = addresses[0];
      if (!entry) return;
      const street = [entry.streetNumber, entry.street, entry.name]
        .filter(Boolean)
        .join(", ");
      const locality = entry.district ?? entry.subregion ?? entry.name ?? "";
      onPinChange(lat, lng, {
        address: street || entry.name || entry.district || "",
        locality,
        city: entry.city ?? entry.subregion ?? entry.district ?? "",
        state: entry.region ?? "",
        pincode: entry.postalCode ?? "",
      });
    } catch {
      setNotice("We couldn’t fetch the address for this pin. You can type it below.");
    }
  };

  const setPin = (lat: number, lng: number, focus = false) => {
    setNotice(null);
    onPinChange(lat, lng);
    if (focus) {
      mapRef.current?.animateToRegion(
        { latitude: lat, longitude: lng, latitudeDelta: 0.012, longitudeDelta: 0.012 },
        300
      );
    }
    void reverseGeocode(lat, lng);
  };

  const mapTapped = (lat: number, lng: number) => {
    if (mode === "boundary") {
      onBoundaryChange([...boundary, { latitude: lat, longitude: lng }]);
      return;
    }
    setPin(lat, lng);
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    setNotice(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setNotice("Location permission was denied. Tap the map to place your pin instead.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (mode === "boundary") setMode("pin");
      setPin(position.coords.latitude, position.coords.longitude, true);
    } catch {
      setNotice("Could not get your current location. Tap the map to place your pin.");
    } finally {
      setLocating(false);
    }
  };

  const searchPlace = async () => {
    const term = query.trim();
    if (!term) {
      setNotice("Type a locality, landmark or city to search.");
      return;
    }
    setSearching(true);
    setNotice(null);
    setResults([]);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=in&limit=5&q=${encodeURIComponent(
          term
        )}`,
        { headers: { "Accept-Language": "en" } }
      );
      if (!response.ok) throw new Error("Search failed");
      const data = (await response.json()) as NominatimResult[];
      if (!data.length) {
        setNotice("No places matched. Try a nearby landmark or pin the map manually.");
      }
      setResults(data);
    } catch {
      setNotice("Place search is unavailable right now. Tap the map to pin your property.");
    } finally {
      setSearching(false);
    }
  };

  const chooseResult = (result: NominatimResult) => {
    const lat = Number(result.lat);
    const lng = Number(result.lon);
    const address = result.address ?? {};
    const street = [address.house_number, address.road, address.neighbourhood]
      .filter(Boolean)
      .join(", ");
    const locality =
      address.suburb ??
      address.neighbourhood ??
      address.village ??
      address.town ??
      address.city_district ??
      address.city ??
      "";
    const city = address.city ?? address.town ?? address.village ?? address.county ?? "";
    setQuery(result.display_name.split(",").slice(0, 2).join(", "));
    setResults([]);
    setNotice(null);
    onPinChange(lat, lng, {
      address:
        street ||
        result.display_name
          .split(",")
          .slice(0, 2)
          .join(", "),
      locality,
      city,
      state: address.state ?? "",
      pincode: address.postcode ?? "",
    });
    mapRef.current?.animateToRegion(
      { latitude: lat, longitude: lng, latitudeDelta: 0.012, longitudeDelta: 0.012 },
      320
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.mapBox}>
        <MapView
provider={MAP_PROVIDER}
                  ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          mapType={satellite ? "satellite" : "standard"}
          toolbarEnabled={false}
          showsCompass={false}
          showsMyLocationButton={false}
          showsUserLocation={false}
          onPress={(event) => {
            const coordinate = event.nativeEvent.coordinate;
            mapTapped(coordinate.latitude, coordinate.longitude);
          }}
        >
          {hasPin ? (
            <Marker
              coordinate={{ latitude: latitude as number, longitude: longitude as number }}
              draggable={mode === "pin"}
              onDragEnd={(event) => {
                const coordinate = event.nativeEvent.coordinate;
                setPin(coordinate.latitude, coordinate.longitude);
              }}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges
            >
              <View style={styles.pin}>
                <MapPin size={20} color={colors.white} strokeWidth={2.5} />
              </View>
              <View style={styles.pinTip} />
            </Marker>
          ) : null}
          {boundary.length >= 3 ? (
            <Polygon
              coordinates={boundary}
              strokeColor="transparent"
              strokeWidth={0}
              fillColor="rgba(23,58,94,0.14)"
            />
          ) : null}
          {boundary.length >= 2 ? (
            <Polyline
              coordinates={[...boundary, boundary[0]]}
              strokeColor={colors.primary}
              strokeWidth={2.5}
              lineDashPattern={[9, 7]}
            />
          ) : null}
          {mode !== "pin"
            ? boundary.map((point, index) => (
                <Marker
                  key={index}
                  coordinate={point}
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges={false}
                >
                  <View style={styles.cornerDot} />
                </Marker>
              ))
            : null}
        </MapView>

        <View style={styles.searchArea}>
          <View style={styles.searchWrap}>
            <Search size={16} color={colors.faint} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search a locality or landmark"
              placeholderTextColor={colors.faint}
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={searchPlace}
              autoCorrect={false}
            />
            {query ? (
              <Pressable
                onPress={() => {
                  setQuery("");
                  setResults([]);
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Clear place search"
              >
                <X size={15} color={colors.muted} />
              </Pressable>
            ) : null}
            <Pressable
              onPress={searchPlace}
              style={styles.searchButton}
              accessibilityRole="button"
              accessibilityLabel="Search place"
            >
              {searching ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Search size={14} color={colors.white} strokeWidth={2.5} />
              )}
            </Pressable>
          </View>

          {results.length ? (
            <View style={styles.results}>
              {results.map((result, index) => (
                <Pressable
                  key={`${result.lat}-${result.lon}-${index}`}
                  onPress={() => chooseResult(result)}
                  style={[
                    styles.resultRow,
                    index === results.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Use ${result.display_name}`}
                >
                  <View style={styles.resultIcon}>
                    <MapPin size={13} color={colors.primary} />
                  </View>
                  <Text style={styles.resultText} numberOfLines={2}>
                    {result.display_name}
                  </Text>
                </Pressable>
              ))}
              <Text style={styles.attribution}>Search by OpenStreetMap</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.mapControls}>
          <Pressable
            onPress={useCurrentLocation}
            style={styles.mapControl}
            accessibilityRole="button"
            accessibilityLabel="Use my current location"
          >
            {locating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <LocateFixed size={18} color={colors.ink} strokeWidth={2.1} />
            )}
          </Pressable>
          <Pressable
            onPress={() => setSatellite((current) => !current)}
            style={styles.mapControl}
            accessibilityRole="button"
            accessibilityLabel="Toggle satellite view"
          >
            <Satellite size={18} color={satellite ? colors.primary : colors.ink} strokeWidth={2.1} />
          </Pressable>
        </View>

        <View style={styles.modeRow}>
          <Pressable
            onPress={() => setMode("pin")}
            style={[styles.modeButton, mode === "pin" && styles.modeButtonActive]}
            accessibilityRole="button"
            accessibilityLabel="Place property pin"
          >
            <MapPin size={13} color={mode === "pin" ? colors.white : colors.ink} />
            <Text style={[styles.modeText, mode === "pin" && styles.modeTextActive]}>
              Place pin
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("boundary")}
            style={[styles.modeButton, mode === "boundary" && styles.modeButtonActive]}
            accessibilityRole="button"
            accessibilityLabel="Draw plot boundary"
          >
            <Pentagon size={13} color={mode === "boundary" ? colors.white : colors.ink} />
            <Text style={[styles.modeText, mode === "boundary" && styles.modeTextActive]}>
              Boundary
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("measure")}
            style={[styles.modeButton, mode === "measure" && styles.modeButtonActive]}
            accessibilityRole="button"
            accessibilityLabel="Measure plot extents"
          >
            <Compass size={13} color={mode === "measure" ? colors.white : colors.ink} />
            <Text style={[styles.modeText, mode === "measure" && styles.modeTextActive]}>
              Measure
            </Text>
          </Pressable>
        </View>

        {mode === "boundary" ? (
          <View style={styles.boundaryPanel}>
            <View style={{ flex: 1 }}>
              <Text style={styles.boundaryTitle}>
                {boundary.length < 3
                  ? `Add ${3 - boundary.length} more corner${boundary.length === 2 ? "" : "s"}`
                  : `${boundary.length} corners marked`}
              </Text>
              <Text style={styles.boundaryHint}>
                Tap the map at each plot corner. This outline is optional.
              </Text>
            </View>
            {boundary.length ? (
              <>
                <Pressable
                  onPress={() => onBoundaryChange(boundary.slice(0, -1))}
                  style={styles.smallButton}
                  accessibilityRole="button"
                  accessibilityLabel="Undo boundary point"
                >
                  <Undo2 size={13} color={colors.ink} />
                </Pressable>
                <Pressable
                  onPress={() => onBoundaryChange([])}
                  style={styles.smallButton}
                  accessibilityRole="button"
                  accessibilityLabel="Clear boundary"
                >
                  <X size={13} color={colors.danger} />
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={() => setMode("pin")}
                style={styles.smallButton}
                accessibilityRole="button"
                accessibilityLabel="Finish boundary"
              >
                <Check size={14} color={colors.success} />
              </Pressable>
            )}
          </View>
        ) : mode === "measure" ? (
          <View style={styles.measurePanel}>
            <View style={styles.measureHeader}>
              <Text style={styles.boundaryTitle}>Measure from the pin</Text>
              {DIRECTIONS.some((direction) => extents[direction.key].trim()) ? (
                <Pressable
                  onPress={() => setExtents({ ...EMPTY_EXTENTS })}
                  style={styles.smallButton}
                  accessibilityRole="button"
                  accessibilityLabel="Clear measurements"
                >
                  <X size={13} color={colors.danger} />
                </Pressable>
              ) : null}
            </View>
            <Text style={styles.boundaryHint}>
              How far does the plot extend from the pin, in metres? The dotted outline appears
              on the map as you type.
            </Text>
            {!hasPin ? (
              <Text style={styles.measureWarn}>
                Place a pin first (tap the map or the locate button), then type the distances.
              </Text>
            ) : null}
            <View style={styles.extentGrid}>
              {DIRECTIONS.map((direction) => (
                <View key={direction.key} style={styles.extentCell}>
                  <Text style={styles.extentLabel}>{direction.key}</Text>
                  <TextInput
                    value={extents[direction.key]}
                    onChangeText={(text) =>
                      setExtents((current) => ({
                        ...current,
                        [direction.key]: sanitizeExtent(text),
                      }))
                    }
                    placeholder="0"
                    placeholderTextColor={colors.faint}
                    keyboardType="decimal-pad"
                    editable={hasPin}
                    style={[
                      styles.extentInput,
                      !hasPin && { backgroundColor: colors.lineSoft, color: colors.faint },
                    ]}
                    accessibilityLabel={`Extent toward ${direction.label} in metres`}
                  />
                </View>
              ))}
            </View>
            <Text style={styles.measureMeta}>
              {boundary.length >= 3
                ? `${boundary.length} corners · ≈ ${Math.round(boundaryArea).toLocaleString()} m² · ${(
                    boundaryArea / 4046.86
                  ).toFixed(2)} acres`
                : "Enter at least three directions to draw the dotted outline"}
            </Text>
          </View>
        ) : (
          <View style={styles.hintPill} pointerEvents="none">
            <Text style={styles.hintText}>
              {hasPin ? "Drag the pin for an exact location" : "Tap the map to place your pin"}
            </Text>
          </View>
        )}
      </View>

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  mapBox: {
    height: 356,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.canvasDeep,
    borderWidth: 1,
    borderColor: colors.line,
  },
  searchArea: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 10,
    zIndex: 20,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    paddingLeft: 11,
    paddingRight: 4,
    height: 46,
    ...shadow.raised,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: colors.ink,
    fontWeight: "500",
    paddingVertical: 0,
  },
  searchButton: {
    width: 38,
    height: 38,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  results: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    marginTop: 6,
    overflow: "hidden",
    paddingBottom: 4,
    ...shadow.raised,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  resultIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  resultText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 14,
    color: colors.body,
    fontWeight: "500",
  },
  attribution: {
    fontSize: 8,
    color: colors.faint,
    textAlign: "right",
    paddingRight: 9,
    paddingTop: 3,
  },
  mapControls: {
    position: "absolute",
    right: 10,
    top: 66,
    gap: 8,
    zIndex: 10,
  },
  mapControl: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.raised,
  },
  modeRow: {
    position: "absolute",
    left: 10,
    bottom: 10,
    flexDirection: "row",
    gap: 6,
    zIndex: 10,
  },
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
    ...shadow.soft,
  },
  modeButtonActive: {
    backgroundColor: colors.dark,
  },
  modeText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: colors.ink,
  },
  modeTextActive: {
    color: colors.white,
  },
  hintPill: {
    position: "absolute",
    right: 10,
    bottom: 12,
    backgroundColor: "rgba(24,25,28,0.72)",
    borderRadius: radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 6,
    maxWidth: 190,
  },
  hintText: {
    fontSize: 8.5,
    fontWeight: "600",
    color: colors.white,
  },
  boundaryPanel: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    paddingHorizontal: 10,
    paddingVertical: 9,
    zIndex: 10,
    ...shadow.raised,
  },
  measurePanel: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 56,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 6,
    zIndex: 10,
    ...shadow.raised,
  },
  measureHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  measureWarn: {
    fontSize: 8.5,
    lineHeight: 12,
    fontWeight: "700",
    color: colors.warning,
    backgroundColor: colors.warningSoft,
    borderRadius: radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  extentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  extentCell: {
    width: "23%",
    gap: 2,
  },
  extentLabel: {
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.4,
    color: colors.faint,
    textAlign: "center",
  },
  extentInput: {
    height: 34,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    fontSize: 12,
    fontWeight: "700",
    color: colors.ink,
    textAlign: "center",
    paddingHorizontal: 2,
  },
  measureMeta: {
    fontSize: 8.5,
    lineHeight: 13,
    fontWeight: "700",
    color: colors.primary,
    backgroundColor: colors.primaryTint,
    borderRadius: radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
    textAlign: "center",
  },
  cornerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
  },
  boundaryTitle: {
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.ink,
  },
  boundaryHint: {
    fontSize: 8.5,
    color: colors.muted,
    marginTop: 1,
  },
  smallButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  pin: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  pinTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.primary,
    marginTop: -2,
  },
  notice: {
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.warning,
    fontWeight: "600",
    backgroundColor: colors.warningSoft,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
