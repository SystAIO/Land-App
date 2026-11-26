import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { colors } from "../constants/theme";

export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <Image
      source={require("../../assets/icon.png")}
      style={{ width: size, height: size, borderRadius: size * 0.3 }}
      resizeMode="cover"
      accessibilityIgnoresInvertColors
    />
  );
}

export function BrandLockup({
  size = 40,
  dark = false,
  showTagline = false,
}: {
  size?: number;
  dark?: boolean;
  showTagline?: boolean;
}) {
  return (
    <View style={styles.lockup}>
      <BrandMark size={size} />
      <View style={styles.lockupText}>
        <Text style={[styles.wordmark, { color: dark ? colors.white : colors.ink }]}>
          SystIO <Text style={styles.wordmarkAccent}>Land</Text>
        </Text>
        {showTagline ? (
          <Text style={[styles.tagline, { color: dark ? "#B8B8B8" : colors.muted }]}>
            Find the ground you grow on
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lockup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  lockupText: {
    justifyContent: "center",
  },
  wordmark: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  wordmarkAccent: {
    color: colors.primary,
  },
  tagline: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
    letterSpacing: 0.15,
  },
});
