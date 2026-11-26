import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing } from "../constants/theme";
import type { PropertyStatus } from "../types";
import { statusPalette } from "../constants/theme";

export function StatusPill({
  status,
  size = "md",
}: {
  status: PropertyStatus;
  size?: "sm" | "md";
}) {
  const palette = statusPalette[status];
  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: palette.bg,
          paddingHorizontal: size === "sm" ? 8 : 10,
          paddingVertical: size === "sm" ? 3 : 5,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: palette.fg }]} />
      <Text
        style={[
          styles.text,
          { color: palette.fg, fontSize: size === "sm" ? 10 : 11 },
        ]}
      >
        {palette.label}
      </Text>
    </View>
  );
}

export function VerifiedPill({ dark = false }: { dark?: boolean }) {
  return (
    <View
      style={[
        styles.verified,
        { backgroundColor: dark ? "rgba(24,25,28,0.82)" : colors.white },
      ]}
    >
      <View style={styles.verifiedDot}>
        <Text style={styles.verifiedTick}>✓</Text>
      </View>
      <Text style={[styles.verifiedText, { color: dark ? colors.white : colors.ink }]}>
        Verified
      </Text>
    </View>
  );
}

export function Chip({
  label,
  active = false,
  onPress,
  icon,
  tone = "neutral",
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  tone?: "neutral" | "red" | "violet" | "dark";
}) {
  const activeBg =
    tone === "violet"
      ? colors.violet
      : tone === "dark"
        ? colors.dark
        : colors.primary;
  const content = (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: active ? activeBg : colors.white,
          borderColor: active ? activeBg : colors.line,
        },
      ]}
    >
      {icon ? <View style={styles.chipIcon}>{icon}</View> : null}
      <Text
        style={[
          styles.chipText,
          { color: active ? colors.white : colors.inkSoft },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
    >
      {content}
    </Pressable>
  );
}

export function MetaChip({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <View style={styles.meta}>
      {icon}
      <Text style={styles.metaText}>{label}</Text>
    </View>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
  actionLabel,
  onAction,
  pad = true,
  center = false,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  pad?: boolean;
  center?: boolean;
}) {
  return (
    <View
      style={[
        styles.section,
        pad && { paddingHorizontal: spacing.lg },
        center && styles.sectionCenter,
      ]}
    >
      <View style={center ? { alignItems: "center" } : { flex: 1 }}>
        <Text style={[styles.sectionTitle, center && { textAlign: "center" }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.sectionSub, center && { textAlign: "center" }]}>{subtitle}</Text>
        ) : null}
      </View>
      {action}
      {!action && actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          hitSlop={8}
          accessibilityRole="button"
          style={center && { alignSelf: "center" }}
        >
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: radii.pill,
    alignSelf: "flex-start",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  text: {
    fontWeight: "800",
    letterSpacing: 0.1,
  },
  verified: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  verifiedDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedTick: {
    color: colors.white,
    fontSize: 8,
    fontWeight: "900",
    lineHeight: 12,
  },
  verifiedText: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.1,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  chipIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: "700",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.canvas,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.xs,
  },
  metaText: {
    fontSize: 11,
    color: colors.body,
    fontWeight: "600",
  },
  section: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  sectionCenter: {
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 3,
    fontWeight: "500",
  },
  sectionAction: {
    color: colors.primary,
    fontSize: 12.5,
    fontWeight: "800",
  },
});
