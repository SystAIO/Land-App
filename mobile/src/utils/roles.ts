import type { UserRole } from "../types";

export function roleLabel(role: UserRole | null | undefined): string {
  switch (role) {
    case "broker":
      return "Broker";
    case "browse":
      return "Browser";
    case "admin":
      return "Admin";
    default:
      return "Owner";
  }
}

export function roleLabelUpper(role: UserRole | null | undefined): string {
  return roleLabel(role).toUpperCase();
}
