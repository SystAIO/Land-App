import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { colors } from "../constants/theme";
import type { AdminStackParamList } from "./types";
import { AdminTabs } from "./AdminTabs";
import { AdminPropertyDetailScreen } from "../screens/admin/AdminPropertyDetailScreen";

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="AdminTabs"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      <Stack.Screen
        name="AdminPropertyDetail"
        component={AdminPropertyDetailScreen}
        options={{ animation: "slide_from_right" }}
      />
    </Stack.Navigator>
  );
}
