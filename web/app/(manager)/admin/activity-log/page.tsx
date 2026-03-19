"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import {
  Search,
  ChevronDown,
  Check,
  CalendarDays,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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
  "Overridden",
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
    return "text-[#008B3A]";
  }

  if (normalized.includes("overridden")) {
    return "text-[#7C3AED]";
  }

  if (normalized.includes("locked")) {
    return "text-[#6A6A6A]";
  }

  if (normalized.includes("rejected") || normalized.includes("cancelled")) {
    return "text-[#D62727]";
  }

  return "text-[#0062DB]";
}

function getActionFilterLabel(action: string) {
  const normalized = action.toLowerCase();

  if (normalized.includes("overridden")) {
    return "Overridden";
  }

  if (normalized.includes("approved")) {
    return "Approved";
  }

  if (normalized.includes("locked")) {
    return "Locked";
  }

  if (normalized.includes("requested")) {
    return "Requested";
  }

  return action;
}

function getDateKey(isoDate: string) {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return "";

  return getDateKeyFromDate(parsed);
}

function getDateKeyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCalendarDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const jsDay = firstDay.getDay();
  const mondayBasedOffset = (jsDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: Array<number | null> = [];

  for (let i = 0; i < mondayBasedOffset; i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(day);
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

function getDateFromDateKey(value: string) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function isSameDay(left: Date | null, right: Date | null) {
  if (!left || !right) return false;

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatDateFilterLabel(value: string) {
  if (!value) {
    return "";
  }

  const parsed = getDateFromDateKey(value);
  if (!parsed) {
    return value;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ActionBadge({ action }: { action: string }) {
  const label = getActionFilterLabel(action);

  return (
    <span
      className={`inline-flex h-8 items-center rounded-[10px] px-3 text-[16px] font-medium ${getActionTone(
        action,
      )}`}
    >
      {label}
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
          <Skeleton className="h-9 w-9 rounded-[10px]" />
        </div>
      </div>

      <div className="admin-table-card">
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
  const [selectedStartDate, setSelectedStartDate] = useState("");
  const [selectedEndDate, setSelectedEndDate] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [draftStartDate, setDraftStartDate] = useState<Date | null>(null);
  const [draftEndDate, setDraftEndDate] = useState<Date | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const calendarRef = useRef<HTMLDivElement | null>(null);

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

      if (calendarRef.current && !calendarRef.current.contains(target)) {
        setIsCalendarOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const calendarDays = useMemo(
    () => getCalendarDays(calendarMonth),
    [calendarMonth],
  );

  const openCalendar = () => {
    const baseDate =
      getDateFromDateKey(selectedStartDate) ??
      getDateFromDateKey(selectedEndDate) ??
      new Date();
    setCalendarMonth(baseDate);
    setDraftStartDate(getDateFromDateKey(selectedStartDate));
    setDraftEndDate(getDateFromDateKey(selectedEndDate));
    setDropdownOpen(false);
    setIsCalendarOpen(true);
  };

  const closeCalendar = () => {
    setIsCalendarOpen(false);
    setDraftStartDate(getDateFromDateKey(selectedStartDate));
    setDraftEndDate(getDateFromDateKey(selectedEndDate));
  };

  const applyCalendarFilter = () => {
    if (!draftStartDate) {
      setIsCalendarOpen(false);
      return;
    }

    setSelectedStartDate(getDateKeyFromDate(draftStartDate));
    setSelectedEndDate(getDateKeyFromDate(draftEndDate ?? draftStartDate));
    setIsCalendarOpen(false);
  };

  const handleDraftDateSelect = (date: Date) => {
    if (!draftStartDate || draftEndDate) {
      setDraftStartDate(date);
      setDraftEndDate(null);
      return;
    }

    if (date.getTime() < draftStartDate.getTime()) {
      setDraftEndDate(draftStartDate);
      setDraftStartDate(date);
      return;
    }

    setDraftEndDate(date);
  };

  const normalizedDateRange = useMemo(() => {
    if (selectedStartDate && selectedEndDate) {
      return selectedStartDate <= selectedEndDate
        ? { from: selectedStartDate, to: selectedEndDate }
        : { from: selectedEndDate, to: selectedStartDate };
    }

    return {
      from: selectedStartDate,
      to: selectedEndDate || selectedStartDate,
    };
  }, [selectedEndDate, selectedStartDate]);

  const normalizedDraftDateRange = useMemo(() => {
    if (draftStartDate && draftEndDate) {
      return draftStartDate.getTime() <= draftEndDate.getTime()
        ? { from: draftStartDate, to: draftEndDate }
        : { from: draftEndDate, to: draftStartDate };
    }

    return {
      from: draftStartDate,
      to: draftEndDate || draftStartDate,
    };
  }, [draftEndDate, draftStartDate]);

  const selectedDateRangeLabel = useMemo(() => {
    if (!selectedStartDate) {
      return "Filter by date";
    }

    if (!selectedEndDate || selectedStartDate === selectedEndDate) {
      return formatDateFilterLabel(selectedStartDate);
    }

    return `${formatDateFilterLabel(selectedStartDate)} - ${formatDateFilterLabel(
      selectedEndDate,
    )}`;
  }, [selectedEndDate, selectedStartDate]);

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
        selectedFilter === "All Actions" ||
        getActionFilterLabel(log.action) === selectedFilter;

      const logDate = getDateKey(log.createdAt);
      const matchesDate =
        (normalizedDateRange.from === "" ||
          logDate >= normalizedDateRange.from) &&
        (normalizedDateRange.to === "" || logDate <= normalizedDateRange.to);

      return matchesSearch && matchesFilter && matchesDate;
    });
  }, [
    data?.auditLog,
    normalizedDateRange.from,
    normalizedDateRange.to,
    search,
    selectedFilter,
  ]);

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

        <div className="flex items-center gap-3 pt-12">
          <div className="relative w-[288px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name..."
              className="h-10 w-full rounded-[10px] border border-[#E2E8F0] bg-white pl-9 pr-4 text-[16px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#CBD5E1]"
            />
          </div>

          <div className="relative h-10 w-48.75 " ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex h-10 w-full items-center justify-between rounded-[10px] border border-[#E2E8F0] bg-white px-4 text-[16px] font-medium text-slate-700"
            >
              {selectedFilter}

              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition  cursor-pointer ${
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
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-[16px] ${
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

          <div className="relative flex items-center gap-2" ref={calendarRef}>
            <button
              type="button"
              onClick={openCalendar}
              className={`flex h-9 w-9 items-center justify-center rounded-[10px] border cursor-pointer bg-white transition hover:bg-slate-50 ${
                selectedStartDate
                  ? "border-[#BFD3FF] text-[#2F66F6]"
                  : "border-[#E2E8F0] text-slate-500"
              }`}
              title={selectedDateRangeLabel}
              aria-label={selectedDateRangeLabel}
            >
              <CalendarDays className="h-4 w-4" />
            </button>

            {selectedStartDate || selectedEndDate ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedStartDate("");
                  setSelectedEndDate("");
                  setDraftStartDate(null);
                  setDraftEndDate(null);
                  setIsCalendarOpen(false);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#E2E8F0] bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                aria-label="Clear date range filter"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}

            {isCalendarOpen ? (
              <div className="absolute right-0 top-11 z-50 w-75 overflow-hidden rounded-[18px] border border-[#D9E2EF] bg-white shadow-[0_20px_48px_rgba(15,23,42,0.14)]">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth(
                        new Date(
                          calendarMonth.getFullYear(),
                          calendarMonth.getMonth() - 1,
                          1,
                        ),
                      )
                    }
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <div className="text-center">
                    <p className="text-[16px] font-semibold text-slate-900">
                      {calendarMonth.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth(
                        new Date(
                          calendarMonth.getFullYear(),
                          calendarMonth.getMonth() + 1,
                          1,
                        ),
                      )
                    }
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                <div className="px-5 py-4">
                  <div className="grid grid-cols-7 text-center text-[13px] font-semibold text-slate-500">
                    {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
                      <div
                        key={day}
                        className="flex h-8 items-center justify-center"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 grid grid-cols-7 gap-y-2 text-center">
                    {calendarDays.map((day, index) => {
                      const cellDate =
                        day === null
                          ? null
                          : new Date(
                              calendarMonth.getFullYear(),
                              calendarMonth.getMonth(),
                              day,
                            );

                      const isStart = isSameDay(
                        cellDate,
                        normalizedDraftDateRange.from,
                      );
                      const isEnd = isSameDay(
                        cellDate,
                        normalizedDraftDateRange.to,
                      );
                      const isSingleDayRange = isStart && isEnd;
                      const isBetween =
                        cellDate !== null &&
                        normalizedDraftDateRange.from !== null &&
                        normalizedDraftDateRange.to !== null &&
                        cellDate.getTime() >
                          normalizedDraftDateRange.from.getTime() &&
                        cellDate.getTime() <
                          normalizedDraftDateRange.to.getTime();

                      return (
                        <div
                          key={`${day}-${index}`}
                          className="relative flex h-10 items-center justify-center"
                        >
                          {day === null ? (
                            <div className="h-10 w-10" />
                          ) : (
                            <>
                              {isBetween ? (
                                <div className="absolute inset-y-1 left-0 right-0 bg-[#EEF4FF]" />
                              ) : null}
                              {isStart &&
                              normalizedDraftDateRange.to &&
                              !isSingleDayRange ? (
                                <div className="absolute inset-y-1 left-1/2 right-0 bg-[#EEF4FF]" />
                              ) : null}
                              {isEnd &&
                              normalizedDraftDateRange.from &&
                              !isSingleDayRange ? (
                                <div className="absolute inset-y-1 left-0 right-1/2 bg-[#EEF4FF]" />
                              ) : null}
                              <button
                                type="button"
                                onClick={() => {
                                  if (cellDate) {
                                    handleDraftDateSelect(cellDate);
                                  }
                                }}
                                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-[16px] font-medium transition ${
                                  isStart || isEnd
                                    ? "bg-[#2F66F6] text-white"
                                    : "text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                {day}
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 border-t border-[#E5E7EB] px-5 py-4">
                  <button
                    type="button"
                    onClick={closeCalendar}
                    className="flex cursor-pointer h-8 min-w-[96px] items-center justify-center rounded-[12px] border border-[#D9E2EF] bg-white px-4 text-[16px] font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={applyCalendarFilter}
                    disabled={!draftStartDate}
                    className="flex cursor-pointer h-8 min-w-[96px] items-center justify-center rounded-[12px] bg-[#2F66F6] px-4 text-[16px] font-medium text-white transition hover:bg-[#2456d7] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Search
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="pt-3">
        <div className="admin-table-card max-h-[calc(100vh-17rem)] overflow-auto">
          <table className="admin-table w-full min-w-[980px] table-fixed">
            <thead className="admin-table-head admin-table-head-sticky">
              <tr className="admin-table-header-row h-14.5">
                <th className="admin-table-th w-15 px-6 text-left text-[13px]">
                  TIMESTAMP
                </th>

                <th className="admin-table-th w-25 text-left text-[13px]">
                  EMPLOYEE
                </th>

                <th className="admin-table-th w-20 px-3 text-left text-[13px]">
                  BENEFITS
                </th>

                <th className="admin-table-th w-15 px-3 text-left text-[13px]">
                  ACTION
                </th>

                <th className="admin-table-th w-50.5 px-1 text-left text-[13px]">
                  DETAIL
                </th>

                <th className="admin-table-th w-25 px-5 text-left text-[13px]">
                  PERFORMED BY
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="admin-table-cell h-13.5 px-5 text-center text-sm text-[#94A3B8] align-middle"
                  >
                    No activity logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="h-13.5 align-middle">
                    <td className="admin-table-cell px-6 py-0 text-[16px] font-normal whitespace-nowrap align-middle text-[#667085]">
                      {formatTimestamp(log.createdAt)}
                    </td>

                    <td className="admin-table-cell py-0 text-[16px] font-medium whitespace-nowrap align-middle text-[#0F172A]">
                      {log.employeeName ?? "System"}
                    </td>

                    <td className="admin-table-cell px-3 py-0 text-[16px] whitespace-nowrap align-middle text-[#334155]">
                      {log.benefitName ?? "-"}
                    </td>

                    <td className="admin-table-cell px-3 py-0 whitespace-nowrap align-middle">
                      <ActionBadge action={log.action} />
                    </td>

                    <td className="admin-table-cell px-1 py-0 text-[16px] align-middle text-[#334155]">
                      {log.detail}
                    </td>

                    <td className="admin-table-cell px-5 py-0 text-[16px] whitespace-nowrap align-middle text-[#667085]">
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
