"use client"

import { useEffect, useMemo, useState } from "react"
import { gql } from "@apollo/client"
import { useMutation, useQuery } from "@apollo/client/react"
import { useUser } from "@clerk/react"
import { CheckCircle2, FileText, LoaderCircle, X, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { canAccessAdminRequests, isManager, normalizeRole } from "@/lib/auth"
import { cn } from "@/lib/utils"

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
      contractAcceptedAt
      reviewNotes
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
      contractAcceptedAt
      reviewNotes
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
      contractAcceptedAt
      reviewNotes
      reviewedBy
      updatedAt
    }
  }
`

type RequestStatus = "pending" | "approved" | "rejected" | "cancelled"
type NoticeTone = "approved" | "rejected"

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
  contractAcceptedAt: string | null
  reviewNotes: string | null
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
    contractAcceptedAt: string | null
    reviewNotes: string | null
    reviewedBy: string | null
    updatedAt: string
  }
}

interface UpdateRequestStatusMutationVariables {
  input: {
    id: string
    status: RequestStatus
    reviewNotes?: string | null
  }
}

interface RequestRow {
  id: string
  employee: string
  benefit: string
  status: RequestStatus
  createdAt: string
  contractAcceptedAt: string | null
  reviewNotes: string | null
}

function formatDate(isoDate: string) {
  const parsed = new Date(isoDate)
  if (Number.isNaN(parsed.getTime())) return isoDate

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function getStatusClasses(status: RequestStatus) {
  switch (status) {
    case "approved":
      return "bg-[#DCFCE7] text-[#15803D]"
    case "rejected":
      return "bg-[#F4F6F8] text-[#5F6B7E]"
    case "cancelled":
      return "bg-[#E5E7EB] text-[#4B5563]"
    default:
      return "bg-[#FEF3C7] text-[#7C5E10]"
  }
}

function getStatusLabel(status: RequestStatus) {
  switch (status) {
    case "approved":
      return "Approved"
    case "rejected":
      return "Rejected"
    case "cancelled":
      return "Cancelled"
    default:
      return "Pending"
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request could not be updated."
}

function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[10px] px-3 py-1 text-[0.95rem] font-medium",
        getStatusClasses(status),
      )}
    >
      {getStatusLabel(status)}
    </span>
  )
}

function RequestNotice({
  notice,
}: {
  notice: { tone: NoticeTone; title: string } | null
}) {
  if (!notice) return null

  const isApproved = notice.tone === "approved"
  const Icon = isApproved ? CheckCircle2 : XCircle

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[60]">
      <div className="flex min-h-[5.25rem] w-[23rem] items-center gap-3 rounded-[14px] border border-[#d9e1ef] bg-white px-5 py-4 shadow-[0_14px_34px_rgba(15,23,42,0.12)]">
        <Icon
          className={cn(
            "h-9 w-9 shrink-0",
            isApproved ? "text-[#16A34A]" : "text-[#EF4444]",
          )}
        />
        <p
          className={cn(
            "text-[1rem] font-semibold tracking-[-0.02em]",
            isApproved ? "text-[#16A34A]" : "text-[#EF4444]",
          )}
        >
          {notice.title}
        </p>
      </div>
    </div>
  )
}

function RejectRequestDialog({
  request,
  reviewNotes,
  onReviewNotesChange,
  onClose,
  onConfirm,
  submitting,
  errorMessage,
}: {
  request: RequestRow | null
  reviewNotes: string
  onReviewNotesChange: (value: string) => void
  onClose: () => void
  onConfirm: () => void
  submitting: boolean
  errorMessage: string | null
}) {
  if (!request) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-3xl rounded-[18px] border border-[#d7deea] bg-white px-8 py-7 shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
        <div className="flex items-start justify-between gap-5">
          <div className="space-y-3">
            <h2 className="text-[2.4rem] font-semibold tracking-[-0.05em] text-[#17243d]">
              Reject Request
            </h2>
            <p className="max-w-[44rem] text-[1.05rem] leading-[1.65] text-[#6D7B93]">
              You are about to reject {request.employee}&apos;s request for{" "}
              {request.benefit}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] p-2 text-[#5F6B7E] transition hover:bg-[#f4f7fb] hover:text-[#17243d]"
            aria-label="Close reject request dialog"
          >
            <X className="h-7 w-7" />
          </button>
        </div>

        <div className="mt-8 space-y-3">
          <label
            htmlFor="reject-review-notes"
            className="block text-[1.1rem] font-semibold tracking-[-0.03em] text-[#17243d]"
          >
            Review Notes (Optional)
          </label>
          <textarea
            id="reject-review-notes"
            value={reviewNotes}
            onChange={(event) => onReviewNotesChange(event.target.value)}
            placeholder="Add notes for the employee regarding this reject..."
            className="min-h-40 w-full rounded-[14px] border-2 border-[#2F66F6] px-5 py-4 text-[1rem] leading-7 text-[#17243d] outline-none placeholder:text-[#7A8798]"
          />
          {errorMessage ? (
            <p className="text-sm text-rose-600">{errorMessage}</p>
          ) : null}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="h-12 min-w-[10rem] rounded-[12px] border-[#d7deea] px-6 text-[1rem] font-medium text-[#17243d] hover:bg-[#f8fafc]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="h-12 min-w-[13rem] rounded-[12px] bg-[#EF4444] px-6 text-[1rem] font-medium text-white hover:bg-[#DC2626]"
          >
            {submitting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Rejecting
              </>
            ) : (
              "Confirm Reject"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

function AdminRequestsSkeleton() {
  return (
    <div className="space-y-7 pb-24">
      <div className="space-y-3">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-6 w-[30rem]" />
      </div>

      <div className="overflow-hidden rounded-[12px] border border-[#d9e1ef] bg-white">
        <div className="grid grid-cols-[4.5rem_1.4fr_1.2fr_1fr_1fr_1.15fr] gap-4 bg-[#edf2f9] px-6 py-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-6 w-full" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid grid-cols-[4.5rem_1.4fr_1.2fr_1fr_1fr_1.15fr] gap-4 border-t border-[#e8edf5] px-6 py-5"
          >
            {Array.from({ length: 6 }).map((__, cellIndex) => (
              <Skeleton key={cellIndex} className="h-8 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminRequestsPage() {
  const [notice, setNotice] = useState<{ tone: NoticeTone; title: string } | null>(
    null,
  )
  const [actionError, setActionError] = useState<string | null>(null)
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null)
  const [rejectingRequest, setRejectingRequest] = useState<RequestRow | null>(null)
  const [rejectReviewNotes, setRejectReviewNotes] = useState("")

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

  const loading =
    !isRoleLoaded || (canViewStaffSummary ? adminLoading : reviewerLoading)
  const error = canViewStaffSummary ? adminError : reviewerError

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
          benefit: benefitMap.get(request.benefitId)?.name ?? request.benefitId,
          status: request.status,
          createdAt: request.createdAt,
          contractAcceptedAt: request.contractAcceptedAt,
          reviewNotes: request.reviewNotes,
        }))
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime(),
        ),
    [benefitMap, benefitRequests, employeeMap],
  )

  useEffect(() => {
    if (!notice) return

    const timeoutId = window.setTimeout(() => {
      setNotice(null)
    }, 2800)

    return () => window.clearTimeout(timeoutId)
  }, [notice])

  function closeRejectDialog() {
    if (updateLoading) return

    setRejectingRequest(null)
    setRejectReviewNotes("")
    setActionError(null)
  }

  function openRejectDialog(request: RequestRow) {
    setRejectingRequest(request)
    setRejectReviewNotes(request.reviewNotes ?? "")
    setActionError(null)
  }

  async function refetchRequests() {
    if (canViewStaffSummary) {
      await refetchAdminData()
    } else {
      await refetchReviewerData()
    }
  }

  async function handleUpdateRequest(
    requestId: string,
    status: RequestStatus,
    reviewNotes?: string | null,
  ) {
    try {
      setActionError(null)
      setProcessingRequestId(requestId)

      await updateRequestStatus({
        variables: {
          input: {
            id: requestId,
            status,
            ...(reviewNotes !== undefined ? { reviewNotes } : {}),
          },
        },
      })

      await refetchRequests()
      setNotice({
        tone: status === "approved" ? "approved" : "rejected",
        title: status === "approved" ? "Request Approved" : "Request Rejected",
      })
    } catch (mutationError) {
      setActionError(getErrorMessage(mutationError))
      throw mutationError
    } finally {
      setProcessingRequestId(null)
    }
  }

  async function handleApprove(request: RequestRow) {
    await handleUpdateRequest(request.id, "approved")
  }

  async function handleConfirmReject() {
    if (!rejectingRequest) return

    try {
      await handleUpdateRequest(
        rejectingRequest.id,
        "rejected",
        rejectReviewNotes.trim() || null,
      )
      closeRejectDialog()
    } catch {
      return
    }
  }

  if (loading) {
    return <AdminRequestsSkeleton />
  }

  if (!canReviewRequests) {
    return (
      <section className="rounded-[12px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
        You do not have permission to review employee requests.
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-[12px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
        Requests dashboard could not be loaded. {error.message}
      </section>
    )
  }

  const title = canViewStaffSummary
    ? "HR Admin Dashboard"
    : "Finance Review Dashboard"
  const description = canViewStaffSummary
    ? "Employee Access Privilege Management and Control"
    : "Review and confirm benefit requests that need financial approval"

  return (
    <>
      <div className="space-y-7 pb-24">
        <section className="space-y-2 pt-2">
          <h1 className="text-[2.35rem] font-semibold tracking-[-0.05em] text-[#17243d]">
            {title}
          </h1>
          <p className="text-[1.15rem] text-[#708198]">{description}</p>
        </section>

        {actionError && !rejectingRequest ? (
          <section className="rounded-[12px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {actionError}
          </section>
        ) : null}

        <section className="overflow-hidden rounded-[12px] border border-[#d9e1ef] bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-[#edf2f9]">
                <tr className="text-[0.95rem] uppercase tracking-[0.03em] text-[#6D7B93]">
                  <th className="w-16 px-6 py-5 font-medium">#</th>
                  <th className="px-6 py-5 font-medium">Employee</th>
                  <th className="px-6 py-5 font-medium">Benefit</th>
                  <th className="px-6 py-5 font-medium">Date</th>
                  <th className="px-6 py-5 font-medium">Status</th>
                  <th className="px-6 py-5 text-right font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {requests.length > 0 ? (
                  requests.map((request, index) => {
                    const isPending = request.status === "pending"
                    const isProcessing =
                      updateLoading && processingRequestId === request.id

                    return (
                      <tr
                        key={request.id}
                        className="border-t border-[#e8edf5] text-[#17243d]"
                      >
                        <td className="px-6 py-5 text-[1rem]">{index + 1}</td>
                        <td className="px-6 py-5 text-[1.15rem] font-semibold tracking-[-0.02em]">
                          {request.employee}
                        </td>
                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            <p className="text-[1.15rem] tracking-[-0.02em] text-[#17243d]">
                              {request.benefit}
                            </p>
                            {request.contractAcceptedAt ? (
                              <p className="text-[0.95rem] text-[#16A34A]">
                                Contract Accepted
                              </p>
                            ) : null}
                            {request.status === "rejected" && request.reviewNotes ? (
                              <p className="max-w-xl text-[0.9rem] text-[#708198]">
                                {request.reviewNotes}
                              </p>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-[1.1rem] text-[#5F6B7E]">
                          {formatDate(request.createdAt)}
                        </td>
                        <td className="px-6 py-5">
                          <StatusBadge status={request.status} />
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-3">
                            {isPending ? (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => openRejectDialog(request)}
                                  disabled={isProcessing}
                                  className="h-10 rounded-[10px] border-[#d9e1ef] px-5 text-[0.95rem] font-medium text-[#17243d] hover:bg-[#f8fafc]"
                                >
                                  Reject
                                </Button>
                                <Button
                                  type="button"
                                  onClick={() => handleApprove(request)}
                                  disabled={isProcessing}
                                  className="h-10 rounded-[10px] bg-[#2F66F6] px-5 text-[0.95rem] font-medium text-white hover:bg-[#2456d7]"
                                >
                                  {isProcessing ? (
                                    <>
                                      <LoaderCircle className="h-4 w-4 animate-spin" />
                                      Saving
                                    </>
                                  ) : (
                                    "Confirm"
                                  )}
                                </Button>
                              </>
                            ) : (
                              <span className="text-sm text-[#94A3B8]">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-14">
                      <div className="flex flex-col items-center justify-center gap-3 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#f4f7fb] text-[#708198]">
                          <FileText className="h-6 w-6" />
                        </div>
                        <p className="text-[1.05rem] font-medium text-[#17243d]">
                          No requests found
                        </p>
                        <p className="text-[0.95rem] text-[#708198]">
                          New employee requests will appear here once submitted.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <RejectRequestDialog
        request={rejectingRequest}
        reviewNotes={rejectReviewNotes}
        onReviewNotesChange={setRejectReviewNotes}
        onClose={closeRejectDialog}
        onConfirm={handleConfirmReject}
        submitting={updateLoading && processingRequestId === rejectingRequest?.id}
        errorMessage={actionError}
      />

      <RequestNotice notice={notice} />
    </>
  )
}
