import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  BadgeCheck,
  Bell,
  ChevronRight,
  CreditCard,
  Crown,
  FileText,
  Gift,
  Heart,
  HelpCircle,
  Info,
  LandPlot,
  Languages,
  LogOut,
  Pencil,
  Phone,
  ReceiptText,
  RotateCcw,
  Settings,
  Ticket,
  UserRound,
  Wallet,
} from "lucide-react-native";

import { Avatar } from "../components/Avatar";
import { PrimaryButton } from "../components/Buttons";
import { MenuCard, MenuRow } from "../components/MenuRow";
import { colors, profileGradient, radii, shadow, spacing } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { useListings } from "../context/ListingsContext";
import { useToast } from "../context/ToastContext";
import type { RootStackParamList, TabParamList } from "../navigation/types";
import { formatPhone } from "../utils/format";
import { roleLabel, roleLabelUpper } from "../utils/roles";

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Profile">,
  NativeStackScreenProps<RootStackParamList>
>;

type Prefs = {
  push: boolean;
  offers: boolean;
  showPhone: boolean;
};

const PREFS_KEY = "systio.preferences.v1";

export function ProfileScreen({ navigation }: Props) {
  const { profile, isDemo, signOut, resetDemoAccount } = useAuth();
  const { myProperties, favoriteIds } = useListings();
  const { showToast } = useToast();
  const [prefs, setPrefs] = useState<Prefs>({ push: true, offers: true, showPhone: true });

  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY)
      .then((raw) => {
        if (raw) setPrefs((current) => ({ ...current, ...JSON.parse(raw) }));
      })
      .catch(() => undefined);
  }, []);

  const updatePref = (key: keyof Prefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next)).catch(() => undefined);
  };

  const approvedCount = myProperties.filter((property) => property.status === "approved").length;
  const pendingCount = myProperties.filter((property) => property.status === "pending").length;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : "2026";

  const handleSignOut = () => {
    Alert.alert("Sign out?", "Your listings and saved properties will stay on your account.", [
      { text: "Stay signed in", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  const handleReset = () => {
    Alert.alert(
      "Reset demo data?",
      "This clears the demo account, all local listings, payments and saved properties. The seeded marketplace will be restored.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset everything",
          style: "destructive",
          onPress: async () => {
            await resetDemoAccount();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
            <Text style={styles.title}>Profile</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate("EditProfile")}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            style={styles.headerButton}
          >
            <Settings size={19} color={colors.ink} strokeWidth={2.1} />
          </Pressable>
        </View>

        <LinearGradient
          colors={profileGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroDecorOne} />
          <View style={styles.heroDecorTwo} />
          <View style={styles.heroTop}>
            <View style={styles.avatarRing}>
              <Avatar name={profile?.name ?? "SystIO"} size={64} tone="violet" />
              <View style={styles.verifiedBadge}>
                <BadgeCheck size={15} color={colors.white} strokeWidth={2.8} />
              </View>
            </View>
            <Pressable
              onPress={() => navigation.navigate("EditProfile")}
              style={styles.editPill}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
              <Pencil size={12} color={colors.white} />
              <Text style={styles.editPillText}>Edit</Text>
            </Pressable>
          </View>

          <Text style={styles.name}>{profile?.name || "Your name"}</Text>
          <View style={styles.metaRow}>
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>
                {roleLabelUpper(profile?.role)}
              </Text>
            </View>
            <View style={styles.metaDot} />
            <Phone size={11} color="rgba(255,255,255,0.8)" />
            <Text style={styles.phone}>+91 {formatPhone(profile?.phone)}</Text>
          </View>
          <Text style={styles.memberSince}>Member since {memberSince}</Text>

          <View style={styles.stats}>
            <ProfileStat value={myProperties.length} label="Listings" />
            <View style={styles.statDivider} />
            <ProfileStat value={approvedCount} label="Approved" />
            <View style={styles.statDivider} />
            <ProfileStat value={favoriteIds.length} label="Saved" />
            <View style={styles.statDivider} />
            <ProfileStat value={pendingCount} label="In review" />
          </View>

          <Pressable
            onPress={() => navigation.navigate("Subscription")}
            accessibilityRole="button"
            accessibilityLabel="Open subscription"
            style={({ pressed }) => [{ opacity: pressed ? 0.94 : 1 }]}
          >
            <LinearGradient
              colors={["#FBE3AB", "#F1C363"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.goldStrip}
            >
              <View style={styles.goldIcon}>
                <Crown size={17} color="#6B4B08" strokeWidth={2.1} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.goldTitle}>
                  {profile?.free_listing_used
                    ? "SystIO Gold · ₹100 per extra listing"
                    : "SystIO Gold · First listing free"}
                </Text>
                <Text style={styles.goldSub}>
                  {profile?.free_listing_used
                    ? "Your free listing has been used"
                    : "A benefit that stays with your account"}
                </Text>
              </View>
              <ChevronRight size={17} color="#6B4B08" strokeWidth={2.5} />
            </LinearGradient>
          </Pressable>
        </LinearGradient>

        <View style={styles.moneyRow}>
          <Pressable
            onPress={() => navigation.navigate("PaymentHistory")}
            style={({ pressed }) => [styles.moneyCard, { opacity: pressed ? 0.94 : 1 }]}
          >
            <View style={styles.moneyTop}>
              <View style={[styles.moneyIcon, { backgroundColor: colors.successSoft }]}>
                <Wallet size={18} color={colors.success} strokeWidth={2} />
              </View>
              <View style={styles.moneyArrow}>
                <ChevronRight size={14} color={colors.faint} />
              </View>
            </View>
            <Text style={styles.moneyLabel}>Money</Text>
            <Text style={styles.moneyValue}>₹0</Text>
            <Text style={styles.moneyHint}>View payments</Text>
          </Pressable>

          <Pressable
            onPress={() => showToast("No coupons yet. New seller offers will appear here.", "info")}
            style={({ pressed }) => [styles.moneyCard, { opacity: pressed ? 0.94 : 1 }]}
          >
            <View style={styles.moneyTop}>
              <View style={[styles.moneyIcon, { backgroundColor: colors.violetSoft }]}>
                <Ticket size={18} color={colors.violet} strokeWidth={2} />
              </View>
              <View style={styles.moneyArrow}>
                <ChevronRight size={14} color={colors.faint} />
              </View>
            </View>
            <Text style={styles.moneyLabel}>Coupons</Text>
            <Text style={styles.moneyValue}>0</Text>
            <Text style={styles.moneyHint}>Your coupons</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => {
            showToast("Referral rewards are coming soon.", "info");
          }}
          style={styles.referCard}
        >
          <View style={styles.referIcon}>
            <Gift size={19} color={colors.primary} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.referTitle}>Refer a seller, earn a free listing</Text>
            <Text style={styles.referBody}>
              Invite another owner or broker. Earn a ₹100 listing credit when they publish.
            </Text>
          </View>
          <ChevronRight size={16} color={colors.faint} />
        </Pressable>

        <MenuCard title="Your activity">
          <MenuRow
            icon={<LandPlot size={18} color={colors.primary} />}
            label="My listings"
            subtitle="Approvals, edits and drafts"
            value={`${myProperties.length}`}
            onPress={() => navigation.navigate("Listings")}
          />
          <MenuRow
            icon={<Heart size={18} color={colors.primary} />}
            label="Saved properties"
            subtitle="Your shortlist"
            value={`${favoriteIds.length}`}
            onPress={() => navigation.navigate("Favorites")}
          />
          <MenuRow
            icon={<ReceiptText size={18} color={colors.violet} />}
            label="Payments & receipts"
            subtitle="Listing fees and invoices"
            onPress={() => navigation.navigate("PaymentHistory")}
          />
          <MenuRow
            icon={<Crown size={18} color={colors.goldDeep} />}
            label="Subscription"
            subtitle="Free listing and ₹100 pricing"
            onPress={() => navigation.navigate("Subscription")}
            last
          />
        </MenuCard>

        <MenuCard title="Preferences">
          <MenuRow
            icon={<UserRound size={18} color={colors.body} />}
            label="Account type"
            value={roleLabel(profile?.role)}
            onPress={() => navigation.navigate("EditProfile")}
          />
          <MenuRow
            icon={<Phone size={18} color={colors.body} />}
            label="Show number on listings"
            subtitle="Buyers can call you directly"
            right={
              <Switch
                value={prefs.showPhone}
                onValueChange={(value) => updatePref("showPhone", value)}
                trackColor={{ false: colors.line, true: colors.success }}
                thumbColor={colors.white}
              />
            }
          />
          <MenuRow
            icon={<Languages size={18} color={colors.body} />}
            label="Language"
            value="English"
            onPress={() => showToast("More languages are coming soon.", "info")}
            last
          />
        </MenuCard>

        <MenuCard title="App settings">
          <MenuRow
            icon={<Bell size={18} color={colors.body} />}
            label="Push notifications"
            subtitle="Approvals, enquiries and reminders"
            right={
              <Switch
                value={prefs.push}
                onValueChange={(value) => updatePref("push", value)}
                trackColor={{ false: colors.line, true: colors.success }}
                thumbColor={colors.white}
              />
            }
          />
          <MenuRow
            icon={<Gift size={18} color={colors.body} />}
            label="Offers & promotions"
            right={
              <Switch
                value={prefs.offers}
                onValueChange={(value) => updatePref("offers", value)}
                trackColor={{ false: colors.line, true: colors.success }}
                thumbColor={colors.white}
              />
            }
          />
          <MenuRow
            icon={<CreditCard size={18} color={colors.body} />}
            label="Payment methods"
            subtitle="UPI, cards and netbanking"
            onPress={() => navigation.navigate("PaymentMethods")}
          />
          <MenuRow
            icon={<HelpCircle size={18} color={colors.body} />}
            label="Help & support"
            onPress={() => navigation.navigate("Info", { kind: "help" })}
          />
          <MenuRow
            icon={<FileText size={18} color={colors.body} />}
            label="Terms & privacy"
            onPress={() => navigation.navigate("Info", { kind: "terms" })}
          />
          <MenuRow
            icon={<Info size={18} color={colors.body} />}
            label="About SystIO Land"
            value="v1.0.0"
            onPress={() => navigation.navigate("Info", { kind: "about" })}
            last={!isDemo}
          />
          {isDemo ? (
            <MenuRow
              icon={<RotateCcw size={18} color={colors.danger} />}
              label="Reset demo data"
              subtitle="Clear accounts, listings and payments"
              onPress={handleReset}
              danger
              last
            />
          ) : null}
        </MenuCard>

        <PrimaryButton
          label="Sign out"
          variant="danger"
          onPress={handleSignOut}
          icon={<LogOut size={17} color={colors.danger} />}
          style={{ marginTop: spacing.xxl }}
        />

        <View style={styles.footer}>
          <Image
            source={require("../../assets/icon.png")}
            style={styles.footerMark}
            accessibilityIgnoresInvertColors
          />
          <Text style={styles.footerText}>SystIO Land · v1.0.0</Text>
          <Text style={styles.footerFine}>
            {isDemo
              ? "Demo mode · local data only"
              : "Secured by the backend · payments by Razorpay"}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileStat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 8,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
    color: colors.faint,
  },
  title: {
    fontSize: 29,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -1.1,
    marginTop: 2,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.lineSoft,
    ...shadow.soft,
  },
  hero: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    overflow: "hidden",
  },
  heroDecorOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.07)",
    right: -50,
    top: -70,
  },
  heroDecorTwo: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.05)",
    left: -36,
    bottom: 40,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  avatarRing: {
    padding: 3,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
  },
  verifiedBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: "#6A59DF",
    alignItems: "center",
    justifyContent: "center",
  },
  editPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editPillText: {
    color: colors.white,
    fontSize: 10.5,
    fontWeight: "700",
  },
  name: {
    color: colors.white,
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.7,
    marginTop: 14,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 7,
  },
  rolePill: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  roleText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginHorizontal: 2,
  },
  phone: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10.5,
    fontWeight: "600",
  },
  memberSince: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 9.5,
    marginTop: 5,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: radii.md,
    marginTop: 16,
    paddingVertical: 10,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  statLabel: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 8,
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  goldStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radii.md,
    paddingHorizontal: 11,
    paddingVertical: 9,
    marginTop: 12,
  },
  goldIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(107,75,8,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  goldTitle: {
    color: "#4A3403",
    fontSize: 11.5,
    fontWeight: "900",
  },
  goldSub: {
    color: "#7A5A12",
    fontSize: 9,
    marginTop: 1,
    fontWeight: "600",
  },
  moneyRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  moneyCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 13,
    ...shadow.soft,
  },
  moneyTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  moneyIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  moneyArrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  moneyLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    marginTop: 10,
  },
  moneyValue: {
    fontSize: 19,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.5,
    marginTop: 1,
  },
  moneyHint: {
    fontSize: 9,
    color: colors.faint,
    marginTop: 1,
    fontWeight: "500",
  },
  referCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 13,
    marginTop: 12,
  },
  referIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  referTitle: {
    fontSize: 11.5,
    fontWeight: "800",
    color: colors.ink,
  },
  referBody: {
    fontSize: 9.5,
    lineHeight: 14,
    color: colors.muted,
    marginTop: 2,
  },
  footer: {
    alignItems: "center",
    paddingTop: 26,
    gap: 5,
  },
  footerMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    opacity: 0.55,
  },
  footerText: {
    fontSize: 10.5,
    color: colors.muted,
    fontWeight: "600",
  },
  footerFine: {
    fontSize: 9,
    color: colors.faint,
  },
});
