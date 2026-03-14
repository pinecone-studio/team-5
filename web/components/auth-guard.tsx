"use client";

import { startTransition, type ReactNode, useEffect } from "react";
import { useAuth, useUser } from "@clerk/react";
import { usePathname, useRouter } from "next/navigation";
import {
  canAccessAdminRoute,
  getRoleLandingPath,
  normalizeRole,
} from "@/lib/auth";

export default function AuthGuard({
  children,
  requireManager = false,
}: {
  children: ReactNode;
  requireManager?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { isLoaded: isUserLoaded, user } = useUser();
  const role = normalizeRole(user?.publicMetadata?.role);
  const isManagerPath = pathname == null ? false : pathname.startsWith("/admin");
  const isReady = isAuthLoaded && (!requireManager || isUserLoaded);
  const canAccessManager =
    !requireManager ||
    !isManagerPath ||
    (isUserLoaded && canAccessAdminRoute(role, pathname));
  const deniedRedirectPath = getRoleLandingPath(role);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isSignedIn) {
      const redirectUrl = pathname ? `?redirect_url=${encodeURIComponent(pathname)}` : "";
      startTransition(() => {
        router.replace(`/login${redirectUrl}`);
      });
      return;
    }

    if (requireManager && isManagerPath && !canAccessManager) {
      startTransition(() => {
        router.replace(deniedRedirectPath);
      });
    }
  }, [
    canAccessManager,
    deniedRedirectPath,
    isManagerPath,
    isReady,
    isSignedIn,
    pathname,
    requireManager,
    router,
  ]);

  if (
    !isReady ||
    !isSignedIn ||
    (requireManager && isManagerPath && !canAccessManager)
  ) {
    return <div className="min-h-screen bg-background" />;
  }

  return <>{children}</>;
}
