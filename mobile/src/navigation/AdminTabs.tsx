import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ClipboardCheck,
  IndianRupee,
  LayoutDashboard,
  ListChecks,
  Users,
} from "lucide-react-native";

import { colors } from "../constants/theme";
import { useAdmin } from "../context/AdminContext";
import type { AdminTabParamList } from "./types";
import { AdminApprovalsScreen } from "../screens/admin/AdminApprovalsScreen";
import { AdminListingsScreen } from "../screens/admin/AdminListingsScreen";
import { AdminOverviewScreen } from "../screens/admin/AdminOverviewScreen";
import { AdminPaymentsScreen } from "../screens/admin/AdminPaymentsScreen";
import { AdminUsersScreen } from "../screens/admin/AdminUsersScreen";

const Tab = createBottomTabNavigator<AdminTabParamList>();

export function AdminTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Overview"
      tabBar={(props) => <AdminTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Tab.Screen name="Overview" component={AdminOverviewScreen} options={{ title: "Overview" }} />
      <Tab.Screen
        name="Approvals"
        component={AdminApprovalsScreen}
        options={{ title: "Approvals" }}
      />
      <Tab.Screen
        name="AdminListings"
        component={AdminListingsScreen}
        options={{ title: "Listings" }}
      />
      <Tab.Screen name="Users" component={AdminUsersScreen} options={{ title: "Users" }} />
      <Tab.Screen
        name="Payments"
        component={AdminPaymentsScreen}
        options={{ title: "Payments" }}
      />
    </Tab.Navigator>
  );
}

function AdminTabIcon({ name, color }: { name: string; color: string }) {
  if (name === "Overview") return <LayoutDashboard size={19} color={color} strokeWidth={2.2} />;
  if (name === "Approvals") return <ClipboardCheck size={19} color={color} strokeWidth={2.2} />;
  if (name === "AdminListings") return <ListChecks size={19} color={color} strokeWidth={2.2} />;
  if (name === "Users") return <Users size={19} color={color} strokeWidth={2.2} />;
  return <IndianRupee size={19} color={color} strokeWidth={2.2} />;
}

function AdminTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { pending } = useAdmin();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const options = descriptors[route.key]?.options;
        const label =
          typeof options?.tabBarLabel === "string"
            ? options.tabBarLabel
            : options?.title ?? route.name;
        const color = focused ? colors.gold : "#85858C";
        const showBadge = route.name === "Approvals" && pending.length > 0;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={() =>
              navigation.emit({ type: "tabLongPress", target: route.key })
            }
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={`${label} admin tab`}
            style={styles.tab}
          >
            {focused ? <View style={styles.activeLine} /> : null}
            <View style={styles.iconWrap}>
              <AdminTabIcon name={route.name} color={color} />
              {showBadge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {pending.length > 9 ? "9+" : pending.length}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text
              style={[styles.label, { color }, focused && styles.labelActive]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#17181B",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingTop: 9,
    paddingHorizontal: 2,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingBottom: 2,
  },
  activeLine: {
    position: "absolute",
    top: -9,
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.gold,
  },
  iconWrap: {
    width: 28,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 7.2,
    fontWeight: "600",
    letterSpacing: 0.15,
  },
  labelActive: {
    fontWeight: "900",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: "#17181B",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  badgeText: {
    fontSize: 6,
    fontWeight: "900",
    color: colors.white,
  },
});
