import { Platform } from "react-native";
import { PROVIDER_GOOGLE } from "react-native-maps";

/**
 * Android renders Google Maps (needs androidGoogleMapsApiKey in app.config.ts).
 * iOS keeps Apple Maps (default provider) until Google Maps SDK for iOS is
 * configured — otherwise iOS maps would break.
 */
export const MAP_PROVIDER = Platform.OS === "android" ? PROVIDER_GOOGLE : undefined;
