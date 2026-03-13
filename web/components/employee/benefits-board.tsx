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
  MY_BENEFITS_QUERY,
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
  detailLines: string[];
  canRequest: boolean;
  requiresContract: boolean;
  failureReasons: string[];
  icon: React.ElementType;
  activeSince?: string;
  latestRequestLabel?: string;
  activeContractVersion?: string | null;
}

const filters: Array<{ label: string; value: BenefitCategory }> = [
  { label: "All", value: "all" },
  { label: "Wellness", value: "wellness" },
  { label: "Career", value: "career" },
  { label: "Flexibility", value: "flexibility" },
  { label: "Financial", value: "financial" },
];

const sections: Array<{
  key: BenefitStatus;
  title: string;
  description: string;
}> = [
  { key: "active", title: "Active", description: "These are yours" },
  {
    key: "available",
    title: "Available",
    description: "You qualify, request anytime",
  },
  { key: "pending", title: "Pending", description: "Waiting for approval" },
  { key: "locked", title: "Locked", description: "Rules still need attention" },
];

function getCategoryClasses(category: BenefitItem["category"]) {
  switch (category) {
    case "wellness":
      return "bg-green-100 text-green-800";
    case "career":
      return "bg-violet-100 text-violet-700";
    case "flexibility":
      return "bg-sky-100 text-sky-700";
    case "financial":
      return "bg-amber-100 text-amber-800";
  }
}

function getCategory(value: string | null | undefined): Exclude<BenefitCategory, "all"> {
  if (value === "wellness" || value === "career" || value === "flexibility" || value === "financial") {
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

function formatDateLabel(prefix: string, isoDate: string | null | undefined) {
  if (!isoDate) return undefined;

  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return undefined;

  return `${prefix} ${parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

function parseRuleSummary(ruleEvaluationJson: string) {
  try {
    const parsed = JSON.parse(ruleEvaluationJson) as Array<{ passed?: boolean }>;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return "No rules configured";
    }

    const passed = parsed.filter((item) => item?.passed !== false).length;
    return `${passed}/${parsed.length} шалгуур биелсэн`;
  } catch {
    return "Rule evaluation unavailable";
  }
}

function buildBenefitDescription(benefit: BenefitRecord["benefit"]) {
  const vendor = benefit.vendorName ? `${benefit.vendorName} ` : "";
  const subsidy =
    benefit.subsidyPercent > 0
      ? `${benefit.subsidyPercent}% санхүүжилттэй `
      : "";

  switch (getCategory(benefit.category)) {
    case "wellness":
      return `${subsidy}${vendor}${benefit.name.toLowerCase()} benefit.`;
    case "career":
      return `${benefit.name} нь карьерын өсөлтөд чиглэсэн benefit.`;
    case "flexibility":
      return `${benefit.name} нь уян хатан ажлын нөхцөлийг дэмжинэ.`;
    case "financial":
      return `${subsidy}${benefit.name} санхүүгийн дэмжлэгтэй benefit.`;
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return fallback;
}

function mapBenefitItem(record: BenefitRecord): BenefitItem {
  return {
    id: record.benefit.id,
    title: record.benefit.name,
    description: buildBenefitDescription(record.benefit),
    category: getCategory(record.benefit.category),
    status: record.status,
    criteria: parseRuleSummary(record.eligibility.ruleEvaluationJson),
    detailLines: [
      record.benefit.vendorName ? `Vendor: ${record.benefit.vendorName}` : "Vendor not configured",
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

function getRequestButtonLabel(benefit: BenefitItem) {
  if (benefit.status === "pending") return "Хүлээгдэж байна";
  if (benefit.status === "active") return "Идэвхтэй";
  if (benefit.status === "locked") return "Шаардлага харах";
  return "Хүсэлт гаргах";
}

function BenefitCard({
  benefit,
  onOpen,
}: {
  benefit: BenefitItem;
  onOpen: (benefitId: string) => void;
}) {
  const Icon = benefit.icon;

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
            <Icon className="h-4.5 w-4.5" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">
            {benefit.title}
          </h3>
        </div>
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
            getCategoryClasses(benefit.category),
          )}
        >
          {filters.find((filter) => filter.value === benefit.category)?.label}
        </span>
      </div>

      <p className="mt-4 min-h-14 text-[0.96rem] leading-7 text-gray-900">
        {benefit.description}
      </p>

      {benefit.activeSince ? (
        <p className="mt-4 text-sm text-gray-500">{benefit.activeSince}</p>
      ) : (
        <div className="mt-4 h-6" />
      )}

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-sm text-gray-500">{benefit.criteria}</span>
        <button
          type="button"
          onClick={() => onOpen(benefit.id)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 transition hover:text-blue-700"
        >
          Дэлгэрэнгүй
          <ChevronRight className="h-4.5 w-4.5" />
        </button>
      </div>
    </article>
  );
}

function BenefitsBoardSkeleton() {
  return (
    <section className="w-full space-y-10">
      <div className="rounded-2xl border border-gray-200 bg-white p-1.5">
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 xl:grid-cols-5">
          {filters.map((filter) => (
            <Skeleton key={filter.value} className="h-12 rounded-xl" />
          ))}
        </div>
      </div>

      <div className="space-y-10">
        {Array.from({ length: 3 }).map((_, sectionIndex) => (
          <div key={sectionIndex} className="space-y-4">
            <Skeleton className="h-7 w-48" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((__, cardIndex) => (
                <div
                  key={cardIndex}
                  className="rounded-2xl border border-gray-200 bg-white p-4"
                >
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="mt-4 h-16 w-full" />
                  <Skeleton className="mt-6 h-5 w-24" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function BenefitsBoard() {
  const [selectedCategory, setSelectedCategory] =
    useState<BenefitCategory>("all");
  const [selectedBenefitId, setSelectedBenefitId] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [requestIntent, setRequestIntent] = useState<{
    requiresContractAcceptance: boolean;
    activeContract: {
      version: string;
      vendorName: string;
      effectiveDate: string | null;
      expiryDate: string | null;
    } | null;
  } | null>(null);

  const { data, loading, error, refetch } = useQuery<{ myBenefits: BenefitRecord[] }>(
    MY_BENEFITS_QUERY,
  );
  const [requestBenefit, { loading: requesting }] = useMutation<RequestBenefitResponse>(
    REQUEST_BENEFIT_MUTATION,
  );
  const [confirmBenefitRequest, { loading: confirming }] = useMutation<ConfirmBenefitRequestResponse>(
    CONFIRM_BENEFIT_REQUEST_MUTATION,
  );

  const benefits = useMemo(
    () => (data?.myBenefits ?? []).map(mapBenefitItem),
    [data?.myBenefits],
  );

  const selectedBenefit =
    benefits.find((benefit) => benefit.id === selectedBenefitId) ?? null;

  const visibleBenefits = benefits.filter((benefit) =>
    selectedCategory === "all" ? true : benefit.category === selectedCategory,
  );

  async function handlePrepareRequest(benefit: BenefitItem) {
    try {
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
    }
  }

  async function handleConfirmRequest(benefit: BenefitItem) {
    try {
      setDetailError(null);
      await confirmBenefitRequest({
        variables: {
          input: {
            benefitId: benefit.id,
            contractVersionAccepted: requestIntent?.activeContract?.version ?? null,
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
  }

  if (loading) {
    return <BenefitsBoardSkeleton />;
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
        Benefits could not be loaded. {error.message}
      </section>
    );
  }

  return (
    <section className="w-full space-y-10">
      <div className="rounded-2xl border border-gray-200 bg-white p-1.5">
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 xl:grid-cols-5">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setSelectedCategory(filter.value)}
              className={cn(
                "min-h-12 rounded-xl px-4 py-3 text-center text-base font-medium transition",
                selectedCategory === filter.value
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-900 hover:bg-gray-50",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-10">
        {sections.map((section) => {
          const sectionBenefits = visibleBenefits.filter(
            (benefit) => benefit.status === section.key,
          );

          if (sectionBenefits.length === 0) return null;

          return (
            <div key={section.key} className="space-y-4">
              <div className="flex flex-wrap items-baseline gap-2.5">
                <h2 className="text-[1.05rem] font-semibold text-gray-900">
                  {section.title}
                </h2>
                <p className="text-base text-gray-500">
                  {section.description} ({sectionBenefits.length})
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {sectionBenefits.map((benefit) => (
                  <BenefitCard
                    key={benefit.id}
                    benefit={benefit}
                    onOpen={setSelectedBenefitId}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Sheet open={selectedBenefit != null} onOpenChange={(open) => (!open ? closeSheet() : null)}>
        <SheetContent side="right" className="w-full max-w-xl bg-white">
          {selectedBenefit ? (
            <>
              <SheetHeader className="border-b border-gray-200 px-6 py-5">
                <SheetTitle className="text-xl font-semibold text-gray-900">
                  {selectedBenefit.title}
                </SheetTitle>
                <SheetDescription className="text-sm text-gray-500">
                  {selectedBenefit.description}
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-medium tracking-[0.18em] text-gray-500 uppercase">
                    Status
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-base font-semibold text-gray-900">
                      {selectedBenefit.status.charAt(0).toUpperCase() +
                        selectedBenefit.status.slice(1)}
                    </span>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                        selectedBenefit.status === "active"
                          ? "bg-green-100 text-green-700"
                          : selectedBenefit.status === "available"
                            ? "bg-blue-100 text-blue-700"
                            : selectedBenefit.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-200 text-gray-700",
                      )}
                    >
                      {selectedBenefit.criteria}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Benefit details
                  </h3>
                  <div className="rounded-2xl border border-gray-200 bg-white">
                    {selectedBenefit.detailLines.map((line) => (
                      <div
                        key={line}
                        className="border-b border-gray-100 px-4 py-3 text-sm text-gray-600 last:border-b-0"
                      >
                        {line}
                      </div>
                    ))}
                    {selectedBenefit.activeSince ? (
                      <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-500">
                        {selectedBenefit.activeSince}
                      </div>
                    ) : null}
                    {selectedBenefit.latestRequestLabel ? (
                      <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-500">
                        {selectedBenefit.latestRequestLabel}
                      </div>
                    ) : null}
                  </div>
                </div>

                {selectedBenefit.failureReasons.length > 0 ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-center gap-2 text-amber-800">
                      <LockKeyhole className="h-4.5 w-4.5" />
                      <h3 className="text-sm font-semibold">Blocked rules</h3>
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-amber-900">
                      {selectedBenefit.failureReasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {requestIntent?.activeContract ? (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <h3 className="text-sm font-semibold text-blue-900">
                      Contract confirmation
                    </h3>
                    <p className="mt-2 text-sm text-blue-800">
                      Version {requestIntent.activeContract.version}
                      {requestIntent.activeContract.vendorName
                        ? ` • ${requestIntent.activeContract.vendorName}`
                        : ""}
                    </p>
                    {requestIntent.activeContract.effectiveDate ? (
                      <p className="mt-1 text-sm text-blue-700">
                        Effective {formatDateLabel("", requestIntent.activeContract.effectiveDate)?.trim()}
                      </p>
                    ) : null}
                    {requestIntent.activeContract.expiryDate ? (
                      <p className="mt-1 text-sm text-blue-700">
                        Expires {formatDateLabel("", requestIntent.activeContract.expiryDate)?.trim()}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {detailError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                    {detailError}
                  </div>
                ) : null}
              </div>

              <div className="border-t border-gray-200 px-6 py-5">
                {requestIntent ? (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-gray-500">
                      {requestIntent.requiresContractAcceptance
                        ? "Confirm contract acceptance to submit this request."
                        : "Everything is ready. Submit the request."}
                    </p>
                    <Button
                      type="button"
                      onClick={() => handleConfirmRequest(selectedBenefit)}
                      disabled={confirming}
                    >
                      {confirming ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Submitting
                        </>
                      ) : (
                        "Confirm request"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-gray-500">
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
                      variant={selectedBenefit.canRequest ? "default" : "outline"}
                      onClick={() => handlePrepareRequest(selectedBenefit)}
                      disabled={!selectedBenefit.canRequest || requesting}
                    >
                      {requesting ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Checking
                        </>
                      ) : (
                        getRequestButtonLabel(selectedBenefit)
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
