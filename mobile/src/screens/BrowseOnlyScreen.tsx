import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Compass, ShieldQuestion, Users } from "lucide-react-native";

import { PrimaryButton } from "../components/Buttons";
import { colors, radii, spacing } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import type { AccountRole } from "../types";

/**
 * Shown to "browse" accounts in place of the listing flow — browsers can
 * explore and save properties but cannot create listings until they switch
 * their account type (free, instant, reversible).
 */
export function BrowseOnlyScreen() {
  const { updateProfile } = useAuth();
  const { showToast } = useToast();
  const [switching, setSwitching] = useState<AccountRole | null>(null);

  const upgrade = async (role: AccountRole) => {
    setSwitching(role);
    try {
      await updateProfile({ role });
      showToast(
        role === "owner"
          ? "Switched to an owner account. You can now list your property."
          : "Switched to a broker account. You can now list properties.",
        "success"
      );
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not switch your account type.",
        "error"
      );
    } finally {
      setSwitching(null);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconWrap}>
          <Compass size={44} color={colors.goldDeep} strokeWidth={1.8} />
        </View>
        <Text style={styles.title}>You’re browsing</Text>
        <Text style={styles.subtitle}>
          Browser accounts can explore listings, save favourites and contact sellers directly.
          To publish a property, switch your account type — it’s free and takes a second.
        </Text>

        <View style={styles.switchCard}>
          <View style={styles.switchCardHeader}>
            <ShieldQuestion size={16} color={colors.violet} strokeWidth={2.2} />
            <Text style={styles.switchCardTitle}>Switch to start listing</Text>
          </View>
          <Text style={styles.switchCardBody}>
            Your name, phone number and saved properties carry over. You can switch back to a
            browser account any time from your profile.
          </Text>
        </View>

        <View style={styles.buttons}>
          <PrimaryButton
            label="Switch to Owner"
            onPress={() => upgrade("owner")}
            loading={switching === "owner"}
          />
          <Pressable
            onPress={() => upgrade("broker")}
            disabled={switching !== null}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.outlineButton,
              pressed && { opacity: 0.85 },
              switching !== null && { opacity: 0.6 },
            ]}
          >
            {switching === "broker" ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <View style={styles.brokerRow}>
                <Users size={16} color={colors.primary} strokeWidth={2.2} />
                <Text style={styles.outlineText}>Switch to Broker</Text>
              </View>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: 72,
    paddingBottom: 40,
    alignItems: "center",
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.goldSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.8,
    marginTop: 18,
  },
  subtitle: {
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.muted,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 340,
  },
  switchCard: {
    alignSelf: "stretch",
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: 14,
    marginTop: 22,
    gap: 6,
  },
  switchCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  switchCardTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: colors.ink,
  },
  switchCardBody: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.muted,
  },
  buttons: {
    alignSelf: "stretch",
    gap: 10,
    marginTop: 22,
  },
  outlineButton: {
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  brokerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  outlineText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
  },
});
