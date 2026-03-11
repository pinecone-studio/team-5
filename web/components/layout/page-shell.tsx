"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { X } from "lucide-react"

import { Header } from "@/components/layout/header"
import {
  Sidebar,
  adminNav,
  employeeNav,
  type NavItem,
} from "@/components/layout/sidebar"
import { cn } from "@/lib/utils"

interface PageShellProps {
  role: "employee" | "admin"
  pendingRequestCount?: number
  userName?: string
  switchHref?: string
  switchLabel?: string
  children: React.ReactNode
}

function formatTitleFromPath(pathname: string) {
  const lastSegment = pathname.split("/").filter(Boolean).at(-1)
  if (!lastSegment) {
    return "Dashboard"
  }

  return lastSegment
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

function getActiveItem(pathname: string, navItems: NavItem[]) {
  return [...navItems]
    .sort((left, right) => right.href.length - left.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const navItems = role === "admin" ? adminNav : employeeNav
  const activeItem = getActiveItem(pathname, navItems)
  const title = activeItem?.label ?? formatTitleFromPath(pathname)
  const subtitle = activeItem?.subtitle

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
            userName={userName}
            switchHref={switchHref}
            switchLabel={switchLabel}
            onNavigate={() => setMobileNavOpen(false)}
          />
        </div>
      </div>

      <main className="min-h-screen md:ml-60">
        <Header
          title={title}
          subtitle={subtitle}
          userName={userName}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
