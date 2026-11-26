import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Lock, MessageCircleMore, ShieldCheck, Sparkles } from "lucide-react-native";

import { BackButton, PrimaryButton } from "../components/Buttons";
import { BrandMark } from "../components/Brand";
import { TextField } from "../components/Form";
import { colors, radii, spacing } from "../constants/theme";
import type { AuthStackParamList } from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { isValidIndianPhone, normalisePhone } from "../utils/format";

type Props = NativeStackScreenProps<AuthStackParamList, "Phone">;

export function PhoneScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { requestOtp, isDemo } = useAuth();
  const { showToast } = useToast();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!isValidIndianPhone(phone)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const normalised = normalisePhone(phone);
      await requestOtp(normalised);
      navigation.navigate("Otp", { phone: normalised });
    } catch (sendError) {
      const message =
        sendError instanceof Error ? sendError.message : "Could not send the OTP.";
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
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.brandRow}>
          <BrandMark size={44} />
          <View style={styles.securePill}>
            <Lock size={10} color={colors.success} />
            <Text style={styles.secureText}>OTP secured</Text>
          </View>
        </View>

        <Text style={styles.title}>What’s your{`\n`}mobile number?</Text>
        <Text style={styles.subtitle}>
          We’ll send a 6-digit code to verify it. Use the same number every time to keep
          your listings together.
        </Text>

        <View style={styles.inputSection}>
          <TextField
            label="Mobile number"
            placeholder="98765 43210"
            keyboardType="phone-pad"
            prefix="+91"
            value={phone}
            maxLength={10}
            onChangeText={(text) => {
              setPhone(text.replace(/\D/g, "").slice(0, 10));
              setError(null);
            }}
            error={error}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleContinue}
            textContentType="telephoneNumber"
            autoComplete="tel"
          />
          <View style={styles.helperRow}>
            <ShieldCheck size={13} color={colors.success} />
            <Text style={styles.helperText}>
              Your number is only shown to buyers when you publish a listing.
            </Text>
          </View>
        </View>

        {isDemo ? (
          <View style={styles.demoCard}>
            <Sparkles size={16} color={colors.goldDeep} />
            <View style={{ flex: 1 }}>
              <Text style={styles.demoTitle}>Demo mode</Text>
              <Text style={styles.demoBody}>
                Use any 10-digit number. The OTP is always <Text style={styles.bold}>123456</Text>.
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.footer}>
          <PrimaryButton
            label="Send OTP"
            onPress={handleContinue}
            loading={loading}
            icon={<MessageCircleMore size={17} color={colors.white} />}
          />
          <Text style={styles.terms}>
            By continuing you agree to our Terms of Service and Privacy Policy.
          </Text>
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
  brandRow: {
    marginTop: 26,
    marginBottom: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  securePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.successSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  secureText: {
    color: colors.success,
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 34,
    lineHeight: 39,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -1.3,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.muted,
    marginTop: 10,
    maxWidth: 360,
  },
  inputSection: {
    marginTop: 34,
    gap: 12,
  },
  helperRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
    paddingRight: 20,
  },
  helperText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.muted,
  },
  demoCard: {
    flexDirection: "row",
    gap: 10,
    padding: 13,
    borderRadius: radii.md,
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: "#F1DDA9",
    marginTop: 22,
  },
  demoTitle: {
    fontSize: 11.5,
    fontWeight: "900",
    color: colors.goldDeep,
  },
  demoBody: {
    fontSize: 11,
    lineHeight: 16,
    color: "#7A5A12",
    marginTop: 2,
  },
  bold: {
    fontWeight: "900",
  },
  footer: {
    marginTop: "auto",
    paddingTop: 32,
    gap: 14,
  },
  terms: {
    textAlign: "center",
    fontSize: 9.5,
    color: colors.faint,
    lineHeight: 14,
    paddingHorizontal: 16,
  },
});
