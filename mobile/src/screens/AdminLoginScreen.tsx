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
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { KeyRound, Lock, ShieldCheck, Sparkles } from "lucide-react-native";

import { BackButton, PrimaryButton } from "../components/Buttons";
import { TextField } from "../components/Form";
import { colors, radii, adminGradient, spacing } from "../constants/theme";
import type { AuthStackParamList } from "../navigation/types";
import { DEMO_CREDENTIALS, useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

type Props = NativeStackScreenProps<AuthStackParamList, "AdminLogin">;

export function AdminLoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { adminLogin, isDemo } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Enter the admin email and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await adminLogin(email, password);
    } catch (loginError) {
      const message =
        loginError instanceof Error ? loginError.message : "Could not sign in.";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={adminGradient} style={styles.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BackButton dark onPress={() => navigation.goBack()} />

          <View style={styles.iconWrap}>
            <ShieldCheck size={30} color={colors.white} strokeWidth={1.8} />
          </View>
          <Text style={styles.eyebrow}>RESTRICTED ACCESS</Text>
          <Text style={styles.title}>Admin console</Text>
          <Text style={styles.subtitle}>
            Approve listings, manage people and keep the marketplace clean. This area uses a
            completely separate admin login.
          </Text>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.keyCircle}>
                <KeyRound size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.cardTitle}>Sign in as admin</Text>
                <Text style={styles.cardSub}>Email & password credentials</Text>
              </View>
            </View>

            <View style={styles.form}>
              <TextField
                label="Admin email"
                placeholder="admin@systio.land"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError(null);
                }}
              />
              <TextField
                label="Password"
                placeholder="••••••••"
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError(null);
                }}
                onSubmitEditing={handleLogin}
                returnKeyType="done"
                error={error}
              />
              <PrimaryButton
                label="Enter admin console"
                onPress={handleLogin}
                loading={loading}
                icon={<Lock size={16} color={colors.white} />}
              />
            </View>

            {isDemo ? (
              <Pressable
                onPress={() => {
                  setEmail(DEMO_CREDENTIALS.email);
                  setPassword(DEMO_CREDENTIALS.password);
                  setError(null);
                }}
                style={styles.demoCard}
                accessibilityRole="button"
                accessibilityLabel="Fill demo admin credentials"
              >
                <Sparkles size={15} color={colors.goldDeep} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.demoTitle}>Demo credentials — tap to fill</Text>
                  <Text style={styles.demoCredentials}>
                    {DEMO_CREDENTIALS.email}  ·  {DEMO_CREDENTIALS.password}
                  </Text>
                </View>
              </Pressable>
            ) : null}

            <Text style={styles.note}>
              Normal user OTP login cannot open this area. Admin accounts are created by
              SystIO Land operators only.
            </Text>
          </View>

          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backLink}
            accessibilityRole="button"
          >
            <Text style={styles.backText}>Back to user sign in</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 34,
  },
  eyebrow: {
    color: colors.gold,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginTop: 22,
  },
  title: {
    color: colors.white,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.3,
    marginTop: 6,
  },
  subtitle: {
    color: "#A8A9AD",
    fontSize: 12.5,
    lineHeight: 19,
    marginTop: 9,
    maxWidth: 380,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginTop: 28,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  keyCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.2,
  },
  cardSub: {
    fontSize: 10.5,
    color: colors.muted,
    marginTop: 2,
  },
  form: {
    gap: 16,
    marginTop: 18,
  },
  demoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: radii.md,
    backgroundColor: colors.goldSoft,
    padding: 11,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#F1DDA9",
  },
  demoTitle: {
    fontSize: 10.5,
    fontWeight: "900",
    color: colors.goldDeep,
  },
  demoCredentials: {
    fontSize: 10.5,
    color: "#7A5A12",
    marginTop: 2,
    fontWeight: "600",
  },
  note: {
    fontSize: 9.5,
    lineHeight: 14,
    color: colors.faint,
    marginTop: 16,
    textAlign: "center",
  },
  backLink: {
    alignSelf: "center",
    paddingVertical: 18,
    marginTop: "auto",
  },
  backText: {
    fontSize: 11.5,
    color: "#C6C7CB",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
