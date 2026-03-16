export type Role = "user" | "admin" | "hr" | "finance_manager";

function normalizeRoleValue(role: unknown): string | null {
  if (typeof role !== "string") return null;

  const normalized = role
    .trim()
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_");
  return normalized.length > 0 ? normalized : null;
}

export function normalizeRole(role: unknown): Role {
  switch (normalizeRoleValue(role)) {
    case "admin":
      return "admin";
    case "hr":
    case "hr_admin":
    case "hradmin":
      return "hr";
    case "finance":
    case "finance_admin":
    case "financeadmin":
    case "finance_manager":
    case "financemanager":
      return "finance_manager";
    default:
      return "user";
  }
}

export function isManager(role: Role): boolean {
  return role === "admin" || role === "hr";
}

export function canAccessAdminRequests(role: Role): boolean {
  return isManager(role) || role === "finance_manager";
}

export function canAccessAdminRoute(
  role: Role,
  pathname: string | null | undefined,
): boolean {
  if (isManager(role)) {
    return true;
  }

  return (
    role === "finance_manager" &&
    typeof pathname === "string" &&
    (pathname === "/admin/requests" || pathname.startsWith("/admin/requests/"))
  );
}

export function getAdminHomePath(role: Role): string | undefined {
  if (isManager(role)) {
    return "/admin";
  }

  if (role === "finance_manager") {
    return "/admin/requests";
  }

  return undefined;
}

export function getRoleLandingPath(role: Role): string {
  return getAdminHomePath(role) ?? "/dashboard";
}
