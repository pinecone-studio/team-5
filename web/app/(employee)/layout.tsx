import AuthGuard from "@/components/auth-guard"
import { PageShell } from "@/components/layout/page-shell"

/**
 * Employee route group — нэвтэрсэн ажилтан (user эсвэл admin/hr энгийн хэрэглэгчээр).
 * Sidebar + auth: нэвтрээгүй бол /login руу.
 */
export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <PageShell role="employee">{children}</PageShell>
    </AuthGuard>
  )
}
