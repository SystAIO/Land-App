import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ClipboardList,
  Compass,
  Home,
  Plus,
  UserRound,
} from "lucide-react-native";

import { colors, brandGradient, shadow, spacing } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { useListings } from "../context/ListingsContext";
import type { RootStackParamList, TabParamList } from "./types";
import { HomeScreen } from "../screens/HomeScreen";
import { ExploreScreen } from "../screens/ExploreScreen";
import { MyListingsScreen } from "../screens/MyListingsScreen";
import { BrowseOnlyScreen } from "../screens/BrowseOnlyScreen";
import { ProfileScreen } from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator<TabParamList>();

export function AppTabs() {
  const { profile } = useAuth();
  const isBrowse = profile?.role === "browse";

  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
      <Tab.Screen name="Explore" component={ExploreScreen} options={{ title: "Explore" }} />
      <Tab.Screen
        name="Listings"
        component={isBrowse ? BrowseOnlyScreen : MyListingsScreen}
        options={{ title: "My Listings" }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}

function TabIcon({
  name,
  color,
  focused,
}: {
  name: string;
  color: string;
  focused: boolean;
}) {
  const strokeWidth = focused ? 2.5 : 2;
  if (name === "Home") return <Home size={21} color={color} strokeWidth={strokeWidth} />;
  if (name === "Explore") return <Compass size={21} color={color} strokeWidth={strokeWidth} />;
  if (name === "Listings")
    return <ClipboardList size={21} color={color} strokeWidth={strokeWidth} />;
  return <UserRound size={21} color={color} strokeWidth={strokeWidth} />;
}

function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { myProperties } = useListings();
  const pendingCount = myProperties.filter((property) => property.status === "pending").length;
  const rootNavigation =
    navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();

  const renderTab = (routeKey: string) => {
    const route = state.routes.find((entry) => entry.key === routeKey);
    if (!route) return null;
    const index = state.routes.findIndex((entry) => entry.key === routeKey);
    const focused = state.index === index;
    const options = descriptors[route.key]?.options;
    const label =
      typeof options?.tabBarLabel === "string"
        ? options.tabBarLabel
        : options?.title ?? route.name;
    const color = focused ? colors.primary : "#8C8C8C";
    const isListings = route.name === "Listings";

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
        accessibilityLabel={`${label} tab`}
        style={styles.tab}
      >
        <View style={styles.iconWrap}>
          <TabIcon name={route.name} color={color} focused={focused} />
          {isListings && pendingCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCount > 9 ? "9+" : pendingCount}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.label, { color }, focused && styles.labelActive]} numberOfLines={1}>
          {label}
        </Text>
        {focused ? <View style={styles.activeDot} /> : null}
      </Pressable>
    );
  };

  const openListProperty = () => {
    rootNavigation?.navigate("ListProperty");
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {renderTab(state.routes[0]?.key)}
      {renderTab(state.routes[1]?.key)}
      <View style={styles.plusSlot}>
        <Pressable
          onPress={openListProperty}
          accessibilityRole="button"
          accessibilityLabel="Create a property listing"
          hitSlop={8}
          style={({ pressed }) => [styles.plusPressable, pressed && { opacity: 0.86 }]}
        >
          <View style={styles.plusShadow}>
            <LinearGradient
              colors={brandGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.plusCircle}
            >
              <Plus size={25} color={colors.white} strokeWidth={2.8} />
            </LinearGradient>
          </View>
          <Text style={styles.plusLabel}>Sell</Text>
        </Pressable>
      </View>
      {renderTab(state.routes[2]?.key)}
      {renderTab(state.routes[3]?.key)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    paddingTop: 7,
    paddingHorizontal: 4,
    ...shadow.card,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    paddingBottom: 3,
    gap: 2,
  },
  iconWrap: {
    width: 30,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 8,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  labelActive: {
    fontWeight: "900",
  },
  activeDot: {
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primary,
    marginTop: 1,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  badgeText: {
    fontSize: 6.5,
    fontWeight: "900",
    color: colors.white,
  },
  plusSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    minHeight: 52,
  },
  plusPressable: {
    alignItems: "center",
    marginTop: -24,
    paddingBottom: 3,
  },
  plusShadow: {
    borderRadius: 27,
    backgroundColor: colors.white,
    padding: 3,
    ...shadow.raised,
  },
  plusCircle: {
    width: 49,
    height: 49,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  plusLabel: {
    fontSize: 7.8,
    fontWeight: "900",
    color: colors.primary,
    marginTop: 2,
    letterSpacing: 0.1,
  },
});
