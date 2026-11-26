import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Crown,
  IndianRupee,
  ShieldCheck,
  Sparkles,
} from "lucide-react-native";

import { PrimaryButton, ScreenTopBar } from "../components/Buttons";
import { colors, radii, shadow, spacing } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Subscription">;

const INCLUDED = [
  "Up to 6 photos and a YouTube walkthrough",
  "Exact map pin with optional plot boundary",
  "Admin verification before going live",
  "Direct calls and WhatsApp from buyers",
  "Free edits with re-review after publishing",
  "No buyer brokerage — ever",
];

const FAQS = [
  {
    q: "How does the free first listing work?",
    a: "Your first property is published with no listing fee. The benefit is tied to your account once used, so it is not restored if you delete the listing later.",
  },
  {
    q: "When do I pay the ₹100 listing fee?",
    a: "You pay when you submit your second or later property, after reviewing all the details. The payment opens inside the app through Razorpay.",
  },
  {
    q: "Do I pay again when a listing is declined?",
    a: "No. Edits and resubmissions for a listing you already paid for are free. Only a brand-new listing uses a new fee.",
  },
  {
    q: "Does SystIO Land charge buyers anything?",
    a: "No. Buyers browse and contact sellers directly without paying brokerage or commission to SystIO Land.",
  },
];

export function SubscriptionScreen({ navigation }: Props) {
  const { profile } = useAuth();
  const freeAvailable = !profile?.free_listing_used;
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const listProperty = () => navigation.navigate("ListProperty");

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScreenTopBar
        title="Subscription"
        subtitle="Pay per listing. No recurring charges."
        onBack={() => navigation.goBack()}
        border={false}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#5A4AD1", "#44349F", "#2C226B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroCircleOne} />
          <View style={styles.heroCircleTwo} />
          <View style={styles.goldPill}>
            <Crown size={13} color="#6B4B08" strokeWidth={2.2} />
            <Text style={styles.goldPillText}>SYSTIO GOLD</Text>
          </View>
          <Text style={styles.heroTitle}>One free listing. Then just ₹100 at a time.</Text>
          <Text style={styles.heroBody}>
            No monthly plans, no commissions. Pay only when you publish a new property.
          </Text>
          <View style={styles.heroStatus}>
            <View style={styles.heroStatusItem}>
              <Text style={styles.heroStatusLabel}>FIRST LISTING</Text>
              <Text style={styles.heroStatusValue}>{freeAvailable ? "FREE" : "USED"}</Text>
            </View>
            <View style={styles.heroStatusDivider} />
            <View style={styles.heroStatusItem}>
              <Text style={styles.heroStatusLabel}>EXTRA LISTINGS</Text>
              <Text style={styles.heroStatusValue}>₹100</Text>
            </View>
            <View style={styles.heroStatusDivider} />
            <View style={styles.heroStatusItem}>
              <Text style={styles.heroStatusLabel}>RENEWALS</Text>
              <Text style={styles.heroStatusValue}>NONE</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.planRow}>
          <View style={[styles.planCard, styles.freePlan]}>
            <View style={styles.planTop}>
              <Text style={styles.planLabel}>FIRST LISTING</Text>
              {freeAvailable ? (
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>AVAILABLE</Text>
                </View>
              ) : (
                <View style={styles.usedPill}>
                  <Text style={styles.usedPillText}>USED</Text>
                </View>
              )}
            </View>
            <Text style={styles.planPrice}>₹0</Text>
            <Text style={styles.planSub}>one-time benefit</Text>
            <View style={styles.planLine} />
            <PlanFeature text="One property listing" />
            <PlanFeature text="All publishing features" />
            <PlanFeature text="Admin verification" />
          </View>

          <View style={[styles.planCard, styles.paidPlan]}>
            <View style={styles.planTop}>
              <Text style={[styles.planLabel, { color: colors.gold }]}>EVERY EXTRA</Text>
              <View style={styles.paidPill}>
                <IndianRupee size={8} color={colors.white} />
                <Text style={styles.paidPillText}>PAY PER LIST</Text>
              </View>
            </View>
            <Text style={[styles.planPrice, { color: colors.white }]}>₹100</Text>
            <Text style={[styles.planSub, { color: "#ABA6D8" }]}>per new property</Text>
            <View style={[styles.planLine, { backgroundColor: "rgba(255,255,255,0.12)" }]} />
            <PlanFeature text="One property listing" dark />
            <PlanFeature text="Edit & resubmit free" dark />
            <PlanFeature text="Razorpay secure checkout" dark />
          </View>
        </View>

        {!freeAvailable ? (
          <View style={styles.usedNotice}>
            <Sparkles size={16} color={colors.goldDeep} />
            <Text style={styles.usedNoticeText}>
              Your free listing benefit has been used. Deleting a property does not reset it;
              new listings are ₹100 each.
            </Text>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Everything included</Text>
          <Text style={styles.sectionSub}>Same features on your free and paid listings.</Text>
        </View>
        <View style={styles.includedCard}>
          {INCLUDED.map((item) => (
            <View key={item} style={styles.includedRow}>
              <View style={styles.includedCheck}>
                <Check size={11} color={colors.white} strokeWidth={3} />
              </View>
              <Text style={styles.includedText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>How the fee works</Text>
        </View>
        <View style={styles.stepsCard}>
          <PriceStep
            number="1"
            title="Create your first listing"
            body="Build the listing, pin the map and submit it. No payment screen appears."
          />
          <PriceStep
            number="2"
            title="Publish more properties"
            body="From your second listing onward, pay ₹100 for each new property before review."
          />
          <PriceStep
            number="3"
            title="Edit or resubmit — free"
            body="Declined or approved listings can be updated and sent back for review at no extra cost."
            last
          />
        </View>

        <PrimaryButton
          label={freeAvailable ? "Start my free listing" : "List a property · ₹100"}
          onPress={listProperty}
          icon={<Sparkles size={17} color={colors.white} />}
          style={{ marginTop: spacing.xxl }}
        />
        <View style={styles.secureRow}>
          <ShieldCheck size={13} color={colors.success} />
          <Text style={styles.secureText}>Payments handled securely by Razorpay</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Questions, answered</Text>
        </View>
        <View style={styles.faqCard}>
          {FAQS.map((faq, index) => {
            const open = openFaq === index;
            return (
              <View
                key={faq.q}
                style={[styles.faqItem, index === FAQS.length - 1 && { borderBottomWidth: 0 }]}
              >
                <Pressable
                  onPress={() => setOpenFaq(open ? null : index)}
                  style={styles.faqQuestion}
                  accessibilityRole="button"
                  accessibilityLabel={faq.q}
                  accessibilityState={{ expanded: open }}
                >
                  <Text style={styles.faqQuestionText}>{faq.q}</Text>
                  {open ? (
                    <ChevronUp size={16} color={colors.muted} />
                  ) : (
                    <ChevronDown size={16} color={colors.muted} />
                  )}
                </Pressable>
                {open ? <Text style={styles.faqAnswer}>{faq.a}</Text> : null}
              </View>
            );
          })}
        </View>

        <Text style={styles.fineprint}>
          Listing fees are non-refundable once a listing is published, except where required
          by law. Price shown is inclusive of applicable taxes.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function PlanFeature({ text, dark = false }: { text: string; dark?: boolean }) {
  return (
    <View style={styles.planFeature}>
      <Check size={11} color={dark ? colors.gold : colors.success} strokeWidth={2.8} />
      <Text style={[styles.planFeatureText, dark && { color: "#CECBF0" }]}>{text}</Text>
    </View>
  );
}

function PriceStep({
  number,
  title,
  body,
  last = false,
}: {
  number: string;
  title: string;
  body: string;
  last?: boolean;
}) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepRail}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>{number}</Text>
        </View>
        {!last ? <View style={styles.stepLine} /> : null}
      </View>
      <View style={[styles.stepBody, last && { paddingBottom: 0 }]}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepText}>{body}</Text>
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
  hero: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    overflow: "hidden",
    ...shadow.card,
  },
  heroCircleOne: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(255,255,255,0.06)",
    right: -46,
    top: -66,
  },
  heroCircleTwo: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(246,196,106,0.09)",
    left: -24,
    bottom: -34,
  },
  goldPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: colors.gold,
    borderRadius: radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  goldPillText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#4A3403",
    letterSpacing: 0.7,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "900",
    letterSpacing: -0.9,
    marginTop: 14,
    maxWidth: 320,
  },
  heroBody: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 7,
    maxWidth: 310,
  },
  heroStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: radii.md,
    paddingVertical: 10,
    marginTop: 16,
  },
  heroStatusItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  heroStatusLabel: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 7.5,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  heroStatusValue: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
  },
  heroStatusDivider: {
    width: 1,
    height: 22,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  planRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  planCard: {
    flex: 1,
    borderRadius: radii.lg,
    padding: 12,
    borderWidth: 1,
    ...shadow.soft,
  },
  freePlan: {
    backgroundColor: colors.white,
    borderColor: "#F0DDA8",
  },
  paidPlan: {
    backgroundColor: colors.dark,
    borderColor: colors.darkSoft,
  },
  planTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
    minHeight: 18,
  },
  planLabel: {
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 0.4,
    color: colors.faint,
    flexShrink: 1,
  },
  activePill: {
    backgroundColor: colors.successSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  activePillText: {
    fontSize: 6.5,
    fontWeight: "900",
    color: colors.success,
  },
  usedPill: {
    backgroundColor: colors.lineSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  usedPillText: {
    fontSize: 6.5,
    fontWeight: "900",
    color: colors.faint,
  },
  paidPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
    backgroundColor: "rgba(246,196,106,0.14)",
    borderRadius: radii.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  paidPillText: {
    fontSize: 6.5,
    fontWeight: "900",
    color: colors.gold,
  },
  planPrice: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -1,
    marginTop: 10,
  },
  planSub: {
    fontSize: 8.5,
    color: colors.faint,
    marginTop: -1,
    fontWeight: "500",
  },
  planLine: {
    height: 1,
    backgroundColor: colors.lineSoft,
    marginVertical: 10,
  },
  planFeature: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    marginBottom: 6,
  },
  planFeatureText: {
    flex: 1,
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.body,
    fontWeight: "500",
  },
  usedNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: colors.goldSoft,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#F0DDA8",
    padding: 11,
    marginTop: 12,
  },
  usedNoticeText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 14,
    color: "#7A5A12",
    fontWeight: "500",
  },
  sectionHeader: {
    marginTop: spacing.xxl,
    marginBottom: 9,
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
  includedCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 14,
    gap: 10,
  },
  includedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  includedCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  includedText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    color: colors.body,
    fontWeight: "500",
  },
  stepsCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 14,
  },
  stepRow: {
    flexDirection: "row",
    gap: 10,
  },
  stepRail: {
    alignItems: "center",
    width: 22,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 9,
    fontWeight: "900",
    color: colors.primary,
  },
  stepLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: colors.lineSoft,
    marginVertical: 4,
  },
  stepBody: {
    flex: 1,
    paddingBottom: 16,
  },
  stepTitle: {
    fontSize: 11.5,
    fontWeight: "800",
    color: colors.ink,
  },
  stepText: {
    fontSize: 10,
    lineHeight: 15,
    color: colors.muted,
    marginTop: 2,
  },
  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 9,
  },
  secureText: {
    fontSize: 9.5,
    color: colors.muted,
    fontWeight: "500",
  },
  faqCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    paddingHorizontal: 14,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  faqQuestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 13,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: "700",
    color: colors.ink,
    lineHeight: 16,
  },
  faqAnswer: {
    fontSize: 10.5,
    lineHeight: 16,
    color: colors.muted,
    paddingBottom: 13,
    paddingRight: 10,
  },
  fineprint: {
    fontSize: 8.5,
    lineHeight: 13,
    color: colors.faint,
    textAlign: "center",
    marginTop: spacing.xxl,
    paddingHorizontal: 12,
  },
});
