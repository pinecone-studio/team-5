import AppApolloProvider from "@/components/apollo-provider"
import AuthGuard from "@/components/auth-guard"
import { PageShell } from "@/components/layout/page-shell"

/**
 * Manager route group.
 * admin/hr нь бүх admin route руу орно.
 * finance_manager нь зөвхөн /admin/requests руу орно.
 * Нэвтрээгүй → /login, бусад user → /dashboard.
 */
export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppApolloProvider>
      <AuthGuard requireManager>
        <PageShell role="admin">{children}</PageShell>
      </AuthGuard>
    </AppApolloProvider>
  )
}
