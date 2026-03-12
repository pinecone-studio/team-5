import { Search } from "lucide-react"

const activityLogs = [
  {
    timestamp: "18 hours ago",
    employee: "Болд Батбаяр",
    benefit: "Gym - Pinefit",
    action: "Requested",
    detail: "Gym (PineFit) contract v2025.1 accepted",
    performedBy: "Болд Батбаяр",
  },
  {
    timestamp: "Nov 12, 2025",
    employee: "Саран Дорж",
    benefit: "Remote Work",
    action: "Locked",
    detail: "late_arrivals > 3",
    performedBy: "System",
  },
  {
    timestamp: "Mar 17, 2024",
    employee: "Тэмүүлэн Ганбат",
    benefit: "UX Engineer Tools",
    action: "Approved",
    detail: "Requirement satisfied",
    performedBy: "System",
  },
  {
    timestamp: "Mar 17, 2024",
    employee: "Тэмүүлэн Ганбат",
    benefit: "UX Engineer Tools",
    action: "Requested",
    detail: "UX Engineer Tools access requested",
    performedBy: "Тэмүүлэн Ганбат",
  },
  {
    timestamp: "Mar 17, 2024",
    employee: "Оюунаа Батсүх",
    benefit: "Down Payment Assistance",
    action: "Approved",
    detail: "Contract accepted request approved",
    performedBy: "Sarnai M.",
  },
]

function ActionBadge({ action }: { action: string }) {
  if (action === "Approved") {
    return (
      <span className="inline-flex rounded-2xl bg-green-100 px-4 py-1.5 text-sm font-medium text-green-800">
        {action}
      </span>
    )
  }

  if (action === "Locked") {
    return (
      <span className="inline-flex rounded-2xl bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-800">
        {action}
      </span>
    )
  }

  return (
    <span className="inline-flex rounded-2xl bg-sky-100 px-4 py-1.5 text-sm font-medium text-sky-800">
      {action}
    </span>
  )
}

export default function AdminActivityLogPage() {
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
              {activityLogs.map((log, index) => (
                <tr
                  key={`${log.timestamp}-${log.employee}-${index}`}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  <td className="px-3 py-7 first:pl-0 text-lg text-gray-900">
                    {log.timestamp}
                  </td>
                  <td className="px-3 py-7 text-lg text-gray-900">
                    {log.employee}
                  </td>
                  <td className="px-3 py-7 text-lg text-gray-900">
                    {log.benefit}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
