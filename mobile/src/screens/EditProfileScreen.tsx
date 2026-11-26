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
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BriefcaseBusiness, Check, Compass, ShieldCheck, UserRound } from "lucide-react-native";

import { Avatar } from "../components/Avatar";
import { PrimaryButton, ScreenTopBar } from "../components/Buttons";
import { TextField } from "../components/Form";
import { colors, radii, shadow, spacing } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import type { RootStackParamList } from "../navigation/types";
import type { AccountRole } from "../types";
import { formatPhone } from "../utils/format";
import { roleLabel } from "../utils/roles";

type Props = NativeStackScreenProps<RootStackParamList, "EditProfile">;

export function EditProfileScreen({ navigation }: Props) {
  const { profile, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState(profile?.name ?? "");
  const [role, setRole] = useState<AccountRole>(
    profile?.role === "broker" ? "broker" : profile?.role === "browse" ? "browse" : "owner"
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ name, role });
      showToast("Profile updated.", "success");
      navigation.goBack();
    } catch (saveError) {
      showToast(
        saveError instanceof Error ? saveError.message : "Could not update your profile.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScreenTopBar
        title="Edit profile"
        subtitle="How buyers see you on listings"
        onBack={() => navigation.goBack()}
        border={false}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.avatarCard}>
            <View style={styles.avatarRing}>
              <Avatar name={name || profile?.name || "SystIO"} size={76} tone="violet" />
            </View>
            <Text style={styles.avatarName}>{name || "Your name"}</Text>
            <Text style={styles.avatarRole}>{roleLabel(role)} account</Text>
            <View style={styles.verifiedPill}>
              <ShieldCheck size={11} color={colors.success} />
              <Text style={styles.verifiedText}>Phone verified</Text>
            </View>
          </View>

          <View style={styles.form}>
            <TextField
              label="Full name"
              required
              value={name}
              onChangeText={(value) => {
                setName(value);
                setError(null);
              }}
              placeholder="Your full name"
              autoCapitalize="words"
              maxLength={60}
              error={error}
              hint={`${name.length}/60`}
            />

            <TextField
              label="Mobile number"
              value={profile?.phone ? `+91 ${formatPhone(profile.phone)}` : "Admin account"}
              editable={false}
              hint="Verified · cannot be changed"
            />

            <View style={styles.roleGroup}>
              <Text style={styles.roleLabel}>Your account type</Text>
              <Text style={styles.roleHint}>
                You can change it any time. Browsers can’t create listings.
              </Text>
              <Pressable
                onPress={() => setRole("owner")}
                style={[styles.roleCard, role === "owner" && styles.roleCardActive]}
                accessibilityRole="radio"
                accessibilityState={{ checked: role === "owner" }}
              >
                <View style={[styles.roleIcon, role === "owner" && styles.roleIconActive]}>
                  <UserRound
                    size={20}
                    color={role === "owner" ? colors.primary : colors.body}
                    strokeWidth={2}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleTitle, role === "owner" && styles.roleTitleActive]}>
                    Owner
                  </Text>
                  <Text style={styles.roleBody}>
                    I’m listing a property that I own or co-own.
                  </Text>
                </View>
                <View style={[styles.radio, role === "owner" && styles.radioActive]}>
                  {role === "owner" ? <View style={styles.radioDot} /> : null}
                </View>
              </Pressable>

              <Pressable
                onPress={() => setRole("broker")}
                style={[styles.roleCard, role === "broker" && styles.roleCardActive]}
                accessibilityRole="radio"
                accessibilityState={{ checked: role === "broker" }}
              >
                <View style={[styles.roleIcon, role === "broker" && styles.roleIconActive]}>
                  <BriefcaseBusiness
                    size={20}
                    color={role === "broker" ? colors.primary : colors.body}
                    strokeWidth={2}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleTitle, role === "broker" && styles.roleTitleActive]}>
                    Broker
                  </Text>
                  <Text style={styles.roleBody}>
                    I list properties on behalf of owners and clients.
                  </Text>
                </View>
                <View style={[styles.radio, role === "broker" && styles.radioActive]}>
                  {role === "broker" ? <View style={styles.radioDot} /> : null}
                </View>
              </Pressable>

              <Pressable
                onPress={() => setRole("browse")}
                style={[styles.roleCard, role === "browse" && styles.roleCardActive]}
                accessibilityRole="radio"
                accessibilityState={{ checked: role === "browse" }}
              >
                <View style={[styles.roleIcon, role === "browse" && styles.roleIconActive]}>
                  <Compass
                    size={20}
                    color={role === "browse" ? colors.primary : colors.body}
                    strokeWidth={2}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleTitle, role === "browse" && styles.roleTitleActive]}>
                    Browser
                  </Text>
                  <Text style={styles.roleBody}>
                    I’m looking to buy or rent. I’ll browse and save favourites only.
                  </Text>
                </View>
                <View style={[styles.radio, role === "browse" && styles.radioActive]}>
                  {role === "browse" ? <View style={styles.radioDot} /> : null}
                </View>
              </Pressable>
            </View>

            <View style={styles.profileNote}>
              <Check size={14} color={colors.success} strokeWidth={2.8} />
              <Text style={styles.profileNoteText}>
                Your name and account type appear on every new listing. Existing listings keep
                their original seller details.
              </Text>
            </View>

            <PrimaryButton label="Save changes" onPress={save} loading={saving} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 36,
  },
  avatarCard: {
    alignItems: "center",
    paddingVertical: 22,
    gap: 3,
  },
  avatarRing: {
    padding: 4,
    borderRadius: 46,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E4DEFF",
    ...shadow.soft,
  },
  avatarName: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.4,
    marginTop: 8,
  },
  avatarRole: {
    fontSize: 10.5,
    color: colors.muted,
    fontWeight: "500",
  },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.successSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
  },
  verifiedText: {
    fontSize: 8.5,
    fontWeight: "800",
    color: colors.success,
  },
  form: {
    gap: 17,
  },
  roleGroup: {
    gap: 8,
  },
  roleLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.body,
  },
  roleHint: {
    fontSize: 10,
    color: colors.faint,
    marginTop: -4,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  roleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  roleIconActive: {
    backgroundColor: colors.primarySoft,
  },
  roleTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.ink,
  },
  roleTitleActive: {
    color: colors.primary,
  },
  roleBody: {
    fontSize: 9.5,
    lineHeight: 14,
    color: colors.muted,
    marginTop: 1,
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
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  profileNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: colors.successSoft,
    borderRadius: radii.md,
    padding: 11,
  },
  profileNoteText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 14,
    color: "#1B6C42",
    fontWeight: "500",
  },
});
