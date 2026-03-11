export type Role = "user" | "admin" | "hr";

export function normalizeRole(role: unknown): Role {
  return role === "admin" || role === "hr" ? role : "user";
}

export function isManager(role: Role): boolean {
  return role === "admin" || role === "hr";
}
