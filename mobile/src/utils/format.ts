import type { AreaUnit, ListingType } from "../types";
import { areaUnitLabel } from "../constants/catalog";

const numberFormatter = new Intl.NumberFormat("en-IN");

/** 4500000 -> "₹45 L", 12500000 -> "₹1.25 Cr" */
export function formatPrice(value: number, listingType: ListingType = "sale"): string {
  if (!Number.isFinite(value)) return "₹0";
  const suffix = listingType === "rent" ? "/mo" : "";
  if (value >= 10000000) {
    return `₹${trimDecimal(value / 10000000)} Cr${suffix}`;
  }
  if (value >= 100000) {
    return `₹${trimDecimal(value / 100000)} L${suffix}`;
  }
  return `₹${numberFormatter.format(Math.round(value))}${suffix}`;
}

/** Full, precise price for detail/review screens. */
export function formatPriceFull(value: number, listingType: ListingType = "sale"): string {
  const suffix = listingType === "rent" ? " / month" : "";
  return `₹${numberFormatter.format(Math.round(value))}${suffix}`;
}

/** Short price for map pins: 4500000 -> "₹45 L", 65000 -> "₹65 k". */
export function formatShortPrice(value: number): string {
  if (!Number.isFinite(value)) return "₹0";
  if (value >= 10000000) return `₹${trimDecimal(value / 10000000)} Cr`;
  if (value >= 100000) return `₹${trimDecimal(value / 100000)} L`;
  if (value >= 1000) return `₹${trimDecimal(value / 1000)} k`;
  return `₹${Math.round(value)}`;
}

function trimDecimal(value: number) {
  return Number(value.toFixed(2)).toString();
}

export function formatArea(value: number, unit: AreaUnit): string {
  const rounded = Number.isInteger(value) ? value.toString() : Number(value.toFixed(2)).toString();
  return `${rounded} ${areaUnitLabel(unit)}`;
}

export function formatCompactNumber(value: number): string {
  if (value >= 10000000) return `${trimDecimal(value / 10000000)}Cr`;
  if (value >= 100000) return `${trimDecimal(value / 100000)}L`;
  if (value >= 1000) return `${trimDecimal(value / 1000)}k`;
  return String(value);
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  if (local.length !== 10) return phone;
  return `${local.slice(0, 5)} ${local.slice(5)}`;
}

export function normalisePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  return `+91${local}`;
}

export function isValidIndianPhone(input: string): boolean {
  const digits = input.replace(/\D/g, "");
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(local);
}

export function timeAgo(iso: string): string {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "just now";
  const seconds = Math.max(1, Math.round((Date.now() - time) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "S";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normaliseYoutube(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!isValidUrl(trimmed)) return null;
  return trimmed;
}
