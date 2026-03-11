import Link from "next/link";
import { redirect } from "next/navigation";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { getSession } from "@/lib/auth";

/**
 * Employee route group — нэвтэрсэн ажилтан (user эсвэл admin/hr энгийн хэрэглэгчээр).
 * Sidebar + auth: нэвтрээгүй бол /login руу.
 */
export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = getSession();
  if (!session) {
    redirect("/login");
  }

  return (
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
            <span className="text-sm text-muted-foreground">
              {session.user.email}
            </span>
            <span className="rounded-md bg-muted px-2 py-1 text-xs">
              {session.role}
            </span>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
