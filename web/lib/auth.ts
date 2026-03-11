/**
 * Auth placeholder — одоогоор session/role байхгүй.
 * Дараа нь API/cookie-аас уншина.
 */
export type Role = "user" | "admin" | "hr";

export type Session = {
  user: { id: string; email: string; name?: string };
  role: Role;
};

export function getSession(): Session | null {
  // TODO: cookie / API-аас унших
  // Dev: demo session (admin → manager болон employee хандана)
  if (typeof process !== "undefined" && process.env?.NODE_ENV === "development") {
    return {
      user: { id: "1", email: "demo@team5.com", name: "Demo" },
      role: "admin",
    };
  }
  return null;
}

export function isManager(role: Role): boolean {
  return role === "admin" || role === "hr";
}
