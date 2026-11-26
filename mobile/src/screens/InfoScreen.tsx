import React, { useState } from "react";
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
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FileText,
  LandPlot,
  Mail,
  MapPinned,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react-native";

import { ScreenTopBar } from "../components/Buttons";
import { APP_NAME } from "../constants/catalog";
import { colors, radii, shadow, spacing } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import type { InfoKind, RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Info">;

const TITLES: Record<InfoKind, { title: string; subtitle: string }> = {
  help: { title: "Help & support", subtitle: "Answers, contact and listing guidance" },
  terms: { title: "Terms of use", subtitle: "The rules for buying and listing" },
  privacy: { title: "Privacy policy", subtitle: "How we handle your information" },
  about: { title: "About SystIO Land", subtitle: "Verified land, direct conversations" },
};

const HELP_FAQS = [
  {
    q: "How do I sign in?",
    a: "Enter your 10-digit mobile number and tap Send OTP. In demo mode the OTP is always 123456. In live mode you’ll receive an SMS from our SMS provider (MSG91).",
  },
  {
    q: "Why is my listing pending?",
    a: "Every listing is checked by an admin before it appears in the public feed. Most reviews finish within 24 hours. You’ll see the decision, and any admin note, in My Listings.",
  },
  {
    q: "When do I pay the listing fee?",
    a: "Your first property is free. When you publish a second or later property, you’ll pay ₹100 through Razorpay after reviewing the listing. The free benefit does not reset if you delete a property.",
  },
  {
    q: "How do I edit or delete a listing?",
    a: "Open My Listings from the Profile tab. Tap Edit to change details or resubmit a declined property. Use the trash icon to delete. Deleting never resets your free-listing benefit.",
  },
  {
    q: "What is the plot boundary used for?",
    a: "When you draw a boundary while pinning the property, buyers can see the approximate outline on the map. It’s optional, but it makes land listings much easier to understand.",
  },
  {
    q: "A payment failed. What should I do?",
    a: "Your property is saved as a draft, so no details are lost. Open My Listings, tap Complete listing and try again. If money was deducted but the listing still shows a draft, email support with the payment ID.",
  },
];

const TERMS = [
  {
    title: "1. Using SystIO Land",
    body: "You must sign in with a mobile number you control and provide accurate account information. Owner accounts are for properties you own or co-own. Broker accounts are for authorised property agents. You are responsible for all activity under your account.",
  },
  {
    title: "2. Property listings",
    body: "Sellers must have the legal right to advertise the property, and all details — price, area, location, ownership and photos — must be accurate. Listings are reviewed by an admin and may be declined, edited or removed if they are misleading, duplicate or unlawful.",
  },
  {
    title: "3. Listing fees",
    body: "The first property listing on an account is free. Each additional new listing costs ₹100, payable through Razorpay before admin review. The free-listing benefit is consumed once used and is not restored by deleting a listing. Editing or resubmitting an existing paid listing is free. Fees are non-refundable except where required by law.",
  },
  {
    title: "4. Buyers and sellers",
    body: "SystIO Land is a marketplace, not a party to any sale or rent agreement. We do not charge buyers brokerage. Buyers must independently verify title documents, approvals, measurements and encumbrances before paying any money. Sellers must respond honestly and must not demand advance payments outside a lawful agreement.",
  },
  {
    title: "5. Prohibited conduct",
    body: "Do not post false listings, impersonate another person, upload content you don’t own, scrape the marketplace, misuse another person’s phone number, or use SystIO Land for fraud or illegal activity. We may suspend accounts and remove content to protect users.",
  },
  {
    title: "6. Liability and availability",
    body: "The service is provided on an as-is basis. Maps, distances and property details may contain inaccuracies. To the extent permitted by law, SystIO Land is not liable for losses arising from transactions between users, downtime or third-party services such as Razorpay, SystIO Backend or Google Maps.",
  },
  {
    title: "7. Contact",
    body: "Questions about these terms can be sent to support@systio.land. These terms are governed by the laws of India, with courts in Pune, Maharashtra having jurisdiction.",
  },
];

const PRIVACY = [
  {
    title: "What we collect",
    body: "We collect your mobile number, name, account type (owner, broker or browser), listings and photos, map location and landmarks you add, saved properties, and listing-fee records. Payment credentials are entered directly into Razorpay and are never stored by SystIO Land.",
  },
  {
    title: "How we use it",
    body: "We use your information to verify your account, publish and review listings, show properties near buyers, process listing fees, prevent fraud and provide support. We do not sell your personal information.",
  },
  {
    title: "What buyers can see",
    body: "Approved listings show the property details, photos, the map location and the seller’s name, account type and phone number so buyers can contact you. Your login OTP and internal account records are never shown publicly.",
  },
  {
    title: "Service providers",
    body: "We use a Node.js/Express backend for authentication and storage, Razorpay for payment processing, Google Maps for maps, and OpenStreetMap/Nominatim for place search. These providers process only the information needed to deliver their service.",
  },
  {
    title: "Storage and security",
    body: "Data is transmitted over encrypted connections and stored in access-controlled cloud systems. Phone OTPs are handled by our authentication provider. No system is perfectly secure, so keep your phone and OTP private.",
  },
  {
    title: "Your choices",
    body: "You can edit your name and account type, delete properties, remove saved properties and ask us to close your account. Some records, such as payment receipts, may be retained where required by law. Email support@systio.land for data requests.",
  },
];

export function InfoScreen({ navigation, route }: Props) {
  const { kind } = route.params;
  const { isDemo } = useAuth();
  const meta = TITLES[kind];
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScreenTopBar
        title={meta.title}
        subtitle={meta.subtitle}
        onBack={() => navigation.goBack()}
        border={false}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {kind === "help" ? (
          <>
            <View style={styles.helpHero}>
              <View style={styles.helpIcon}>
                <Mail size={22} color={colors.primary} strokeWidth={2} />
              </View>
              <Text style={styles.helpTitle}>We’re here to help</Text>
              <Text style={styles.helpBody}>
                Send us the phone number on your account and a short description. We reply
                within one working day, Monday to Saturday.
              </Text>
              <Pressable
                onPress={() =>
                  Linking.openURL("mailto:support@systio.land?subject=SystIO%20Land%20support")
                }
                style={styles.emailButton}
                accessibilityRole="button"
                accessibilityLabel="Email support"
              >
                <Mail size={14} color={colors.white} />
                <Text style={styles.emailButtonText}>Email support</Text>
              </Pressable>
              <Text style={styles.helpEmail}>support@systio.land</Text>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Common questions</Text>
            </View>
            <View style={styles.faqCard}>
              {HELP_FAQS.map((faq, index) => {
                const open = openFaq === index;
                return (
                  <View
                    key={faq.q}
                    style={[
                      styles.faqItem,
                      index === HELP_FAQS.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <Pressable
                      onPress={() => setOpenFaq(open ? null : index)}
                      style={styles.faqQuestion}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: open }}
                      accessibilityLabel={faq.q}
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

            <View style={styles.linkCard}>
              <ShieldCheck size={18} color={colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.linkTitle}>Safety tip</Text>
                <Text style={styles.linkBody}>
                  Never share OTPs. Verify property documents and visit the site before paying
                  any token or advance amount.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => navigation.navigate("Info", { kind: "terms" })}
              style={styles.rowLink}
              accessibilityRole="button"
              accessibilityLabel="Read terms of use"
            >
              <FileText size={17} color={colors.body} />
              <Text style={styles.rowLinkText}>Read the terms of use</Text>
              <ChevronRight size={15} color={colors.faint} />
            </Pressable>
          </>
        ) : null}

        {kind === "about" ? (
          <>
            <View style={styles.aboutHero}>
              <View style={styles.aboutMark}>
                <LandPlot size={30} color={colors.white} strokeWidth={1.9} />
              </View>
              <Text style={styles.aboutName}>{APP_NAME}</Text>
              <Text style={styles.aboutTagline}>Verified land. Direct conversations.</Text>
              <View style={styles.versionPill}>
                <Text style={styles.versionText}>v1.0.0</Text>
                {isDemo ? <Text style={styles.demoText}> · DEMO MODE</Text> : null}
              </View>
            </View>

            <Text style={styles.aboutBody}>
              SystIO Land is a property marketplace built for the way land is actually bought
              and sold in India. Owners and brokers publish plots, homes, farm land and
              commercial spaces with exact map pins, real photos and plot boundaries — while
              buyers browse a verified feed and contact sellers directly, without brokerage.
            </Text>

            <View style={styles.aboutGrid}>
              <AboutFeature
                icon={<MapPinned size={19} color={colors.primary} />}
                title="Pinned, not guessed"
                body="Every property has an exact map position and optional boundary."
              />
              <AboutFeature
                icon={<UserCheck size={19} color={colors.violet} />}
                title="Human reviewed"
                body="An admin checks every listing before it reaches the feed."
              />
              <AboutFeature
                icon={<Sparkles size={19} color={colors.goldDeep} />}
                title="First listing free"
                body="Start with no fee, then ₹100 per additional property."
              />
              <AboutFeature
                icon={<ShieldCheck size={19} color={colors.success} />}
                title="No buyer brokerage"
                body="Buyers and sellers talk directly. SystIO Land stays out of the deal."
              />
            </View>

            <View style={styles.aboutCard}>
              <Text style={styles.aboutCardTitle}>Built for India</Text>
              <Text style={styles.aboutCardBody}>
                Area units include square feet, square metres, acres, kattha, dismil and bigha.
                Prices are shown in Indian formats, and payments are processed in INR by
                Razorpay.
              </Text>
            </View>

            <Pressable
              onPress={() =>
                Linking.openURL("mailto:support@systio.land?subject=About%20SystIO%20Land")
              }
              style={styles.rowLink}
              accessibilityRole="button"
              accessibilityLabel="Contact SystIO Land"
            >
              <Mail size={17} color={colors.body} />
              <Text style={styles.rowLinkText}>support@systio.land</Text>
              <ChevronRight size={15} color={colors.faint} />
            </Pressable>

            <Text style={styles.copyright}>
              © 2026 SystIO Land. Made in India. All rights reserved.
            </Text>
          </>
        ) : null}

        {kind === "terms" || kind === "privacy" ? (
          <>
            <View style={styles.legalIntro}>
              <Text style={styles.legalUpdated}>LAST UPDATED · NOVEMBER 2026</Text>
              <Text style={styles.legalIntroText}>
                {kind === "terms"
                  ? "These terms explain how SystIO Land works for sellers and buyers. By creating an account or publishing a listing, you agree to them."
                  : "This policy explains what we collect, why we collect it and the choices you have. We keep it short and in plain language."}
              </Text>
            </View>

            {(kind === "terms" ? TERMS : PRIVACY).map((section) => (
              <View key={section.title} style={styles.legalSection}>
                <Text style={styles.legalTitle}>{section.title}</Text>
                <Text style={styles.legalBody}>{section.body}</Text>
              </View>
            ))}

            {kind === "terms" ? (
              <Pressable
                onPress={() => navigation.navigate("Info", { kind: "privacy" })}
                style={styles.rowLink}
                accessibilityRole="button"
                accessibilityLabel="Read privacy policy"
              >
                <ShieldCheck size={17} color={colors.body} />
                <Text style={styles.rowLinkText}>Read the privacy policy</Text>
                <ChevronRight size={15} color={colors.faint} />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => navigation.navigate("Info", { kind: "terms" })}
                style={styles.rowLink}
                accessibilityRole="button"
                accessibilityLabel="Read terms of use"
              >
                <FileText size={17} color={colors.body} />
                <Text style={styles.rowLinkText}>Read the terms of use</Text>
                <ChevronRight size={15} color={colors.faint} />
              </Pressable>
            )}

            <Text style={styles.copyright}>Questions? support@systio.land</Text>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function AboutFeature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.aboutFeature}>
      <View style={styles.aboutFeatureIcon}>{icon}</View>
      <Text style={styles.aboutFeatureTitle}>{title}</Text>
      <Text style={styles.aboutFeatureBody}>{body}</Text>
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
  helpHero: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: spacing.xl,
    ...shadow.soft,
  },
  helpIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.4,
    marginTop: 10,
  },
  helpBody: {
    fontSize: 10.5,
    lineHeight: 16,
    color: colors.muted,
    textAlign: "center",
    marginTop: 5,
    maxWidth: 300,
  },
  emailButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: 15,
    paddingVertical: 9,
    marginTop: 13,
  },
  emailButtonText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "800",
  },
  helpEmail: {
    fontSize: 9.5,
    color: colors.faint,
    marginTop: 7,
  },
  sectionHeader: {
    marginTop: spacing.xxl,
    marginBottom: 9,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.4,
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
  linkCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: colors.successSoft,
    borderRadius: radii.md,
    padding: 12,
    marginTop: 14,
  },
  linkTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.ink,
  },
  linkBody: {
    fontSize: 9.5,
    lineHeight: 14,
    color: colors.muted,
    marginTop: 2,
  },
  rowLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    paddingHorizontal: 12,
    paddingVertical: 13,
    marginTop: 10,
  },
  rowLinkText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: "700",
    color: colors.body,
  },
  aboutHero: {
    alignItems: "center",
    paddingVertical: 16,
  },
  aboutMark: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  aboutName: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.9,
    marginTop: 12,
  },
  aboutTagline: {
    fontSize: 10.5,
    color: colors.muted,
    marginTop: 2,
    fontWeight: "500",
  },
  versionPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  versionText: {
    fontSize: 8.5,
    fontWeight: "800",
    color: colors.muted,
  },
  demoText: {
    fontSize: 8,
    fontWeight: "900",
    color: colors.warning,
  },
  aboutBody: {
    fontSize: 11.5,
    lineHeight: 18,
    color: colors.body,
    marginTop: 4,
  },
  aboutGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginTop: spacing.xl,
  },
  aboutFeature: {
    width: "48.6%",
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 12,
  },
  aboutFeatureIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  aboutFeatureTitle: {
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.ink,
    marginTop: 8,
  },
  aboutFeatureBody: {
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.muted,
    marginTop: 2,
  },
  aboutCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 14,
    marginTop: 12,
  },
  aboutCardTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.ink,
  },
  aboutCardBody: {
    fontSize: 10,
    lineHeight: 15,
    color: colors.muted,
    marginTop: 3,
  },
  copyright: {
    fontSize: 8.5,
    color: colors.faint,
    textAlign: "center",
    marginTop: spacing.xxl,
    lineHeight: 13,
  },
  legalIntro: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 13,
  },
  legalUpdated: {
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: colors.faint,
  },
  legalIntroText: {
    fontSize: 10.5,
    lineHeight: 16,
    color: colors.body,
    marginTop: 6,
  },
  legalSection: {
    marginTop: spacing.xl,
  },
  legalTitle: {
    fontSize: 12.5,
    fontWeight: "900",
    color: colors.ink,
  },
  legalBody: {
    fontSize: 10.5,
    lineHeight: 17,
    color: colors.muted,
    marginTop: 4,
  },
});
