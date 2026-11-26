import { MAP_PROVIDER } from "../constants/mapStyle";
import React, { useMemo, useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, Polygon, Polyline } from "react-native-maps";
import { ExternalLink, Satellite } from "lucide-react-native";

import { colors, radii, shadow, spacing } from "../constants/theme";
import type { Property } from "../types";

export function PropertyMap({
  property,
  height = 210,
  interactive = false,
  showOpenMaps = true,
}: {
  property: Property;
  height?: number;
  interactive?: boolean;
  showOpenMaps?: boolean;
}) {
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");

  const region = useMemo(
    () => ({
      latitude: property.latitude,
      longitude: property.longitude,
      latitudeDelta: property.boundary.length >= 3 ? 0.007 : 0.012,
      longitudeDelta: property.boundary.length >= 3 ? 0.007 : 0.012,
    }),
    [property.boundary.length, property.latitude, property.longitude]
  );

  const openInMaps = () => {
    const label = encodeURIComponent(property.title);
    const url =
      Platform.OS === "ios"
        ? `maps:0,0?q=${label}@${property.latitude},${property.longitude}`
        : `geo:${property.latitude},${property.longitude}?q=${property.latitude},${property.longitude}(${label})`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`
      );
    });
  };

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
provider={MAP_PROVIDER}
                style={StyleSheet.absoluteFill}
        initialRegion={region}
        mapType={mapType}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {property.boundary.length >= 3 ? (
          <Polygon
            coordinates={property.boundary}
            strokeColor="transparent"
            strokeWidth={0}
            fillColor="rgba(23, 58, 94, 0.15)"
          />
        ) : null}
        {property.boundary.length >= 2 ? (
          <Polyline
            coordinates={[...property.boundary, property.boundary[0]]}
            strokeColor={colors.primary}
            strokeWidth={2.5}
            lineDashPattern={[9, 7]}
          />
        ) : null}
        <Marker
          coordinate={{
            latitude: property.latitude,
            longitude: property.longitude,
          }}
          title={property.title}
          description={`${property.locality}, ${property.city}`}
        />
      </MapView>

      <View style={styles.topRight} pointerEvents="box-none">
        <Pressable
          onPress={() =>
            setMapType((current) => (current === "standard" ? "satellite" : "standard"))
          }
          style={styles.mapButton}
          accessibilityRole="button"
          accessibilityLabel="Toggle satellite view"
        >
          <Satellite size={14} color={colors.ink} strokeWidth={2.2} />
          <Text style={styles.mapButtonText}>
            {mapType === "standard" ? "Satellite" : "Map"}
          </Text>
        </Pressable>
      </View>

      {showOpenMaps ? (
        <Pressable
          onPress={openInMaps}
          style={styles.openButton}
          accessibilityRole="button"
          accessibilityLabel="Open location in Google Maps"
        >
          <ExternalLink size={13} color={colors.ink} strokeWidth={2.2} />
          <Text style={styles.openText}>Open in Maps</Text>
        </Pressable>
      ) : null}

      {property.boundary.length >= 3 ? (
        <View style={styles.boundaryBadge} pointerEvents="none">
          <Text style={styles.boundaryText}>PLOT BOUNDARY</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.canvasDeep,
    borderWidth: 1,
    borderColor: colors.line,
  },
  topRight: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radii.pill,
    ...shadow.soft,
  },
  mapButtonText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.ink,
  },
  openButton: {
    position: "absolute",
    right: 10,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.96)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radii.pill,
    ...shadow.soft,
  },
  openText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.ink,
  },
  boundaryBadge: {
    position: "absolute",
    left: 10,
    top: 10,
    backgroundColor: "rgba(24,25,28,0.82)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radii.xs,
  },
  boundaryText: {
    color: colors.white,
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
