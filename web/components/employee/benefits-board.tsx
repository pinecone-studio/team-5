"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  BadgeCheck,
  Brain,
  CheckCircle2,
  Circle,
  ChevronRight,
  Dumbbell,
  FileText,
  HeartPulse,
  LoaderCircle,
  LockKeyhole,
  Umbrella,
  Wifi,
  X,
} from "lucide-react";

import {
  CONFIRM_BENEFIT_REQUEST_MUTATION,
  EMPLOYEE_DASHBOARD_QUERY,
  REQUEST_BENEFIT_MUTATION,
} from "@/lib/employee-portal";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
    r2ObjectKey: string;
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
      r2ObjectKey: string;
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
  contractVendorName?: string | null;
  contractDownloadUrl?: string | null;
  contractEffectiveDate?: string | null;
  contractExpiryDate?: string | null;
  isOverrideActive: boolean;
  overrideReason?: string | null;
  requirements: Array<{
    label: string;
    passed: boolean;
  }>;
}

const sections: Array<{
  key: BenefitStatus;
  title: string;
  emptyLabel: string;
}> = [
  {
    key: "pending",
    title: "Pending",
    emptyLabel: "No requests are waiting for review.",
  },
  {
    key: "available",
    title: "Available",
    emptyLabel: "No benefits are available to request right now.",
  },
  { key: "active", title: "Active", emptyLabel: "No active benefits yet." },
  {
    key: "locked",
    title: "Not Yet Available",
    emptyLabel: "No upcoming benefits right now.",
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

function toRequirementLabel(type: string) {
  switch (type) {
    case "employment_status":
      return "Employment status";
    case "okr_submitted":
      return "OKR submitted";
    case "attendance":
      return "Attendance";
    case "responsibility_level":
      return "Responsibility level";
    case "tenure_days":
      return "Tenure";
    case "department":
      return "Department";
    case "role":
      return "Role";
    default:
      return type
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
  }
}

function parseRequirements(ruleEvaluationJson: string) {
  try {
    const parsed = JSON.parse(ruleEvaluationJson) as Array<{
      type?: string;
      passed?: boolean;
    }>;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((item) => ({
      label: toRequirementLabel(item?.type ?? "Requirement"),
      passed: item?.passed !== false,
    }));
  } catch {
    return [];
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
    requirements: parseRequirements(record.eligibility.ruleEvaluationJson),
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
    contractVendorName: record.activeContract?.vendorName ?? null,
    contractDownloadUrl: record.activeContract?.r2ObjectKey ?? null,
    contractEffectiveDate: record.activeContract?.effectiveDate ?? null,
    contractExpiryDate: record.activeContract?.expiryDate ?? null,
    isOverrideActive:
      record.status === "active" && Boolean(record.eligibility.overrideReason),
    overrideReason: record.eligibility.overrideReason,
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

function getOkrValue(employee: EmployeeRecord) {
  if (employee.okrStatus === "success") {
    return "Success";
  }

  if (employee.okrSubmitted || employee.okrStatus === "submitted") {
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
  const value = employee.role ?? employee.department ?? "Employee";

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getAttendanceValue(employee: EmployeeRecord) {
  return `${employee.lateArrivalCount}/3 lates`;
}

function getPrimaryButtonLabel(benefit: BenefitItem) {
  if (benefit.status === "pending") return "View details";
  if (benefit.status === "active") return "View details";
  if (benefit.status === "locked") return "View Requirements";
  return benefit.requiresContract ? "Preview contract" : "Submit request";
}

function ContractEmptyState({ benefitTitle }: { benefitTitle: string }) {
  return (
    <section className="rounded-[16px] border border-[#d9e1ef] bg-white p-5">
      <h3 className="text-[0.95rem] font-semibold text-[#18243d]">Contract</h3>
      <div className="mt-4 rounded-[14px] border border-dashed border-[#d9e1ef] bg-[#fbfcfe] px-4 py-4">
        <p className="text-[0.95rem] font-medium text-[#18243d]">
          No contract has been attached for {benefitTitle} yet.
        </p>
        <p className="mt-2 text-[0.92rem] leading-7 text-[#6c7d96]">
          Once a contract is uploaded, you’ll be able to review it here and
          accept the terms before submitting your request.
        </p>
      </div>

      <div className="mt-5 space-y-3 text-[0.92rem] text-[#3b4960]">
        <p className="text-[0.8rem] font-medium tracking-[0.18em] text-[#74839b] uppercase">
          Why this helps
        </p>
        <ul className="space-y-2">
          <li className="flex items-start gap-3">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#2f66f6]" />
            <span>Clear terms for coverage, dates, and vendor conditions.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#2f66f6]" />
            <span>Faster approvals with a consistent review workflow.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#2f66f6]" />
            <span>Audit trail for who accepted which contract version.</span>
          </li>
        </ul>
      </div>
    </section>
  );
}

function ContractSigningView({
  benefitTitle,
  contract,
  acceptedTerms,
  onAcceptedTermsChange,
}: {
  benefitTitle: string;
  contract: {
    version: string;
    vendorName: string;
    r2ObjectKey: string;
    effectiveDate: string | null;
    expiryDate: string | null;
  };
  acceptedTerms: boolean;
  onAcceptedTermsChange: (next: boolean) => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <section className="overflow-hidden rounded-[16px] border border-[#e4ebf5] bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-[#eef3fa] px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-[0.95rem] font-semibold text-[#18243d]">
              {benefitTitle} contract
            </p>
            <p className="mt-1 text-[0.9rem] text-[#6c7d96]">
              Version {contract.version}
              {contract.vendorName ? ` • ${contract.vendorName}` : ""}
            </p>
          </div>
          <a
            href={contract.r2ObjectKey}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-[12px] border border-[#d9e1ef] bg-white px-4 py-2 text-[0.9rem] font-medium text-[#253247] transition hover:bg-[#f8fafc]"
          >
            Open PDF
          </a>
        </div>
        <div className="bg-[#fbfcfe] p-3">
          <div className="h-[52vh] min-h-[420px] overflow-hidden rounded-[14px] border border-[#e4ebf5] bg-white">
            <iframe
              title={`${benefitTitle} contract preview`}
              src={contract.r2ObjectKey}
              className="h-full w-full"
            />
          </div>
        </div>
      </section>

      <section className="rounded-[16px] border border-[#e4ebf5] bg-white p-5">
        <h3 className="text-[0.95rem] font-semibold text-[#18243d]">
          Review & accept
        </h3>
        <div className="mt-4 space-y-3 text-[0.92rem] text-[#3b4960]">
          <div className="flex items-center justify-between gap-4">
            <span className="font-medium text-[#18243d]">Vendor</span>
            <span className="text-[#6c7d96]">{contract.vendorName || "—"}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="font-medium text-[#18243d]">Effective</span>
            <span className="text-[#6c7d96]">
              {formatDateValue(contract.effectiveDate) ?? "Not set"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="font-medium text-[#18243d]">Expires</span>
            <span className="text-[#6c7d96]">
              {formatDateValue(contract.expiryDate) ?? "Not set"}
            </span>
          </div>
        </div>

        <label className="mt-6 flex cursor-pointer items-start gap-3 text-[0.95rem] text-[#18243d]">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => onAcceptedTermsChange(event.target.checked)}
            className="sr-only"
          />
          <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-[#2f66f6] bg-white">
            {acceptedTerms ? (
              <CheckCircle2 className="h-5 w-5 text-[#2f66f6]" />
            ) : (
              <Circle className="h-4 w-4 text-transparent" />
            )}
          </span>
          <span className="leading-7">
            I have read and accept the terms and conditions for{" "}
            <span className="font-medium">
              {contract.vendorName || benefitTitle}
            </span>
            .
          </span>
        </label>
      </section>
    </div>
  );
}

function getCriteriaBadgeClasses(status: BenefitStatus) {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-600";
    case "available":
      return "border-[#9ab2ff] bg-[#f5f8ff] text-[#3268f6]";
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "locked":
      return "border-rose-200 bg-rose-50 text-rose-500";
  }
}

function getOverrideBadgeClasses() {
  return "border-[#cbb2ff] bg-[#f7f1ff] text-[#7a4ef0]";
}

function getEmploymentValue(status: EmploymentStatus) {
  switch (status) {
    case "leave":
      return "On Leave";
    case "probation":
      return "Probation";
    case "terminated":
      return "Terminated";
    default:
      return "Active";
  }
}

function SummaryMetric({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[0.8rem] font-medium tracking-[0.08em] text-[#74839b] uppercase">
        {label}
      </p>
      <p
        className={cn(
          "text-[1rem] font-medium tracking-[-0.03em] text-[#18243d]",
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
  const isLockedCard = benefit.status === "locked";
  const showOverrideBadge =
    benefit.status === "active" && benefit.isOverrideActive;
  const actionLabel =
    benefit.status === "pending"
      ? "View details"
      : benefit.status === "locked"
        ? "View requirements"
        : isRequestCard
          ? "Submit request"
          : "View details";

  return (
    <article
      className={cn(
        "flex h-full min-h-[164px] flex-col rounded-[14px] border px-5 py-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.08)]",
        isLockedCard
          ? "border-[#e7ebf3] bg-[#fdfefe]"
          : "border-[#d9e1ef] bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <h3
          className={cn(
            "max-w-[14rem] text-[1.05rem] font-semibold tracking-[-0.03em]",
            isLockedCard ? "text-[#7f8897]" : "text-[#18243d]",
          )}
        >
          {benefit.title}
        </h3>
        <span
          className={cn(
            "inline-flex min-w-11 items-center justify-center rounded-[10px] border px-3 py-1 text-[0.95rem] font-medium",
            showOverrideBadge
              ? getOverrideBadgeClasses()
              : getCriteriaBadgeClasses(benefit.status),
          )}
        >
          {showOverrideBadge ? "Override" : benefit.criteria}
        </span>
      </div>

      <p
        className={cn(
          "mt-4 min-h-[72px] max-w-[26rem] text-[0.95rem] leading-8",
          isLockedCard ? "text-[#a4afbf]" : "text-[#708198]",
        )}
      >
        {benefit.description}
      </p>

      <div className="mt-auto pt-2">
        {isRequestCard ? (
          <button
            type="button"
            onClick={() => onRequest(benefit)}
            disabled={preparing || !benefit.canRequest}
            className="inline-flex items-center gap-1.5 text-[0.95rem] font-medium text-[#253247] transition hover:text-[#2f66f6] disabled:pointer-events-none disabled:text-[#94a3b8]"
          >
            {preparing ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading
              </>
            ) : (
              actionLabel
            )}
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onOpen(benefit.id)}
            className={cn(
              "inline-flex items-center gap-1.5 text-[0.95rem] font-medium transition",
              isLockedCard
                ? "text-[#7f8897] hover:text-[#4f5d73]"
                : "text-[#253247] hover:text-[#2f66f6]",
            )}
          >
            {actionLabel}
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
      <div className="rounded-[16px] border border-[#d9e1ef] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center">
          <div className="flex items-center gap-5 xl:min-w-[22rem] xl:pr-8">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-28" />
            </div>
          </div>
          <div className="hidden xl:block xl:h-[76px] xl:w-px xl:bg-[#e8edf5]" />
          <div className="grid flex-1 gap-5 sm:grid-cols-2 xl:grid-cols-5 xl:gap-8">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {Array.from({ length: 2 }).map((_, sectionIndex) => (
        <div key={sectionIndex} className="space-y-5">
          <Skeleton className="h-10 w-28" />
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((__, cardIndex) => (
              <Skeleton key={cardIndex} className="h-44 rounded-[14px]" />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function BenefitsHeader({ employee }: { employee: EmployeeRecord }) {
  return (
    <section className="rounded-[16px] border border-[#d9e1ef] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:px-6">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center">
        <div className="flex items-center gap-4 xl:min-w-[22rem] xl:pr-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f3f7] text-[1.35rem] font-medium tracking-[-0.04em] text-[#18243d]">
            {getEmployeeInitials(employee.fullName)}
          </div>

          <div className="space-y-1.5">
            <h1 className="text-[1.7rem] font-semibold tracking-[-0.05em] text-[#18243d]">
              {employee.fullName}
            </h1>
            <p className="text-[0.95rem] font-normal text-[#607089]">
              {getEmployeeSubtitle(employee)}
            </p>
          </div>
        </div>

        <div className="hidden xl:block xl:h-[76px] xl:w-px xl:bg-[#e8edf5]" />

        <div className="grid flex-1 gap-5 sm:grid-cols-2 xl:grid-cols-5 xl:gap-8">
          <SummaryMetric
            label="Employment"
            value={getEmploymentValue(employee.employmentStatus)}
          />
          <SummaryMetric
            label="OKR"
            value={getOkrValue(employee)}
            valueClassName={getOkrClasses(employee)}
          />
          <SummaryMetric
            label="Attendance"
            value={getAttendanceValue(employee)}
          />
          <SummaryMetric
            label="Responsibility"
            value={`Level ${employee.responsibilityLevel}`}
          />
          <SummaryMetric
            label="Hired"
            value={formatDateValue(employee.hireDate) ?? "Not set"}
          />
        </div>
      </div>
    </section>
  );
}

export default function BenefitsBoard() {
  const [selectedBenefitId, setSelectedBenefitId] = useState<string | null>(
    null,
  );
  const [requestBenefitId, setRequestBenefitId] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [preparingBenefitId, setPreparingBenefitId] = useState<string | null>(
    null,
  );
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [requestIntent, setRequestIntent] = useState<{
    requiresContractAcceptance: boolean;
    activeContract: {
      version: string;
      vendorName: string;
      r2ObjectKey: string;
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
  const requestModalBenefit =
    benefits.find((benefit) => benefit.id === requestBenefitId) ?? null;

  function openBenefit(benefitId: string) {
    setSelectedBenefitId(benefitId);
    setRequestIntent(null);
    setDetailError(null);
  }

  async function handlePrepareRequest(benefit: BenefitItem) {
    try {
      setRequestBenefitId(benefit.id);
      setAcceptedTerms(false);
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
              r2ObjectKey: intent.activeContract.r2ObjectKey,
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
      closeRequestModal();
    } catch (mutationError) {
      setDetailError(
        getErrorMessage(mutationError, "Benefit request confirmation failed."),
      );
    }
  }

  function closeSheet() {
    setSelectedBenefitId(null);
    setDetailError(null);
  }

  function closeRequestModal() {
    setRequestBenefitId(null);
    setRequestIntent(null);
    setDetailError(null);
    setPreparingBenefitId(null);
    setAcceptedTerms(false);
  }

  if (loading) {
    return <BenefitsBoardSkeleton />;
  }

  if (error) {
    return (
      <section className="rounded-[12px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        Employee benefits could not be loaded. {error.message}
      </section>
    );
  }

  return (
    <section className="space-y-11">
      {employee ? (
        <section className="pt-1">
          <BenefitsHeader employee={employee} />
        </section>
      ) : null}

      <div className="space-y-10">
        {sections.map((section) => {
          const sectionBenefits = benefits.filter(
            (benefit) => benefit.status === section.key,
          );

          if (sectionBenefits.length === 0 && section.key === "pending") {
            return null;
          }

          return (
            <section key={section.key} className="space-y-5">
              <div className="border-b border-[#dfe6f0] pb-4">
                <h2 className="text-[1.15rem] font-semibold tracking-[-0.03em] text-[#18243d]">
                  {section.title}
                </h2>
              </div>

              {sectionBenefits.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
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
                <div className="rounded-[12px] border border-dashed border-[#d9e1ef] bg-white p-6 text-[0.95rem] text-[#708198]">
                  {section.emptyLabel}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {selectedBenefit ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/12 px-4 py-6 backdrop-blur-[2px]">
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[18px] border border-[#dfe6f0] bg-[#f8fafc] shadow-[0_20px_40px_rgba(15,23,42,0.18)]">
            <button
              type="button"
              onClick={closeSheet}
              className="absolute right-5 top-5 z-10 rounded-[10px] p-1.5 text-[#66758b] transition hover:bg-[#eef3fa] hover:text-[#18243d]"
              aria-label="Close benefit details"
            >
              <X className="h-5 w-5" />
            </button>

            <>
              <div className="bg-white px-6 py-6">
                <div className="flex items-start gap-4 pr-10 text-left">
                  <div className="space-y-2">
                    <h2 className="text-[1.75rem] font-semibold tracking-[-0.04em] text-[#18243d]">
                      {selectedBenefit.title}
                    </h2>
                    {selectedBenefit.status !== "active" ? (
                      <p className="text-[0.95rem] leading-7 text-[#607089]">
                        {selectedBenefit.description}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
                {selectedBenefit.status === "active" ? (
                  <>
                    <section className="rounded-[16px] border border-[#e4ebf5] bg-white p-5">
                      <h3 className="text-[0.95rem] font-semibold text-[#18243d]">
                        Benefit Details
                      </h3>
                      <p className="mt-4 text-[0.95rem] leading-8 text-[#6c7d96]">
                        {selectedBenefit.description}
                      </p>
                    </section>

                    <section className="rounded-[16px] border border-[#e4ebf5] bg-white p-5">
                      <h3 className="text-[0.95rem] font-semibold text-[#18243d]">
                        Requirements
                      </h3>
                      <div className="mt-4 space-y-4">
                        {selectedBenefit.requirements.map((requirement) => (
                          <div
                            key={requirement.label}
                            className="flex items-center gap-3 text-[0.95rem] text-[#18243d]"
                          >
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            <span>{requirement.label}</span>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="rounded-[16px] border border-[#e4ebf5] bg-white p-5">
                      <h3 className="text-[0.95rem] font-semibold text-[#18243d]">
                        Contract
                      </h3>
                      {selectedBenefit.contractDownloadUrl ? (
                        <a
                          href={selectedBenefit.contractDownloadUrl}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 flex items-center gap-3 rounded-[14px] border border-[#e4ebf5] bg-[#fbfcfe] px-4 py-3 text-[0.95rem] text-[#3b4960] transition hover:border-[#cdd8ea] hover:bg-white"
                        >
                          <FileText className="h-5 w-5 text-[#2f66f6]" />
                          <span>View {selectedBenefit.title} PDF</span>
                        </a>
                      ) : (
                        <div className="mt-4 flex items-center gap-3 rounded-[14px] border border-[#e4ebf5] bg-[#fbfcfe] px-4 py-3 text-[0.95rem] text-[#94a3b8]">
                          <FileText className="h-5 w-5 text-[#94a3b8]" />
                          <span>PDF unavailable</span>
                        </div>
                      )}

                      <div className="mt-6 space-y-4 text-[0.95rem]">
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-medium text-[#18243d]">
                            Signed by
                          </span>
                          <span className="text-[#6c7d96]">
                            {employee?.fullName ?? "Employee"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-medium text-[#18243d]">
                            Status
                          </span>
                          <span className="text-[#6c7d96]">Active</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-medium text-[#18243d]">
                            Effective date:
                          </span>
                          <span className="text-[#6c7d96]">
                            {formatDateValue(
                              selectedBenefit.contractEffectiveDate,
                            ) ?? "Not set"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-medium text-[#18243d]">
                            Expiry date:
                          </span>
                          <span className="text-[#6c7d96]">
                            {formatDateValue(
                              selectedBenefit.contractExpiryDate,
                            ) ?? "Not set"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-medium text-[#18243d]">
                            Contract version
                          </span>
                          <span className="text-[#6c7d96]">
                            {selectedBenefit.activeContractVersion
                              ? `v${selectedBenefit.activeContractVersion}`
                              : "Not set"}
                          </span>
                        </div>
                      </div>
                    </section>

                    {selectedBenefit.activeSince ? (
                      <p className="px-0.5 text-[0.95rem] text-[#6c7d96]">
                        {selectedBenefit.activeSince}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <div className="rounded-[12px] border border-[#d9e1ef] bg-white p-5">
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
                      <div className="overflow-hidden rounded-[12px] border border-[#d9e1ef] bg-white">
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
                  </>
                )}

                {selectedBenefit.failureReasons.length > 0 ? (
                  <div className="rounded-[12px] border border-amber-200 bg-amber-50 p-5">
                    <div className="flex items-center gap-2 text-amber-800">
                      <LockKeyhole className="h-4.5 w-4.5" />
                      <h3 className="text-[0.9rem] font-medium">
                        Blocked rules
                      </h3>
                    </div>
                    <ul className="mt-3 space-y-2 text-[0.9rem] text-amber-900">
                      {selectedBenefit.failureReasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {requestIntent?.activeContract ? (
                  <div className="rounded-[12px] border border-blue-200 bg-blue-50 p-5">
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
                  <div className="rounded-[12px] border border-rose-200 bg-rose-50 p-4 text-[0.9rem] text-rose-700">
                    {detailError}
                  </div>
                ) : null}
              </div>

              <div className="border-t border-[#dfe6f0] bg-white px-6 py-5">
                {selectedBenefit.status === "active" ? (
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={closeSheet}
                      className="h-10 rounded-[10px] border border-[#d9e1ef] bg-white px-5 text-[0.9rem] font-medium text-[#3c4a60] transition hover:bg-[#f8fafc]"
                    >
                      Close
                    </button>
                  </div>
                ) : requestIntent ? (
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
                      className="h-10 rounded-[10px] bg-[#2f66f6] px-5 text-[0.9rem] font-medium text-white hover:bg-[#2456d7]"
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
                        "h-10 rounded-[10px] px-5 text-[0.9rem] font-medium",
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
          </div>
        </div>
      ) : null}

      {requestModalBenefit ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/12 px-4 py-6 backdrop-blur-[2px]">
          <div
            className={cn(
              "relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[18px] border border-[#dfe6f0] bg-white shadow-[0_20px_40px_rgba(15,23,42,0.18)]",
              requestIntent?.activeContract?.r2ObjectKey
                ? "max-w-6xl"
                : "max-w-[32rem]",
            )}
          >
            <button
              type="button"
              onClick={closeRequestModal}
              className="absolute right-5 top-5 rounded-[10px] p-1.5 text-[#66758b] transition hover:bg-[#f3f6fb] hover:text-[#18243d]"
              aria-label="Close request modal"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-2 px-6 pt-6">
              <h2 className="pr-10 text-[1.05rem] font-semibold tracking-[-0.03em] text-[#18243d] sm:text-[1.2rem]">
                Request {requestModalBenefit.title}
              </h2>
              <p className="text-[0.95rem] text-[#4c5d75]">
                Submit a formal request to activate this benefit.
              </p>
            </div>

            <div className="space-y-5 overflow-y-auto px-6 py-6">
              <section className="rounded-[16px] border border-[#e4ebf5] bg-[#fbfcfe] p-5">
                <h3 className="text-[0.95rem] font-semibold text-[#18243d]">
                  Benefit Details
                </h3>
                <p className="mt-4 text-[0.95rem] leading-8 text-[#6c7d96]">
                  {requestModalBenefit.description}
                </p>
              </section>

              <section className="rounded-[16px] border border-[#e4ebf5] bg-[#fbfcfe] p-5">
                <h3 className="text-[0.95rem] font-semibold text-[#18243d]">
                  Requirements
                </h3>
                <div className="mt-4 space-y-3">
                  {requestModalBenefit.requirements.map((requirement) => (
                    <div
                      key={requirement.label}
                      className="flex items-center gap-3 text-[0.95rem] text-[#18243d]"
                    >
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <span>{requirement.label}</span>
                    </div>
                  ))}
                </div>
              </section>

              {requestIntent?.requiresContractAcceptance ? (
                requestIntent.activeContract?.r2ObjectKey ? (
                  <ContractSigningView
                    benefitTitle={requestModalBenefit.title}
                    contract={requestIntent.activeContract}
                    acceptedTerms={acceptedTerms}
                    onAcceptedTermsChange={setAcceptedTerms}
                  />
                ) : (
                  <ContractEmptyState
                    benefitTitle={requestModalBenefit.title}
                  />
                )
              ) : null}

              {detailError ? (
                <div className="rounded-[12px] border border-rose-200 bg-rose-50 p-4 text-[0.9rem] text-rose-700">
                  {detailError}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#e4ebf5] px-6 py-5">
              <button
                type="button"
                onClick={closeRequestModal}
                className="h-11 rounded-[14px] border border-[#d9e1ef] bg-white px-5 text-[0.95rem] font-medium text-[#3c4a60] transition hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <Button
                type="button"
                onClick={() => handleConfirmRequest(requestModalBenefit)}
                disabled={
                  confirming ||
                  preparingBenefitId === requestModalBenefit.id ||
                  requestIntent == null ||
                  (requestIntent?.requiresContractAcceptance &&
                    (!requestIntent.activeContract?.r2ObjectKey ||
                      !acceptedTerms))
                }
                className="h-11 rounded-[14px] bg-[#9dbffd] px-5 text-[0.95rem] font-medium text-white hover:bg-[#88aff8] disabled:opacity-60"
              >
                {preparingBenefitId === requestModalBenefit.id ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Loading
                  </>
                ) : confirming ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Submitting
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
