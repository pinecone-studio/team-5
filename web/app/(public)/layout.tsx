/**
 * Public route group — нэвтрээгүй хэрэглэгчид.
 * Auth шаардлагагүй.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
