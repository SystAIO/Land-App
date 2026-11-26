import type { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  Welcome: undefined;
  Phone: undefined;
  Otp: { phone: string };
  RoleSetup: undefined;
  AdminLogin: undefined;
};

export type TabParamList = {
  Home: undefined;
  Explore: { city?: string } | undefined;
  Listings: undefined;
  Profile: undefined;
};

export type InfoKind = "help" | "terms" | "privacy" | "about";

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  PropertyDetail: { id: string };
  ListProperty: { editId?: string } | undefined;
  Subscription: undefined;
  EditProfile: undefined;
  Favorites: undefined;
  PaymentHistory: undefined;
  PaymentMethods: undefined;
  Info: { kind: InfoKind };
};

export type AdminTabParamList = {
  Overview: undefined;
  Approvals: undefined;
  AdminListings: undefined;
  Users: undefined;
  Payments: undefined;
};

export type AdminStackParamList = {
  AdminTabs: NavigatorScreenParams<AdminTabParamList> | undefined;
  AdminPropertyDetail: { id: string };
};
