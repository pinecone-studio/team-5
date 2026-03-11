import Link from "next/link";

/**
 * Нэвтрэх хуудас — public, нэвтрээгүй хэрэглэгч
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Нэвтрэх</h1>
      <p className="text-muted-foreground text-center text-sm">
        Auth холбох хэсгийг энд нэмнэ.
      </p>
      <Link
        href="/dashboard"
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
      >
        Dashboard руу (demo)
      </Link>
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        ← Буцах
      </Link>
    </div>
  );
}
