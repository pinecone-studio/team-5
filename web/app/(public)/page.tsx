import Link from "next/link";

/**
 * Нэвтрээгүй хэрэглэгчид — landing / нүүр хуудас
 */
export default function PublicHomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Team 5</h1>
      {/* <p className="text-muted-foreground text-center">
        Нэвтрэх эсвэл бүртгүүлэх
      </p> */}
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
        >
          Нэвтрэх
        </Link>
        {/* <Link
          href="/dashboard"
          className="rounded-md border border-input px-4 py-2 hover:bg-accent"
        >
          Dashboard руу
        </Link> */}
      </div>
    </div>
  );
}
