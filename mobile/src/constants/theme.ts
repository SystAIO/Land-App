/**
 * SystIO Land design tokens.
 *
 * Deep-navy brand with warm gold accents — a calm, premium land-and-property
 * identity (navy ink typography on warm white canvas).
 */

export const colors = {
  primary: "#173A5E",
  primaryDark: "#10273F",
  primaryDeep: "#0A1B2E",
  primarySoft: "#E8EDF4",
  primaryTint: "#F5F8FC",

  violet: "#6C5CE7",
  violetDark: "#5646C9",
  violetSoft: "#F0EDFF",
  gold: "#F6C46A",
  goldDeep: "#9C6B14",
  goldSoft: "#FFF4DA",

  ink: "#1C1C1C",
  inkSoft: "#333333",
  body: "#4A4A4A",
  muted: "#6F6F6F",
  faint: "#9A9A9A",
  line: "#ECECEC",
  lineSoft: "#F4F4F4",
  surface: "#FFFFFF",
  canvas: "#F8F7F5",
  canvasDeep: "#F2F0ED",
  disabled: "#C7C7C7",

  success: "#1E9E5A",
  successSoft: "#E9F8EF",
  warning: "#E08A00",
  warningSoft: "#FFF4DE",
  danger: "#B03A2E",
  dangerSoft: "#F7E8E6",
  info: "#2563EB",
  infoSoft: "#EBF1FF",

  dark: "#18191C",
  darkSoft: "#24252A",
  white: "#FFFFFF",
  overlay: "rgba(18, 18, 20, 0.48)",
  overlaySoft: "rgba(18, 18, 20, 0.18)",
} as const;

export const statusPalette = {
  draft: { fg: colors.muted, bg: colors.lineSoft, label: "Draft" },
  pending: { fg: colors.warning, bg: colors.warningSoft, label: "Pending review" },
  approved: { fg: colors.success, bg: colors.successSoft, label: "Approved" },
  declined: { fg: colors.danger, bg: colors.dangerSoft, label: "Declined" },
} as const;

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 30,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
} as const;

export const shadow = {
  card: {
    shadowColor: "#14263B",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  raised: {
    shadowColor: "#14263B",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 8,
  },
  soft: {
    shadowColor: "#2A2A2A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
} as const;

export const profileGradient = ["#7A6AF0", "#6C5CE7", "#5544C6"] as const;
export const adminGradient = ["#232428", "#18191C"] as const;
export const brandGradient = ["#1F4E74", "#173A5E"] as const;
