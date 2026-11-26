import React, { useEffect, useRef, useState } from "react";
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
import { Clock3, RefreshCw, ShieldCheck, Sparkles } from "lucide-react-native";

import { BackButton, PrimaryButton } from "../components/Buttons";
import { OtpInput } from "../components/OtpInput";
import { colors, radii, spacing } from "../constants/theme";
import type { AuthStackParamList } from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatPhone } from "../utils/format";

type Props = NativeStackScreenProps<AuthStackParamList, "Otp">;

export function OtpScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { phone } = route.params;
  const { verifyOtp, requestOtp, isDemo } = useAuth();
  const { showToast } = useToast();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(30);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timer.current = setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          if (timer.current) clearInterval(timer.current);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const verify = async (value = otp) => {
    if (value.length !== 6) {
      setError("Enter the complete 6-digit code.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await verifyOtp(phone, value);
      if (result.needsProfile) {
        navigation.replace("RoleSetup");
      }
    } catch (verifyError) {
      const message =
        verifyError instanceof Error ? verifyError.message : "Could not verify the OTP.";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (seconds > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      await requestOtp(phone);
      setSeconds(30);
      setOtp("");
      if (timer.current) clearInterval(timer.current);
      timer.current = setInterval(() => {
        setSeconds((current) => {
          if (current <= 1) {
            if (timer.current) clearInterval(timer.current);
            return 0;
          }
          return current - 1;
        });
      }, 1000);
      showToast("A new OTP has been sent.", "success");
    } catch (resendError) {
      showToast(
        resendError instanceof Error ? resendError.message : "Could not resend the OTP.",
        "error"
      );
    } finally {
      setResending(false);
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

        <View style={styles.iconCircle}>
          <ShieldCheck size={26} color={colors.primary} strokeWidth={2} />
        </View>
        <Text style={styles.title}>Verify your number</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code we sent to{" "}
          <Text style={styles.phone}>+91 {formatPhone(phone)}</Text>
        </Text>

        <View style={styles.otpWrap}>
          <OtpInput
            value={otp}
            onChange={(value) => {
              setOtp(value);
              setError(null);
            }}
            error={Boolean(error)}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        {isDemo ? (
          <Pressable
            onPress={() => {
              setOtp("123456");
              setError(null);
            }}
            style={styles.demoCard}
            accessibilityRole="button"
            accessibilityLabel="Fill demo OTP"
          >
            <Sparkles size={16} color={colors.goldDeep} />
            <View style={{ flex: 1 }}>
              <Text style={styles.demoTitle}>Demo OTP: 123456</Text>
              <Text style={styles.demoBody}>Tap here to fill it automatically.</Text>
            </View>
            <RefreshCw size={14} color={colors.goldDeep} />
          </Pressable>
        ) : null}

        <View style={styles.actions}>
          <PrimaryButton
            label="Verify & continue"
            onPress={() => verify()}
            loading={loading}
            disabled={otp.length !== 6}
          />
          <View style={styles.resendRow}>
            {seconds > 0 ? (
              <>
                <Clock3 size={13} color={colors.faint} />
                <Text style={styles.resendMuted}>
                  Resend code in 00:{String(seconds).padStart(2, "0")}
                </Text>
              </>
            ) : (
              <Pressable
                onPress={resend}
                style={styles.resendButton}
                accessibilityRole="button"
                accessibilityLabel="Resend OTP"
              >
                <RefreshCw size={13} color={colors.primary} />
                <Text style={styles.resendText}>
                  {resending ? "Sending…" : "Resend code"}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.changeNumber}
          accessibilityRole="button"
        >
          <Text style={styles.changeText}>Change mobile number</Text>
        </Pressable>
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
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 34,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -1.2,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.muted,
    marginTop: 9,
  },
  phone: {
    color: colors.ink,
    fontWeight: "800",
  },
  otpWrap: {
    marginTop: 32,
    gap: 10,
  },
  error: {
    fontSize: 11.5,
    color: colors.danger,
    fontWeight: "600",
    textAlign: "center",
  },
  demoCard: {
    flexDirection: "row",
    alignItems: "center",
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
    fontSize: 10.5,
    lineHeight: 15,
    color: "#7A5A12",
    marginTop: 2,
  },
  actions: {
    marginTop: 30,
    gap: 14,
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    minHeight: 32,
  },
  resendMuted: {
    fontSize: 11.5,
    color: colors.faint,
    fontWeight: "600",
  },
  resendButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
  },
  resendText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "800",
  },
  changeNumber: {
    alignSelf: "center",
    marginTop: "auto",
    paddingTop: 30,
    paddingVertical: 10,
  },
  changeText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
