/**
 * Public route group — нэвтрээгүй хэрэглэгчид.
 * Clerk context нь root layout дээр mount хийгдэнэ.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
