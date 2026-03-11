import AppApolloProvider from "@/components/apollo-provider"
import AuthGuard from "@/components/auth-guard"
import { PageShell } from "@/components/layout/page-shell"

/**
 * Manager route group — зөвхөн admin/hr (менеджер).
 * Нэвтрээгүй → /login, энгийн user → /dashboard.
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
