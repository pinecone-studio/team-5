import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  ArrowLeftRight,
  BriefcaseBusiness,
  ClipboardList,
  FileCheck2,
  LayoutDashboard,
  Scale,
  UserCircle,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"

export interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  subtitle?: string
  showPendingBadge?: boolean
}

export const employeeNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    subtitle: "Нэвтэрсэн ажилтны үндсэн хуудас",
  },
  {
    label: "Profile",
    href: "/profile",
    icon: UserCircle,
    subtitle: "Хувийн мэдээлэл, тохиргоо",
  },
]

export const adminNav: NavItem[] = [
  {
    label: "Employees",
    href: "/admin/employees",
    icon: Users,
    subtitle: "Хэрэглэгчийн удирдлага",
  },
  {
    label: "Requests",
    href: "/admin/requests",
    icon: BriefcaseBusiness,
    subtitle: "Ажилтны хүсэлтүүд, шалгалт",
    showPendingBadge: true,
  },
  {
    label: "Rules",
    href: "/admin/rules",
    icon: Scale,
    subtitle: "Benefit eligibility rules",
  },
  {
    label: "Contract",
    href: "/admin/contract",
    icon: FileCheck2,
    subtitle: "Гэрээ болон нөхцөлийн тохиргоо",
  },
  {
    label: "Activity Log",
    href: "/admin/activity-log",
    icon: ClipboardList,
    subtitle: "Өөрчлөлтийн түүх, аудит",
  },
]

interface SidebarProps {
  role: "employee" | "admin"
  activePath?: string
  pendingRequestCount?: number
  userName?: string
  switchHref?: string
  switchLabel?: string
  onNavigate?: () => void
}

export function getActiveNavItem(currentPath: string, navItems: NavItem[]) {
  return [...navItems]
    .sort((left, right) => right.href.length - left.href.length)
    .find((item) => currentPath === item.href || currentPath.startsWith(`${item.href}/`))
}

export function Sidebar({
  role,
  activePath,
  pendingRequestCount,
  userName = "User",
  switchHref,
  switchLabel,
  onNavigate,
}: SidebarProps) {
  const navItems = role === "admin" ? adminNav : employeeNav
  const defaultPath = role === "admin" ? adminNav[0]?.href ?? "/admin" : "/dashboard"
  const currentPath = activePath ?? defaultPath
  const activeItem = getActiveNavItem(currentPath, navItems)
  const initial = userName.trim().charAt(0).toUpperCase() || "U"

  return (
    <aside className="flex h-full w-60 flex-col border-r border-gray-200 bg-white">
      <div className="px-6 py-5">
        <span className="text-xl font-bold tracking-tight text-blue-600">
          EBMS
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = activeItem?.href === item.href
          const showBadge =
            item.showPendingBadge &&
            typeof pendingRequestCount === "number" &&
            pendingRequestCount > 0

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1">{item.label}</span>
              {showBadge ? (
                <Badge variant="danger">{pendingRequestCount}</Badge>
              ) : null}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">
              {userName}
            </p>
            {switchHref && switchLabel ? (
              <Link
                href={switchHref}
                onClick={onNavigate}
                className="inline-flex items-center gap-1 text-xs text-gray-500 transition hover:text-gray-700"
              >
                <ArrowLeftRight className="h-3 w-3" />
                Switch to {switchLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  )
}
