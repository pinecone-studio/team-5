"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { Search, ChevronDown, Check } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

const ADMIN_ACTIVITY_LOG_QUERY = gql`
  query AdminActivityLog($limit: Int) {
    auditLog(limit: $limit) {
      id
      employeeId
      employeeName
      benefitId
      benefitName
      action
      detail
      performedByEmployeeId
      performedBy
      createdAt
    }
  }
`;

const ACTION_FILTERS = [
  "All Actions",
  "Requested",
  "Approved",
  "Locked",
] as const;

interface AuditLogItem {
  id: string;
  employeeId: string | null;
  employeeName: string | null;
  benefitId: string | null;
  benefitName: string | null;
  action: string;
  detail: string;
  performedByEmployeeId: string | null;
  performedBy: string;
  createdAt: string;
}

interface AdminActivityLogQueryData {
  auditLog: AuditLogItem[];
}

function formatTimestamp(isoDate: string) {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return isoDate;

  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 24 && diffHours >= 1) {
    return `${diffHours} hours ago`;
  }

  return parsed.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getActionTone(action: string) {
  const normalized = action.toLowerCase();

  if (normalized.includes("approved")) {
    return " text-[#008B3A]";
  }
  if (normalized.includes("locked")) {
    return " text-[#6A6A6A]";
  }
  if (normalized.includes("rejected") || normalized.includes("cancelled")) {
    return " text-[#D62727]";
  }

  return " text-[#0062DB]";
}

function ActionBadge({ action }: { action: string }) {
  return (
    <span
      className={`inline-flex h-8 items-center rounded-[10px] px-3 text-[14px] font-medium ${getActionTone(
        action,
      )}`}
    >
      {action}
    </span>
  );
}

function AdminActivityLogSkeleton() {
  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Skeleton className="h-10 w-52" />
          <Skeleton className="mt-3 h-6 w-80" />
        </div>

        <div className="flex w-full max-w-xl gap-4">
          <Skeleton className="h-14 flex-1 rounded-[10px]" />
          <Skeleton className="h-14 w-56 rounded-[10px]" />
        </div>
      </div>

      <div className="overflow-hidden rounded-[12px] border border-gray-200 bg-white shadow-sm">
        <div className="space-y-0">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-6 gap-4 border-b border-gray-100 px-6 py-5 last:border-b-0"
            >
              {Array.from({ length: 6 }).map((__, cellIndex) => (
                <Skeleton key={cellIndex} className="h-6 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function AdminActivityLogPage() {
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All Actions");
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { data, loading, error } = useQuery<AdminActivityLogQueryData>(
    ADMIN_ACTIVITY_LOG_QUERY,
    {
      variables: { limit: 200 },
    },
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;

      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredLogs = useMemo(() => {
    const logs = data?.auditLog ?? [];
    const normalizedSearch = search.trim().toLowerCase();

    return logs.filter((log) => {
      const employeeName = (log.employeeName ?? "").toLowerCase();
      const benefitName = (log.benefitName ?? "").toLowerCase();
      const detail = log.detail.toLowerCase();
      const performedBy = log.performedBy.toLowerCase();

      const matchesSearch =
        normalizedSearch === "" ||
        employeeName.includes(normalizedSearch) ||
        benefitName.includes(normalizedSearch) ||
        detail.includes(normalizedSearch) ||
        performedBy.includes(normalizedSearch);

      const matchesFilter =
        selectedFilter === "All Actions" || log.action === selectedFilter;

      return matchesSearch && matchesFilter;
    });
  }, [data?.auditLog, search, selectedFilter]);

  if (loading) {
    return <AdminActivityLogSkeleton />;
  }

  if (error) {
    return (
      <section className="space-y-8">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-gray-950">
            Activity Log
          </h2>
          <p className="mt-3 text-base text-rose-600">
            Activity log could not be loaded. {error.message}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <div className="flex items-start justify-between gap-6">
        <div className="flex h-15 w-94.5 flex-col gap-1">
          <h2 className="text-[2.15rem] font-semibold tracking-[-0.03em] text-slate-900 ">
            Activity Log
          </h2>
          <p className="mt-3 text-[1.05rem] text-slate-500">
            Track all system changes and actions
          </p>
        </div>

        <div className="flex items-center pt-12 gap-3">
          <div className="relative w-[288px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name..."
              className="h-10 w-full rounded-[10px] border border-[#E2E8F0] bg-white pl-9 pr-4 text-[14px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#CBD5E1]"
            />
          </div>

          <div className="relative h-10 w-48.75" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex h-10 w-full items-center justify-between rounded-[10px] border border-[#E2E8F0] bg-white px-4 text-[14px] font-medium text-slate-700"
            >
              {selectedFilter}

              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-11 z-50 w-48.75 overflow-hidden rounded-[10px] border border-[#E2E8F0] bg-white py-1 shadow-lg">
                {ACTION_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => {
                      setSelectedFilter(filter);
                      setDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-[14px] ${
                      selectedFilter === filter
                        ? "bg-slate-50 font-medium text-slate-900"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>{filter}</span>
                    {selectedFilter === filter && (
                      <Check className="h-4 w-4 text-slate-700" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto pt-3">
        <div className="overflow-hidden rounded-[12px] border border-[#E2E8F0] bg-white">
          <table className="w-full max-w-[294.5] table-fixed">
            <thead className="bg-[#E1E7F0]">
              <tr className="h-14.5 border-b border-[#E2E8F0]">
                <th className="w-15 px-6 text-left text-[13px] font-semibold uppercase tracking-[0.04em] text-[#65748B]">
                  TIMESTAMP
                </th>

                <th className="w-25 text-left text-[13px] font-semibold uppercase tracking-[0.04em] text-[#65748B]">
                  EMPLOYEE
                </th>

                <th className="w-20 px-3 text-left text-[13px] font-semibold uppercase tracking-[0.04em] text-[#65748B]">
                  BENEFITS
                </th>

                <th className="w-15 px-3 text-left text-[13px] font-semibold uppercase tracking-[0.04em] text-[#65748B]">
                  ACTION
                </th>

                <th className="w-50.5 px-1 text-left text-[13px] font-semibold uppercase tracking-[0.04em] text-[#65748B]">
                  DETAIL
                </th>

                <th className="w-25 px-5 text-left text-[13px] font-semibold uppercase tracking-[0.04em] text-[#65748B]">
                  PERFORMED BY
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="h-13.5 px-5 text-center text-sm text-[#94A3B8] align-middle"
                  >
                    No activity logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr
                    key={log.id}
                    className={`h-13.5 align-middle ${
                      idx !== filteredLogs.length - 1
                        ? "border-b border-[#E2E8F0]"
                        : ""
                    }`}
                  >
                    <td className="px-6 py-0 text-[14px] font-normal whitespace-nowrap align-middle text-[#667085]">
                      {formatTimestamp(log.createdAt)}
                    </td>

                    <td className=" py-0 text-[14px] font-semibold whitespace-nowrap align-middle text-[#0F172A]">
                      {log.employeeName ?? "System"}
                    </td>

                    <td className="px-3 py-0 text-[14px] whitespace-nowrap align-middle text-[#334155]">
                      {log.benefitName ?? "-"}
                    </td>

                    <td className="px-3 py-0 whitespace-nowrap align-middle">
                      <ActionBadge action={log.action} />
                    </td>

                    <td className="px-1 py-0 text-[14px] align-middle text-[#334155]">
                      {log.detail}
                    </td>

                    <td className="px-5 py-0 text-[14px] whitespace-nowrap align-middle text-[#667085]">
                      {log.performedBy}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
