import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/auth";
import {
  Activity,
  ArrowLeftRight,
  FileText,
  LayoutGrid,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import EbmsLogo from "@/components/branding/ebms-logo";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  subtitle?: string;
  showPendingBadge?: boolean;
}

function RequestLogoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M15.3 4H7.7C7.05817 4 6.44263 4.25491 5.98873 4.70881C5.53482 5.16271 5.27991 5.77826 5.27991 6.42009V17.5799C5.27991 18.2217 5.53482 18.8373 5.98873 19.2912C6.44263 19.7451 7.05817 20 7.7 20H18.8598C19.5016 20 20.1172 19.7451 20.5711 19.2912C21.025 18.8373 21.2799 18.2217 21.2799 17.5799V10.18M10.12 12.1801L12.48 14.54L20.3466 6.67342"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const employeeNav: NavItem[] = [
  {
    label: "Benefits",
    href: "/dashboard",
    icon: LayoutGrid,
    subtitle: "Benefits and eligibility",
  },
  {
    label: "Request",
    href: "/requests",
    icon: RequestLogoIcon,
    subtitle: "Submitted requests and statuses",
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
    label: "Request",
    href: "/admin/requests",
    icon: RequestLogoIcon,
    subtitle: "Ажилтны хүсэлтүүд, шалгалт",
    showPendingBadge: true,
  },
  {
    label: "Rules",
    href: "/admin/rules",
    icon: FileText,
    subtitle: "Benefit eligibility rules",
  },
  {
    label: "Activity Log",
    href: "/admin/activity-log",
    icon: Activity,
    subtitle: "Өөрчлөлтийн түүх, аудит",
  },
];

export const financeNav: NavItem[] = [
  {
    label: "Request",
    href: "/admin/requests",
    icon: RequestLogoIcon,
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
  const isPortalShell = role === "employee" || role === "admin";

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-white",
        isPortalShell
          ? "w-[14.625rem] border-[#dfe6f0]"
          : "w-60 border-gray-200",
      )}
    >
      <div className={cn(isPortalShell ? "px-4 py-6" : "px-6 py-5")}>
        {isPortalShell ? (
          <EbmsLogo />
        ) : (
          <span className="text-xl font-bold tracking-tight text-blue-600">
            EBMS
          </span>
        )}
      </div>

      <nav
        className={cn(
          "flex-1 px-2.5",
          isPortalShell ? "space-y-1.5 pt-8" : "space-y-2 pt-4",
        )}
      >
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
                "group relative flex items-center gap-3 overflow-hidden px-4 text-[1rem] font-medium transition-colors",
                isPortalShell ? "rounded-[12px] py-3" : "rounded-[10px] py-3",
                isPortalShell
                  ? isActive
                    ? "bg-[#edf2f9] text-[#17243d]"
                    : "text-[#253247] hover:bg-[#f6f8fb] hover:text-[#17243d]"
                  : isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-500 hover:bg-gray-100 hover:text-blue-700",
              )}
            >
              {!isPortalShell ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute inset-y-0 right-0 w-[4px] rounded-l-[999px] bg-blue-600 transition-opacity duration-200",
                    isActive
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100",
                  )}
                />
              ) : null}
              <item.icon
                className={cn(
                  "relative z-10 h-5 w-5 shrink-0 transition-colors",
                  isPortalShell
                    ? isActive
                      ? "text-[#17243d]"
                      : "text-[#334155] group-hover:text-[#17243d]"
                    : isActive
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

      <div
        className={cn(
          "border-t px-4 py-4",
          isPortalShell
            ? "mt-auto border-[#dfe6f0] px-4 py-5"
            : "border-gray-200",
        )}
      >
        {switchHref && switchLabel ? (
          <Link
            href={switchHref}
            onClick={onNavigate}
            className={cn(
              "inline-flex items-center gap-1.5 text-sm transition",
              isPortalShell
                ? "text-[0.95rem] font-medium text-[#253247] hover:text-[#111827]"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            <ArrowLeftRight className="h-4 w-4" />
            Switch to {switchLabel}
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
