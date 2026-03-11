import Link from "next/link";
import { redirect } from "next/navigation";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex items-center justify-between border-b bg-background px-6 py-3">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <nav className="flex gap-4 text-sm">
              <Link href="/admin" className="hover:text-primary">
                Admin
              </Link>
              <Link href="/admin/users" className="hover:text-primary">
                Хэрэглэгчид
              </Link>
              <Link href="/dashboard" className="hover:text-primary">
                Dashboard
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {session.user.email}
            </span>
            <span className="rounded-md bg-primary/20 px-2 py-1 text-xs font-medium text-primary">
              {session.role}
            </span>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
