import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowUpDown, Check, RotateCcw, X } from "lucide-react-native";

import { PROPERTY_TYPES } from "../constants/catalog";
import {
  DEFAULT_FILTERS,
  RENT_PRICE_BANDS,
  SALE_PRICE_BANDS,
  type BrowseFilters,
} from "../constants/filters";
import { colors, radii, spacing } from "../constants/theme";
import type { ListingType, PropertyType } from "../types";
import { PrimaryButton } from "./Buttons";

const SORTS: { id: BrowseFilters["sort"]; label: string }[] = [
  { id: "newest", label: "Newest first" },
  { id: "price_low", label: "Price: low to high" },
  { id: "price_high", label: "Price: high to low" },
  { id: "area_high", label: "Largest area" },
];

export function FilterSheet({
  visible,
  filters,
  onApply,
  onClose,
}: {
  visible: boolean;
  filters: BrowseFilters;
  onApply: (filters: BrowseFilters) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<BrowseFilters>(filters);

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [filters, visible]);

  const bands = draft.listingType === "rent" ? RENT_PRICE_BANDS : SALE_PRICE_BANDS;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) + 10 }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Filters</Text>
              <Text style={styles.subtitle}>Refine your property search</Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close filters"
              style={styles.close}
            >
              <X size={18} color={colors.ink} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 18 }}>
            <Text style={styles.label}>I am looking to</Text>
            <View style={styles.segment}>
              {(
                [
                  { id: "all", label: "Buy or rent" },
                  { id: "sale", label: "Buy" },
                  { id: "rent", label: "Rent" },
                ] as { id: ListingType | "all"; label: string }[]
              ).map((entry) => {
                const active = draft.listingType === entry.id;
                return (
                  <Pressable
                    key={entry.id}
                    onPress={() =>
                      setDraft((current) => ({
                        ...current,
                        listingType: entry.id,
                        maxPrice: entry.id === current.listingType ? current.maxPrice : null,
                      }))
                    }
                    style={[styles.segmentItem, active && styles.segmentActive]}
                  >
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                      {entry.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Property type</Text>
            <View style={styles.chipWrap}>
              <Pressable
                onPress={() => setDraft((current) => ({ ...current, propertyType: "all" }))}
                style={[styles.chip, draft.propertyType === "all" && styles.chipActive]}
              >
                <Text
                  style={[
                    styles.chipText,
                    draft.propertyType === "all" && styles.chipTextActive,
                  ]}
                >
                  All types
                </Text>
              </Pressable>
              {PROPERTY_TYPES.map((entry) => {
                const active = draft.propertyType === entry.id;
                return (
                  <Pressable
                    key={entry.id}
                    onPress={() =>
                      setDraft((current) => ({
                        ...current,
                        propertyType: entry.id as PropertyType,
                      }))
                    }
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {entry.short}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Budget</Text>
            <View style={styles.chipWrap}>
              {bands.map((band) => {
                const active = draft.maxPrice === band.max;
                return (
                  <Pressable
                    key={band.label}
                    onPress={() =>
                      setDraft((current) => ({ ...current, maxPrice: band.max }))
                    }
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {band.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.sortHeader}>
              <ArrowUpDown size={14} color={colors.muted} />
              <Text style={styles.labelInline}>Sort by</Text>
            </View>
            <View style={styles.sortList}>
              {SORTS.map((sort) => {
                const active = draft.sort === sort.id;
                return (
                  <Pressable
                    key={sort.id}
                    onPress={() => setDraft((current) => ({ ...current, sort: sort.id }))}
                    style={styles.sortRow}
                  >
                    <Text style={[styles.sortText, active && styles.sortTextActive]}>
                      {sort.label}
                    </Text>
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active ? <Check size={11} color={colors.white} strokeWidth={3} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={() => setDraft({ ...DEFAULT_FILTERS })}
              style={styles.reset}
              accessibilityRole="button"
            >
              <RotateCcw size={14} color={colors.body} />
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>
            <PrimaryButton
              label="Show properties"
              onPress={() => {
                onApply(draft);
                onClose();
              }}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    maxHeight: "88%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 3,
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.lineSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.ink,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  labelInline: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.ink,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.canvas,
    borderRadius: radii.md,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radii.sm,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: colors.ink,
    fontWeight: "800",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 13,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.body,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: "800",
  },
  sortHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },
  sortList: {
    marginTop: 2,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  sortText: {
    fontSize: 13,
    color: colors.body,
    fontWeight: "500",
  },
  sortTextActive: {
    color: colors.ink,
    fontWeight: "800",
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    paddingTop: spacing.md,
  },
  reset: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  resetText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.body,
  },
});
