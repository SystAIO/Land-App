import React, { useMemo, useState } from "react";
import {
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
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Clock,
  IndianRupee,
  ReceiptText,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react-native";

import {
  AdminFilterChip,
  AdminPill,
  AdminSearch,
  AdminShell,
} from "../../components/admin/AdminUI";
import { EmptyState } from "../../components/EmptyState";
import { colors, radii, shadow, spacing } from "../../constants/theme";
import { useAdmin } from "../../context/AdminContext";
import type { AdminStackParamList, AdminTabParamList } from "../../navigation/types";
import type { Payment, PaymentStatus } from "../../types";
import { formatDate, formatPriceFull, timeAgo } from "../../utils/format";

type Props = CompositeScreenProps<
  BottomTabScreenProps<AdminTabParamList, "Payments">,
  NativeStackScreenProps<AdminStackParamList>
>;

type Filter = "all" | PaymentStatus;

function statusTone(status: PaymentStatus): "neutral" | "gold" | "success" | "danger" | "info" {
  if (status === "paid") return "success";
  if (status === "created") return "gold";
  if (status === "failed") return "danger";
  return "info";
}

export function AdminPaymentsScreen({ navigation }: Props) {
  const { data, stats, refreshing, refresh, error } = useAdmin();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const next: Record<Filter, number> = {
      all: data.payments.length,
      paid: 0,
      created: 0,
      failed: 0,
      refunded: 0,
    };
    data.payments.forEach((payment) => {
      next[payment.status] += 1;
    });
    return next;
  }, [data.payments]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return data.payments.filter((payment) => {
      if (filter !== "all" && payment.status !== filter) return false;
      if (!term) return true;
      return [
        payment.user_name ?? "",
        payment.property_title ?? "",
        payment.razorpay_order_id ?? "",
        payment.razorpay_payment_id ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [data.payments, filter, search]);

  const paidTotal = data.payments
    .filter((payment) => payment.status === "paid" && payment.kind === "listing_fee")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const average = stats.paidListings ? stats.revenue / stats.paidListings : 0;

  return (
    <AdminShell
      title="Payments"
      subtitle="Listing fees, free benefits and every Razorpay receipt in one place."
      right={
        <View style={styles.countPill}>
          <Wallet size={12} color={colors.gold} />
          <Text style={styles.countText}>{data.payments.length} RECEIPTS</Text>
        </View>
      }
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <LinearGradient
          colors={["#282A30", "#17181B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.revenueCard}
        >
          <View style={styles.revenueGlow} />
          <View style={styles.revenueTop}>
            <View>
              <Text style={styles.revenueEyebrow}>LISTING REVENUE</Text>
              <Text style={styles.revenueValue}>{formatPriceFull(paidTotal / 100)}</Text>
              <Text style={styles.revenueSub}>
                from {stats.paidListings} paid listing {stats.paidListings === 1 ? "fee" : "fees"}
              </Text>
            </View>
            <View style={styles.revenueIcon}>
              <TrendingUp size={19} color={colors.gold} />
            </View>
          </View>
          <View style={styles.revenueDivider} />
          <View style={styles.revenueStats}>
            <View style={styles.revenueStat}>
              <Text style={styles.revenueStatValue}>{stats.paidListings}</Text>
              <Text style={styles.revenueStatLabel}>Paid listings</Text>
            </View>
            <View style={styles.revenueStatDivider} />
            <View style={styles.revenueStat}>
              <Text style={styles.revenueStatValue}>{stats.freeListings}</Text>
              <Text style={styles.revenueStatLabel}>Free listings</Text>
            </View>
            <View style={styles.revenueStatDivider} />
            <View style={styles.revenueStat}>
              <Text style={styles.revenueStatValue}>{formatPriceFull(average)}</Text>
              <Text style={styles.revenueStatLabel}>Average fee</Text>
            </View>
          </View>
        </LinearGradient>

        <AdminSearch
          value={search}
          onChangeText={setSearch}
          placeholder="Search user, property or Razorpay ID"
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          <AdminFilterChip
            label="All"
            count={counts.all}
            active={filter === "all"}
            onPress={() => setFilter("all")}
          />
          <AdminFilterChip
            label="Paid"
            count={counts.paid}
            active={filter === "paid"}
            onPress={() => setFilter("paid")}
            tone="success"
          />
          <AdminFilterChip
            label="Pending"
            count={counts.created}
            active={filter === "created"}
            onPress={() => setFilter("created")}
            tone="gold"
          />
          <AdminFilterChip
            label="Failed"
            count={counts.failed}
            active={filter === "failed"}
            onPress={() => setFilter("failed")}
            tone="danger"
          />
          <AdminFilterChip
            label="Refunded"
            count={counts.refunded}
            active={filter === "refunded"}
            onPress={() => setFilter("refunded")}
          />
        </ScrollView>

        <View style={styles.resultRow}>
          <Text style={styles.resultText}>
            {filtered.length} {filtered.length === 1 ? "payment" : "payments"}
          </Text>
          <View style={styles.sortPill}>
            <Clock size={11} color={colors.muted} />
            <Text style={styles.sortText}>Newest first</Text>
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

        {filtered.length ? (
          <View style={styles.list}>
            {filtered.map((payment) => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                expanded={expandedId === payment.id}
                onToggle={() =>
                  setExpandedId(expandedId === payment.id ? null : payment.id)
                }
                onOpenProperty={
                  payment.property_id
                    ? () =>
                        navigation.navigate("AdminPropertyDetail", {
                          id: payment.property_id as string,
                        })
                    : undefined
                }
              />
            ))}
          </View>
        ) : (
          <EmptyState
            compact
            icon={<ReceiptText size={26} color={colors.primary} />}
            title="No matching payments"
            body={
              data.payments.length
                ? "Try another search term or payment status."
                : "Listing fees and free listing receipts will appear here."
            }
            actionLabel={search || filter !== "all" ? "Clear filters" : undefined}
            onAction={
              search || filter !== "all"
                ? () => {
                    setSearch("");
                    setFilter("all");
                  }
                : undefined
            }
          />
        )}

        <View style={styles.noteCard}>
          <CircleDollarSign size={15} color={colors.goldDeep} />
          <Text style={styles.noteText}>
            Every paid listing is ₹100, charged once. Free listings are one-time and never generate
            a charge. Refunds are completed from the Razorpay dashboard and reflected here.
          </Text>
        </View>
      </ScrollView>
    </AdminShell>
  );
}

function PaymentRow({
  payment,
  expanded,
  onToggle,
  onOpenProperty,
}: {
  payment: Payment;
  expanded: boolean;
  onToggle: () => void;
  onOpenProperty?: () => void;
}) {
  const isFree = payment.kind === "free_listing";
  return (
    <View style={styles.paymentCard}>
      <Pressable
        onPress={onToggle}
        style={styles.paymentHeader}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${isFree ? "Free listing" : formatPriceFull(payment.amount / 100)}, ${
          payment.user_name ?? "user"
        }`}
      >
        <View
          style={[
            styles.paymentIcon,
            { backgroundColor: isFree ? colors.goldSoft : colors.successSoft },
          ]}
        >
          {isFree ? (
            <Sparkles size={16} color={colors.goldDeep} />
          ) : (
            <IndianRupee size={16} color={colors.success} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.paymentTitleRow}>
            <Text style={styles.paymentUser} numberOfLines={1}>
              {payment.user_name ?? "SystIO user"}
            </Text>
            <AdminPill
              label={payment.status.toUpperCase()}
              tone={statusTone(payment.status)}
            />
          </View>
          <Text style={styles.paymentProperty} numberOfLines={1}>
            {payment.property_title ?? "Listing"} · {isFree ? "Free benefit" : "Listing fee"}
          </Text>
          <Text style={styles.paymentMeta}>
            {formatDate(payment.paid_at ?? payment.created_at)} ·{" "}
            {timeAgo(payment.paid_at ?? payment.created_at)}
          </Text>
        </View>
        <View style={styles.paymentAmountWrap}>
          <Text style={[styles.paymentAmount, isFree && { color: colors.goldDeep }]}>
            {isFree ? "FREE" : formatPriceFull(payment.amount / 100)}
          </Text>
          {expanded ? (
            <ChevronUp size={14} color={colors.faint} />
          ) : (
            <ChevronDown size={14} color={colors.faint} />
          )}
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.expanded}>
          <View style={styles.idRow}>
            <Text style={styles.idLabel}>ORDER ID</Text>
            <Text style={styles.idValue} numberOfLines={1}>
              {payment.razorpay_order_id ?? "—"}
            </Text>
          </View>
          <View style={styles.idRow}>
            <Text style={styles.idLabel}>PAYMENT ID</Text>
            <Text style={styles.idValue} numberOfLines={1}>
              {payment.razorpay_payment_id ?? "—"}
            </Text>
          </View>
          <View style={styles.idRow}>
            <Text style={styles.idLabel}>USER ID</Text>
            <Text style={styles.idValue} numberOfLines={1}>
              {payment.user_id}
            </Text>
          </View>
          <View style={styles.idRow}>
            <Text style={styles.idLabel}>AMOUNT</Text>
            <Text style={styles.idValue}>
              {formatPriceFull(payment.amount / 100)} {payment.currency.toUpperCase()}
            </Text>
          </View>
          {onOpenProperty ? (
            <Pressable
              onPress={onOpenProperty}
              style={styles.openProperty}
              accessibilityRole="button"
              accessibilityLabel="Open property"
            >
              <Text style={styles.openPropertyText}>Open property record</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 14,
    paddingBottom: 36,
  },
  countPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(246,196,106,0.13)",
    borderRadius: radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  countText: {
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: colors.gold,
  },
  revenueCard: {
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 12,
    overflow: "hidden",
    ...shadow.card,
  },
  revenueGlow: {
    position: "absolute",
    right: -34,
    top: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(246,196,106,0.1)",
  },
  revenueTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  revenueEyebrow: {
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.8,
    color: colors.gold,
  },
  revenueValue: {
    fontSize: 30,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: -1.1,
    marginTop: 3,
  },
  revenueSub: {
    fontSize: 8.5,
    color: "#A7A7AC",
    marginTop: 2,
  },
  revenueIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(246,196,106,0.13)",
    alignItems: "center",
    justifyContent: "center",
  },
  revenueDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginTop: 12,
    marginBottom: 10,
  },
  revenueStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  revenueStat: {
    flex: 1,
    alignItems: "center",
  },
  revenueStatValue: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.white,
  },
  revenueStatLabel: {
    fontSize: 7,
    color: "#9A9AA0",
    marginTop: 1,
  },
  revenueStatDivider: {
    width: 1,
    height: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  filters: {
    gap: 6,
    paddingVertical: 10,
    paddingRight: 6,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
  },
  resultText: {
    fontSize: 9,
    color: colors.muted,
    fontWeight: "600",
  },
  sortPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sortText: {
    fontSize: 8,
    color: colors.muted,
    fontWeight: "600",
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.md,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 9,
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
  list: {
    gap: 8,
  },
  paymentCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    ...shadow.soft,
  },
  paymentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 10,
  },
  paymentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  paymentUser: {
    flexShrink: 1,
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.ink,
  },
  paymentProperty: {
    fontSize: 8.5,
    color: colors.muted,
    marginTop: 1,
  },
  paymentMeta: {
    fontSize: 7.5,
    color: colors.faint,
    marginTop: 2,
  },
  paymentAmountWrap: {
    alignItems: "flex-end",
    gap: 4,
  },
  paymentAmount: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.ink,
  },
  expanded: {
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  idRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 3,
  },
  idLabel: {
    width: 70,
    fontSize: 6.5,
    fontWeight: "900",
    letterSpacing: 0.4,
    color: colors.faint,
  },
  idValue: {
    flex: 1,
    fontSize: 7.5,
    color: colors.body,
    fontWeight: "500",
  },
  openProperty: {
    marginTop: 6,
    backgroundColor: colors.primaryTint,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  openPropertyText: {
    fontSize: 8.5,
    fontWeight: "900",
    color: colors.primary,
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    backgroundColor: colors.goldSoft,
    borderRadius: radii.md,
    padding: 11,
    marginTop: spacing.xl,
  },
  noteText: {
    flex: 1,
    fontSize: 8.5,
    lineHeight: 13,
    color: "#7A5A12",
  },
});
