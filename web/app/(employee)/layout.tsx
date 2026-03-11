import { redirect } from "next/navigation";
import ApolloProvider from "@/components/apollo-provider";
import { RoleSidebar } from "@/components/role-sidebar";
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
    <div className="flex min-h-screen bg-[#f8fafc]">
      <RoleSidebar
        role="employee"
        userName={session.user.name ?? session.user.email}
      />
      <ApolloProvider>
        <main className="min-w-0 flex-1">{children}</main>
      </ApolloProvider>
    </div>
  );
}
