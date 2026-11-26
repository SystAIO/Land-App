import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  CreditCard,
  Lock,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react-native";

import { useAuth } from "../context/AuthContext";
import { colors, radii, shadow, spacing } from "../constants/theme";
import { DEMO_MODE } from "../lib/env";
import type { CheckoutSession, Property } from "../types";
import { startListingCheckout, verifyListingPayment } from "../services/api";
import { formatPriceFull } from "../utils/format";
import { PrimaryButton } from "./Buttons";

type Phase =
  | "loading"
  | "free"
  | "already_paid"
  | "demo"
  | "razorpay"
  | "verifying"
  | "done"
  | "cancelled"
  | "error";

export function PaymentModal({
  visible,
  property,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  property: Property | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { profile, refreshProfile } = useAuth();
  const [phase, setPhase] = useState<Phase>("loading");
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startedFor = useRef<string | null>(null);

  const begin = useCallback(async () => {
    if (!property) return;
    setPhase("loading");
    setError(null);
    setSession(null);
    try {
      const next = await startListingCheckout(property.id);
      setSession(next);
      if (next.mode === "free") setPhase("free");
      else if (next.mode === "already_paid") setPhase("already_paid");
      else if (next.mode === "demo") setPhase("demo");
      else setPhase("razorpay");
    } catch (startError) {
      setError(
        startError instanceof Error
          ? startError.message
          : "Could not start the payment. Please try again."
      );
      setPhase("error");
    }
  }, [property]);

  useEffect(() => {
    if (!visible || !property) {
      startedFor.current = null;
      return;
    }
    if (startedFor.current === property.id) return;
    startedFor.current = property.id;
    begin();
  }, [begin, property, visible]);

  const finishPaid = useCallback(async () => {
    await refreshProfile();
    setPhase("done");
  }, [refreshProfile]);

  const continueAfterSuccess = useCallback(async () => {
    await refreshProfile();
    onSuccess();
  }, [onSuccess, refreshProfile]);

  const onWebViewMessage = useCallback(
    async (raw: string) => {
      if (!property || !session || session.mode !== "razorpay") return;
      try {
        const payload = JSON.parse(raw) as {
          kind: "success" | "dismiss" | "failed";
          paymentId?: string;
          orderId?: string;
          signature?: string;
          message?: string;
        };
        if (payload.kind === "dismiss") {
          setPhase("cancelled");
          return;
        }
        if (payload.kind === "failed") {
          setError(payload.message || "The payment could not be completed.");
          setPhase("error");
          return;
        }
        if (payload.kind === "success" && payload.paymentId && payload.signature) {
          setPhase("verifying");
          await verifyListingPayment({
            propertyId: property.id,
            orderId: payload.orderId ?? session.orderId,
            paymentId: payload.paymentId,
            signature: payload.signature,
          });
          await finishPaid();
        }
      } catch (messageError) {
        setError(
          messageError instanceof Error
            ? messageError.message
            : "We could not verify the payment."
        );
        setPhase("error");
      }
    },
    [finishPaid, property, session]
  );

  const payInDemo = useCallback(async () => {
    if (!property) return;
    setPhase("verifying");
    try {
      await verifyListingPayment({
        propertyId: property.id,
        orderId: `demo_order_${Date.now()}`,
        paymentId: `pay_demo_${Date.now()}`,
        signature: "demo_signature",
      });
      await finishPaid();
    } catch (payError) {
      setError(payError instanceof Error ? payError.message : "Payment failed.");
      setPhase("error");
    }
  }, [finishPaid, property]);

  const closeable = phase !== "verifying" && phase !== "done";

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerLeft}>
        <View style={styles.lockCircle}>
          <Lock size={15} color={colors.success} strokeWidth={2.4} />
        </View>
        <View>
          <Text style={styles.headerTitle}>Secure checkout</Text>
          <Text style={styles.headerSub}>256-bit encrypted · Razorpay</Text>
        </View>
      </View>
      {closeable ? (
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close checkout"
          style={styles.close}
        >
          <X size={20} color={colors.ink} />
        </Pressable>
      ) : null}
    </View>
  );

  const html = buildCheckoutHtml(session, property, profile?.name, profile?.phone);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => {
        if (closeable) onClose();
      }}
    >
      <View style={styles.root}>
        {header}

        {phase === "loading" ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loadingTitle}>Preparing your checkout</Text>
            <Text style={styles.loadingBody}>Checking your listing benefits…</Text>
          </View>
        ) : null}

        {phase === "free" && property ? (
          <ScrollView contentContainerStyle={styles.centerScroll}>
            <View style={styles.benefitIcon}>
              <Sparkles size={34} color={colors.goldDeep} strokeWidth={1.8} />
            </View>
            <Text style={styles.successTitle}>Your first listing is free</Text>
            <Text style={styles.successBody}>
              No payment needed. “{property.title}” has been submitted to our team for
              review and will appear on the home feed once approved.
            </Text>
            <View style={styles.freeCard}>
              <View style={styles.freeRow}>
                <Text style={styles.freeLabel}>Listing fee</Text>
                <Text style={styles.freeCut}>₹0</Text>
              </View>
              <View style={styles.freeRow}>
                <Text style={styles.freeLabel}>First listing benefit</Text>
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>APPLIED</Text>
                </View>
              </View>
              <Text style={styles.freeHint}>
                Your next property will cost ₹100. Deleting this listing will not reset the
                benefit.
              </Text>
            </View>
            <PrimaryButton
              label="View my listing"
              onPress={continueAfterSuccess}
              style={styles.fullButton}
            />
          </ScrollView>
        ) : null}

        {phase === "already_paid" && property ? (
          <ScrollView contentContainerStyle={styles.centerScroll}>
            <View style={[styles.benefitIcon, { backgroundColor: colors.successSoft }]}>
              <BadgeCheck size={36} color={colors.success} strokeWidth={1.8} />
            </View>
            <Text style={styles.successTitle}>Payment already received</Text>
            <Text style={styles.successBody}>
              We found a completed listing fee for “{property.title}”. It has been sent for
              review and you have not been charged again.
            </Text>
            <View style={styles.freeCard}>
              <View style={styles.freeRow}>
                <Text style={styles.freeLabel}>New charge</Text>
                <Text style={styles.freeCut}>₹0</Text>
              </View>
              <View style={styles.freeRow}>
                <Text style={styles.freeLabel}>Listing status</Text>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>PENDING REVIEW</Text>
                </View>
              </View>
              <Text style={styles.freeHint}>
                Your payment was recovered automatically, so the draft was not charged a second
                time.
              </Text>
            </View>
            <PrimaryButton
              label="View my listing"
              onPress={continueAfterSuccess}
              style={styles.fullButton}
            />
          </ScrollView>
        ) : null}

        {phase === "demo" && session?.mode === "demo" && property ? (
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>DEMO PAYMENT</Text>
            </View>
            <View style={styles.rzpBrand}>
              <View style={styles.rzpLogo}>
                <Text style={styles.rzpLogoText}>R</Text>
              </View>
              <Text style={styles.rzpText}>Razorpay</Text>
              <ShieldCheck size={17} color={colors.success} />
            </View>

            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>LISTING FEE</Text>
              <Text style={styles.amount}>₹100</Text>
              <Text style={styles.amountProperty} numberOfLines={2}>
                {property.title}
              </Text>
              <View style={styles.amountDivider} />
              <Text style={styles.amountHint}>
                Your free listing has been used. This property is your second listing.
              </Text>
            </View>

            <Text style={styles.sectionLabel}>Pay with</Text>
            <View style={styles.methods}>
              <MethodRow icon={<Smartphone size={18} color={colors.primary} />} label="UPI" active />
              <MethodRow icon={<CreditCard size={18} color={colors.muted} />} label="Card" />
              <MethodRow
                icon={<Building2 size={18} color={colors.muted} />}
                label="Netbanking"
              />
            </View>

            <View style={styles.demoNotice}>
              <AlertTriangle size={15} color={colors.warning} />
              <Text style={styles.demoNoticeText}>
                Demo mode is on. This simulates a successful Razorpay payment and no money
                will be charged. Add live Razorpay keys to the backend to accept real payments.
              </Text>
            </View>

            <PrimaryButton
              label="Pay ₹100 (demo)"
              onPress={payInDemo}
              style={styles.fullButton}
              icon={<Lock size={16} color={colors.white} />}
            />
            <Pressable onPress={onClose} style={styles.cancelLink} accessibilityRole="button">
              <Text style={styles.cancelText}>Cancel payment</Text>
            </Pressable>
          </ScrollView>
        ) : null}

        {phase === "razorpay" && session?.mode === "razorpay" && property ? (
          <View style={{ flex: 1 }}>
            <View style={styles.razorpaySummary}>
              <View>
                <Text style={styles.razorpaySummaryLabel}>Listing fee</Text>
                <Text style={styles.razorpaySummaryPrice}>
                  {formatPriceFull(session.amount / 100)}
                </Text>
              </View>
              <View style={styles.securePill}>
                <ShieldCheck size={13} color={colors.success} />
                <Text style={styles.secureText}>Secure</Text>
              </View>
            </View>
            <WebView
              originWhitelist={["*"]}
              source={{ html, baseUrl: "https://systio.land" }}
              javaScriptEnabled
              domStorageEnabled
              mixedContentMode="always"
              setSupportMultipleWindows={false}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.webLoading}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.loadingBody}>Opening Razorpay…</Text>
                </View>
              )}
              onMessage={(event) => onWebViewMessage(event.nativeEvent.data)}
              onError={() => {
                setError("Razorpay could not load. Check your internet connection and retry.");
                setPhase("error");
              }}
              style={{ flex: 1, backgroundColor: colors.white }}
            />
          </View>
        ) : null}

        {phase === "verifying" ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loadingTitle}>Verifying payment</Text>
            <Text style={styles.loadingBody}>
              Please don’t close the app. This usually takes a few seconds.
            </Text>
          </View>
        ) : null}

        {phase === "done" && property ? (
          <ScrollView contentContainerStyle={styles.centerScroll}>
            <View style={styles.doneIcon}>
              <CheckCircle2 size={40} color={colors.success} strokeWidth={1.9} />
            </View>
            <Text style={styles.successTitle}>You’re all set</Text>
            <Text style={styles.successBody}>
              “{property.title}” has been submitted for review. You can track its approval
              status in My Listings.
            </Text>
            <View style={styles.receiptCard}>
              <View style={styles.freeRow}>
                <Text style={styles.freeLabel}>Amount paid</Text>
                <Text style={styles.receiptAmount}>
                  {session?.mode === "free" ? "₹0 (first listing)" : "₹100"}
                </Text>
              </View>
              <View style={styles.freeRow}>
                <Text style={styles.freeLabel}>Status</Text>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>PENDING REVIEW</Text>
                </View>
              </View>
              <View style={styles.receiptNote}>
                <BadgeCheck size={15} color={colors.success} />
                <Text style={styles.receiptText}>
                  Our team usually approves new listings within 24 hours.
                </Text>
              </View>
            </View>
            <PrimaryButton
              label="View my listing"
              onPress={continueAfterSuccess}
              style={styles.fullButton}
            />
          </ScrollView>
        ) : null}

        {phase === "cancelled" ? (
          <View style={styles.center}>
            <View style={styles.errorIcon}>
              <X size={30} color={colors.muted} />
            </View>
            <Text style={styles.successTitle}>Payment cancelled</Text>
            <Text style={styles.successBody}>
              Your property is saved as a draft. You can complete the ₹100 payment any time
              from My Listings.
            </Text>
            <PrimaryButton label="Try again" onPress={begin} style={styles.fullButton} />
            <Pressable onPress={onClose} style={styles.cancelLink} accessibilityRole="button">
              <Text style={styles.cancelText}>Back to listing</Text>
            </Pressable>
          </View>
        ) : null}

        {phase === "error" ? (
          <View style={styles.center}>
            <View style={[styles.errorIcon, { backgroundColor: colors.dangerSoft }]}>
              <AlertTriangle size={30} color={colors.danger} />
            </View>
            <Text style={styles.successTitle}>Payment didn’t go through</Text>
            <Text style={styles.successBody}>{error ?? "Something went wrong."}</Text>
            <PrimaryButton label="Try again" onPress={begin} style={styles.fullButton} />
            <Pressable onPress={onClose} style={styles.cancelLink} accessibilityRole="button">
              <Text style={styles.cancelText}>Back to listing</Text>
            </Pressable>
          </View>
        ) : null}

        {DEMO_MODE && phase !== "razorpay" ? (
          <View style={[styles.demoFooter, { paddingBottom: Math.max(insets.bottom, 8) }]}>
            <Text style={styles.demoFooterText}>
              DEMO MODE · Payments are simulated · No money is charged
            </Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function MethodRow({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <View style={[styles.method, active && styles.methodActive]}>
      {icon}
      <Text style={[styles.methodLabel, active && { color: colors.ink }]}>{label}</Text>
      <View style={[styles.radio, active && styles.radioActive]}>
        {active ? <View style={styles.radioDot} /> : null}
      </View>
    </View>
  );
}

function buildCheckoutHtml(
  session: CheckoutSession | null,
  property: Property | null,
  name?: string,
  phone?: string | null
): string {
  if (!session || session.mode !== "razorpay" || !property) {
    return "<html><body></body></html>";
  }
  const config = JSON.stringify({
    key: session.keyId,
    amount: session.amount,
    currency: session.currency,
    name: "SystIO Land",
    description: `Listing fee — ${property.title}`,
    order_id: session.orderId,
    prefill: {
      name: name ?? "",
      contact: phone ?? "",
    },
    notes: { property_id: property.id },
    theme: { color: "#173A5E" },
  }).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <style>
      html, body { margin:0; padding:0; background:#F8F7F5; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
      #fallback { display:flex; height:100vh; align-items:center; justify-content:center; color:#6F6F6F; font-size:14px; }
    </style>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  </head>
  <body>
    <div id="fallback">Opening Razorpay…</div>
    <script>
      var options = ${config};
      options.handler = function (response) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          kind: 'success',
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          signature: response.razorpay_signature
        }));
      };
      options.modal = {
        escape: false,
        backdropclose: false,
        ondismiss: function () {
          window.ReactNativeWebView.postMessage(JSON.stringify({ kind: 'dismiss' }));
        }
      };
      try {
        var rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            kind: 'failed',
            message: (response && response.error && response.error.description) || 'Payment failed'
          }));
        });
        rzp.open();
      } catch (err) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          kind: 'failed',
          message: 'Could not open Razorpay checkout.'
        }));
      }
    </script>
  </body>
</html>`;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  lockCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.successSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  headerSub: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 1,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lineSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    paddingBottom: 60,
  },
  centerScroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
    paddingBottom: 100,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: 60,
  },
  benefitIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.goldSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  doneIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.successSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  errorIcon: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: colors.lineSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: colors.ink,
    textAlign: "center",
    letterSpacing: -0.6,
  },
  successBody: {
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.muted,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 340,
  },
  freeCard: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    gap: 13,
  },
  freeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  freeLabel: {
    fontSize: 13,
    color: colors.body,
    fontWeight: "600",
  },
  freeCut: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.success,
  },
  freeBadge: {
    backgroundColor: colors.successSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  freeBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: colors.success,
    letterSpacing: 0.4,
  },
  freeHint: {
    fontSize: 11.5,
    lineHeight: 17,
    color: colors.muted,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    paddingTop: 12,
  },
  fullButton: {
    width: "100%",
    marginTop: 22,
  },
  demoBadge: {
    backgroundColor: colors.warningSoft,
    alignSelf: "center",
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 2,
    marginBottom: 12,
  },
  demoBadgeText: {
    color: colors.warning,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  rzpBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.lg,
  },
  rzpLogo: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#0B72E7",
    alignItems: "center",
    justifyContent: "center",
  },
  rzpLogoText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "900",
  },
  rzpText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0B72E7",
    letterSpacing: -0.4,
  },
  amountCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    ...shadow.card,
  },
  amountLabel: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "800",
    color: colors.faint,
  },
  amount: {
    fontSize: 38,
    fontWeight: "900",
    color: colors.ink,
    marginTop: 4,
    letterSpacing: -1.5,
  },
  amountProperty: {
    fontSize: 12.5,
    color: colors.muted,
    marginTop: 3,
    fontWeight: "600",
    lineHeight: 17,
  },
  amountDivider: {
    height: 1,
    backgroundColor: colors.lineSoft,
    marginVertical: spacing.md,
  },
  amountHint: {
    fontSize: 11.5,
    lineHeight: 17,
    color: colors.muted,
  },
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: "800",
    color: colors.ink,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  methods: {
    gap: 8,
  },
  method: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  methodActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  methodLabel: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: "700",
    color: colors.muted,
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
  demoNotice: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    backgroundColor: colors.warningSoft,
    borderRadius: radii.md,
    marginTop: spacing.lg,
  },
  demoNoticeText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 15.5,
    color: "#8A5A00",
    fontWeight: "600",
  },
  cancelLink: {
    alignSelf: "center",
    paddingVertical: 14,
    marginTop: 4,
  },
  cancelText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.muted,
  },
  receiptCard: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: 22,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    gap: 12,
  },
  receiptAmount: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.ink,
  },
  pendingBadge: {
    backgroundColor: colors.warningSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  pendingText: {
    fontSize: 8.5,
    fontWeight: "900",
    color: colors.warning,
    letterSpacing: 0.4,
  },
  receiptNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    paddingTop: 12,
  },
  receiptText: {
    fontSize: 10.5,
    color: colors.muted,
    flex: 1,
    lineHeight: 15,
  },
  loadingTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.ink,
    marginTop: 18,
  },
  loadingBody: {
    fontSize: 12.5,
    color: colors.muted,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 18,
  },
  razorpaySummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  razorpaySummaryLabel: {
    fontSize: 10,
    color: colors.faint,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  razorpaySummaryPrice: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.ink,
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
    fontSize: 10,
    fontWeight: "800",
    color: colors.success,
  },
  webLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.canvas,
  },
  demoFooter: {
    backgroundColor: colors.dark,
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  demoFooterText: {
    color: "#CFCFCF",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
  },
});
