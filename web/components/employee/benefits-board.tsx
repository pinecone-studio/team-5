"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  BadgeCheck,
  Brain,
  ChevronRight,
  Dumbbell,
  HeartPulse,
  LoaderCircle,
  LockKeyhole,
  Umbrella,
  Wifi,
} from "lucide-react";

import {
  CONFIRM_BENEFIT_REQUEST_MUTATION,
  EMPLOYEE_DASHBOARD_QUERY,
  REQUEST_BENEFIT_MUTATION,
} from "@/lib/employee-portal";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

type BenefitCategory =
  | "all"
  | "wellness"
  | "career"
  | "flexibility"
  | "financial";
type BenefitStatus = "active" | "available" | "pending" | "locked";
type EmploymentStatus = "active" | "terminated" | "leave" | "probation" | null;

type BenefitRecord = {
  status: BenefitStatus;
  canRequest: boolean;
  failureReasons: string[];
  benefit: {
    id: string;
    name: string;
    category: string | null;
    subsidyPercent: number;
    vendorName: string | null;
    requiresContract: boolean | null;
    activeContractId: string | null;
    isActive: boolean | null;
  };
  eligibility: {
    employeeId: string;
    benefitId: string;
    status: string;
    ruleEvaluationJson: string;
    computedAt: string;
    overrideReason: string | null;
  };
  latestRequest: {
    id: string;
    benefitId: string;
    status: string;
    contractVersionAccepted: string | null;
    contractAcceptedAt: string | null;
    reviewedBy: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  activeContract: {
    id: string;
    benefitId: string;
    vendorName: string;
    version: string;
    effectiveDate: string | null;
    expiryDate: string | null;
    isActive: boolean | null;
  } | null;
};

type EmployeeRecord = {
  id: string;
  fullName: string;
  name: string;
  email: string | null;
  role: string | null;
  department: string | null;
  responsibilityLevel: number;
  employmentStatus: EmploymentStatus;
  hireDate: string | null;
  okrStatus: "submitted" | "success" | "fail" | null;
  okrSubmitted: boolean;
  lateArrivalCount: number;
  employeeCode: string | null;
};

type EmployeeDashboardResponse = {
  me: EmployeeRecord;
  myBenefits: BenefitRecord[];
};

type RequestBenefitResponse = {
  requestBenefit: {
    requiresContractAcceptance: boolean;
    activeContract: {
      version: string;
      vendorName: string;
      effectiveDate: string | null;
      expiryDate: string | null;
    } | null;
  };
};

type ConfirmBenefitRequestResponse = {
  confirmBenefitRequest: {
    id: string;
  };
};

interface BenefitItem {
  id: string;
  title: string;
  description: string;
  category: Exclude<BenefitCategory, "all">;
  status: BenefitStatus;
  criteria: string;
  criteriaDetail: string;
  detailLines: string[];
  canRequest: boolean;
  requiresContract: boolean;
  failureReasons: string[];
  icon: React.ElementType;
  activeSince?: string;
  latestRequestLabel?: string;
  activeContractVersion?: string | null;
}

const sections: Array<{
  key: BenefitStatus;
  title: string;
  emptyLabel: string;
}> = [
  { key: "active", title: "Active", emptyLabel: "No active benefits yet." },
  {
    key: "available",
    title: "Available",
    emptyLabel: "No benefits are available to request right now.",
  },
  {
    key: "pending",
    title: "Pending",
    emptyLabel: "No requests are waiting for review.",
  },
  {
    key: "locked",
    title: "Locked",
    emptyLabel: "No blocked benefits at the moment.",
  },
];

function getCategory(
  value: string | null | undefined,
): Exclude<BenefitCategory, "all"> {
  if (
    value === "wellness" ||
    value === "career" ||
    value === "flexibility" ||
    value === "financial"
  ) {
    return value;
  }

  return "career";
}

function getBenefitIcon(benefit: BenefitRecord["benefit"]) {
  const name = benefit.name.toLowerCase();

  if (name.includes("gym") || name.includes("fit")) return Dumbbell;
  if (name.includes("insurance") || name.includes("health")) return HeartPulse;
  if (name.includes("wellness")) return Brain;
  if (name.includes("remote")) return Wifi;
  if (name.includes("responsibility")) return BadgeCheck;

  switch (getCategory(benefit.category)) {
    case "wellness":
      return HeartPulse;
    case "career":
      return BadgeCheck;
    case "flexibility":
      return Wifi;
    case "financial":
      return Umbrella;
  }
}

function formatDateValue(isoDate: string | null | undefined) {
  if (!isoDate) return undefined;

  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return undefined;

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateLabel(prefix: string, isoDate: string | null | undefined) {
  const value = formatDateValue(isoDate);
  if (!value) return undefined;

  return prefix.length > 0 ? `${prefix} ${value}` : value;
}

function parseRuleSummary(ruleEvaluationJson: string) {
  try {
    const parsed = JSON.parse(ruleEvaluationJson) as Array<{
      passed?: boolean;
    }>;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return {
        badge: "0/0",
        detail: "No rules configured",
      };
    }

    const passed = parsed.filter((item) => item?.passed !== false).length;
    return {
      badge: `${passed}/${parsed.length}`,
      detail: `${passed}/${parsed.length} rules satisfied`,
    };
  } catch {
    return {
      badge: "N/A",
      detail: "Rule evaluation unavailable",
    };
  }
}

function buildBenefitDescription(benefit: BenefitRecord["benefit"]) {
  const subsidyPrefix =
    benefit.subsidyPercent > 0
      ? `${benefit.subsidyPercent}% company-subsidized `
      : "";

  if (benefit.name.toLowerCase().includes("insurance")) {
    return `${subsidyPrefix}private health insurance coverage.`;
  }

  if (benefit.name.toLowerCase().includes("wellness")) {
    return `${subsidyPrefix}wellness support for mental and physical health.`;
  }

  if (benefit.name.toLowerCase().includes("remote")) {
    return "Flexible remote-work support for eligible work days.";
  }

  return `${subsidyPrefix}${benefit.name.toLowerCase()} support for eligible employees.`;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return fallback;
}

function mapBenefitItem(record: BenefitRecord): BenefitItem {
  const criteria = parseRuleSummary(record.eligibility.ruleEvaluationJson);

  return {
    id: record.benefit.id,
    title: record.benefit.name,
    description: buildBenefitDescription(record.benefit),
    category: getCategory(record.benefit.category),
    status: record.status,
    criteria: criteria.badge,
    criteriaDetail: criteria.detail,
    detailLines: [
      record.benefit.vendorName
        ? `Vendor: ${record.benefit.vendorName}`
        : "Vendor not configured",
      record.benefit.subsidyPercent > 0
        ? `Subsidy: ${record.benefit.subsidyPercent}%`
        : "No subsidy configured",
      record.benefit.requiresContract
        ? "Contract acceptance required"
        : "No contract acceptance required",
    ],
    canRequest: record.canRequest,
    requiresContract: Boolean(record.benefit.requiresContract),
    failureReasons: record.failureReasons,
    icon: getBenefitIcon(record.benefit),
    activeSince:
      record.status === "active"
        ? formatDateLabel(
            "Active since",
            record.latestRequest?.updatedAt ?? record.latestRequest?.createdAt,
          )
        : undefined,
    latestRequestLabel:
      record.latestRequest != null
        ? formatDateLabel("Last request", record.latestRequest.updatedAt)
        : undefined,
    activeContractVersion: record.activeContract?.version ?? null,
  };
}

function getEmployeeInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "U";
}

function getEmploymentClasses(status: EmploymentStatus) {
  switch (status) {
    case "leave":
      return {
        dot: "bg-amber-500",
        text: "text-amber-600",
      };
    case "probation":
      return {
        dot: "bg-blue-500",
        text: "text-blue-600",
      };
    case "terminated":
      return {
        dot: "bg-rose-500",
        text: "text-rose-600",
      };
    default:
      return {
        dot: "bg-emerald-500",
        text: "text-emerald-600",
      };
  }
}

function getOkrValue(employee: EmployeeRecord) {
  if (
    employee.okrSubmitted ||
    employee.okrStatus === "submitted" ||
    employee.okrStatus === "success"
  ) {
    return "Submitted";
  }

  if (employee.okrStatus === "fail") {
    return "Needs update";
  }

  return "Pending";
}

function getOkrClasses(employee: EmployeeRecord) {
  if (
    employee.okrSubmitted ||
    employee.okrStatus === "submitted" ||
    employee.okrStatus === "success"
  ) {
    return "text-emerald-600";
  }

  if (employee.okrStatus === "fail") {
    return "text-rose-600";
  }

  return "text-[#18243d]";
}

function getEmployeeSubtitle(employee: EmployeeRecord) {
  return employee.role ?? employee.department ?? "Employee";
}

function getAttendanceValue(employee: EmployeeRecord) {
  return `${employee.lateArrivalCount}/3 late arrivals`;
}

function getPrimaryButtonLabel(benefit: BenefitItem) {
  if (benefit.status === "pending") return "Pending Review";
  if (benefit.status === "active") return "Already Active";
  if (benefit.status === "locked") return "View Requirements";
  return benefit.requiresContract ? "Preview Contract" : "Preview Request";
}

function getCardMetaLine(benefit: BenefitItem) {
  if (benefit.status === "active") {
    return benefit.activeSince ?? "Currently active";
  }

  if (benefit.status === "available") {
    return benefit.latestRequestLabel ?? "Ready for a new request";
  }

  if (benefit.status === "pending") {
    return benefit.latestRequestLabel ?? "Waiting for review";
  }

  return benefit.failureReasons[0] ?? benefit.criteriaDetail;
}

function getCriteriaBadgeClasses(status: BenefitStatus) {
  switch (status) {
    case "active":
    case "available":
      return "border-emerald-200 bg-emerald-50 text-emerald-600";
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "locked":
      return "border-slate-200 bg-slate-100 text-slate-500";
  }
}

function SummaryStat({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-[1rem] border border-[#d9e1ef] bg-white px-4 py-4">
      <p className="text-[0.8rem] font-medium tracking-[0.08em] text-[#74839b] uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-2.5 text-[1.15rem] font-normal tracking-[-0.03em] text-[#18243d] sm:text-[1.2rem]",
          valueClassName,
        )}
      >
        {value}
      </p>
    </div>
  );
}

function BenefitCard({
  benefit,
  preparing,
  onOpen,
  onRequest,
}: {
  benefit: BenefitItem;
  preparing: boolean;
  onOpen: (benefitId: string) => void;
  onRequest: (benefit: BenefitItem) => void;
}) {
  const isRequestCard = benefit.status === "available";

  return (
    <article className="flex h-full flex-col rounded-[1.15rem] border border-[#d9e1ef] bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="max-w-[14rem] text-[1.1rem] font-medium tracking-[-0.03em] text-[#18243d]">
          {benefit.title}
        </h3>
        <span
          className={cn(
            "inline-flex min-w-14 items-center justify-center rounded-full border px-3 py-1 text-[0.95rem] font-medium",
            getCriteriaBadgeClasses(benefit.status),
          )}
        >
          {benefit.criteria}
        </span>
      </div>

      <p className="mt-4 min-h-20 text-[0.95rem] leading-7 text-[#708198]">
        {benefit.description}
      </p>

      <p className="mt-4 text-[0.95rem] text-[#607089]">
        {getCardMetaLine(benefit)}
      </p>

      <div className="mt-auto pt-6">
        {isRequestCard ? (
          <Button
            type="button"
            onClick={() => onRequest(benefit)}
            disabled={preparing || !benefit.canRequest}
            className="h-10 w-full rounded-[0.95rem] bg-[#2f66f6] text-[0.95rem] font-normal text-white hover:bg-[#2456d7]"
          >
            {preparing ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
        ) : (
          <button
            type="button"
            onClick={() => onOpen(benefit.id)}
            className="inline-flex items-center gap-1.5 text-[0.95rem] font-normal text-[#18243d] transition hover:text-[#2f66f6]"
          >
            {benefit.status === "pending"
              ? "Track request"
              : benefit.status === "locked"
                ? "View rules"
                : "View details"}
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        )}
      </div>
    </article>
  );
}

function BenefitsBoardSkeleton() {
  return (
    <section className="space-y-10">
      <div className="rounded-[2.25rem] border border-[#d9e1ef] bg-white p-7">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-center gap-5">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-3">
              <Skeleton className="h-10 w-52" />
              <Skeleton className="h-7 w-36" />
            </div>
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-[1.5rem]" />
          ))}
        </div>
      </div>

      {Array.from({ length: 2 }).map((_, sectionIndex) => (
        <div key={sectionIndex} className="space-y-5">
          <Skeleton className="h-10 w-28" />
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((__, cardIndex) => (
              <Skeleton key={cardIndex} className="h-80 rounded-[1.8rem]" />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export default function BenefitsBoard() {
  const [selectedBenefitId, setSelectedBenefitId] = useState<string | null>(
    null,
  );
  const [detailError, setDetailError] = useState<string | null>(null);
  const [preparingBenefitId, setPreparingBenefitId] = useState<string | null>(
    null,
  );
  const [requestIntent, setRequestIntent] = useState<{
    requiresContractAcceptance: boolean;
    activeContract: {
      version: string;
      vendorName: string;
      effectiveDate: string | null;
      expiryDate: string | null;
    } | null;
  } | null>(null);

  const { data, loading, error, refetch } = useQuery<EmployeeDashboardResponse>(
    EMPLOYEE_DASHBOARD_QUERY,
  );
  const [requestBenefit, { loading: requesting }] =
    useMutation<RequestBenefitResponse>(REQUEST_BENEFIT_MUTATION);
  const [confirmBenefitRequest, { loading: confirming }] =
    useMutation<ConfirmBenefitRequestResponse>(
      CONFIRM_BENEFIT_REQUEST_MUTATION,
    );

  const employee = data?.me ?? null;
  const benefits = useMemo(
    () => (data?.myBenefits ?? []).map(mapBenefitItem),
    [data?.myBenefits],
  );
  const selectedBenefit =
    benefits.find((benefit) => benefit.id === selectedBenefitId) ?? null;

  function openBenefit(benefitId: string) {
    setSelectedBenefitId(benefitId);
    setRequestIntent(null);
    setDetailError(null);
  }

  async function handlePrepareRequest(benefit: BenefitItem) {
    try {
      setSelectedBenefitId(benefit.id);
      setPreparingBenefitId(benefit.id);
      setRequestIntent(null);
      setDetailError(null);

      const response = await requestBenefit({
        variables: {
          input: {
            benefitId: benefit.id,
          },
        },
      });

      const intent = response.data?.requestBenefit;
      if (!intent) {
        throw new Error("Benefit request preview could not be loaded.");
      }

      setRequestIntent({
        requiresContractAcceptance: intent.requiresContractAcceptance,
        activeContract: intent.activeContract
          ? {
              version: intent.activeContract.version,
              vendorName: intent.activeContract.vendorName,
              effectiveDate: intent.activeContract.effectiveDate,
              expiryDate: intent.activeContract.expiryDate,
            }
          : null,
      });
    } catch (mutationError) {
      setDetailError(
        getErrorMessage(mutationError, "Benefit request preview failed."),
      );
    } finally {
      setPreparingBenefitId(null);
    }
  }

  async function handleConfirmRequest(benefit: BenefitItem) {
    try {
      setDetailError(null);
      await confirmBenefitRequest({
        variables: {
          input: {
            benefitId: benefit.id,
            contractVersionAccepted:
              requestIntent?.activeContract?.version ?? null,
            contractAcceptedAt: requestIntent?.requiresContractAcceptance
              ? new Date().toISOString()
              : null,
          },
        },
      });

      await refetch();
      setRequestIntent(null);
    } catch (mutationError) {
      setDetailError(
        getErrorMessage(mutationError, "Benefit request confirmation failed."),
      );
    }
  }

  function closeSheet() {
    setSelectedBenefitId(null);
    setRequestIntent(null);
    setDetailError(null);
    setPreparingBenefitId(null);
  }

  if (loading) {
    return <BenefitsBoardSkeleton />;
  }

  if (error) {
    return (
      <section className="rounded-[1.8rem] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        Employee benefits could not be loaded. {error.message}
      </section>
    );
  }

  return (
    <section className="space-y-11">
      {employee ? (
        <section className="pt-2">
          <div className="flex flex-col gap-7 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f3f7] text-[1.35rem] font-medium tracking-[-0.04em] text-[#18243d]">
                  {getEmployeeInitials(employee.fullName)}
                </div>
                <span
                  className={cn(
                    "absolute right-0 bottom-0 h-5 w-5 translate-x-[3px] translate-y-[2px] rounded-full border-[3px] border-white",
                    getEmploymentClasses(employee.employmentStatus).dot,
                  )}
                  aria-hidden="true"
                />
              </div>

              <div className="space-y-1.5">
                <h1 className="text-[1.9rem] font-medium tracking-[-0.05em] text-[#18243d]">
                  {employee.fullName}
                </h1>
                <div className="flex items-center gap-3 text-[0.95rem] font-normal text-[#607089]">
                  <span>{getEmployeeSubtitle(employee)}</span>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "inline-flex items-center gap-2 self-start pt-1 text-[0.95rem] font-normal",
                getEmploymentClasses(employee.employmentStatus).text,
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  getEmploymentClasses(employee.employmentStatus).dot,
                )}
              />
              {employee.employmentStatus === "leave"
                ? "On Leave"
                : employee.employmentStatus === "probation"
                  ? "Probation"
                  : employee.employmentStatus === "terminated"
                    ? "Terminated"
                    : "Active"}
            </div>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryStat
              label="Responsibility"
              value={`Level ${employee.responsibilityLevel}`}
            />
            <SummaryStat
              label="Hired"
              value={formatDateValue(employee.hireDate) ?? "Not set"}
            />
            <SummaryStat
              label="Attendance"
              value={getAttendanceValue(employee)}
            />
            <SummaryStat
              label="OKR"
              value={getOkrValue(employee)}
              valueClassName={getOkrClasses(employee)}
            />
          </div>
        </section>
      ) : null}

      <div className="space-y-10">
        {sections.map((section) => {
          const sectionBenefits = benefits.filter(
            (benefit) => benefit.status === section.key,
          );

          if (
            sectionBenefits.length === 0 &&
            (section.key === "pending" || section.key === "locked")
          ) {
            return null;
          }

          return (
            <section key={section.key} className="space-y-5">
              <div className="border-b border-[#dfe6f0] pb-4">
                <h2 className="text-[1.15rem] font-medium tracking-[-0.03em] text-[#18243d]">
                  {section.title}
                </h2>
              </div>

              {sectionBenefits.length > 0 ? (
                <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
                  {sectionBenefits.map((benefit) => (
                    <BenefitCard
                      key={benefit.id}
                      benefit={benefit}
                      preparing={preparingBenefitId === benefit.id}
                      onOpen={openBenefit}
                      onRequest={handlePrepareRequest}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-[1rem] border border-dashed border-[#d9e1ef] bg-white p-6 text-[0.95rem] text-[#708198]">
                  {section.emptyLabel}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <Sheet
        open={selectedBenefit != null}
        onOpenChange={(open) => (!open ? closeSheet() : null)}
      >
        <SheetContent
          side="right"
          className="w-full max-w-2xl border-l border-[#dfe6f0] bg-[#f8fafc] p-0"
        >
          {selectedBenefit ? (
            <>
              <SheetHeader className="border-b border-[#dfe6f0] bg-white px-6 py-6">
                <div className="flex items-start gap-4 text-left">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[0.95rem] bg-[#edf2f9] text-[#18243d]">
                    <selectedBenefit.icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <SheetTitle className="text-[1.25rem] font-medium tracking-[-0.03em] text-[#18243d]">
                      {selectedBenefit.title}
                    </SheetTitle>
                    <SheetDescription className="text-[0.95rem] leading-7 text-[#607089]">
                      {selectedBenefit.description}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                <div className="rounded-[1rem] border border-[#d9e1ef] bg-white p-5">
                  <p className="text-xs font-medium tracking-[0.18em] text-[#74839b] uppercase">
                    Status
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[1rem] font-medium text-[#18243d]">
                      {selectedBenefit.status.charAt(0).toUpperCase() +
                        selectedBenefit.status.slice(1)}
                    </span>
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-3 py-1 text-[0.85rem] font-medium",
                        getCriteriaBadgeClasses(selectedBenefit.status),
                      )}
                    >
                      {selectedBenefit.criteriaDetail}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-[0.9rem] font-medium text-[#18243d]">
                    Benefit details
                  </h3>
                  <div className="overflow-hidden rounded-[1rem] border border-[#d9e1ef] bg-white">
                    {selectedBenefit.detailLines.map((line) => (
                      <div
                        key={line}
                        className="border-b border-[#edf2f7] px-5 py-4 text-[0.9rem] text-[#607089] last:border-b-0"
                      >
                        {line}
                      </div>
                    ))}
                    {selectedBenefit.activeSince ? (
                      <div className="border-t border-[#edf2f7] px-5 py-4 text-[0.9rem] text-[#607089]">
                        {selectedBenefit.activeSince}
                      </div>
                    ) : null}
                    {selectedBenefit.latestRequestLabel ? (
                      <div className="border-t border-[#edf2f7] px-5 py-4 text-[0.9rem] text-[#607089]">
                        {selectedBenefit.latestRequestLabel}
                      </div>
                    ) : null}
                    {selectedBenefit.activeContractVersion ? (
                      <div className="border-t border-[#edf2f7] px-5 py-4 text-[0.9rem] text-[#607089]">
                        Active contract version{" "}
                        {selectedBenefit.activeContractVersion}
                      </div>
                    ) : null}
                  </div>
                </div>

                {selectedBenefit.failureReasons.length > 0 ? (
                  <div className="rounded-[1rem] border border-amber-200 bg-amber-50 p-5">
                    <div className="flex items-center gap-2 text-amber-800">
                      <LockKeyhole className="h-4.5 w-4.5" />
                      <h3 className="text-[0.9rem] font-medium">Blocked rules</h3>
                    </div>
                    <ul className="mt-3 space-y-2 text-[0.9rem] text-amber-900">
                      {selectedBenefit.failureReasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {requestIntent?.activeContract ? (
                  <div className="rounded-[1rem] border border-blue-200 bg-blue-50 p-5">
                    <h3 className="text-[0.9rem] font-medium text-blue-900">
                      Contract confirmation
                    </h3>
                    <p className="mt-2 text-[0.9rem] text-blue-800">
                      Version {requestIntent.activeContract.version}
                      {requestIntent.activeContract.vendorName
                        ? ` • ${requestIntent.activeContract.vendorName}`
                        : ""}
                    </p>
                    {requestIntent.activeContract.effectiveDate ? (
                      <p className="mt-1 text-[0.9rem] text-blue-700">
                        Effective{" "}
                        {formatDateLabel(
                          "",
                          requestIntent.activeContract.effectiveDate,
                        )}
                      </p>
                    ) : null}
                    {requestIntent.activeContract.expiryDate ? (
                      <p className="mt-1 text-[0.9rem] text-blue-700">
                        Expires{" "}
                        {formatDateLabel(
                          "",
                          requestIntent.activeContract.expiryDate,
                        )}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {detailError ? (
                  <div className="rounded-[1rem] border border-rose-200 bg-rose-50 p-4 text-[0.9rem] text-rose-700">
                    {detailError}
                  </div>
                ) : null}
              </div>

              <div className="border-t border-[#dfe6f0] bg-white px-6 py-5">
                {requestIntent ? (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-md text-[0.9rem] text-[#607089]">
                      {requestIntent.requiresContractAcceptance
                        ? "Confirm contract acceptance to submit this request."
                        : "Everything is ready. Submit the request."}
                    </p>
                    <Button
                      type="button"
                      onClick={() => handleConfirmRequest(selectedBenefit)}
                      disabled={confirming}
                      className="h-10 rounded-[0.95rem] bg-[#2f66f6] px-5 text-[0.9rem] font-medium text-white hover:bg-[#2456d7]"
                    >
                      {confirming ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Submitting
                        </>
                      ) : (
                        "Confirm Request"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-md text-[0.9rem] text-[#607089]">
                      {selectedBenefit.status === "locked"
                        ? "This benefit is locked until the listed rules are satisfied."
                        : selectedBenefit.status === "pending"
                          ? "This request is already waiting for review."
                          : selectedBenefit.status === "active"
                            ? "This benefit is already active for you."
                            : selectedBenefit.requiresContract
                              ? "Preview the contract requirement before submitting."
                              : "Preview the request before submitting."}
                    </p>
                    <Button
                      type="button"
                      variant={
                        selectedBenefit.canRequest ? "default" : "outline"
                      }
                      onClick={() => handlePrepareRequest(selectedBenefit)}
                      disabled={!selectedBenefit.canRequest || requesting}
                      className={cn(
                        "h-10 rounded-[0.95rem] px-5 text-[0.9rem] font-medium",
                        selectedBenefit.canRequest
                          ? "bg-[#2f66f6] text-white hover:bg-[#2456d7]"
                          : "",
                      )}
                    >
                      {requesting &&
                      preparingBenefitId === selectedBenefit.id ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Loading
                        </>
                      ) : (
                        getPrimaryButtonLabel(selectedBenefit)
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </section>
  );
}
