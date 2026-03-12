"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { useUser } from "@clerk/react"
import { X } from "lucide-react"

import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { isManager, normalizeRole } from "@/lib/auth"
import { cn } from "@/lib/utils"

interface PageShellProps {
  role: "employee" | "admin"
  pendingRequestCount?: number
  userName?: string
  switchHref?: string
  switchLabel?: string
  children: React.ReactNode
}

export function PageShell({
  role,
  pendingRequestCount,
  userName,
  switchHref,
  switchLabel,
  children,
}: PageShellProps) {
  const pathname = usePathname()
  const { user } = useUser()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const userRole = normalizeRole(user?.publicMetadata?.role)
  const resolvedUserName =
    userName ??
    user?.fullName?.trim() ??
    user?.firstName ??
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ??
    "User"
  const resolvedSwitchHref =
    switchHref ?? (role === "admin" ? "/dashboard" : isManager(userRole) ? "/admin" : undefined)
  const resolvedSwitchLabel =
    switchLabel ?? (role === "admin" ? "Employee" : isManager(userRole) ? "Admin" : undefined)

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className={cn(
          "fixed inset-0 z-40 bg-gray-900/30 transition-opacity md:hidden",
          mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileNavOpen(false)}
      />

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 transition-transform md:translate-x-0",
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
            activePath={pathname}
            pendingRequestCount={pendingRequestCount}
            userName={resolvedUserName}
            switchHref={resolvedSwitchHref}
            switchLabel={resolvedSwitchLabel}
            onNavigate={() => setMobileNavOpen(false)}
          />
        </div>
      </div>

      <main className="min-h-screen md:ml-60">
        <Header
          userName={resolvedUserName}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[130rem] 2xl:max-w-[100rem]">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
