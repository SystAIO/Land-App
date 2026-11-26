import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing } from "../constants/theme";
import { PrimaryButton } from "./Buttons";

export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
  compact = false,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}) {
  return (
    <View style={[styles.wrap, compact && { paddingVertical: spacing.xxl }]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {actionLabel && onAction ? (
        <PrimaryButton
          label={actionLabel}
          onPress={onAction}
          compact
          style={{ marginTop: spacing.lg, minWidth: 160 }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: 56,
    paddingHorizontal: spacing.xxl,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: radii.xl,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.ink,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  body: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
    textAlign: "center",
    maxWidth: 300,
  },
});
