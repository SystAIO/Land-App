import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { colors } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import type { RootStackParamList } from "./types";
import { AppTabs } from "./AppTabs";
import { PropertyDetailScreen } from "../screens/PropertyDetailScreen";
import { ListPropertyScreen } from "../screens/ListPropertyScreen";
import { BrowseOnlyScreen } from "../screens/BrowseOnlyScreen";
import { SubscriptionScreen } from "../screens/SubscriptionScreen";
import { EditProfileScreen } from "../screens/EditProfileScreen";
import { FavoritesScreen } from "../screens/FavoritesScreen";
import { PaymentHistoryScreen } from "../screens/PaymentHistoryScreen";
import { PaymentMethodsScreen } from "../screens/PaymentMethodsScreen";
import { InfoScreen } from "../screens/InfoScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function UserNavigator() {
  const { profile } = useAuth();
  const isBrowse = profile?.role === "browse";
  return (
    <Stack.Navigator
      initialRouteName="Tabs"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Stack.Screen name="Tabs" component={AppTabs} />
      <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
      <Stack.Screen
        name="ListProperty"
        component={isBrowse ? BrowseOnlyScreen : ListPropertyScreen}
        options={{ animation: "slide_from_bottom" }}
      />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="Info" component={InfoScreen} />
    </Stack.Navigator>
  );
}
