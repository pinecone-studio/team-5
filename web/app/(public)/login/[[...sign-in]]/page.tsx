"use client";

import { startTransition, useEffect } from "react";
import { SignIn, useAuth } from "@clerk/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();
  const redirectUrl = searchParams.get("redirect_url") || "/dashboard";

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    startTransition(() => {
      router.replace(redirectUrl);
    });
  }, [isLoaded, isSignedIn, redirectUrl, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <SignIn path="/login" routing="path" fallbackRedirectUrl={redirectUrl} />
    </div>
  );
}
