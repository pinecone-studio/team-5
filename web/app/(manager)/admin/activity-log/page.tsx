"use client"

import { useMemo, useState } from "react"
import { gql } from "@apollo/client"
import { useQuery } from "@apollo/client/react"
import { Search } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"

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
`

interface AuditLogItem {
  id: string
  employeeId: string | null
  employeeName: string | null
  benefitId: string | null
  benefitName: string | null
  action: string
  detail: string
  performedByEmployeeId: string | null
  performedBy: string
  createdAt: string
}

interface AdminActivityLogQueryData {
  auditLog: AuditLogItem[]
}

function formatTimestamp(isoDate: string) {
  const parsed = new Date(isoDate)
  if (Number.isNaN(parsed.getTime())) return isoDate

  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getActionTone(action: string) {
  const normalized = action.toLowerCase()

  if (normalized.includes("approved")) {
    return "bg-green-100 text-green-800"
  }

  if (
    normalized.includes("locked") ||
    normalized.includes("rejected") ||
    normalized.includes("cancelled")
  ) {
    return "bg-amber-100 text-amber-800"
  }

  return "bg-sky-100 text-sky-800"
}

function ActionBadge({ action }: { action: string }) {
  return (
    <span
      className={`inline-flex rounded-2xl px-4 py-1.5 text-sm font-medium ${getActionTone(
        action,
      )}`}
    >
      {action}
    </span>
  )
}

function AdminActivityLogSkeleton() {
  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="mt-2 h-5 w-72" />
        </div>

        <Skeleton className="h-14 w-full max-w-md rounded-2xl" />
      </div>

      <div className="overflow-hidden rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-6 gap-4 rounded-2xl border border-gray-100 p-4"
            >
              {Array.from({ length: 6 }).map((__, cellIndex) => (
                <Skeleton key={cellIndex} className="h-6 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function AdminActivityLogPage() {
  const [search, setSearch] = useState("")
  const { data, loading, error } = useQuery<AdminActivityLogQueryData>(
    ADMIN_ACTIVITY_LOG_QUERY,
    {
      variables: { limit: 200 },
    },
  )

  const filteredLogs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const logs = data?.auditLog ?? []

    if (!normalizedSearch) {
      return logs
    }

    return logs.filter((log) =>
      [
        log.employeeName,
        log.benefitName,
        log.action,
        log.detail,
        log.performedBy,
      ]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(normalizedSearch)),
    )
  }, [data?.auditLog, search])

  if (loading) {
    return <AdminActivityLogSkeleton />
  }

  if (error) {
    return (
      <section className="space-y-8">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-gray-950">
            Activity Log
          </h2>
          <p className="mt-2 text-base text-rose-600">
            Activity log could not be loaded. {error.message}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-gray-950">
            Activity Log
          </h2>
          <p className="mt-2 text-base text-gray-500">
            Track all system changes and actions
          </p>
        </div>

        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search activity log..."
            className="h-14 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 text-base text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-300"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 text-base font-semibold text-gray-950">
                <th className="px-3 py-4 first:pl-0">Timestamp</th>
                <th className="px-3 py-4">Employee</th>
                <th className="px-3 py-4">Benefits</th>
                <th className="px-3 py-4">Action</th>
                <th className="px-3 py-4">Detail</th>
                <th className="px-3 py-4">Performed by</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-10 text-center text-base text-gray-500"
                  >
                    No activity logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-gray-100 last:border-b-0"
                  >
                    <td className="px-3 py-7 first:pl-0 text-lg text-gray-900">
                      {formatTimestamp(log.createdAt)}
                    </td>
                    <td className="px-3 py-7 text-lg text-gray-900">
                      {log.employeeName ?? "System"}
                    </td>
                    <td className="px-3 py-7 text-lg text-gray-900">
                      {log.benefitName ?? "-"}
                    </td>
                    <td className="px-3 py-7">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-3 py-7 text-lg text-gray-900">
                      {log.detail}
                    </td>
                    <td className="px-3 py-7 text-lg text-gray-900">
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
  )
}
