import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import ApolloProvider from "@/components/apollo-provider";
import { RoleSidebar } from "@/components/role-sidebar";
import { getSession, isManager } from "@/lib/auth";

/**
 * Manager route group — зөвхөн admin/hr (менеджер).
 * Нэвтрээгүй → /login, энгийн user → /dashboard.
 */
export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = getSession();
  if (!session) {
    redirect("/login");
  }
  if (!isManager(session.role)) {
    redirect("/dashboard");
  }

  const displayName = session.user.name ?? session.user.email;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <RoleSidebar
        role="admin"
        userName={displayName}
        pendingRequestCount={3}
      />
      <ApolloProvider>
        <div className="min-w-0 flex-1">
          <header className="flex h-20 items-center justify-end border-b border-gray-200 bg-white px-8">
            <div className="flex items-center gap-5">
              <button
                type="button"
                aria-label="Notifications"
                className="text-gray-500 transition hover:text-gray-700"
              >
                <Bell className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                  {initial}
                </div>
                <span className="text-base font-medium text-gray-700">
                  {displayName}
                </span>
              </div>
            </div>
          </header>
          <main className="min-w-0 flex-1 p-6">{children}</main>
        </div>
      </ApolloProvider>
    </div>
  );
}
