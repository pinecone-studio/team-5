"use client";

import { startTransition, type ReactNode, useEffect } from "react";
import { useAuth, useUser } from "@clerk/react";
import { usePathname, useRouter } from "next/navigation";
import { isManager, normalizeRole } from "@/lib/auth";

export default function AuthGuard({
  children,
  requireManager = false,
}: {
  children: ReactNode;
  requireManager?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const role = normalizeRole(user?.publicMetadata?.role);
  const canAccessManager = !requireManager || isManager(role);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      const redirectUrl = pathname ? `?redirect_url=${encodeURIComponent(pathname)}` : "";
      startTransition(() => {
        router.replace(`/login${redirectUrl}`);
      });
      return;
    }

    if (!canAccessManager) {
      startTransition(() => {
        router.replace("/dashboard");
      });
    }
  }, [canAccessManager, isLoaded, isSignedIn, pathname, router]);

  if (!isLoaded || !isSignedIn || !canAccessManager) {
    return <div className="min-h-screen bg-background" />;
  }

  return <>{children}</>;
}
