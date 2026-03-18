"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useUser } from "@clerk/react";
import { Bell } from "lucide-react";

import { MY_REQUESTS_QUERY } from "@/lib/employee-portal";
import { isManager, normalizeRole } from "@/lib/auth";
import { cn } from "@/lib/utils";

const ADMIN_NOTIFICATIONS_QUERY = gql`
  query HeaderAdminNotifications($limit: Int) {
    auditLog(limit: $limit) {
      id
      action
      detail
      createdAt
    }
  }
`;

const FINANCE_NOTIFICATIONS_QUERY = gql`
  query HeaderFinanceNotifications {
    benefits {
      id
      name
    }
    benefitRequests {
      id
      benefitId
      status
      createdAt
      updatedAt
    }
  }
`;

type HeaderRole = "employee" | "admin";
type AppRole = ReturnType<typeof normalizeRole>;

interface NotificationEntry {
  id: string;
  message: string;
  seenKey: string;
  timeLabel: string;
}

interface MyRequestsQueryData {
  myRequests: Array<{
    benefit: {
      id: string;
      name: string;
    };
    request: {
      id: string;
      status: string;
      createdAt: string;
      updatedAt: string;
    };
  }>;
}

interface AdminNotificationsQueryData {
  auditLog: Array<{
    id: string;
    action: string;
    detail: string;
    createdAt: string;
  }>;
}

interface FinanceNotificationsQueryData {
  benefits: Array<{
    id: string;
    name: string;
  }>;
  benefitRequests: Array<{
    id: string;
    benefitId: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

function formatRelativeTime(isoDate: string) {
  const parsedDate = new Date(isoDate);
  if (Number.isNaN(parsedDate.getTime())) return "";

  const diffMs = Date.now() - parsedDate.getTime();
  const minuteMs = 1000 * 60;
  const hourMs = minuteMs * 60;
  const dayMs = hourMs * 24;

  if (diffMs < hourMs) {
    const minutes = Math.max(1, Math.floor(diffMs / minuteMs));
    return `${minutes} min ago`;
  }

  if (diffMs < dayMs) {
    const hours = Math.floor(diffMs / hourMs);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  const days = Math.floor(diffMs / dayMs);
  if (days < 7) {
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getEmployeeMessage(status: string, benefitName: string) {
  switch (status) {
    case "approved":
      return `${benefitName} request is approved.`;
    case "rejected":
      return `${benefitName} request has been rejected.`;
    case "cancelled":
      return `${benefitName} request was cancelled.`;
    default:
      return `${benefitName} request is pending review.`;
  }
}

function getFinanceMessage(status: string, benefitName: string) {
  switch (status) {
    case "approved":
      return `${benefitName} request was approved.`;
    case "rejected":
      return `${benefitName} request was rejected.`;
    case "cancelled":
      return `${benefitName} request was cancelled.`;
    default:
      return `${benefitName} request needs review.`;
  }
}

function readStoredSeenKey(storageKey: string) {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function persistSeenKey(storageKey: string, seenKey: string) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(storageKey, seenKey);
  } catch {
    // Ignore storage failures and fall back to in-memory state.
  }
}

interface NotificationMenuContentProps {
  role: HeaderRole;
  actualRole: AppRole;
  storageKey: string;
}

function NotificationMenuContent({
  role,
  actualRole,
  storageKey,
}: NotificationMenuContentProps) {
  const [open, setOpen] = useState(false);
  const [lastSeenKey, setLastSeenKey] = useState<string | null>(() =>
    readStoredSeenKey(storageKey),
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isEmployeeShell = role === "employee";
  const isManagerShell = role === "admin" && isManager(actualRole);
  const isFinanceReviewer = role === "admin" && actualRole === "finance_manager";
  const isPortalShell = role === "employee" || role === "admin";

  const { data: employeeData, loading: employeeLoading } =
    useQuery<MyRequestsQueryData>(MY_REQUESTS_QUERY, {
      skip: !isEmployeeShell,
      pollInterval: 20000,
      fetchPolicy: "cache-and-network",
    });
  const { data: adminData, loading: adminLoading } =
    useQuery<AdminNotificationsQueryData>(ADMIN_NOTIFICATIONS_QUERY, {
      skip: !isManagerShell,
      variables: { limit: 5 },
      pollInterval: 20000,
      fetchPolicy: "cache-and-network",
    });
  const { data: financeData, loading: financeLoading } =
    useQuery<FinanceNotificationsQueryData>(FINANCE_NOTIFICATIONS_QUERY, {
      skip: !isFinanceReviewer,
      pollInterval: 20000,
      fetchPolicy: "cache-and-network",
    });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const notifications = useMemo<NotificationEntry[]>(() => {
    if (isEmployeeShell) {
      return [...(employeeData?.myRequests ?? [])]
        .filter(({ request }) => request.status !== "pending")
        .sort(
          (leftItem, rightItem) =>
            new Date(rightItem.request.updatedAt).getTime() -
            new Date(leftItem.request.updatedAt).getTime(),
        )
        .slice(0, 5)
        .map(({ benefit, request }) => ({
          id: request.id,
          message: getEmployeeMessage(request.status, benefit.name),
          seenKey: `${request.id}:${request.updatedAt}`,
          timeLabel: formatRelativeTime(request.updatedAt),
        }));
    }

    if (isFinanceReviewer) {
      const benefitMap = new Map(
        (financeData?.benefits ?? []).map((benefit) => [benefit.id, benefit.name]),
      );

      return [...(financeData?.benefitRequests ?? [])]
        .sort(
          (leftItem, rightItem) =>
            new Date(rightItem.updatedAt).getTime() -
            new Date(leftItem.updatedAt).getTime(),
        )
        .slice(0, 5)
        .map((request) => {
          const benefitName = benefitMap.get(request.benefitId) ?? "Benefit";

          return {
            id: request.id,
            message: getFinanceMessage(request.status, benefitName),
            seenKey: `${request.id}:${request.updatedAt}`,
            timeLabel: formatRelativeTime(request.updatedAt),
          };
        });
    }

    return (adminData?.auditLog ?? []).map((item) => ({
      id: item.id,
      message: item.detail,
      seenKey: `${item.id}:${item.createdAt}`,
      timeLabel: formatRelativeTime(item.createdAt),
    }));
  }, [adminData?.auditLog, employeeData?.myRequests, financeData, isEmployeeShell, isFinanceReviewer]);

  const latestSeenKey = notifications[0]?.seenKey ?? null;

  const isLoading = isEmployeeShell
    ? employeeLoading
    : isFinanceReviewer
      ? financeLoading
      : adminLoading;
  const hasUnread = !open && Boolean(latestSeenKey && latestSeenKey !== lastSeenKey);

  function markNotificationsSeen() {
    if (latestSeenKey) {
      persistSeenKey(storageKey, latestSeenKey);
      setLastSeenKey(latestSeenKey);
    }
  }

  function handleToggleOpen() {
    if (open) {
      markNotificationsSeen();
      setOpen(false);
      return;
    }

    markNotificationsSeen();
    setOpen(true);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggleOpen}
        className={
          isPortalShell
            ? "relative rounded-[10px] p-2 text-[#7a8798] transition hover:bg-[#f4f7fb] hover:text-[#17243d]"
            : "relative rounded-[10px] p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        }
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-5 w-5" />
        {hasUnread ? (
          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#EF4444]" />
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-3 w-[min(29rem,calc(100vw-2rem))] overflow-hidden rounded-[14px] border border-[#d9e1ef] bg-white shadow-[0_16px_38px_rgba(15,23,42,0.12)]">
          <div className="border-b border-[#e8edf5] px-5 py-4">
            <p className="text-[1.05rem] font-semibold text-[#17243d]">
              Notification
            </p>
          </div>

          <div className="max-h-[22rem] overflow-y-auto">
            {isLoading ? (
              <div className="px-5 py-4 text-sm text-[#708198]">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-5 py-4 text-sm text-[#708198]">
                No notifications yet.
              </div>
            ) : (
              notifications.map((item, index) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-start justify-between gap-4 px-5 py-4",
                    index !== notifications.length - 1
                      ? "border-b border-[#eef2f7]"
                      : "",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[1rem] font-medium leading-6 text-[#24324a]">
                      {item.message}
                    </p>
                  </div>
                  <span className="shrink-0 pt-0.5 text-[0.95rem] text-[#7c8aa5]">
                    {item.timeLabel}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function NotificationMenu({ role = "admin" }: { role?: HeaderRole }) {
  const { user } = useUser();
  const actualRole = normalizeRole(user?.publicMetadata?.role);
  const storageKey = `notification-menu-seen:${role}:${actualRole}:${user?.id ?? "guest"}`;

  return (
    <NotificationMenuContent
      key={storageKey}
      role={role}
      actualRole={actualRole}
      storageKey={storageKey}
    />
  );
}
