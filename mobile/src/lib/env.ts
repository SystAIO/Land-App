export const DEMO_MODE =
  (process.env.EXPO_PUBLIC_DEMO_MODE ?? "true").toLowerCase() !== "false" ||
  !process.env.EXPO_PUBLIC_API_BASE_URL;

/** Listing fee is ₹100; buyers pay nothing for browsing. */
export const LISTING_FEE_RUPEES = 100;

// Demo-mode credentials (local-only, never used in real mode)
export const DEMO_ADMIN_EMAIL = "admin@systio.land";
export const DEMO_ADMIN_PASSWORD = "Admin@123";
export const DEMO_OTP = "123456";
