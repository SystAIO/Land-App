import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Expo config.
 *
 * `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` is only needed for standalone APK/AAB
 * builds. Expo Go ships with its own Google Maps key, so the app still renders
 * maps while developing.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "SystIO Land",
  slug: "systio-land",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  scheme: "systioland",
  extra: {
    eas: {
      projectId: "2776821d-305f-4e17-896d-e39803e2f8d4",
    },
  },
  icon: "./assets/icon.png",
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.systio.land",
    infoPlist: {
      NSPhotoLibraryUsageDescription:
        "SystIO Land needs access to your photos so you can add pictures to your property listing.",
      NSCameraUsageDescription:
        "SystIO Land needs camera access so you can photograph your property.",
      NSLocationWhenInUseUsageDescription:
        "SystIO Land uses your location to pin your property accurately on the map.",
    },
  },
  android: {
    package: "com.systio.land",
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#173A5E",
    },
    permissions: [
      "INTERNET",
      "ACCESS_NETWORK_STATE",
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "READ_MEDIA_IMAGES",
    ],
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "./plugins/withCleartextTraffic.js",
    "expo-asset",
    "expo-status-bar",
    [
      "react-native-maps",
      {
        androidGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/splash-icon.png",
        imageWidth: 160,
        resizeMode: "contain",
        backgroundColor: "#173A5E",
        dark: {
          backgroundColor: "#173A5E",
        },
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "SystIO Land needs access to your photos so you can add pictures to your property listing.",
        cameraPermission:
          "SystIO Land needs camera access so you can photograph your property.",
      },
    ],
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "SystIO Land uses your location to pin your property accurately on the map.",
      },
    ],
  ],
});
