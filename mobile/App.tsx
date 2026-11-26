import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { colors } from "./src/constants/theme";
import { ToastProvider } from "./src/context/ToastContext";
import { AuthProvider } from "./src/context/AuthContext";
import { ListingsProvider } from "./src/context/ListingsContext";
import { AdminProvider } from "./src/context/AdminContext";
import { RootNavigator } from "./src/navigation/RootNavigator";

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.canvas,
    card: colors.white,
    text: colors.ink,
    border: colors.line,
    notification: colors.primary,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AuthProvider>
          <ListingsProvider>
            <AdminProvider>
              <NavigationContainer theme={navigationTheme}>
                <StatusBar style="dark" />
                <RootNavigator />
              </NavigationContainer>
            </AdminProvider>
          </ListingsProvider>
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
