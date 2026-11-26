import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import {
  ChevronRight,
  CreditCard,
  Gift,
  HelpCircle,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react-native";

import { EmptyState } from "../components/EmptyState";
import { ScreenTopBar } from "../components/Buttons";
import { colors, radii, shadow, spacing } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import type { RootStackParamList } from "../navigation/types";
import type { Payment } from "../types";
import { fetchPaymentHistory } from "../services/api";
import { formatDate, formatPriceFull } from "../utils/format";

type Props = NativeStackScreenProps<RootStackParamList, "PaymentHistory">;

export function PaymentHistoryScreen({ navigation }: Props) {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!profile) return;
      if (!silent) setRefreshing(true);
      setError(null);
      try {
        const next = await fetchPaymentHistory(profile.id);
        setPayments(next);
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "Could not load your payments."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [profile]
  );

  

  const paid = payments.filter((payment) => payment.status === "paid");
  const totalPaid = paid.reduce((sum, payment) => sum + payment.amount / 100, 0);
  const paidListings = paid.filter((payment) => payment.kind === "listing_fee").length;
  const freeUsed = paid.some((payment) => payment.kind === "free_listing");

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScreenTopBar
        title="Payments"
        subtitle="Listing fees, receipts and benefits"
        onBack={() => navigation.goBack()}
        border={false}
        right={
          <Pressable
            onPress={() => navigation.navigate("PaymentMethods")}
            style={styles.topButton}
            accessibilityRole="button"
            accessibilityLabel="Payment methods"
          >
            <CreditCard size={18} color={colors.ink} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(false)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <LinearGradient
          colors={["#2A2B30", "#18191C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summary}
        >
          <View style={styles.summaryGlow} />
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryLabel}>TOTAL SPENT ON LISTINGS</Text>
              <Text style={styles.summaryAmount}>{formatPriceFull(totalPaid)}</Text>
            </View>
            <View style={styles.summaryIcon}>
              <Wallet size={19} color={colors.gold} />
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{paidListings}</Text>
              <Text style={styles.summaryStatLabel}>
                paid {paidListings === 1 ? "listing" : "listings"}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <View style={styles.freeRow}>
                <Gift size={11} color={colors.gold} />
                <Text style={styles.summaryStatValue}>
                  {freeUsed || profile?.free_listing_used ? "Used" : "Available"}
                </Text>
              </View>
              <Text style={styles.summaryStatLabel}>free listing</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>₹100</Text>
              <Text style={styles.summaryStatLabel}>per new listing</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Receipts</Text>
          <Text style={styles.sectionSub}>Every listing payment in one place.</Text>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading payments…</Text>
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => load(false)} accessibilityRole="button">
              <Text style={styles.retry}>Try again</Text>
            </Pressable>
          </View>
        ) : payments.length ? (
          <View style={styles.list}>
            {payments.map((payment) => (
              <PaymentRow key={payment.id} payment={payment} />
            ))}
          </View>
        ) : (
          <EmptyState
            compact
            icon={<ReceiptText size={27} color={colors.primary} />}
            title="No payments yet"
            body="Your first listing is free. Any ₹100 listing payments will show up here with a receipt."
            actionLabel="List a property"
            onAction={() => navigation.navigate("ListProperty")}
          />
        )}

        <Pressable
          onPress={() => navigation.navigate("PaymentMethods")}
          style={styles.linkCard}
          accessibilityRole="button"
          accessibilityLabel="Open payment methods"
        >
          <View style={styles.linkIcon}>
            <CreditCard size={18} color={colors.violet} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>Payment methods</Text>
            <Text style={styles.linkBody}>UPI, cards and netbanking via Razorpay</Text>
          </View>
          <ChevronRight size={16} color={colors.faint} />
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate("Info", { kind: "help" })}
          style={styles.linkCard}
          accessibilityRole="button"
          accessibilityLabel="Get help with payments"
        >
          <View style={[styles.linkIcon, { backgroundColor: colors.infoSoft }]}>
            <HelpCircle size={18} color={colors.info} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>Need help with a payment?</Text>
            <Text style={styles.linkBody}>We usually respond within one working day.</Text>
          </View>
          <ChevronRight size={16} color={colors.faint} />
        </Pressable>

        <View style={styles.secureCard}>
          <ShieldCheck size={16} color={colors.success} />
          <Text style={styles.secureText}>
            Payments are processed by Razorpay. SystIO Land never stores your card or UPI
            credentials.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PaymentRow({ payment }: { payment: Payment }) {
  const palette =
    payment.status === "paid"
      ? { fg: colors.success, bg: colors.successSoft, label: "PAID" }
      : payment.status === "failed"
        ? { fg: colors.danger, bg: colors.dangerSoft, label: "FAILED" }
        : payment.status === "refunded"
          ? { fg: colors.violet, bg: colors.violetSoft, label: "REFUNDED" }
          : { fg: colors.warning, bg: colors.warningSoft, label: "PENDING" };

  const free = payment.kind === "free_listing";
  return (
    <View style={styles.paymentCard}>
      <View style={styles.paymentTop}>
        <View
          style={[
            styles.paymentIcon,
            { backgroundColor: free ? colors.goldSoft : colors.successSoft },
          ]}
        >
          {free ? (
            <Sparkles size={18} color={colors.goldDeep} />
          ) : (
            <ReceiptText size={18} color={colors.success} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.paymentTitle} numberOfLines={1}>
            {payment.property_title || (free ? "Free listing benefit" : "Listing fee")}
          </Text>
          <Text style={styles.paymentDate}>
            {formatDate(payment.paid_at ?? payment.created_at)} ·{" "}
            {free ? "First listing" : "Additional listing"}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <Text style={styles.paymentAmount}>
            {free ? "FREE" : formatPriceFull(payment.amount / 100)}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: palette.bg }]}>
            <Text style={[styles.statusText, { color: palette.fg }]}>{palette.label}</Text>
          </View>
        </View>
      </View>
      <View style={styles.paymentFooter}>
        <Text style={styles.paymentRef} numberOfLines={1}>
          {payment.razorpay_payment_id
            ? `PAYMENT ID · ${payment.razorpay_payment_id}`
            : "SYSTIO LAND · NO PAYMENT REQUIRED"}
        </Text>
        <Text style={styles.paymentKind}>{payment.currency}</Text>
      </View>
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
    paddingBottom: 36,
  },
  topButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  summary: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    overflow: "hidden",
    ...shadow.card,
  },
  summaryGlow: {
    position: "absolute",
    right: -50,
    top: -70,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(246,196,106,0.12)",
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  summaryLabel: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
    color: "rgba(255,255,255,0.48)",
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: -1,
    marginTop: 3,
  },
  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 12,
    marginTop: 14,
  },
  summaryStat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  summaryStatValue: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.white,
  },
  summaryStatLabel: {
    fontSize: 8,
    color: "rgba(255,255,255,0.48)",
    fontWeight: "500",
  },
  summaryDivider: {
    width: 1,
    height: 25,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  freeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sectionHeader: {
    marginTop: spacing.xxl,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  sectionSub: {
    fontSize: 10.5,
    color: colors.muted,
    marginTop: 2,
  },
  loading: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  loadingText: {
    fontSize: 10.5,
    color: colors.muted,
  },
  errorCard: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.md,
    padding: 14,
    gap: 7,
  },
  errorText: {
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.danger,
    fontWeight: "500",
  },
  retry: {
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.danger,
    textDecorationLine: "underline",
  },
  list: {
    gap: 9,
  },
  paymentCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 12,
    ...shadow.soft,
  },
  paymentTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  paymentIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentTitle: {
    fontSize: 11.5,
    fontWeight: "800",
    color: colors.ink,
  },
  paymentDate: {
    fontSize: 8.5,
    color: colors.muted,
    marginTop: 2,
    fontWeight: "500",
  },
  paymentAmount: {
    fontSize: 12.5,
    fontWeight: "900",
    color: colors.ink,
  },
  statusPill: {
    borderRadius: radii.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 6.5,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  paymentFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    marginTop: 9,
    paddingTop: 7,
    gap: 8,
  },
  paymentRef: {
    flex: 1,
    fontSize: 7.5,
    fontWeight: "700",
    color: colors.faint,
    letterSpacing: 0.2,
  },
  paymentKind: {
    fontSize: 7.5,
    fontWeight: "800",
    color: colors.faint,
  },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 12,
    marginTop: 10,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.violetSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  linkTitle: {
    fontSize: 11.5,
    fontWeight: "800",
    color: colors.ink,
  },
  linkBody: {
    fontSize: 9,
    color: colors.muted,
    marginTop: 2,
  },
  secureCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    paddingHorizontal: 4,
    marginTop: spacing.xl,
  },
  secureText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 13,
    color: colors.faint,
  },
});
