import React from "react";
import {
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BadgeCheck, MapPin, ShieldCheck, ChevronRight, Sparkles } from "lucide-react-native";

import { BrandLockup } from "../components/Brand";
import { colors, radii, brandGradient, spacing } from "../constants/theme";
import type { AuthStackParamList } from "../navigation/types";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

const HERO =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=85";

export function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { isDemo } = useAuth();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ImageBackground source={{ uri: HERO }} style={styles.hero} resizeMode="cover">
        <LinearGradient
          colors={["rgba(16,14,13,0.18)", "rgba(16,14,13,0.38)", "rgba(16,14,13,0.9)"]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
          <BrandLockup size={42} dark />
          {isDemo ? (
            <View style={styles.demoPill}>
              <Sparkles size={11} color={colors.gold} />
              <Text style={styles.demoText}>DEMO</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.heroCopy}>
          <View style={styles.locationPill}>
            <MapPin size={13} color={colors.white} />
            <Text style={styles.locationText}>Plots · Flats · Farm land · Shops</Text>
          </View>
          <Text style={styles.heroTitle}>Find the ground{`\n`}you grow on.</Text>
          <Text style={styles.heroSub}>
            Verified listings from owners and brokers across India — with real plot
            boundaries, direct contacts and zero noise.
          </Text>
        </View>
      </ImageBackground>

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <View style={styles.handle} />
        <View style={styles.trustRow}>
          <View style={styles.trustItem}>
            <BadgeCheck size={15} color={colors.success} />
            <Text style={styles.trustText}>Verified listings</Text>
          </View>
          <View style={styles.trustDot} />
          <View style={styles.trustItem}>
            <MapPin size={15} color={colors.primary} />
            <Text style={styles.trustText}>Map pin + boundary</Text>
          </View>
        </View>

        <Pressable
          onPress={() => navigation.navigate("Phone")}
          accessibilityRole="button"
          accessibilityLabel="Continue with mobile number"
          style={({ pressed }) => [styles.ctaWrap, { opacity: pressed ? 0.9 : 1 }]}
        >
          <LinearGradient
            colors={brandGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            <PhoneIcon />
            <Text style={styles.ctaText}>Continue with mobile number</Text>
            <ChevronRight size={18} color={colors.white} />
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate("AdminLogin")}
          accessibilityRole="button"
          accessibilityLabel="Open admin console"
          style={styles.adminLink}
        >
          <ShieldCheck size={14} color={colors.muted} />
          <Text style={styles.adminText}>Admin console</Text>
        </Pressable>

        <Text style={styles.terms}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </View>
  );
}

function PhoneIcon() {
  return (
    <View style={styles.phoneIcon}>
      <View style={styles.phoneIconDot} />
      <View style={styles.phoneIconBar} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  hero: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingBottom: 180,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  demoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(246,196,106,0.45)",
    backgroundColor: "rgba(24,25,28,0.4)",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  demoText: {
    fontSize: 9,
    fontWeight: "900",
    color: colors.gold,
    letterSpacing: 0.8,
  },
  heroCopy: {
    paddingBottom: 30,
    maxWidth: 420,
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: radii.pill,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    marginBottom: 14,
  },
  locationText: {
    color: colors.white,
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "900",
    letterSpacing: -1.6,
  },
  heroSub: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13.5,
    lineHeight: 20,
    marginTop: 12,
    fontWeight: "500",
    maxWidth: 340,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: spacing.xl,
    paddingTop: 10,
    marginTop: -30,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    alignSelf: "center",
    marginBottom: 16,
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
    flexWrap: "wrap",
  },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  trustText: {
    fontSize: 11.5,
    color: colors.body,
    fontWeight: "700",
  },
  trustDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.faint,
  },
  ctaWrap: {
    borderRadius: radii.md,
    overflow: "hidden",
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  ctaText: {
    flex: 1,
    textAlign: "center",
    color: colors.white,
    fontSize: 14.5,
    fontWeight: "800",
  },
  phoneIcon: {
    width: 18,
    height: 26,
    borderRadius: 5,
    borderWidth: 1.6,
    borderColor: colors.white,
    alignItems: "center",
    paddingTop: 4,
    gap: 3,
  },
  phoneIconDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.white,
  },
  phoneIconBar: {
    width: 8,
    height: 1.5,
    backgroundColor: colors.white,
    position: "absolute",
    bottom: 3,
    borderRadius: 1,
  },
  adminLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    marginTop: 4,
  },
  adminText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
  },
  terms: {
    textAlign: "center",
    fontSize: 9.5,
    color: colors.faint,
    lineHeight: 14,
    paddingHorizontal: 20,
  },
});
