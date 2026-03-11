"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ElementType } from "react";
import {
  Gift,
  FileText,
  HelpCircle,
  Users,
  Inbox,
  Scale,
  FileCheck,
  ClipboardList,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  label: string;
  icon: ElementType;
  href: string;
}

const employeeNav: NavItem[] = [
  { label: "My Benefits", icon: Gift, href: "/dashboard" },
  { label: "My Requests", icon: FileText, href: "/requests" },
  { label: "Help", icon: HelpCircle, href: "/help" },
];

const adminNav: NavItem[] = [
  { label: "Employees", icon: Users, href: "/admin/users" },
  { label: "Requests", icon: Inbox, href: "/admin" },
  { label: "Rules", icon: Scale, href: "/admin/rule" },
  { label: "Contracts", icon: FileCheck, href: "/admin/contracts" },
  { label: "Audit Log", icon: ClipboardList, href: "/admin/audit" },
];

interface RoleSidebarProps {
  role: "employee" | "admin";
  pendingRequestCount?: number;
  userName?: string;
}

export function RoleSidebar({
  role,
  pendingRequestCount,
  userName = "User",
}: RoleSidebarProps) {
  const navItems = role === "admin" ? adminNav : employeeNav;
  const defaultPath = role === "admin" ? "/admin/users" : "/dashboard";
  const pathname = usePathname();
  const currentPath = pathname ?? defaultPath;

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="px-6 py-5">
        <span className="text-xl font-bold tracking-tight text-blue-600">
          EBMS
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = currentPath === item.href;
          const showBadge =
            item.label === "Requests" &&
            role === "admin" &&
            Boolean(pendingRequestCount && pendingRequestCount > 0);

          return (
            <Link
              key={item.href}
              href={item.href}
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
                <Badge variant="destructive">{pendingRequestCount}</Badge>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">
              {userName}
            </p>
            <Link
              href={role === "admin" ? "/dashboard" : "/admin/users"}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftRight className="h-3 w-3" />
              Switch to {role === "admin" ? "Employee" : "Admin"}
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
