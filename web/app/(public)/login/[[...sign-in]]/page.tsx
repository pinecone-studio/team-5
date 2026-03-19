"use client";

import { startTransition, useEffect } from "react";
import { SignIn, useAuth } from "@clerk/react";
import { useRouter, useSearchParams } from "next/navigation";
import MissingConfigState from "@/components/missing-config-state";
import EbmsLogo from "@/components/branding/ebms-logo";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function LoginPageContent() {
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
      <div className="flex w-full max-w-[860px] flex-col items-center gap-7">
        <EbmsLogo variant="login" priority />
        <SignIn path="/login" routing="path" fallbackRedirectUrl={redirectUrl} />
      </div>
    </div>
  );
}

export default function LoginPage() {
  if (!clerkPublishableKey) {
    return (
      <MissingConfigState
        missingKeys={["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"]}
        description="Нэвтрэх хуудсыг ашиглахын тулд Clerk publishable key шаардлагатай."
      />
    );
  }

  return <LoginPageContent />;
}
