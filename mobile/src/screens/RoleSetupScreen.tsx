import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Check, Compass, Home, Sparkles, Users } from "lucide-react-native";

import { PrimaryButton } from "../components/Buttons";
import { TextField } from "../components/Form";
import { colors, radii, spacing } from "../constants/theme";
import type { AuthStackParamList } from "../navigation/types";
import type { AccountRole } from "../types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatPhone } from "../utils/format";

type Props = NativeStackScreenProps<AuthStackParamList, "RoleSetup">;

const ROLES: {
  id: AccountRole;
  title: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "owner",
    title: "I’m an owner",
    description: "The property is mine. I want to sell or rent it directly.",
    icon: <Home size={21} color={colors.primary} strokeWidth={2.1} />,
  },
  {
    id: "broker",
    title: "I’m a broker",
    description: "I list properties on behalf of owners and handle enquiries.",
    icon: <Users size={21} color={colors.violet} strokeWidth={2.1} />,
  },
  {
    id: "browse",
    title: "I’m here to browse",
    description:
      "I’m looking to buy or rent. I just want to explore listings and save favourites.",
    icon: <Compass size={21} color={colors.goldDeep} strokeWidth={2.1} />,
  },
];

export function RoleSetupScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { saveProfile, pendingPhone, signOut, isDemo } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [role, setRole] = useState<AccountRole>("owner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await saveProfile({ name, role });
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Could not save your profile.";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepPill}>
          <Text style={styles.stepText}>ONE LAST STEP</Text>
        </View>
        <Text style={styles.title}>Tell us about you</Text>
        <Text style={styles.subtitle}>
          Pick how you’ll use SystIO Land. You can switch between Owner, Broker and Browser
          any time from your profile.
        </Text>

        {pendingPhone ? (
          <View style={styles.phoneLine}>
            <Text style={styles.phoneMuted}>Verified number</Text>
            <Text style={styles.phoneValue}>+91 {formatPhone(pendingPhone)}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <TextField
            label="Full name"
            placeholder="e.g. Priya Sharma"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError(null);
            }}
            autoCapitalize="words"
            autoFocus
            error={error}
          />

          <View style={{ gap: 10 }}>
            <Text style={styles.sectionLabel}>Your account type</Text>
            {ROLES.map((entry) => {
              const active = role === entry.id;
              const iconBg =
                entry.id === "broker"
                  ? colors.violetSoft
                  : entry.id === "browse"
                    ? colors.goldSoft
                    : colors.primarySoft;
              return (
                <Pressable
                  key={entry.id}
                  onPress={() => setRole(entry.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={[styles.roleCard, active && styles.roleCardActive]}
                >
                  <View
                    style={[
                      styles.roleIcon,
                      {
                        backgroundColor: iconBg,
                      },
                    ]}
                  >
                    {entry.icon}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roleTitle}>{entry.title}</Text>
                    <Text style={styles.roleDescription}>{entry.description}</Text>
                  </View>
                  <View style={[styles.check, active && styles.checkActive]}>
                    {active ? <Check size={12} color={colors.white} strokeWidth={3} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {isDemo ? (
          <View style={styles.demoCard}>
            <Sparkles size={16} color={colors.goldDeep} />
            <Text style={styles.demoText}>
              Demo mode: your profile and listings are stored on this device.
            </Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <PrimaryButton label="Continue" onPress={handleContinue} loading={loading} />
          <Pressable
            onPress={async () => {
              await signOut();
            }}
            style={styles.change}
            accessibilityRole="button"
          >
            <Text style={styles.changeText}>Use a different number</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
  },
  stepPill: {
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  stepText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    color: colors.primary,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -1.3,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
    marginTop: 9,
    maxWidth: 370,
  },
  phoneLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  phoneMuted: {
    fontSize: 11.5,
    color: colors.muted,
    fontWeight: "600",
  },
  phoneValue: {
    fontSize: 12,
    color: colors.ink,
    fontWeight: "800",
  },
  form: {
    gap: 24,
    marginTop: 26,
  },
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.body,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: 13,
    backgroundColor: colors.white,
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  roleTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    color: colors.ink,
  },
  roleDescription: {
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.muted,
    marginTop: 2,
  },
  check: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  checkActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  demoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.goldSoft,
    borderRadius: radii.md,
    padding: 11,
    marginTop: 22,
  },
  demoText: {
    flex: 1,
    fontSize: 10.5,
    color: "#7A5A12",
    fontWeight: "600",
    lineHeight: 15,
  },
  footer: {
    marginTop: "auto",
    paddingTop: 36,
    gap: 8,
  },
  change: {
    alignSelf: "center",
    paddingVertical: 10,
  },
  changeText: {
    fontSize: 11.5,
    color: colors.muted,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
