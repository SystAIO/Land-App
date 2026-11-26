import React from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Building2,
  ChevronRight,
  CreditCard,
  Lock,
  Mail,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react-native";

import { ScreenTopBar } from "../components/Buttons";
import { colors, radii, shadow, spacing } from "../constants/theme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "PaymentMethods">;

const METHODS = [
  {
    icon: Smartphone,
    color: colors.primary,
    bg: colors.primarySoft,
    title: "UPI",
    body: "Google Pay, PhonePe, Paytm and any UPI app",
    tag: "RECOMMENDED",
  },
  {
    icon: CreditCard,
    color: colors.violet,
    bg: colors.violetSoft,
    title: "Credit & debit cards",
    body: "Visa, Mastercard, RuPay and American Express",
    tag: "SECURE",
  },
  {
    icon: Building2,
    color: colors.info,
    bg: colors.infoSoft,
    title: "Netbanking",
    body: "All major Indian banks",
    tag: "BANK",
  },
  {
    icon: Wallet,
    color: colors.success,
    bg: colors.successSoft,
    title: "Wallets",
    body: "Supported wallets shown at Razorpay checkout",
    tag: "WALLET",
  },
];

export function PaymentMethodsScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScreenTopBar
        title="Payment methods"
        subtitle="Only needed for additional listings"
        onBack={() => navigation.goBack()}
        border={false}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Lock size={22} color={colors.success} strokeWidth={2.1} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Checkout stays with Razorpay</Text>
            <Text style={styles.heroBody}>
              SystIO Land does not store card numbers, UPI IDs or bank credentials. Every
              ₹100 listing fee opens Razorpay’s PCI-DSS compliant checkout.
            </Text>
          </View>
        </View>

        <View style={styles.feeCard}>
          <View>
            <Text style={styles.feeLabel}>LISTING FEE</Text>
            <Text style={styles.feeValue}>₹100</Text>
          </View>
          <View style={styles.feeDivider} />
          <View style={{ flex: 1 }}>
            <Text style={styles.feeNote}>Your first listing is free</Text>
            <Text style={styles.feeSub}>
              The fee is charged once per new property. Edits and resubmissions are free.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Accepted at checkout</Text>
        <View style={styles.methods}>
          {METHODS.map((method) => {
            const Icon = method.icon;
            return (
              <View key={method.title} style={styles.method}>
                <View style={[styles.methodIcon, { backgroundColor: method.bg }]}>
                  <Icon size={19} color={method.color} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodTitle}>{method.title}</Text>
                  <Text style={styles.methodBody}>{method.body}</Text>
                </View>
                <View style={[styles.methodTag, { backgroundColor: method.bg }]}>
                  <Text style={[styles.methodTagText, { color: method.color }]}>
                    {method.tag}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.savedCard}>
          <View style={styles.savedIcon}>
            <CreditCard size={19} color={colors.muted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.savedTitle}>No saved payment methods</Text>
            <Text style={styles.savedBody}>
              For your safety, payment details are entered directly in Razorpay each time.
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => navigation.navigate("Info", { kind: "help" })}
          style={styles.helpCard}
          accessibilityRole="button"
          accessibilityLabel="Payment support"
        >
          <Mail size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.helpTitle}>Payment support</Text>
            <Text style={styles.helpBody}>Get help with a failed or duplicate payment.</Text>
          </View>
          <ChevronRight size={16} color={colors.faint} />
        </Pressable>

        <Pressable
          onPress={() => Linking.openURL("mailto:support@systio.land?subject=Listing%20payment")}
          style={styles.emailLink}
          accessibilityRole="button"
          accessibilityLabel="Email payment support"
        >
          <Text style={styles.emailText}>support@systio.land</Text>
        </Pressable>

        <View style={styles.trustRow}>
          <ShieldCheck size={14} color={colors.success} />
          <Text style={styles.trustText}>Refunds are processed to the original payment source.</Text>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: 36,
  },
  hero: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    backgroundColor: colors.successSoft,
    borderRadius: radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: "#CDEEDB",
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 13.5,
    fontWeight: "900",
    color: "#145C36",
  },
  heroBody: {
    fontSize: 10,
    lineHeight: 15,
    color: "#2C7450",
    marginTop: 3,
  },
  feeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 14,
    marginTop: 12,
    ...shadow.soft,
  },
  feeLabel: {
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.6,
    color: colors.faint,
  },
  feeValue: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.8,
    marginTop: 1,
  },
  feeDivider: {
    width: 1,
    height: 42,
    backgroundColor: colors.lineSoft,
  },
  feeNote: {
    fontSize: 11.5,
    fontWeight: "800",
    color: colors.ink,
  },
  feeSub: {
    fontSize: 9,
    lineHeight: 13,
    color: colors.muted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.4,
    marginTop: spacing.xxl,
    marginBottom: 9,
  },
  methods: {
    gap: 8,
  },
  method: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 11,
  },
  methodIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  methodTitle: {
    fontSize: 11.5,
    fontWeight: "800",
    color: colors.ink,
  },
  methodBody: {
    fontSize: 8.5,
    color: colors.muted,
    marginTop: 1,
    lineHeight: 12,
  },
  methodTag: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  methodTagText: {
    fontSize: 6,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  savedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.line,
    borderRadius: radii.md,
    padding: 13,
    marginTop: spacing.xl,
  },
  savedIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.canvasDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  savedTitle: {
    fontSize: 11.5,
    fontWeight: "800",
    color: colors.ink,
  },
  savedBody: {
    fontSize: 9,
    lineHeight: 13,
    color: colors.muted,
    marginTop: 1,
  },
  helpCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 12,
    marginTop: 12,
  },
  helpTitle: {
    fontSize: 11.5,
    fontWeight: "800",
    color: colors.ink,
  },
  helpBody: {
    fontSize: 9,
    color: colors.muted,
    marginTop: 1,
  },
  emailLink: {
    alignItems: "center",
    paddingVertical: 12,
  },
  emailText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: colors.primary,
    textDecorationLine: "underline",
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 6,
  },
  trustText: {
    fontSize: 8.5,
    color: colors.faint,
  },
});
