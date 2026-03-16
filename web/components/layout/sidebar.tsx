import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/auth";
import {
  ArrowLeftRight,
  BriefcaseBusiness,
  CircleHelp,
  ClipboardList,
  FileCheck2,
  FileText,
  Gift,
  Scale,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  subtitle?: string;
  showPendingBadge?: boolean;
}

export const employeeNav: NavItem[] = [
  {
    label: "My Benefits",
    href: "/dashboard",
    icon: Gift,
    subtitle: "Танд хамаарах benefits болон eligibility",
  },
  {
    label: "My Requests",
    href: "/requests",
    icon: FileText,
    subtitle: "Илгээсэн хүсэлт, approval статус",
  },
  {
    label: "Help",
    href: "/help",
    icon: CircleHelp,
    subtitle: "FAQ, support болон гарын авлага",
  },
];

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
];

export const financeNav: NavItem[] = [
  {
    label: "Requests",
    href: "/admin/requests",
    icon: BriefcaseBusiness,
    subtitle: "Санхүүгийн review хийх хүсэлтүүд",
    showPendingBadge: true,
  },
];

interface SidebarProps {
  role: "employee" | "admin" | "finance_manager";
  accessRole?: Role;
  activePath?: string;
  pendingRequestCount?: number;
  userName?: string;
  switchHref?: string;
  switchLabel?: string;
  onNavigate?: () => void;
}

export function getActiveNavItem(currentPath: string, navItems: NavItem[]) {
  return [...navItems]
    .sort((left, right) => right.href.length - left.href.length)
    .find(
      (item) =>
        currentPath === item.href || currentPath.startsWith(`${item.href}/`),
    );
}

export function Sidebar({
  role,
  accessRole = "user",
  activePath,
  pendingRequestCount,
  switchHref,
  switchLabel,
  onNavigate,
}: SidebarProps) {
  const navItems =
    role === "admin"
      ? accessRole === "finance_manager"
        ? financeNav
        : adminNav
      : employeeNav;
  const defaultPath =
    role === "admin" ? (navItems[0]?.href ?? "/admin") : "/dashboard";
  const currentPath = activePath ?? defaultPath;
  const activeItem = getActiveNavItem(currentPath, navItems);

  return (
    <aside className="flex h-full w-60 flex-col border-r border-gray-200 bg-white">
      <div className="px-6 py-5">
        <span className="text-xl font-bold tracking-tight text-blue-600">
          EBMS
        </span>
      </div>

      <nav className="flex-1 space-y-2 px-3 pt-4">
        {navItems.map((item) => {
          const isActive = activeItem?.href === item.href;
          const showBadge =
            item.showPendingBadge &&
            typeof pendingRequestCount === "number" &&
            pendingRequestCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 overflow-hidden rounded-[10px] px-4 py-3 text-base font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-500 hover:bg-gray-100 hover:text-blue-700",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute inset-y-0 right-0 w-[4px] rounded-l-[999px] bg-blue-600 transition-opacity duration-200",
                  isActive
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100",
                )}
              />
              <item.icon
                className={cn(
                  "relative z-10 h-6 w-6 shrink-0 transition-colors",
                  isActive
                    ? "text-blue-700"
                    : "text-gray-500 group-hover:text-blue-700",
                )}
              />
              <span className="relative z-10 flex-1">{item.label}</span>
              {showBadge ? (
                <Badge variant="danger" className="relative z-10">
                  {pendingRequestCount}
                </Badge>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 px-4 py-4">
        {switchHref && switchLabel ? (
          <Link
            href={switchHref}
            onClick={onNavigate}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-700"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Switch to {switchLabel}
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
