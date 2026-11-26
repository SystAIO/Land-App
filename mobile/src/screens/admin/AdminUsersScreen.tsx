import React, { useMemo, useState } from "react";
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  IndianRupee,
  Mail,
  Phone,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react-native";

import { Avatar } from "../../components/Avatar";
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
import type { Profile, Property } from "../../types";
import { formatDate, formatPhone, formatPrice } from "../../utils/format";
import { roleLabelUpper } from "../../utils/roles";

type Props = CompositeScreenProps<
  BottomTabScreenProps<AdminTabParamList, "Users">,
  NativeStackScreenProps<AdminStackParamList>
>;

type RoleFilter = "all" | "owner" | "broker" | "browse";

export function AdminUsersScreen({ navigation }: Props) {
  const { data, stats, refreshing, refresh, error } = useAdmin();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const users = useMemo(() => data.profiles.filter((entry) => entry.role !== "admin"), [data.profiles]);
  const propertiesByOwner = useMemo(() => {
    const map = new Map<string, Property[]>();
    data.properties.forEach((property) => {
      const existing = map.get(property.owner_id) ?? [];
      existing.push(property);
      map.set(property.owner_id, existing);
    });
    return map;
  }, [data.properties]);

  const spendByUser = useMemo(() => {
    const map = new Map<string, number>();
    data.payments
      .filter((payment) => payment.status === "paid")
      .forEach((payment) => {
        map.set(payment.user_id, (map.get(payment.user_id) ?? 0) + payment.amount / 100);
      });
    return map;
  }, [data.payments]);

  const counts = useMemo(
    () => ({
      all: users.length,
      owner: users.filter((user) => user.role === "owner").length,
      broker: users.filter((user) => user.role === "broker").length,
      browse: users.filter((user) => user.role === "browse").length,
    }),
    [users]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      if (role !== "all" && user.role !== role) return false;
      if (!term) return true;
      return [user.name, user.phone ?? "", user.email ?? ""].join(" ").toLowerCase().includes(term);
    });
  }, [role, search, users]);

  const freeUsed = users.filter((user) => user.free_listing_used).length;

  return (
    <AdminShell
      title="People"
      subtitle="Owners, brokers, browsers and the listings they bring to the marketplace."
      right={
        <View style={styles.countPill}>
          <Users size={12} color={colors.gold} />
          <Text style={styles.countText}>{users.length} ACCOUNTS</Text>
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
        <View style={styles.summaryCard}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryValue}>{stats.owners}</Text>
            <Text style={styles.summaryLabel}>Owners</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStat}>
            <Text style={styles.summaryValue}>{stats.brokers}</Text>
            <Text style={styles.summaryLabel}>Brokers</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStat}>
            <Text style={styles.summaryValue}>{stats.browsers}</Text>
            <Text style={styles.summaryLabel}>Browsers</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStat}>
            <View style={styles.summaryFreeRow}>
              <Sparkles size={11} color={colors.goldDeep} />
              <Text style={styles.summaryValue}>{freeUsed}</Text>
            </View>
            <Text style={styles.summaryLabel}>Free used</Text>
          </View>
        </View>

        <AdminSearch
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, phone or email"
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          <AdminFilterChip
            label="Everyone"
            count={counts.all}
            active={role === "all"}
            onPress={() => setRole("all")}
          />
          <AdminFilterChip
            label="Owners"
            count={counts.owner}
            active={role === "owner"}
            onPress={() => setRole("owner")}
            tone="success"
          />
          <AdminFilterChip
            label="Brokers"
            count={counts.broker}
            active={role === "broker"}
            onPress={() => setRole("broker")}
            tone="danger"
          />
          <AdminFilterChip
            label="Browsers"
            count={counts.browse}
            active={role === "browse"}
            onPress={() => setRole("browse")}
            tone="gold"
          />
        </ScrollView>

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
            {filtered.map((user) => {
              const listings = propertiesByOwner.get(user.id) ?? [];
              const spend = spendByUser.get(user.id) ?? 0;
              const expanded = expandedId === user.id;
              return (
                <UserCard
                  key={user.id}
                  user={user}
                  listings={listings}
                  spend={spend}
                  expanded={expanded}
                  onToggle={() => setExpandedId(expanded ? null : user.id)}
                  onOpenProperty={(id) =>
                    navigation.navigate("AdminPropertyDetail", { id })
                  }
                />
              );
            })}
          </View>
        ) : (
          <EmptyState
            compact
            icon={<UserRound size={26} color={colors.primary} />}
            title="No users match"
            body="Try another name, phone number or account type."
            actionLabel="Clear filters"
            onAction={() => {
              setSearch("");
              setRole("all");
            }}
          />
        )}

        <View style={styles.noteCard}>
          <BadgeCheck size={15} color={colors.violet} />
          <Text style={styles.noteText}>
            Phone numbers are verified at sign-up. Open a user to see their property history and
            contact them directly if a listing needs clarification.
          </Text>
        </View>
      </ScrollView>
    </AdminShell>
  );
}

function UserCard({
  user,
  listings,
  spend,
  expanded,
  onToggle,
  onOpenProperty,
}: {
  user: Profile;
  listings: Property[];
  spend: number;
  expanded: boolean;
  onToggle: () => void;
  onOpenProperty: (id: string) => void;
}) {
  const approved = listings.filter((property) => property.status === "approved").length;
  const pending = listings.filter((property) => property.status === "pending").length;
  const phone = user.phone ? `+91 ${formatPhone(user.phone)}` : null;

  return (
    <View style={styles.userCard}>
      <Pressable
        onPress={onToggle}
        style={styles.userHeader}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${user.name}, ${user.role}`}
      >
        <Avatar name={user.name || "SystIO user"} role={user.role} size={44} />
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {user.name || "Unnamed user"}
            </Text>
            <AdminPill
              label={roleLabelUpper(user.role)}
              tone={
                user.role === "broker" ? "danger" : user.role === "browse" ? "info" : "success"
              }
            />
          </View>
          <Text style={styles.userMeta}>
            {phone ?? "No phone"} · joined {formatDate(user.created_at)}
          </Text>
          <View style={styles.userStats}>
            <Text style={styles.userStat}>
              <Text style={styles.userStatStrong}>{listings.length}</Text> listings
            </Text>
            <Text style={styles.userStatDot}>·</Text>
            <Text style={styles.userStat}>
              <Text style={styles.userStatStrong}>{approved}</Text> live
            </Text>
            {pending ? (
              <>
                <Text style={styles.userStatDot}>·</Text>
                <Text style={[styles.userStat, { color: colors.goldDeep }]}>
                  <Text style={styles.userStatStrong}>{pending}</Text> pending
                </Text>
              </>
            ) : null}
            {spend > 0 ? (
              <>
                <Text style={styles.userStatDot}>·</Text>
                <Text style={styles.userStat}>
                  <Text style={styles.userStatStrong}>₹{spend}</Text> paid
                </Text>
              </>
            ) : null}
          </View>
        </View>
        <View style={styles.chevron}>
          {expanded ? (
            <ChevronUp size={16} color={colors.muted} />
          ) : (
            <ChevronDown size={16} color={colors.muted} />
          )}
        </View>
      </Pressable>

      <View style={styles.badgeRow}>
        <View
          style={[
            styles.freePill,
            {
              backgroundColor: user.free_listing_used ? colors.lineSoft : colors.goldSoft,
            },
          ]}
        >
          <Sparkles
            size={9}
            color={user.free_listing_used ? colors.faint : colors.goldDeep}
          />
          <Text
            style={[
              styles.freePillText,
              { color: user.free_listing_used ? colors.faint : colors.goldDeep },
            ]}
          >
            {user.free_listing_used ? "FREE BENEFIT USED" : "FREE LISTING AVAILABLE"}
          </Text>
        </View>
        {user.email ? (
          <View style={styles.emailPill}>
            <Mail size={9} color={colors.muted} />
            <Text style={styles.emailPillText} numberOfLines={1}>
              {user.email}
            </Text>
          </View>
        ) : null}
      </View>

      {expanded ? (
        <View style={styles.expanded}>
          <View style={styles.contactRow}>
            {phone ? (
              <Pressable
                onPress={() => Linking.openURL(`tel:${user.phone?.replace(/\s/g, "")}`)}
                style={styles.contactButton}
                accessibilityRole="button"
                accessibilityLabel={`Call ${user.name}`}
              >
                <Phone size={13} color={colors.success} />
                <Text style={styles.contactText}>Call</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() =>
                Linking.openURL(
                  `mailto:${user.email ?? "support@systio.land"}?subject=SystIO%20Land%20account`
                )
              }
              style={styles.contactButton}
              accessibilityRole="button"
              accessibilityLabel={`Email ${user.name}`}
            >
              <Mail size={13} color={colors.info} />
              <Text style={styles.contactText}>Email</Text>
            </Pressable>
            <View style={styles.contactSpacer} />
            <View style={styles.spendPill}>
              <IndianRupee size={10} color={colors.muted} />
              <Text style={styles.spendText}>{spend} listing fees</Text>
            </View>
          </View>

          <Text style={styles.listingsLabel}>
            {listings.length ? "PROPERTIES" : "NO PROPERTIES YET"}
          </Text>
          {listings.length ? (
            <View style={styles.userListings}>
              {listings.slice(0, 4).map((property) => (
                <Pressable
                  key={property.id}
                  onPress={() => onOpenProperty(property.id)}
                  style={styles.userListing}
                  accessibilityRole="button"
                  accessibilityLabel={property.title}
                >
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          property.status === "approved"
                            ? colors.success
                            : property.status === "pending"
                              ? colors.gold
                              : property.status === "declined"
                                ? colors.danger
                                : colors.faint,
                      },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userListingTitle} numberOfLines={1}>
                      {property.title}
                    </Text>
                    <Text style={styles.userListingMeta}>
                      {property.city} · {formatPrice(property.price, property.listing_type)} ·{" "}
                      {property.status}
                    </Text>
                  </View>
                  <ChevronRight size={14} color={colors.faint} />
                </Pressable>
              ))}
              {listings.length > 4 ? (
                <Text style={styles.moreListings}>+{listings.length - 4} more properties</Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.noListings}>
              This user hasn’t created a property yet.
            </Text>
          )}
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
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    paddingVertical: 12,
    marginBottom: 12,
    ...shadow.soft,
  },
  summaryStat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  summaryLabel: {
    fontSize: 8,
    color: colors.muted,
    fontWeight: "600",
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.lineSoft,
  },
  summaryFreeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  filters: {
    gap: 6,
    paddingVertical: 10,
    paddingRight: 6,
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
    gap: 9,
  },
  userCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 11,
    ...shadow.soft,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  userName: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "900",
    color: colors.ink,
  },
  userMeta: {
    fontSize: 8.5,
    color: colors.muted,
    marginTop: 2,
  },
  userStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  userStat: {
    fontSize: 8,
    color: colors.muted,
    fontWeight: "500",
  },
  userStatStrong: {
    color: colors.ink,
    fontWeight: "900",
  },
  userStatDot: {
    fontSize: 8,
    color: colors.faint,
  },
  chevron: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  freePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  freePillText: {
    fontSize: 6.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  emailPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    flexShrink: 1,
  },
  emailPillText: {
    flexShrink: 1,
    fontSize: 7.5,
    color: colors.faint,
  },
  expanded: {
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    marginTop: 9,
    paddingTop: 9,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.canvas,
    borderRadius: radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  contactText: {
    fontSize: 8.5,
    fontWeight: "800",
    color: colors.body,
  },
  contactSpacer: {
    flex: 1,
  },
  spendPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  spendText: {
    fontSize: 7.5,
    color: colors.faint,
    fontWeight: "600",
  },
  listingsLabel: {
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: colors.faint,
    marginTop: 10,
    marginBottom: 5,
  },
  userListings: {
    gap: 2,
  },
  userListing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  userListingTitle: {
    fontSize: 9.5,
    fontWeight: "700",
    color: colors.ink,
  },
  userListingMeta: {
    fontSize: 7.5,
    color: colors.muted,
    marginTop: 1,
  },
  moreListings: {
    fontSize: 8,
    fontWeight: "700",
    color: colors.primary,
    marginTop: 3,
  },
  noListings: {
    fontSize: 9,
    color: colors.faint,
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    backgroundColor: colors.violetSoft,
    borderRadius: radii.md,
    padding: 11,
    marginTop: spacing.xl,
  },
  noteText: {
    flex: 1,
    fontSize: 8.5,
    lineHeight: 13,
    color: "#5646A8",
  },
});
