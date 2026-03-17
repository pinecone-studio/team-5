"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";

import { MY_REQUESTS_QUERY } from "@/lib/employee-portal";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface RequestItem {
  id: string;
  title: string;
  submittedAtRaw: string;
  reviewedAtRaw: string;
  approvedBy: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  details?: string;
  requestDescription?: string;
  rejectionReason?: string;
}

type RequestStatus = RequestItem["status"];
type StepState = "done" | "current" | "upcoming" | "rejected";

const steps = ["Submitted", "HR Review", "Active"] as const;

type MyRequestsResponse = {
  myRequests: Array<{
    benefit: {
      id: string;
      name: string;
    };
    request: {
      id: string;
      status: "pending" | "approved" | "rejected" | "cancelled";
      reviewNotes: string | null;
      reviewedBy: string | null;
      createdAt: string;
      updatedAt: string;
    };
  }>;
};

function formatDate(isoDate: string) {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getMockRequestMeta(title: string, status: RequestStatus) {
  const normalized = title.toLowerCase();

  if (normalized.includes("mac")) {
    return {
      details:
        "50% financing for MacBook Pro 14-inch purchase. Total price: 3,500,000₮, financing: 1,750,000₮",
      requestDescription: "Required for development work.",
      rejectionReason:
        status === "rejected"
          ? "This request could not be approved at this time."
          : "",
    };
  }

  if (normalized.includes("remote")) {
    return {
      details: "Request to work from home 2 days per week.",
      requestDescription: "The home environment is suitable for working.",
      rejectionReason:
        "Due to the team’s high workload at the moment, remote work is not possible. You may submit a new request again after 2 months.",
    };
  }

  if (
    normalized.includes("responsibility") ||
    normalized.includes("promotion")
  ) {
    return {
      details:
        "Request to move from Junior Developer to Mid-level Developer and take on additional responsibilities.",
      requestDescription:
        "Worked for 2 years, participated in leadership training.",
      rejectionReason:
        status === "rejected" ? "The promotion request needs more review." : "",
    };
  }

  return {
    details: "No details provided yet.",
    requestDescription: "No request description provided yet.",
    rejectionReason: status === "rejected" ? "This request was rejected." : "",
  };
}

function getRequestItems(data: MyRequestsResponse | undefined): RequestItem[] {
  return (data?.myRequests ?? [])
    .map((item) => {
      const meta = getMockRequestMeta(item.benefit.name, item.request.status);

      return {
        id: item.request.id,
        title: item.benefit.name,
        submittedAtRaw: item.request.createdAt,
        reviewedAtRaw: item.request.updatedAt,
        approvedBy:
          item.request.reviewedBy ??
          (item.request.status === "approved" ? "System" : "Pending"),
        status: item.request.status,
        details: meta.details,
        requestDescription: meta.requestDescription,
        rejectionReason: item.request.reviewNotes ?? meta.rejectionReason,
      };
    })
    .sort(
      (left, right) =>
        new Date(right.submittedAtRaw).getTime() -
        new Date(left.submittedAtRaw).getTime(),
    );
}

function isRejectedStatus(status: RequestStatus) {
  return status === "rejected" || status === "cancelled";
}

function getStepState(request: RequestItem, stepIndex: number): StepState {
  if (request.status === "approved") {
    return "done";
  }

  if (request.status === "pending") {
    if (stepIndex === 0) return "done";
    if (stepIndex === 1) return "current";
    return "upcoming";
  }

  if (isRejectedStatus(request.status)) {
    if (stepIndex === 0) return "done";
    if (stepIndex === 1) return "rejected";
    return "upcoming";
  }

  return "upcoming";
}

function getCircleClasses(state: StepState) {
  if (state === "done") {
    return "border-[#16A34A] bg-white";
  }

  if (state === "current") {
    return "border-[#16A34A] bg-white";
  }

  if (state === "rejected") {
    return "border-[#FF3B30] bg-white";
  }

  return "border-[#737373] bg-white";
}

function getLineClasses(state: StepState) {
  if (state === "done" || state === "current") {
    return "bg-[#16A34A]";
  }

  if (state === "rejected") {
    return "bg-[#737373]";
  }

  return "bg-[#737373]";
}

function getStepDate(request: RequestItem, stepIndex: number) {
  const created = formatDate(request.submittedAtRaw);
  const updated = formatDate(request.reviewedAtRaw);

  if (request.status === "pending") {
    if (stepIndex === 0) return created;
    return "";
  }

  if (isRejectedStatus(request.status)) {
    if (stepIndex === 0) return created;
    if (stepIndex === 1) return updated;
    return "";
  }

  if (request.status === "approved") {
    if (stepIndex === 0) return created;
    if (stepIndex === 1) return updated;
    if (stepIndex === 2) return updated;
  }

  return "";
}

function StepIcon({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#22C55E] text-white">
        ✓
      </div>
    );
  }

  if (state === "current") {
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#DCFCE7] text-[#22C55E]">
        ✓
      </div>
    );
  }

  if (state === "rejected") {
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#FCA5A5] text-white">
        ✓
      </div>
    );
  }

  return (
    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#F1F5F9] text-[#CBD5E1]">
      ✓
    </div>
  );
}

function StepTimeline({ request }: { request: RequestItem }) {
  return (
    <div className="mt-5 space-y-0">
      {steps.map((step, index) => {
        const state = getStepState(request, index);
        const date = getStepDate(request, index);
        const isLast = index === steps.length - 1;

        return (
          <div key={step} className="flex items-start gap-4">
            <div className="flex w-4 flex-col items-center">
              <div
                className={cn(
                  "rounded-full",
                  "h-4 w-4 border-2",
                  getCircleClasses(state),
                )}
              />
              {!isLast ? (
                <div className={cn("my-1 h-9 w-0.5", getLineClasses(state))} />
              ) : null}
            </div>

            <div className="flex min-h-12 flex-1 justify-between gap-4">
              <p className="text-font/size/base font-medium text-[#0F172A]">
                {step}
              </p>
              <p className="shrink-0 text-font/size/sm text-[#737373]">
                {date}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RequestDetailSteps({ request }: { request: RequestItem }) {
  return (
    <div className="mt-6 space-y-3">
      {steps.map((step, index) => {
        const state = getStepState(request, index);

        return (
          <div key={step} className="flex items-center gap-3">
            <StepIcon state={state} />
            <p
              className={cn(
                "text-[18px] font-medium",
                state === "upcoming" ? "text-[#475569]" : "text-[#0F172A]",
              )}
            >
              {step}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function RequestDetailModal({
  request,
  onClose,
}: {
  request: RequestItem;
  onClose: () => void;
}) {
  const isRejectedCard = isRejectedStatus(request.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
      <div className="relative w-full max-w-130 rounded-[20px] border border-[#D7DEE7] bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 text-[28px] leading-none text-[#64748B] hover:text-[#0F172A] cursor-pointer"
        >
          ×
        </button>

        <h2 className="pr-10 text-[22px] font-semibold text-[#0F172A]">
          {request.title}
        </h2>
        <p className="mt-2 text-[16px] text-[#64748B]">
          Submitted {formatDate(request.submittedAtRaw)}
        </p>

        <RequestDetailSteps request={request} />

        {isRejectedCard ? (
          <div className="mt-6 rounded-[16px] border border-[#F87171] bg-[#FEF2F2] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#EF4444] text-[14px] font-bold text-[#EF4444]">
                !
              </div>
              <p className="text-[18px] font-semibold text-[#DC2626]">
                Rejection Reason
              </p>
            </div>
            <p className="mt-4 text-[16px] leading-7 text-[#EF4444]">
              {request.rejectionReason || "No rejection reason provided."}
            </p>
          </div>
        ) : null}

        <div className="mt-8">
          <h3 className="text-[18px] font-semibold text-[#0F172A]">Details</h3>
          <p className="mt-2 text-[16px] leading-7 text-[#475569]">
            {request.details}
          </p>
        </div>

        <div className="mt-8">
          <h3 className="text-[18px] font-semibold text-[#0F172A]">
            Request Description
          </h3>
          <p className="mt-2 text-[16px] leading-7 text-[#475569]">
            {request.requestDescription}
          </p>
        </div>

        {request.status === "approved" ? (
          <div className="mt-8 border-t border-[#E2E8F0] pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[16px] text-[#475569]">Approved</span>
              <span className="text-[16px] font-semibold text-[#0F172A]">
                {request.approvedBy} • {formatDate(request.reviewedAtRaw)}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RequestCard({
  request,
  onViewDetails,
}: {
  request: RequestItem;
  onViewDetails: (request: RequestItem) => void;
}) {
  const isRejectedCard = isRejectedStatus(request.status);

  return (
    <article
      className={cn(
        "w-full max-w-94.75 rounded-[18px] border bg-white px-4 py-3",
        isRejectedCard ? "border-[#D9E1EE]" : "border-[#D7DEE7]",
      )}
    >
      <h3 className="text-font/size/lg font-font/family/sans text-[#0F172A]">
        {request.title}
      </h3>

      <StepTimeline request={request} />

      <div
        className={cn(
          "border-t border-[#E2E8F0]",
          isRejectedCard ? "mt-2 pt-2" : "",
        )}
      >
        <button
          type="button"
          onClick={() => onViewDetails(request)}
          className="mt-2 flex items-center gap-2 text-font/size/sm font-medium text-[#334155] transition hover:text-[#0F172A] cursor-pointer"
        >
          View details
          <span className="text-font/size/lg cursor-pointer">›</span>
        </button>
      </div>
    </article>
  );
}

function RequestsSection({
  title,
  requests,
  onViewDetails,
}: {
  title: string;
  requests: RequestItem[];
  onViewDetails: (request: RequestItem) => void;
}) {
  if (requests.length === 0) return null;

  return (
    <section className="mt-10">
      <h3 className="text-[24px] font-semibold text-[#0F172A]">{title}</h3>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {requests.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </section>
  );
}

function RequestsBoardSkeleton() {
  return (
    <section className="w-full">
      <Skeleton className="h-8 w-40" />

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[18px] border border-[#D7DEE7] bg-white px-6 py-6"
          >
            <Skeleton className="h-7 w-40" />
            <Skeleton className="mt-8 h-44 w-full" />
            <Skeleton className="mt-6 h-6 w-28" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function RequestsBoard() {
  const { data, loading, error } =
    useQuery<MyRequestsResponse>(MY_REQUESTS_QUERY);

  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(
    null,
  );

  const requests = useMemo(() => getRequestItems(data), [data]);

  const approvedRequests = requests.filter(
    (request) => request.status === "approved",
  );
  const inProgressRequests = requests.filter(
    (request) => request.status === "pending",
  );
  const rejectedRequests = requests.filter(
    (request) =>
      request.status === "rejected" || request.status === "cancelled",
  );

  if (loading) {
    return <RequestsBoardSkeleton />;
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
        Requests could not be loaded. {error.message}
      </section>
    );
  }

  return (
    <>
      <section className="w-full px-2 sm:px-4">
        <RequestsSection
          title="Approved"
          requests={approvedRequests}
          onViewDetails={setSelectedRequest}
        />
        <RequestsSection
          title="In Progress"
          requests={inProgressRequests}
          onViewDetails={setSelectedRequest}
        />
        <RequestsSection
          title="Rejected"
          requests={rejectedRequests}
          onViewDetails={setSelectedRequest}
        />

        {requests.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
            No benefit requests yet.
          </div>
        ) : null}
      </section>

      {selectedRequest ? (
        <RequestDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      ) : null}
    </>
  );
}
