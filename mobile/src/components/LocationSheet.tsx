import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, MapPin, X } from "lucide-react-native";

import { CITIES } from "../constants/catalog";
import { colors, radii, spacing } from "../constants/theme";

export function LocationSheet({
  visible,
  selectedCity,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selectedCity: string;
  onSelect: (city: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
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
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Choose your city</Text>
              <Text style={styles.subtitle}>See properties around you</Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close city picker"
              style={styles.close}
            >
              <X size={18} color={colors.ink} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
            <Pressable
              onPress={() => {
                onSelect("All cities");
                onClose();
              }}
              style={styles.row}
            >
              <View style={styles.icon}>
                <MapPin size={17} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.city}>All cities</Text>
                <Text style={styles.state}>Browse every approved listing</Text>
              </View>
              {selectedCity === "All cities" ? (
                <View style={styles.check}>
                  <Check size={13} color={colors.white} strokeWidth={3} />
                </View>
              ) : null}
            </Pressable>
            {CITIES.map((entry) => {
              const active = selectedCity === entry.city;
              return (
                <Pressable
                  key={entry.city}
                  onPress={() => {
                    onSelect(entry.city);
                    onClose();
                  }}
                  style={styles.row}
                >
                  <View style={styles.icon}>
                    <MapPin
                      size={17}
                      color={active ? colors.primary : colors.body}
                      strokeWidth={2.2}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.city}>{entry.city}</Text>
                    <Text style={styles.state}>{entry.state}</Text>
                  </View>
                  {active ? (
                    <View style={styles.check}>
                      <Check size={13} color={colors.white} strokeWidth={3} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
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
    maxHeight: "82%",
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
    marginBottom: spacing.md,
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  city: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  state: {
    fontSize: 11.5,
    color: colors.muted,
    marginTop: 1,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
