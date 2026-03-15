"use client"

import { useEffect, useMemo, useState } from "react"
import { useUser } from "@clerk/react"
import { gql } from "@apollo/client"
import { useMutation, useQuery } from "@apollo/client/react"
import {
  AlertTriangle,
  Check,
  Clock3,
  FileText,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { canAccessAdminRequests, isManager, normalizeRole } from "@/lib/auth"

const ADMIN_REQUESTS_QUERY = gql`
  query AdminRequestsPageData {
    employees {
      id
      fullName
      okrSubmitted
    }
    benefits {
      id
      name
    }
    benefitRequests {
      id
      employeeId
      benefitId
      status
      reviewedBy
      createdAt
      updatedAt
    }
  }
`

const REVIEWER_REQUESTS_QUERY = gql`
  query ReviewerRequestsPageData {
    benefits {
      id
      name
    }
    benefitRequests {
      id
      employeeId
      benefitId
      status
      reviewedBy
      createdAt
      updatedAt
    }
  }
`

const UPDATE_REQUEST_STATUS_MUTATION = gql`
  mutation UpdateBenefitRequestStatus($input: UpdateBenefitRequestStatusInput!) {
    updateBenefitRequestStatus(input: $input) {
      id
      status
      reviewedBy
      updatedAt
    }
  }
`

type RequestStatus = "pending" | "approved" | "rejected" | "cancelled"

interface EmployeeItem {
  id: string
  fullName: string
  okrSubmitted: boolean
}

interface BenefitItem {
  id: string
  name: string
}

interface BenefitRequestItem {
  id: string
  employeeId: string
  benefitId: string
  status: RequestStatus
  reviewedBy: string | null
  createdAt: string
  updatedAt: string
}

interface AdminRequestsQueryData {
  employees: EmployeeItem[]
  benefits: BenefitItem[]
  benefitRequests: BenefitRequestItem[]
}

interface ReviewerRequestsQueryData {
  benefits: BenefitItem[]
  benefitRequests: BenefitRequestItem[]
}

interface UpdateRequestStatusMutationData {
  updateBenefitRequestStatus: {
    id: string
    status: RequestStatus
    reviewedBy: string | null
    updatedAt: string
  }
}

interface UpdateRequestStatusMutationVariables {
  input: {
    id: string
    status: RequestStatus
    reviewedBy?: string
  }
}

interface RequestRow {
  id: string
  employee: string
  priority: string
  status: RequestStatus
  createdAt: string
  updatedAt: string
}

const statusLabel: Record<RequestStatus, string> = {
  pending: "Pending",
  approved: "Confirmed",
  rejected: "Declined",
  cancelled: "Cancelled",
}

function formatDate(isoDate: string) {
  const parsed = new Date(isoDate)
  if (Number.isNaN(parsed.getTime())) return isoDate

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function StatusBadge({ status }: { status: RequestStatus }) {
  if (status === "approved") {
    return (
      <span className="inline-flex min-w-28 justify-center rounded-full bg-gray-950 px-4 py-1.5 text-sm font-medium text-white">
        {statusLabel[status]}
      </span>
    )
  }

  if (status === "rejected" || status === "cancelled") {
    return (
      <span className="inline-flex min-w-24 justify-center rounded-full bg-rose-100 px-4 py-1.5 text-sm font-medium text-rose-700">
        {statusLabel[status]}
      </span>
    )
  }

  return (
    <span className="inline-flex min-w-24 justify-center rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-700">
      {statusLabel[status]}
    </span>
  )
}

function AdminRequestsSkeleton() {
  return (
    <div className="space-y-8 pb-24">
      <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="mt-3 h-5 w-80" />

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <article
              key={index}
              className="flex items-center gap-4 rounded-[24px] border border-gray-200 bg-white px-6 py-7"
            >
              <Skeleton className="h-16 w-16 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-[24px] border border-gray-200 bg-white p-6 sm:p-7">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-3 h-5 w-64" />

          <div className="mt-8 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-[1.1fr_1fr_0.8fr_0.8fr_1fr] gap-4 rounded-2xl border border-gray-100 p-4"
              >
                {Array.from({ length: 5 }).map((__, cellIndex) => (
                  <Skeleton key={cellIndex} className="h-6 w-full" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default function AdminRequestsPage() {
  const [notice, setNotice] = useState<"approved" | "declined" | null>(null)
  const { isLoaded: isRoleLoaded, user } = useUser()
  const role = normalizeRole(user?.publicMetadata?.role)
  const canViewStaffSummary = isManager(role)
  const canReviewRequests = canAccessAdminRequests(role)

  const {
    data: adminData,
    loading: adminLoading,
    error: adminError,
    refetch: refetchAdminData,
  } = useQuery<AdminRequestsQueryData>(ADMIN_REQUESTS_QUERY, {
    skip: !isRoleLoaded || !canViewStaffSummary,
  })

  const {
    data: reviewerData,
    loading: reviewerLoading,
    error: reviewerError,
    refetch: refetchReviewerData,
  } = useQuery<ReviewerRequestsQueryData>(REVIEWER_REQUESTS_QUERY, {
    skip: !isRoleLoaded || canViewStaffSummary || !canReviewRequests,
  })

  const [updateRequestStatus, { loading: updateLoading }] = useMutation<
    UpdateRequestStatusMutationData,
    UpdateRequestStatusMutationVariables
  >(UPDATE_REQUEST_STATUS_MUTATION)

  const employees = useMemo(() => adminData?.employees ?? [], [adminData?.employees])
  const benefits = useMemo(
    () =>
      canViewStaffSummary
        ? adminData?.benefits ?? []
        : reviewerData?.benefits ?? [],
    [adminData?.benefits, canViewStaffSummary, reviewerData?.benefits],
  )
  const benefitRequests = useMemo(
    () =>
      canViewStaffSummary
        ? adminData?.benefitRequests ?? []
        : reviewerData?.benefitRequests ?? [],
    [
      adminData?.benefitRequests,
      canViewStaffSummary,
      reviewerData?.benefitRequests,
    ],
  )
  const loading =
    !isRoleLoaded || (canViewStaffSummary ? adminLoading : reviewerLoading)
  const error = canViewStaffSummary ? adminError : reviewerError

  const employeeMap = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees],
  )

  const benefitMap = useMemo(
    () => new Map(benefits.map((benefit) => [benefit.id, benefit])),
    [benefits],
  )

  const requests = useMemo<RequestRow[]>(
    () =>
      benefitRequests
        .map((request) => ({
          id: request.id,
          employee:
            employeeMap.get(request.employeeId)?.fullName ?? request.employeeId,
          priority: benefitMap.get(request.benefitId)?.name ?? request.benefitId,
          status: request.status,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
        }))
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime(),
        ),
    [benefitMap, benefitRequests, employeeMap],
  )

  const pendingCount = requests.filter(
    (request) => request.status === "pending",
  ).length
  const reviewedCount = requests.filter(
    (request) => request.status !== "pending",
  ).length
  const okrNotSubmittedCount = employees.filter(
    (employee) => !employee.okrSubmitted,
  ).length

  const summaryCards = canViewStaffSummary
    ? [
        {
          title: "Total Staff",
          value: employees.length,
          icon: Users,
          iconClassName: "text-blue-600",
        },
        {
          title: "Pending",
          value: pendingCount,
          icon: Clock3,
          iconClassName: "text-amber-500",
        },
        {
          title: "OKR not submitted",
          value: okrNotSubmittedCount,
          icon: AlertTriangle,
          iconClassName: "text-red-500",
        },
        {
          title: "Total Requests",
          value: requests.length,
          icon: FileText,
          iconClassName: "text-green-600",
        },
      ]
    : [
        {
          title: "Pending",
          value: pendingCount,
          icon: Clock3,
          iconClassName: "text-amber-500",
        },
        {
          title: "Reviewed",
          value: reviewedCount,
          icon: Check,
          iconClassName: "text-blue-600",
        },
        {
          title: "Total Requests",
          value: requests.length,
          icon: FileText,
          iconClassName: "text-green-600",
        },
      ]

  useEffect(() => {
    if (!notice) return

    const timeoutId = window.setTimeout(() => {
      setNotice(null)
    }, 2800)

    return () => window.clearTimeout(timeoutId)
  }, [notice])

  async function handleUpdateRequest(requestId: string, status: RequestStatus) {
    await updateRequestStatus({
      variables: {
        input: {
          id: requestId,
          status,
        },
      },
    })

    if (canViewStaffSummary) {
      await refetchAdminData()
    } else {
      await refetchReviewerData()
    }
    setNotice(status === "approved" ? "approved" : "declined")
  }

  if (loading) {
    return <AdminRequestsSkeleton />
  }

  if (!canReviewRequests) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
        You do not have permission to review employee requests.
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
        Requests dashboard could not be loaded. {error.message}
      </section>
    )
  }

  return (
    <div className="space-y-8 pb-24">
      <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-gray-950">
            {canViewStaffSummary ? "HR Admin Dashboard" : "Finance Review Dashboard"}
          </h2>
          <p className="mt-2 text-base text-gray-500">
            {canViewStaffSummary
              ? "Employee Access Privilege Management and Control"
              : "Review and confirm benefit requests that need financial approval"}
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
              {canViewStaffSummary ? "Preferential Requests" : "Review Queue"}
            </h3>
            <p className="mt-2 text-base text-gray-500">
              {canViewStaffSummary
                ? "Monitor requests sent by employees"
                : "Monitor and review incoming requests"}
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
                {requests.length > 0 ? (
                  requests.map((request) => {
                    const isPending = request.status === "pending"

                    return (
                      <tr
                        key={request.id}
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
                          {formatDate(request.createdAt)}
                        </td>
                        <td className="px-3 py-8">
                          <div className="flex justify-end gap-3">
                            {isPending ? (
                              <>
                                <Button
                                  className="h-10 rounded-xl bg-blue-600 px-5 text-white hover:bg-blue-700"
                                  onClick={() =>
                                    handleUpdateRequest(request.id, "approved")
                                  }
                                  disabled={updateLoading}
                                >
                                  Confirm
                                </Button>
                                <Button
                                  variant="outline"
                                  className="h-10 rounded-xl px-5"
                                  onClick={() =>
                                    handleUpdateRequest(request.id, "rejected")
                                  }
                                  disabled={updateLoading}
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
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-0 py-10 text-center text-base text-gray-500"
                    >
                      No requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {notice ? (
        <div className="pointer-events-none fixed bottom-6 right-6 z-50">
          <div className="flex min-w-[280px] items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-lg">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white">
              <Check className="h-4 w-4" />
            </div>
            <p className="text-base font-semibold text-gray-950">
              {notice === "approved" ? "Request Approved" : "Request Declined"}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
