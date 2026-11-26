import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  ClipboardCheck,
  IndianRupee,
  LandPlot,
  ListChecks,
  LogOut,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react-native";

import {
  AdminFilterChip,
  AdminHeaderButton,
  AdminMetric,
  AdminPill,
  AdminSectionHeader,
  AdminShell,
} from "../../components/admin/AdminUI";
import { colors, radii, shadow, spacing } from "../../constants/theme";
import { useAdmin } from "../../context/AdminContext";
import { useAuth } from "../../context/AuthContext";
import type { AdminStackParamList, AdminTabParamList } from "../../navigation/types";
import { formatPrice, formatPriceFull, timeAgo } from "../../utils/format";

type Props = CompositeScreenProps<
  BottomTabScreenProps<AdminTabParamList, "Overview">,
  NativeStackScreenProps<AdminStackParamList>
>;

export function AdminOverviewScreen({ navigation }: Props) {
  const { profile, signOut, isDemo } = useAuth();
  const { stats, pending, data, loading, refreshing, refresh, error } = useAdmin();

  const confirmSignOut = () => {
    Alert.alert(
      "Sign out of admin?",
      "You will return to the welcome screen. User accounts stay signed out.",
      [
        { text: "Stay", style: "cancel" },
        { text: "Sign out", style: "destructive", onPress: () => signOut() },
      ]
    );
  };

  const recentProperties = data.properties.slice(0, 4);
  const recentPayments = data.payments.slice(0, 3);
  const oldest = pending[0];
  const mixTotal = Math.max(1, stats.totalListings);
  const approvedPct = Math.round((stats.approved / mixTotal) * 100);
  const pendingPct = Math.round((stats.pending / mixTotal) * 100);
  const declinedPct = Math.max(0, 100 - approvedPct - pendingPct);
  const firstName = profile?.name?.split(" ")[0] ?? "Admin";

  return (
    <AdminShell
      title={`Good to see you, ${firstName}.`}
      subtitle="The live pulse of listings, people and listing-fee revenue."
      right={
        <AdminHeaderButton
          icon={<LogOut size={17} color={colors.white} />}
          onPress={confirmSignOut}
          label="Sign out of admin"
        />
      }
    >
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading the console…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          <View style={styles.dateRow}>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </Text>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE DATA</Text>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={refresh} accessibilityRole="button">
                <Text style={styles.errorRetry}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          {pending.length ? (
            <Pressable
              onPress={() => navigation.navigate("Approvals")}
              accessibilityRole="button"
              accessibilityLabel={`Review ${pending.length} pending listings`}
              style={({ pressed }) => [styles.pendingBanner, pressed && { opacity: 0.9 }]}
            >
              <View style={styles.pendingIcon}>
                <Clock size={22} color="#6B4B08" strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pendingLabel}>WAITING FOR REVIEW</Text>
                <Text style={styles.pendingTitle}>
                  {pending.length} {pending.length === 1 ? "listing needs" : "listings need"} your
                  decision
                </Text>
                <Text style={styles.pendingSub}>
                  Oldest submitted {oldest ? timeAgo(oldest.created_at) : "recently"} ·{" "}
                  {oldest ? oldest.city : ""}
                </Text>
              </View>
              <View style={styles.pendingArrow}>
                <ArrowUpRight size={17} color="#5C4107" />
              </View>
            </Pressable>
          ) : (
            <View style={styles.clearedBanner}>
              <View style={styles.clearedIcon}>
                <CheckCircle2 size={20} color={colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.clearedTitle}>Approval queue is clear</Text>
                <Text style={styles.clearedSub}>
                  New submissions will appear here the moment they’re paid for.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.metricsGrid}>
            <AdminMetric
              icon={<LandPlot size={17} color={colors.ink} />}
              label="Total listings"
              value={String(stats.totalListings)}
              sub={`${stats.approved} live in the feed`}
              onPress={() => navigation.navigate("AdminListings")}
            />
            <AdminMetric
              icon={<Clock size={17} color={colors.goldDeep} />}
              label="Pending review"
              value={String(stats.pending)}
              sub="Needs a decision"
              tone="gold"
              onPress={() => navigation.navigate("Approvals")}
            />
            <AdminMetric
              icon={<Users size={17} color={colors.violet} />}
              label="People"
              value={String(stats.totalUsers)}
              sub={`${stats.owners} owners · ${stats.brokers} brokers · ${stats.browsers} browsers`}
              tone="violet"
              onPress={() => navigation.navigate("Users")}
            />
            <AdminMetric
              icon={<IndianRupee size={17} color={colors.success} />}
              label="Listing revenue"
              value={formatPriceFull(stats.revenue)}
              sub={`${stats.paidListings} paid · ${stats.freeListings} free`}
              tone="success"
              onPress={() => navigation.navigate("Payments")}
            />
          </View>

          <AdminSectionHeader
            title="Marketplace mix"
            sub="Approved, pending and declined across all time."
          />
          <View style={styles.mixCard}>
            <View style={styles.mixBar}>
              <View style={[styles.mixSegment, { width: `${approvedPct}%`, backgroundColor: colors.success }]} />
              <View style={[styles.mixSegment, { width: `${pendingPct}%`, backgroundColor: colors.gold }]} />
              <View
                style={[styles.mixSegment, { width: `${declinedPct}%`, backgroundColor: colors.danger }]}
              />
            </View>
            <View style={styles.mixLegend}>
              <MixStat color={colors.success} label="Approved" value={stats.approved} pct={approvedPct} />
              <MixStat color={colors.gold} label="Pending" value={stats.pending} pct={pendingPct} />
              <MixStat color={colors.danger} label="Declined" value={stats.declined} pct={declinedPct} />
            </View>
          </View>

          <AdminSectionHeader
            title="Review queue"
            sub="Oldest submissions first."
            actionLabel={pending.length ? "Open queue" : undefined}
            onAction={pending.length ? () => navigation.navigate("Approvals") : undefined}
          />
          {pending.length ? (
            <View style={styles.queueList}>
              {pending.slice(0, 3).map((property) => (
                <Pressable
                  key={property.id}
                  onPress={() => navigation.navigate("AdminPropertyDetail", { id: property.id })}
                  style={({ pressed }) => [styles.queueCard, pressed && { opacity: 0.85 }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Review ${property.title}`}
                >
                  <Image source={{ uri: property.images[0] }} style={styles.queueImage} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.queueTitle} numberOfLines={2}>
                      {property.title}
                    </Text>
                    <Text style={styles.queueMeta} numberOfLines={1}>
                      {property.owner_name} · {property.locality}, {property.city}
                    </Text>
                    <View style={styles.queueBottom}>
                      <Text style={styles.queuePrice}>
                        {formatPrice(property.price, property.listing_type)}
                      </Text>
                      <Text style={styles.queueTime}>{timeAgo(property.created_at)}</Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color={colors.faint} />
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.emptyQueue}>
              <ShieldCheck size={24} color={colors.success} />
              <Text style={styles.emptyQueueText}>
                Nothing to review. The feed is up to date.
              </Text>
            </View>
          )}

          <AdminSectionHeader
            title="Latest activity"
            sub="Newest listings and payments."
            actionLabel="All listings"
            onAction={() => navigation.navigate("AdminListings")}
          />
          <View style={styles.activityCard}>
            {recentProperties.map((property, index) => (
              <Pressable
                key={property.id}
                onPress={() => navigation.navigate("AdminPropertyDetail", { id: property.id })}
                style={[
                  styles.activityRow,
                  index === recentProperties.length - 1 && { borderBottomWidth: 0 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={property.title}
              >
                <View
                  style={[
                    styles.activityDot,
                    {
                      backgroundColor:
                        property.status === "approved"
                          ? colors.successSoft
                          : property.status === "pending"
                            ? colors.goldSoft
                            : property.status === "declined"
                              ? colors.dangerSoft
                              : colors.lineSoft,
                    },
                  ]}
                >
                  {property.status === "approved" ? (
                    <CheckCircle2 size={12} color={colors.success} />
                  ) : (
                    <LandPlot size={12} color={colors.muted} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTitle} numberOfLines={1}>
                    {property.title}
                  </Text>
                  <Text style={styles.activityMeta}>
                    {property.owner_name} · {timeAgo(property.created_at)}
                  </Text>
                </View>
                <AdminPill
                  label={property.status.toUpperCase()}
                  tone={
                    property.status === "approved"
                      ? "success"
                      : property.status === "pending"
                        ? "gold"
                        : property.status === "declined"
                          ? "danger"
                          : "neutral"
                  }
                />
              </Pressable>
            ))}
          </View>

          <AdminSectionHeader
            title="Recent payments"
            sub="Listing fees processed through Razorpay."
            actionLabel="All payments"
            onAction={() => navigation.navigate("Payments")}
          />
          <View style={styles.paymentsCard}>
            {recentPayments.length ? (
              recentPayments.map((payment, index) => (
                <View
                  key={payment.id}
                  style={[
                    styles.paymentRow,
                    index === recentPayments.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View
                    style={[
                      styles.paymentIcon,
                      {
                        backgroundColor:
                          payment.kind === "free_listing" ? colors.goldSoft : colors.successSoft,
                      },
                    ]}
                  >
                    {payment.kind === "free_listing" ? (
                      <Sparkles size={14} color={colors.goldDeep} />
                    ) : (
                      <IndianRupee size={14} color={colors.success} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.paymentTitle} numberOfLines={1}>
                      {payment.user_name ?? "SystIO user"} · {payment.property_title ?? "Listing"}
                    </Text>
                    <Text style={styles.paymentMeta}>
                      {payment.kind === "free_listing" ? "Free listing" : "Listing fee"} ·{" "}
                      {timeAgo(payment.paid_at ?? payment.created_at)}
                    </Text>
                  </View>
                  <Text style={styles.paymentAmount}>
                    {payment.kind === "free_listing" ? "FREE" : formatPriceFull(payment.amount / 100)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noPayments}>No payments yet.</Text>
            )}
          </View>

          <View style={styles.quickGrid}>
            <QuickAction
              icon={<ClipboardCheck size={18} color={colors.primary} />}
              title="Approvals"
              sub={`${stats.pending} waiting`}
              onPress={() => navigation.navigate("Approvals")}
            />
            <QuickAction
              icon={<ListChecks size={18} color={colors.info} />}
              title="Listings"
              sub={`${stats.totalListings} total`}
              onPress={() => navigation.navigate("AdminListings")}
            />
            <QuickAction
              icon={<Users size={18} color={colors.violet} />}
              title="Users"
              sub={`${stats.totalUsers} accounts`}
              onPress={() => navigation.navigate("Users")}
            />
            <QuickAction
              icon={<TrendingUp size={18} color={colors.success} />}
              title="Payments"
              sub={`${stats.paidListings + stats.freeListings} receipts`}
              onPress={() => navigation.navigate("Payments")}
            />
          </View>

          <View style={styles.footerCard}>
            <ShieldCheck size={15} color={colors.goldDeep} />
            <Text style={styles.footerText}>
              Signed in as {profile?.email ?? "admin"} ·{" "}
              {isDemo ? "Demo mode, all actions stay on this device." : "Live production workspace."}
            </Text>
          </View>
        </ScrollView>
      )}
    </AdminShell>
  );
}

function MixStat({
  color,
  label,
  value,
  pct,
}: {
  color: string;
  label: string;
  value: number;
  pct: number;
}) {
  return (
    <View style={styles.mixStat}>
      <View style={[styles.mixDot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.mixLabel}>{label}</Text>
        <Text style={styles.mixValue}>
          {value} · {pct}%
        </Text>
      </View>
    </View>
  );
}

function QuickAction({
  icon,
  title,
  sub,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${sub}`}
      style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.8 }]}
    >
      <View style={styles.quickIcon}>{icon}</View>
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickSub}>{sub}</Text>
      <ChevronRight size={13} color={colors.faint} style={{ position: "absolute", right: 10, top: 12 }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 14,
    paddingBottom: 36,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  loadingText: {
    fontSize: 10.5,
    color: colors.muted,
    fontWeight: "500",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
  },
  dateText: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: "600",
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.successSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.success,
  },
  liveText: {
    fontSize: 6.5,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: colors.success,
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.md,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 9.5,
    color: colors.danger,
    lineHeight: 14,
  },
  errorRetry: {
    fontSize: 9.5,
    fontWeight: "900",
    color: colors.danger,
    textDecorationLine: "underline",
  },
  pendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: colors.goldSoft,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#F0DDA8",
    padding: 13,
    marginBottom: 12,
  },
  pendingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  pendingLabel: {
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.7,
    color: colors.goldDeep,
  },
  pendingTitle: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "#4F3806",
    marginTop: 2,
  },
  pendingSub: {
    fontSize: 8.5,
    color: "#8A6A20",
    marginTop: 2,
  },
  pendingArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  clearedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.successSoft,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#CDEEDB",
    padding: 12,
    marginBottom: 12,
  },
  clearedIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  clearedTitle: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#145C36",
  },
  clearedSub: {
    fontSize: 8.5,
    color: "#2C7450",
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  mixCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 13,
    ...shadow.soft,
  },
  mixBar: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: colors.canvasDeep,
  },
  mixSegment: {
    height: 8,
  },
  mixLegend: {
    flexDirection: "row",
    gap: 8,
    marginTop: 11,
  },
  mixStat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
  },
  mixDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginTop: 3,
  },
  mixLabel: {
    fontSize: 8,
    color: colors.muted,
    fontWeight: "600",
  },
  mixValue: {
    fontSize: 10.5,
    color: colors.ink,
    fontWeight: "900",
    marginTop: 1,
  },
  queueList: {
    gap: 8,
  },
  queueCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 9,
  },
  queueImage: {
    width: 54,
    height: 54,
    borderRadius: radii.sm,
    backgroundColor: colors.canvasDeep,
  },
  queueTitle: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  queueMeta: {
    fontSize: 8,
    color: colors.muted,
    marginTop: 2,
  },
  queueBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 3,
  },
  queuePrice: {
    fontSize: 10,
    fontWeight: "900",
    color: colors.primary,
  },
  queueTime: {
    fontSize: 7.5,
    color: colors.faint,
    fontWeight: "600",
  },
  emptyQueue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 14,
  },
  emptyQueueText: {
    flex: 1,
    fontSize: 10,
    color: colors.muted,
  },
  activityCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    paddingHorizontal: 12,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  activityDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  activityTitle: {
    fontSize: 10.5,
    fontWeight: "700",
    color: colors.ink,
  },
  activityMeta: {
    fontSize: 8,
    color: colors.muted,
    marginTop: 1,
  },
  paymentsCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    paddingHorizontal: 12,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  paymentIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentTitle: {
    fontSize: 9.5,
    fontWeight: "700",
    color: colors.ink,
  },
  paymentMeta: {
    fontSize: 8,
    color: colors.muted,
    marginTop: 1,
  },
  paymentAmount: {
    fontSize: 10,
    fontWeight: "900",
    color: colors.ink,
  },
  noPayments: {
    fontSize: 10,
    color: colors.faint,
    paddingVertical: 16,
    textAlign: "center",
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginTop: spacing.xxl,
  },
  quickCard: {
    width: "48.5%",
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 12,
  },
  quickIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  quickTitle: {
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.ink,
    marginTop: 8,
  },
  quickSub: {
    fontSize: 8.5,
    color: colors.muted,
    marginTop: 1,
  },
  footerCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    backgroundColor: colors.goldSoft,
    borderRadius: radii.md,
    padding: 11,
    marginTop: spacing.xl,
  },
  footerText: {
    flex: 1,
    fontSize: 8.5,
    lineHeight: 13,
    color: "#7A5A12",
  },
});
