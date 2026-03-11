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
 * Employee route group — нэвтэрсэн ажилтан (user эсвэл admin/hr энгийн хэрэглэгчээр).
 * Sidebar + auth: нэвтрээгүй бол /login руу.
 */
export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex items-center justify-between border-b bg-background px-6 py-3">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <nav className="flex gap-4 text-sm">
                <Link href="/dashboard" className="hover:text-primary">
                  Dashboard
                </Link>
                <Link href="/profile" className="hover:text-primary">
                  Profile
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
