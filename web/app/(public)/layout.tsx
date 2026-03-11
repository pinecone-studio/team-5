import { ClerkAppProvider } from "@/components/apollo-provider";

/**
 * Public route group — нэвтрээгүй хэрэглэгчид.
 * Auth шаардлагагүй.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClerkAppProvider>{children}</ClerkAppProvider>;
}
