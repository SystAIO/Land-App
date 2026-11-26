import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { colors } from "../constants/theme";
import type { AuthStackParamList } from "./types";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { PhoneScreen } from "../screens/PhoneScreen";
import { OtpScreen } from "../screens/OtpScreen";
import { RoleSetupScreen } from "../screens/RoleSetupScreen";
import { AdminLoginScreen } from "../screens/AdminLoginScreen";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator({
  initialRouteName = "Welcome",
}: {
  initialRouteName?: keyof AuthStackParamList;
}) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Phone" component={PhoneScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
      <Stack.Screen name="RoleSetup" component={RoleSetupScreen} />
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
    </Stack.Navigator>
  );
}
