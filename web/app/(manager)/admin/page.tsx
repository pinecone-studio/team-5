/**
 * Admin page — for admin/hr only
 */
export default function AdminPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold">Admin</h1>
      <p className="text-muted-foreground mt-2">
        Only users with admin/hr access can view this page.
      </p>
    </div>
  );
}
