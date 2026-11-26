import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { colors, radii, spacing } from "../constants/theme";

export function MenuRow({
  icon,
  label,
  subtitle,
  value,
  onPress,
  right,
  danger = false,
  last = false,
}: {
  icon?: React.ReactNode;
  label: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
  last?: boolean;
}) {
  const content = (
    <View style={[styles.row, !last && styles.border]}>
      {icon ? <View style={styles.iconBox}>{icon}</View> : null}
      <View style={styles.textWrap}>
        <Text style={[styles.label, danger && { color: colors.danger }]}>{label}</Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {right ?? (onPress ? <ChevronRight size={17} color={colors.faint} /> : null)}
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({ backgroundColor: pressed ? colors.lineSoft : "transparent" })}
    >
      {content}
    </Pressable>
  );
}

export function MenuCard({
  title,
  children,
  accent = colors.primary,
}: {
  title?: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <View style={{ marginTop: spacing.xxl }}>
      {title ? (
        <View style={styles.titleRow}>
          <View style={[styles.accent, { backgroundColor: accent }]} />
          <Text style={styles.title}>{title}</Text>
        </View>
      ) : null}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: 15,
    gap: spacing.md,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  iconBox: {
    width: 30,
    alignItems: "flex-start",
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: 14.5,
    fontWeight: "700",
    color: colors.ink,
  },
  subtitle: {
    fontSize: 11.5,
    color: colors.muted,
    marginTop: 2,
    lineHeight: 16,
  },
  value: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: "600",
    maxWidth: 130,
    textAlign: "right",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  accent: {
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.2,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
});
