"use client";

import { useMemo } from "react";
import { useQuery } from "@apollo/client/react";

import { MY_BENEFITS_QUERY } from "@/lib/employee-portal";
import { Skeleton } from "@/components/ui/skeleton";

interface RequestItem {
  id: string;
  title: string;
  submittedAt: string;
  submittedAtRaw: string;
  approvedBy: string;
  approvedAt: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
}

const steps = ["Submitted", "HR Review", "Active"] as const;

type MyBenefitsResponse = {
  myBenefits: Array<{
    benefit: {
      id: string;
      name: string;
    };
    latestRequest: {
      id: string;
      status: "pending" | "approved" | "rejected" | "cancelled";
      reviewedBy: string | null;
      createdAt: string;
      updatedAt: string;
    } | null;
  }>;
};

function formatLabel(prefix: string, isoDate: string) {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return prefix;

  return `${prefix} ${parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

function getRequestItems(data: MyBenefitsResponse | undefined): RequestItem[] {
  return (data?.myBenefits ?? [])
    .flatMap((item) => {
      if (!item.latestRequest) return [];

      return [
        {
          id: item.latestRequest.id,
          title: item.benefit.name,
          submittedAt: formatLabel("Submitted", item.latestRequest.createdAt),
          submittedAtRaw: item.latestRequest.createdAt,
          approvedBy:
            item.latestRequest.reviewedBy ??
            (item.latestRequest.status === "approved" ? "System" : "Pending"),
          approvedAt: formatLabel(
            item.latestRequest.status === "approved" ? "Approved" : "Updated",
            item.latestRequest.updatedAt,
          ),
          status: item.latestRequest.status,
        },
      ];
    })
    .sort(
      (left, right) =>
        new Date(right.submittedAtRaw).getTime() -
        new Date(left.submittedAtRaw).getTime(),
    );
}

function StatusCheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12.5354 5.45829C12.8094 6.80307 12.6142 8.20114 11.9821 9.41936C11.3501 10.6376 10.3196 11.6023 9.06234 12.1527C7.80512 12.703 6.39721 12.8058 5.07342 12.4437C3.74962 12.0817 2.58996 11.2767 1.78781 10.1631C0.985661 9.04955 0.589518 7.69463 0.665443 6.32432C0.741368 4.95401 1.28477 3.65115 2.20503 2.633C3.1253 1.61484 4.36679 0.942953 5.72248 0.729366C7.07817 0.51578 8.46611 0.77341 9.65484 1.45929M4.85484 6.05829L6.65484 7.85829L12.6548 1.85829"
        stroke="#16A34A"
        strokeWidth="1.3125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getStepClasses(request: RequestItem, stepIndex: number) {
  if (request.status === "approved") {
    return {
      line: "bg-green-200",
      badge: "bg-green-100 text-green-600 ring-green-200",
      text: "text-gray-500",
    };
  }

  if (request.status === "pending") {
    return {
      line: stepIndex === 0 ? "bg-blue-200" : "bg-gray-200",
      badge:
        stepIndex <= 1
          ? "bg-blue-100 text-blue-600 ring-blue-200"
          : "bg-gray-100 text-gray-400 ring-gray-200",
      text: stepIndex <= 1 ? "text-gray-700" : "text-gray-400",
    };
  }

  return {
    line: "bg-rose-200",
    badge:
      stepIndex === 0
        ? "bg-rose-100 text-rose-600 ring-rose-200"
        : "bg-gray-100 text-gray-400 ring-gray-200",
    text: stepIndex === 0 ? "text-rose-700" : "text-gray-400",
  };
}

function RequestProgressCard({ request }: { request: RequestItem }) {
  return (
    <article className="w-full rounded-2xl border border-gray-200 bg-white p-4">
      <h3 className="text-[1.05rem] font-semibold text-gray-900">
        {request.title}
      </h3>
      <p className="mt-2 text-sm text-gray-500">{request.submittedAt}</p>

      <div className="mt-8">
        <div className="grid grid-cols-3 gap-4">
          {steps.map((step, index) => (
            <div key={step} className="relative text-center">
              {index < steps.length - 1 ? (
                <div
                  className={`absolute top-4 left-1/2 h-[2px] w-full ${getStepClasses(request, index).line}`}
                />
              ) : null}
              <div
                className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-full ring-2 ${getStepClasses(request, index).badge}`}
              >
                <StatusCheckIcon />
              </div>
              <p className={`mt-3 text-sm ${getStepClasses(request, index).text}`}>
                {step}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-7 text-right text-sm text-gray-500">
        {request.status === "approved"
          ? `Approved by ${request.approvedBy} on ${request.approvedAt.replace("Approved ", "")}`
          : request.status === "pending"
            ? "Waiting for HR review"
            : `${request.status.charAt(0).toUpperCase() + request.status.slice(1)} on ${request.approvedAt.replace("Updated ", "")}`}
      </p>
    </article>
  );
}

function RequestsBoardSkeleton() {
  return (
    <section className="w-full">
      <div>
        <Skeleton className="h-8 w-44" />
        <Skeleton className="mt-2 h-5 w-24" />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="w-full rounded-2xl border border-gray-200 bg-white p-4"
          >
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-2 h-4 w-28" />
            <Skeleton className="mt-8 h-24 w-full" />
            <Skeleton className="mt-7 ml-auto h-4 w-32" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function RequestsBoard() {
  const { data, loading, error } = useQuery<MyBenefitsResponse>(MY_BENEFITS_QUERY);

  const requests = useMemo(() => getRequestItems(data), [data]);

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
    <section className="w-full">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">My Requests</h2>
        <p className="mt-2 text-base text-gray-500">
          {requests.length} requests
        </p>
      </div>

      {requests.length > 0 ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {requests.map((request) => (
            <RequestProgressCard key={request.id} request={request} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          No benefit requests yet.
        </div>
      )}
    </section>
  );
}
