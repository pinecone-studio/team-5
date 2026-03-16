"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/react";
import { X } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { getAdminHomePath, normalizeRole } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface PageShellProps {
  role: "employee" | "admin";
  pendingRequestCount?: number;
  userName?: string;
  switchHref?: string;
  switchLabel?: string;
  children: React.ReactNode;
}

export function PageShell({
  role,
  pendingRequestCount,
  userName,
  switchHref,
  switchLabel,
  children,
}: PageShellProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const userRole = normalizeRole(user?.publicMetadata?.role);
  const resolvedUserName =
    userName ??
    user?.fullName?.trim() ??
    user?.firstName ??
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ??
    "User";
  const resolvedSwitchHref =
    switchHref ??
    (role === "admin" ? "/dashboard" : getAdminHomePath(userRole));
  const resolvedSwitchLabel =
    switchLabel ??
    (role === "admin"
      ? "Employee"
      : getAdminHomePath(userRole)
        ? "Admin"
        : undefined);
  const isPortalShell = role === "employee" || role === "admin";
  const sidebarWidthClass = isPortalShell ? "md:ml-[19rem]" : "md:ml-60";

  return (
    <div
      className={cn("min-h-screen", isPortalShell ? "bg-white" : "bg-gray-50")}
    >
      <div
        className={cn(
          "fixed inset-0 z-40 bg-gray-900/30 transition-opacity md:hidden",
          mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileNavOpen(false)}
      />

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform md:translate-x-0",
          isPortalShell ? "w-[19rem]" : "w-60",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="relative h-full">
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="absolute right-3 top-3 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 md:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
          <Sidebar
            role={role}
            accessRole={userRole}
            activePath={pathname}
            pendingRequestCount={pendingRequestCount}
            userName={resolvedUserName}
            switchHref={resolvedSwitchHref}
            switchLabel={resolvedSwitchLabel}
            onNavigate={() => setMobileNavOpen(false)}
          />
        </div>
      </div>

      <main className={cn("min-h-screen bg-[#F9FAFB]", sidebarWidthClass)}>
        <Header
          role={role}
          userName={resolvedUserName}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <div
          className={cn(
            isPortalShell
              ? "px-4 py-6 sm:px-6 lg:px-8 lg:py-7"
              : "p-4 sm:p-6 lg:p-8",
          )}
        >
          <div
            className={cn(
              "mx-auto w-full",
              isPortalShell
                ? "max-w-[98rem]"
                : "max-w-[130rem] 2xl:max-w-[100rem]",
            )}
          >
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
