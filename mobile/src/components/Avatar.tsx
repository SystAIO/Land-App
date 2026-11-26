import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { colors } from "../constants/theme";
import { initials } from "../utils/format";
import type { UserRole } from "../types";

export function Avatar({
  name,
  size = 48,
  role = "owner",
  tone,
}: {
  name: string;
  size?: number;
  role?: UserRole | "neutral";
  tone?: "gold" | "violet" | "neutral";
}) {
  const palette =
    tone === "gold"
      ? (["#FFE3A8", "#F6C46A"] as const)
      : tone === "violet"
        ? (["#9B8CFF", "#6C5CE7"] as const)
        : role === "broker"
          ? (["#C9C2F5", "#6C5CE7"] as const)
          : role === "browse"
            ? (["#D8E7F5", "#8FB6DC"] as const)
            : (["#C5EBD6", "#8DD3AE"] as const);
  const textColor = tone === "gold" ? colors.goldDeep : colors.white;
  return (
    <LinearGradient
      colors={palette}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: textColor,
          fontSize: size * 0.34,
          fontWeight: "900",
          letterSpacing: -0.5,
        }}
      >
        {initials(name)}
      </Text>
    </LinearGradient>
  );
}

export function AvatarWithBadge({
  name,
  size = 48,
  badge,
}: {
  name: string;
  size?: number;
  badge?: React.ReactNode;
}) {
  return (
    <View style={{ width: size, height: size }}>
      <Avatar name={name} size={size} tone="gold" />
      {badge ? <View style={styles.badge}>{badge}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    right: -4,
    bottom: -4,
  },
});
