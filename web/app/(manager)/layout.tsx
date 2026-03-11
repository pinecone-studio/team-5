import Link from "next/link";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import AuthGuard from "@/components/auth-guard";
import SessionBadge from "@/components/session-badge";

/**
 * Manager route group — зөвхөн admin/hr (менеджер).
 * Нэвтрээгүй → /login, энгийн user → /dashboard.
 */
export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requireManager>
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
              <SessionBadge />
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
