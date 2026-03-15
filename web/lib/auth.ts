export type Role = "user" | "admin" | "hr" | "hr_admin" | "finance_manager";

export function normalizeRole(role: unknown): Role {
  if (role === "admin" || role === "hr" || role === "hr_admin") {
    return role;
  }

  if (role === "finance" || role === "finance_manager") {
    return "finance_manager";
  }

  return "user";
}

export function isManager(role: Role): boolean {
  return (
    role === "admin" ||
    role === "hr" ||
    role === "hr_admin" ||
    role === "finance_manager"
  );
}
