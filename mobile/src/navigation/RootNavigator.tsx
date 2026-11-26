import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";

import { BrandMark } from "../components/Brand";
import { colors, spacing } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { AuthNavigator } from "./AuthNavigator";
import { UserNavigator } from "./UserNavigator";
import { AdminNavigator } from "./AdminNavigator";

export function RootNavigator() {
  const { ready, profile, pendingPhone, needsProfile } = useAuth();

  if (!ready) {
    return (
      <LinearGradient
        colors={["#1F4E74", "#173A5E", "#0E2740"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.boot}
      >
        <StatusBar style="light" />
        <View style={styles.glowOne} />
        <View style={styles.glowTwo} />
        <View style={styles.logoCard}>
          <BrandMark size={70} />
        </View>
        <Text style={styles.wordmark}>SystIO Land</Text>
        <Text style={styles.tagline}>Find the ground you grow on.</Text>
        <ActivityIndicator color={colors.white} style={styles.spinner} />
        <Text style={styles.loadingText}>Opening the marketplace…</Text>
      </LinearGradient>
    );
  }

  if (profile?.role === "admin") {
    return <AdminNavigator />;
  }

  if (profile && needsProfile) {
    return <AuthNavigator initialRouteName="RoleSetup" />;
  }

  if (profile) {
    return <UserNavigator />;
  }

  return (
    <AuthNavigator
      initialRouteName={needsProfile && pendingPhone ? "RoleSetup" : "Welcome"}
    />
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    overflow: "hidden",
  },
  glowOne: {
    position: "absolute",
    top: -110,
    right: -90,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  glowTwo: {
    position: "absolute",
    bottom: -150,
    left: -110,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: "rgba(0,0,0,0.09)",
  },
  logoCard: {
    width: 98,
    height: 98,
    borderRadius: 29,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#5A0B13",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 10,
  },
  wordmark: {
    fontSize: 31,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: -1.1,
    marginTop: 20,
  },
  tagline: {
    fontSize: 12,
    color: "rgba(255,255,255,0.78)",
    marginTop: 5,
    letterSpacing: 0.15,
  },
  spinner: {
    marginTop: 34,
  },
  loadingText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    marginTop: 10,
    fontWeight: "500",
    letterSpacing: 0.15,
  },
});
