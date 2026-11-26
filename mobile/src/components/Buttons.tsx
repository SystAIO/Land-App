import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

import { colors, radii, shadow, spacing } from "../constants/theme";

type ButtonVariant =
  | "primary"
  | "dark"
  | "outline"
  | "violet"
  | "soft"
  | "danger"
  | "success";

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
};

const variantStyles: Record<
  ButtonVariant,
  { background: string; text: string; border: string }
> = {
  primary: { background: colors.primary, text: colors.white, border: colors.primary },
  dark: { background: colors.dark, text: colors.white, border: colors.dark },
  outline: { background: colors.white, text: colors.ink, border: colors.line },
  violet: { background: colors.violet, text: colors.white, border: colors.violet },
  soft: { background: colors.primarySoft, text: colors.primary, border: colors.primarySoft },
  danger: { background: colors.dangerSoft, text: colors.danger, border: colors.dangerSoft },
  success: { background: colors.success, text: colors.white, border: colors.success },
};

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  icon,
  style,
  compact = false,
}: PrimaryButtonProps) {
  const palette = variantStyles[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      android_ripple={{ color: "rgba(0,0,0,0.08)" }}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
          opacity: inactive ? 0.55 : pressed ? 0.88 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, { color: palette.text }, compact && styles.labelCompact]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function BackButton({
  onPress,
  dark = false,
  tint,
}: {
  onPress?: () => void;
  dark?: boolean;
  tint?: string;
}) {
  const navigation = useNavigation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={onPress ?? (() => navigation.goBack())}
      hitSlop={8}
      style={({ pressed }) => [
        styles.back,
        {
          backgroundColor: dark ? "rgba(255,255,255,0.16)" : colors.white,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <ArrowLeft size={20} color={tint ?? (dark ? colors.white : colors.ink)} strokeWidth={2.4} />
    </Pressable>
  );
}

export function RoundIconButton({
  icon,
  onPress,
  size = 40,
  tone = "light",
  accessibilityLabel,
  style,
}: {
  icon: React.ReactNode;
  onPress: () => void;
  size?: number;
  tone?: "light" | "dark" | "ghost";
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}) {
  const backgroundColor =
    tone === "dark"
      ? "rgba(24,25,28,0.76)"
      : tone === "ghost"
        ? "rgba(255,255,255,0.18)"
        : colors.white;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.round,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          opacity: pressed ? 0.76 : 1,
        },
        style,
      ]}
    >
      {icon}
    </Pressable>
  );
}

export function HeaderIcon({
  icon,
  onPress,
  label,
  badge,
}: {
  icon: React.ReactNode;
  onPress: () => void;
  label: string;
  badge?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.headerIcon, { opacity: pressed ? 0.7 : 1 }]}
    >
      {icon}
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? "9+" : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function ScreenTopBar({
  title,
  subtitle,
  onBack,
  right,
  dark = false,
  border = true,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  dark?: boolean;
  border?: boolean;
}) {
  return (
    <View style={[styles.topBar, border && styles.topBarBorder]}>
      <View style={styles.topBarLeft}>
        {onBack ? <BackButton onPress={onBack} dark={dark} /> : null}
        <View style={{ flexShrink: 1 }}>
          <Text
            style={[styles.topBarTitle, { color: dark ? colors.white : colors.ink }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.topBarSub, { color: dark ? "#B9B9B9" : colors.muted }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    ...shadow.soft,
  },
  compact: {
    minHeight: 42,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.sm,
  },
  label: {
    fontSize: 15.5,
    fontWeight: "800",
    letterSpacing: 0.1,
  },
  labelCompact: {
    fontSize: 13.5,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  round: {
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "900",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  topBarBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  topBarSub: {
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: "500",
  },
});
