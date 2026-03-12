import {
  AlertTriangle,
  Clock3,
  FileText,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"

const summaryCards = [
  {
    title: "Total Staff",
    value: 5,
    icon: Users,
    iconClassName: "text-blue-600",
  },
  {
    title: "Pending",
    value: 1,
    icon: Clock3,
    iconClassName: "text-amber-500",
  },
  {
    title: "OKR not submitted",
    value: 2,
    icon: AlertTriangle,
    iconClassName: "text-red-500",
  },
  {
    title: "Priority",
    value: 11,
    icon: FileText,
    iconClassName: "text-green-600",
  },
]

const requests = [
  {
    employee: "Болд Батбаяр",
    priority: "Фитнес - PineFit",
    status: "Confirmed",
    date: "14/01/2026",
  },
  {
    employee: "Болд Батбаяр",
    priority: "Аялал жуулчлал",
    status: "Pending",
    date: "05/03/2026",
  },
]

function StatusBadge({ status }: { status: string }) {
  if (status === "Confirmed") {
    return (
      <span className="inline-flex min-w-28 justify-center rounded-full bg-gray-950 px-4 py-1.5 text-sm font-medium text-white">
        {status}
      </span>
    )
  }

  return (
    <span className="inline-flex min-w-24 justify-center rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-700">
      {status}
    </span>
  )
}

export default function AdminRequestsPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-gray-950">
            HR Admin Dashboard
          </h2>
          <p className="mt-2 text-base text-gray-500">
            Employee Access Privilege Management and Control
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon

            return (
              <article
                key={card.title}
                className="flex items-center gap-4 rounded-[24px] border border-gray-200 bg-white px-6 py-7"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50">
                  <Icon className={`h-9 w-9 ${card.iconClassName}`} />
                </div>
                <div>
                  <p className="text-4xl font-semibold leading-none text-gray-950">
                    {card.value}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">{card.title}</p>
                </div>
              </article>
            )
          })}
        </div>

        <div className="mt-8 rounded-[24px] border border-gray-200 bg-white p-6 sm:p-7">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-gray-950">
              Preferential Requests
            </h3>
            <p className="mt-2 text-base text-gray-500">
              Monitor requests sent by employees
            </p>
          </div>

          <div className="mt-8 overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 text-base font-semibold text-gray-950">
                  <th className="px-3 py-4 first:pl-0">Employee</th>
                  <th className="px-3 py-4">Priority</th>
                  <th className="px-3 py-4">Status</th>
                  <th className="px-3 py-4">Date</th>
                  <th className="px-3 py-4 text-right">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => {
                  const isPending = request.status === "Pending"

                  return (
                    <tr
                      key={`${request.employee}-${request.priority}`}
                      className="border-b border-gray-100 last:border-b-0"
                    >
                      <td className="px-3 py-8 first:pl-0 text-lg font-medium text-gray-950">
                        {request.employee}
                      </td>
                      <td className="px-3 py-8 text-lg text-gray-950">
                        {request.priority}
                      </td>
                      <td className="px-3 py-8">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-3 py-8 text-lg text-gray-400">
                        {request.date}
                      </td>
                      <td className="px-3 py-8">
                        <div className="flex justify-end gap-3">
                          {isPending ? (
                            <>
                              <Button className="h-10 rounded-xl bg-blue-600 px-5 text-white hover:bg-blue-700">
                                Confirm
                              </Button>
                              <Button
                                variant="outline"
                                className="h-10 rounded-xl px-5"
                              >
                                Decline
                              </Button>
                            </>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
