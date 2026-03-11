"use client";

import { UserButton, useUser } from "@clerk/react";
import { normalizeRole } from "@/lib/auth";

export default function SessionBadge() {
  const { isLoaded, user } = useUser();

  if (!isLoaded || !user) {
    return <div className="h-8 w-24 rounded-md bg-muted" />;
  }

  const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress;
  const role = normalizeRole(user.publicMetadata?.role);

  return (
    <>
      <span className="text-sm text-muted-foreground">{email}</span>
      <span className="rounded-md bg-muted px-2 py-1 text-xs">{role}</span>
      <UserButton />
    </>
  );
}
