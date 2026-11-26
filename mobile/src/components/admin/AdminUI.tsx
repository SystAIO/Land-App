import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import {
  Check,
  ChevronRight,
  Search,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react-native";

import { PrimaryButton } from "../Buttons";
import { adminGradient } from "../../constants/theme";
import { colors, radii, shadow, spacing } from "../../constants/theme";
import type { Property } from "../../types";

export function AdminShell({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar style="light" />
      <LinearGradient
        colors={adminGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerGlow} />
        <View style={styles.brandRow}>
          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <ShieldCheck size={13} color={colors.gold} strokeWidth={2.4} />
            </View>
            <Text style={styles.brandText}>ADMIN CONSOLE</Text>
          </View>
          {right}
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </LinearGradient>
      <View style={styles.body}>{children}</View>
    </SafeAreaView>
  );
}

export function AdminHeaderButton({
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
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.7 }]}
    >
      {icon}
      {badge ? (
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{badge > 9 ? "9+" : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function AdminMetric({
  icon,
  label,
  value,
  sub,
  tone = "ink",
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: "ink" | "gold" | "success" | "danger" | "violet";
  onPress?: () => void;
}) {
  const palette =
    tone === "gold"
      ? { fg: colors.goldDeep, bg: colors.goldSoft }
      : tone === "success"
        ? { fg: colors.success, bg: colors.successSoft }
        : tone === "danger"
          ? { fg: colors.danger, bg: colors.dangerSoft }
          : tone === "violet"
            ? { fg: colors.violet, bg: colors.violetSoft }
            : { fg: colors.ink, bg: colors.canvas };
  const inner = (
    <>
      <View style={[styles.metricIcon, { backgroundColor: palette.bg }]}>{icon}</View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      {sub ? <Text style={styles.metricSub}>{sub}</Text> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        style={({ pressed }) => [styles.metric, pressed && { opacity: 0.8 }]}
      >
        {inner}
      </Pressable>
    );
  }

  return <View style={styles.metric}>{inner}</View>;
}

export function AdminSectionHeader({
  title,
  sub,
  actionLabel,
  onAction,
}: {
  title: string;
  sub?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {sub ? <Text style={styles.sectionSub}>{sub}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          hitSlop={6}
          style={styles.sectionAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.sectionActionText}>{actionLabel}</Text>
          <ChevronRight size={13} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function AdminSearch({
  value,
  onChangeText,
  placeholder = "Search",
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.search}>
      <Search size={15} color={colors.faint} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        style={styles.searchInput}
        autoCorrect={false}
        returnKeyType="search"
      />
      {value ? (
        <Pressable
          onPress={() => onChangeText("")}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <X size={14} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function AdminFilterChip({
  label,
  count,
  active,
  onPress,
  tone = "neutral",
}: {
  label: string;
  count?: number;
  active?: boolean;
  onPress: () => void;
  tone?: "neutral" | "gold" | "success" | "danger";
}) {
  const activeBg =
    tone === "gold"
      ? colors.gold
      : tone === "success"
        ? colors.success
        : tone === "danger"
          ? colors.danger
          : colors.dark;
  const activeText =
    tone === "gold" ? "#4A3403" : tone === "success" ? colors.white : colors.white;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(active) }}
      accessibilityLabel={`${label}${count !== undefined ? `, ${count}` : ""}`}
      style={[
        styles.chip,
        active ? { backgroundColor: activeBg, borderColor: activeBg } : null,
      ]}
    >
      <Text style={[styles.chipText, active ? { color: activeText } : null]}>{label}</Text>
      {count !== undefined ? (
        <View
          style={[
            styles.chipCount,
            { backgroundColor: active ? "rgba(255,255,255,0.2)" : colors.canvasDeep },
          ]}
        >
          <Text style={[styles.chipCountText, active ? { color: activeText } : null]}>
            {count}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const DECLINE_REASONS = [
  "Photos are unclear or missing",
  "Address doesn’t match the map pin",
  "Price or area needs verification",
  "Property details are incomplete",
  "Looks like a duplicate listing",
];

export function DeclineModal({
  visible,
  property,
  submitting = false,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  property: Property | null;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setNote("");
      setError(null);
    }
  }, [visible]);

  const confirm = () => {
    if (note.trim().length < 5) {
      setError("Add a short reason so the seller knows what to fix.");
      return;
    }
    onConfirm(note.trim());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!submitting) onClose();
      }}
    >
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            if (!submitting) onClose();
          }}
          accessibilityRole="button"
          accessibilityLabel="Close decline dialog"
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetTitleRow}>
            <View style={styles.sheetIcon}>
              <TriangleAlert size={19} color={colors.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>Decline this listing?</Text>
              <Text style={styles.sheetSub} numberOfLines={2}>
                {property?.title ?? "The seller will see your note and can resubmit."}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={18} color={colors.muted} />
            </Pressable>
          </View>

          <Text style={styles.fieldLabel}>WHAT NEEDS FIXING?</Text>
          <View style={styles.reasonWrap}>
            {DECLINE_REASONS.map((reason) => {
              const active = note === reason;
              return (
                <Pressable
                  key={reason}
                  onPress={() => {
                    setNote(reason);
                    setError(null);
                  }}
                  style={[styles.reason, active && styles.reasonActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  {active ? <Check size={11} color={colors.danger} strokeWidth={3} /> : null}
                  <Text style={[styles.reasonText, active && styles.reasonTextActive]}>
                    {reason}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.noteWrap, error ? styles.noteWrapError : null]}>
            <TextInput
              value={note}
              onChangeText={(value) => {
                setNote(value);
                setError(null);
              }}
              placeholder="Explain what the seller should change…"
              placeholderTextColor={colors.faint}
              multiline
              maxLength={300}
              style={styles.noteInput}
              textAlignVertical="top"
            />
            <Text style={styles.noteCount}>{note.length}/300</Text>
          </View>
          {error ? <Text style={styles.noteError}>{error}</Text> : null}

          <View style={styles.sheetActions}>
            <PrimaryButton
              label="Keep listing"
              variant="outline"
              compact
              onPress={onClose}
              disabled={submitting}
              style={{ flex: 0.55 }}
            />
            <PrimaryButton
              label="Decline listing"
              variant="danger"
              compact
              loading={submitting}
              onPress={confirm}
              style={{ flex: 1 }}
            />
          </View>
          <Text style={styles.sheetFine}>
            The listing moves to Declined and the seller can edit and resubmit for free.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function AdminPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "gold" | "success" | "danger" | "info";
}) {
  const palette =
    tone === "gold"
      ? { fg: colors.goldDeep, bg: colors.goldSoft }
      : tone === "success"
        ? { fg: colors.success, bg: colors.successSoft }
        : tone === "danger"
          ? { fg: colors.danger, bg: colors.dangerSoft }
          : tone === "info"
            ? { fg: colors.info, bg: colors.infoSoft }
            : { fg: colors.muted, bg: colors.canvasDeep };
  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <Text style={[styles.pillText, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  headerGlow: {
    position: "absolute",
    right: -55,
    top: -80,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(246,196,106,0.08)",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 40,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandMark: {
    width: 23,
    height: 23,
    borderRadius: 8,
    backgroundColor: "rgba(246,196,106,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: colors.gold,
  },
  title: {
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.9,
    color: colors.white,
    marginTop: 7,
  },
  subtitle: {
    fontSize: 10.5,
    color: "#A4A4AA",
    marginTop: 3,
    lineHeight: 15,
  },
  body: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBadgeText: {
    color: colors.white,
    fontSize: 7.5,
    fontWeight: "900",
  },
  metric: {
    width: "48.5%",
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 12,
    ...shadow.soft,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.7,
    marginTop: 9,
  },
  metricLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    color: colors.muted,
    marginTop: 1,
  },
  metricSub: {
    fontSize: 8,
    color: colors.faint,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: spacing.xxl,
    marginBottom: 9,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.4,
  },
  sectionSub: {
    fontSize: 9.5,
    color: colors.muted,
    marginTop: 2,
  },
  sectionAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.primaryTint,
    borderRadius: radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  sectionActionText: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.primary,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    height: 44,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 11,
  },
  searchInput: {
    flex: 1,
    fontSize: 11.5,
    color: colors.ink,
    fontWeight: "500",
    paddingVertical: 0,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: colors.body,
  },
  chipCount: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  chipCountText: {
    fontSize: 7.5,
    fontWeight: "900",
    color: colors.muted,
  },
  pill: {
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  pillText: {
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(18,18,20,0.55)",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: 8,
    ...shadow.raised,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    marginBottom: 14,
  },
  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  sheetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.4,
  },
  sheetSub: {
    fontSize: 9.5,
    lineHeight: 14,
    color: colors.muted,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: colors.faint,
    marginTop: 16,
    marginBottom: 7,
  },
  reasonWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  reason: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.pill,
    backgroundColor: colors.canvas,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  reasonActive: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  reasonText: {
    fontSize: 8.5,
    fontWeight: "600",
    color: colors.body,
  },
  reasonTextActive: {
    color: colors.danger,
    fontWeight: "800",
  },
  noteWrap: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    backgroundColor: colors.canvas,
    padding: 10,
    marginTop: 10,
  },
  noteWrapError: {
    borderColor: colors.danger,
  },
  noteInput: {
    minHeight: 62,
    maxHeight: 110,
    fontSize: 11,
    color: colors.ink,
    padding: 0,
  },
  noteCount: {
    fontSize: 7.5,
    color: colors.faint,
    textAlign: "right",
    marginTop: 3,
  },
  noteError: {
    fontSize: 9,
    color: colors.danger,
    fontWeight: "600",
    marginTop: 4,
  },
  sheetActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  sheetFine: {
    fontSize: 8,
    lineHeight: 12,
    color: colors.faint,
    textAlign: "center",
    marginTop: 9,
  },
});
