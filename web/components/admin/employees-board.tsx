"use client";

import { useEffect, useMemo, useState } from "react";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  LoaderCircle,
  Minus,
  Plus,
  Search,
  X,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ADMIN_EMPLOYEES_QUERY = gql`
  query AdminEmployeesPageData {
    employees {
      id
      fullName
      email
      role
      department
      responsibilityLevel
      status
      hireDate
      okrStatus
      lateArrivalCount
      lateArrivalUpdatedAt
    }
    benefits {
      id
      name
      requiresContract
      isActive
    }
    benefitEligibility {
      employeeId
      benefitId
      status
      ruleEvaluationJson
      overrideReason
      overrideExpiresAt
    }
    benefitRequests {
      id
      employeeId
      benefitId
      status
      contractVersionAccepted
      contractAcceptedAt
      reviewNotes
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_EMPLOYEE_MUTATION = gql`
  mutation UpdateEmployeeAdminPage(
    $id: ID!
    $okrStatus: EmployeeOkrStatus
    $okrSubmitted: Boolean
    $lateArrivalCount: Int
    $lateArrivalUpdatedAt: String
  ) {
    updateEmployee(
      id: $id
      okrStatus: $okrStatus
      okrSubmitted: $okrSubmitted
      lateArrivalCount: $lateArrivalCount
      lateArrivalUpdatedAt: $lateArrivalUpdatedAt
    ) {
      id
      okrStatus
      okrSubmitted
      lateArrivalCount
      lateArrivalUpdatedAt
      updatedAt
    }
  }
`;

const UPSERT_BENEFIT_ELIGIBILITY_MUTATION = gql`
  mutation UpsertBenefitEligibility($input: UpdateBenefitEligibilityInput!) {
    upsertBenefitEligibility(input: $input) {
      employeeId
      benefitId
      status
      overrideReason
      overrideExpiresAt
    }
  }
`;

type OkrStatus = "Success" | "Submitted" | "Failed";
type BenefitStatus = "Active" | "Available" | "Pending" | "Not Yet Available";

interface EmployeeBenefit {
  id: string;
  name: string;
  status: BenefitStatus;
  reason: string;
  contractLabel: string;
}

interface EmployeeItem {
  id: string;
  name: string;
  email: string;
  status: string;
  department: string;
  roleLabel: string;
  okr: OkrStatus;
  lateDates: string[];
  contract: string;
  responsibilityLevel: number;
  benefits: EmployeeBenefit[];
}

type PendingLateAction =
  | { type: "add"; employeeId: string }
  | { type: "delete"; employeeId: string; date: string };

type OverrideDialogState = {
  employeeId: string;
  benefitId: string;
  benefitName: string;
};

type EmployeeRecord = {
  employees: Array<{
    id: string;
    fullName: string;
    email: string | null;
    role: string | null;
    department: string | null;
    responsibilityLevel: number;
    status: string | null;
    hireDate: string | null;
    okrStatus: "submitted" | "success" | "fail" | null;
    lateArrivalCount: number;
    lateArrivalUpdatedAt: string | null;
  }>;
  benefits: Array<{
    id: string;
    name: string;
    requiresContract: boolean | null;
    isActive: boolean | null;
  }>;
  benefitEligibility: Array<{
    employeeId: string;
    benefitId: string;
    status: "active" | "eligible" | "locked" | "pending";
    ruleEvaluationJson: string;
    overrideReason: string | null;
    overrideExpiresAt: string | null;
  }>;
  benefitRequests: Array<{
    id: string;
    employeeId: string;
    benefitId: string;
    status: "pending" | "approved" | "rejected" | "cancelled";
    contractVersionAccepted: string | null;
    contractAcceptedAt: string | null;
    reviewNotes: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
};

type UpdateEmployeeMutationResponse = {
  updateEmployee: {
    id: string;
    okrStatus: "submitted" | "success" | "fail" | null;
    okrSubmitted: boolean;
    lateArrivalCount: number;
    lateArrivalUpdatedAt: string | null;
    updatedAt: string;
  };
};

type UpsertBenefitEligibilityResponse = {
  upsertBenefitEligibility: {
    employeeId: string;
    benefitId: string;
    status: string;
    overrideReason: string | null;
    overrideExpiresAt: string | null;
  };
};

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatContractLabel(name: string, requiresContract: boolean | null) {
  return requiresContract ? `${name} PDF` : "-";
}

function parseFailureReason(ruleEvaluationJson: string) {
  try {
    const parsed = JSON.parse(ruleEvaluationJson) as Array<{
      passed?: boolean;
      reason?: string;
    }>;

    if (!Array.isArray(parsed)) {
      return null;
    }

    return (
      parsed.find(
        (item) => item?.passed === false && typeof item.reason === "string",
      )?.reason ?? null
    );
  } catch {
    return null;
  }
}

function deriveLateDates(count: number, updatedAt: string | null) {
  if (count <= 0) {
    return [];
  }

  const baseDate = updatedAt ? new Date(updatedAt) : new Date();
  if (Number.isNaN(baseDate.getTime())) {
    return [];
  }

  return Array.from({ length: count }, (_, index) => {
    const lateDate = new Date(baseDate);
    lateDate.setDate(baseDate.getDate() - index);
    return lateDate.toISOString().slice(0, 10);
  }).sort();
}

function mapOkrStatus(
  status: EmployeeRecord["employees"][number]["okrStatus"],
): OkrStatus {
  switch (status) {
    case "success":
      return "Success";
    case "submitted":
      return "Submitted";
    default:
      return "Failed";
  }
}

function mapBenefitStatus(params: {
  eligibilityStatus?: "active" | "eligible" | "locked" | "pending";
  latestRequestStatus?: "pending" | "approved" | "rejected" | "cancelled";
}): BenefitStatus {
  if (params.latestRequestStatus === "approved") {
    return "Active";
  }
  if (params.latestRequestStatus === "pending") {
    return "Pending";
  }
  if (
    params.eligibilityStatus === "active" ||
    params.eligibilityStatus === "eligible"
  ) {
    return "Available";
  }

  return "Not Yet Available";
}

function buildBenefitReason(params: {
  status: BenefitStatus;
  latestRequestUpdatedAt?: string;
  latestRequestReviewNotes?: string | null;
  eligibilityOverrideReason?: string | null;
  eligibilityFailureReason?: string | null;
}) {
  if (params.status === "Active") {
    return params.latestRequestUpdatedAt
      ? `Approved ${formatLateDate(params.latestRequestUpdatedAt)}`
      : "Approved";
  }

  if (params.status === "Pending") {
    return params.latestRequestReviewNotes?.trim() || "Pending HR review";
  }

  if (params.status === "Available") {
    return (
      params.eligibilityOverrideReason?.trim() || "All eligibility rules met"
    );
  }

  return (
    params.eligibilityOverrideReason?.trim() ||
    params.eligibilityFailureReason?.trim() ||
    "Eligibility requirements not met"
  );
}

function getOkrClasses(status: OkrStatus) {
  switch (status) {
    case "Success":
      return "text-green-600";
    case "Submitted":
      return "text-amber-500";
    case "Failed":
      return "text-red-500";
  }
}

function getLateClasses(value: number) {
  return value >= 4 ? "bg-red-100 text-red-700" : "bg-stone-100 text-gray-700";
}

function getBenefitStatusClasses(status: BenefitStatus) {
  switch (status) {
    case "Active":
      return "border-emerald-300 bg-emerald-50 text-emerald-600";
    case "Available":
      return "border-blue-300 bg-blue-50 text-blue-600";
    case "Pending":
      return "border-amber-300 bg-amber-50 text-amber-500";
    case "Not Yet Available":
      return "border-stone-300 bg-stone-50 text-stone-500";
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("");
}

function formatLateDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSelectedDate(date: Date | null) {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getCalendarDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const jsDay = firstDay.getDay();
  const mondayBasedOffset = (jsDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: Array<number | null> = [];

  for (let i = 0; i < mondayBasedOffset; i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(day);
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

function isSameDay(left: Date | null, right: Date | null) {
  if (!left || !right) return false;
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export default function EmployeesBoard() {
  const [search, setSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [detailEmployeeId, setDetailEmployeeId] = useState<string | null>(null);
  const [openOkrMenuId, setOpenOkrMenuId] = useState<string | null>(null);
  const [lateDialogEmployeeId, setLateDialogEmployeeId] = useState<
    string | null
  >(null);
  const [overrideDialog, setOverrideDialog] =
    useState<OverrideDialogState | null>(null);
  const [overrideEnabled, setOverrideEnabled] = useState(true);
  const [overrideJustification, setOverrideJustification] = useState("");
  const [overridePermanent, setOverridePermanent] = useState(false);
  const [overrideSelectedDate, setOverrideSelectedDate] = useState<Date | null>(
    null,
  );
  const [overrideMonth, setOverrideMonth] = useState(() => new Date());
  const [pendingLateAction, setPendingLateAction] =
    useState<PendingLateAction | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery<EmployeeRecord>(
    ADMIN_EMPLOYEES_QUERY,
    {
      notifyOnNetworkStatusChange: true,
    },
  );

  const [updateEmployee] = useMutation<UpdateEmployeeMutationResponse>(
    UPDATE_EMPLOYEE_MUTATION,
  );

  const [upsertBenefitEligibility, { loading: savingOverride }] =
    useMutation<UpsertBenefitEligibilityResponse>(
      UPSERT_BENEFIT_ELIGIBILITY_MUTATION,
    );

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 2800);

    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  useEffect(() => {
    if (!errorMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setErrorMessage(null);
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [errorMessage]);

  useEffect(() => {
    if (!openOkrMenuId) {
      return;
    }

    function handleWindowClick() {
      setOpenOkrMenuId(null);
    }

    window.addEventListener("click", handleWindowClick);

    return () => window.removeEventListener("click", handleWindowClick);
  }, [openOkrMenuId]);

  const employees = useMemo<EmployeeItem[]>(() => {
    if (!data) {
      return [];
    }

    const activeBenefits = data.benefits
      .filter((benefit) => benefit.isActive !== false)
      .sort((left, right) => left.name.localeCompare(right.name));

    const eligibilityByKey = new Map(
      data.benefitEligibility.map((item) => [
        `${item.employeeId}:${item.benefitId}`,
        item,
      ]),
    );

    const latestRequestByKey = new Map<
      string,
      EmployeeRecord["benefitRequests"][number]
    >();

    data.benefitRequests.forEach((request) => {
      const key = `${request.employeeId}:${request.benefitId}`;
      const current = latestRequestByKey.get(key);
      if (!current) {
        latestRequestByKey.set(key, request);
        return;
      }

      const currentTimestamp = new Date(current.updatedAt).getTime();
      const nextTimestamp = new Date(request.updatedAt).getTime();
      if (nextTimestamp >= currentTimestamp) {
        latestRequestByKey.set(key, request);
      }
    });

    return data.employees.map((employee) => {
      const department = employee.department?.trim().toLowerCase() || "general";
      const benefits = activeBenefits.map((benefit) => {
        const key = `${employee.id}:${benefit.id}`;
        const eligibility = eligibilityByKey.get(key);
        const latestRequest = latestRequestByKey.get(key);
        const status = mapBenefitStatus({
          eligibilityStatus: eligibility?.status,
          latestRequestStatus: latestRequest?.status,
        });

        return {
          id: benefit.id,
          name: benefit.name,
          status,
          reason: buildBenefitReason({
            status,
            latestRequestUpdatedAt:
              latestRequest?.updatedAt ?? latestRequest?.createdAt,
            latestRequestReviewNotes: latestRequest?.reviewNotes,
            eligibilityOverrideReason: eligibility?.overrideReason,
            eligibilityFailureReason: eligibility
              ? parseFailureReason(eligibility.ruleEvaluationJson)
              : null,
          }),
          contractLabel: formatContractLabel(
            benefit.name,
            benefit.requiresContract,
          ),
        };
      });

      return {
        id: employee.id,
        name: employee.fullName,
        email: employee.email ?? "-",
        status: titleCase((employee.status ?? "active").toLowerCase()),
        department,
        roleLabel: employee.role?.trim() || titleCase(department),
        okr: mapOkrStatus(employee.okrStatus),
        lateDates: deriveLateDates(
          employee.lateArrivalCount ?? 0,
          employee.lateArrivalUpdatedAt,
        ),
        contract: employee.hireDate ? formatLateDate(employee.hireDate) : "-",
        responsibilityLevel: employee.responsibilityLevel ?? 0,
        benefits,
      };
    });
  }, [data]);

  const departmentFilters = useMemo(
    () => [
      { label: "All", value: "all" },
      ...Array.from(new Set(employees.map((employee) => employee.department)))
        .sort((left, right) => left.localeCompare(right))
        .map((department) => ({
          label: titleCase(department),
          value: department,
        })),
    ],
    [employees],
  );

  const filteredEmployees = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesDepartment =
        selectedDepartment === "all" ||
        employee.department === selectedDepartment;
      const matchesSearch =
        keyword.length === 0 ||
        employee.name.toLowerCase().includes(keyword) ||
        employee.email.toLowerCase().includes(keyword);

      return matchesDepartment && matchesSearch;
    });
  }, [employees, search, selectedDepartment]);

  const detailEmployee = detailEmployeeId
    ? (employees.find((employee) => employee.id === detailEmployeeId) ?? null)
    : null;

  const selectedEmployee = lateDialogEmployeeId
    ? (employees.find((employee) => employee.id === lateDialogEmployeeId) ??
      null)
    : null;

  const calendarDays = useMemo(
    () => getCalendarDays(overrideMonth),
    [overrideMonth],
  );

  function closeLateDialogs() {
    setLateDialogEmployeeId(null);
    setPendingLateAction(null);
  }

  async function updateEmployeeOkr(employeeId: string, okr: OkrStatus) {
    const okrStatus =
      okr === "Success"
        ? "success"
        : okr === "Submitted"
          ? "submitted"
          : "fail";

    try {
      await updateEmployee({
        variables: {
          id: employeeId,
          okrStatus,
          okrSubmitted: okr !== "Failed",
        },
      });
      await refetch();
      setSuccessMessage("OKR status updated successfully.");
    } catch (mutationError) {
      setErrorMessage(
        mutationError instanceof Error
          ? mutationError.message
          : "OKR status could not be updated.",
      );
    }
  }

  function closeOverrideDialog() {
    setOverrideDialog(null);
    setOverrideJustification("");
    setOverrideEnabled(true);
    setOverridePermanent(false);
    setOverrideSelectedDate(null);
    setOverrideMonth(new Date());
    setErrorMessage(null);
  }

  function openOverrideDialog(
    employee: EmployeeItem,
    benefit: EmployeeBenefit,
  ) {
    const today = new Date();

    setOverrideDialog({
      employeeId: employee.id,
      benefitId: benefit.id,
      benefitName: benefit.name,
    });
    setOverrideEnabled(
      benefit.status === "Active" ||
        benefit.status === "Available" ||
        benefit.status === "Pending",
    );
    setOverrideJustification("");
    setOverridePermanent(false);
    setOverrideSelectedDate(today);
    setOverrideMonth(today);
  }

  async function saveOverride() {
    if (!overrideDialog) {
      return;
    }

    if (!overridePermanent && !overrideSelectedDate) {
      setErrorMessage(
        "Please select an expiry date or choose permanent override.",
      );
      return;
    }

    try {
      await upsertBenefitEligibility({
        variables: {
          input: {
            employeeId: overrideDialog.employeeId,
            benefitId: overrideDialog.benefitId,
            status: overrideEnabled ? "active" : "locked",
            overrideReason:
              overrideJustification.trim() ||
              (overrideEnabled
                ? "Manual override granted"
                : "Manual override restricted"),
            overrideExpiresAt: overridePermanent
              ? null
              : (overrideSelectedDate?.toISOString() ?? null),
          },
        },
      });
      await refetch();
      setSuccessMessage("Eligibility override saved successfully.");
      closeOverrideDialog();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Eligibility override could not be saved.",
      );
    }
  }

  async function confirmLateAction() {
    if (!pendingLateAction) {
      return;
    }

    const targetEmployee = employees.find(
      (employee) => employee.id === pendingLateAction.employeeId,
    );

    if (!targetEmployee) {
      setErrorMessage("Employee record could not be loaded.");
      closeLateDialogs();
      return;
    }

    const nextLateCount =
      pendingLateAction.type === "add"
        ? targetEmployee.lateDates.length + 1
        : Math.max(0, targetEmployee.lateDates.length - 1);

    try {
      await updateEmployee({
        variables: {
          id: targetEmployee.id,
          lateArrivalCount: nextLateCount,
          lateArrivalUpdatedAt: new Date().toISOString(),
        },
      });
      await refetch();
      setSuccessMessage(
        pendingLateAction.type === "add"
          ? "Late attendance marked successfully."
          : "Late attendance removed successfully.",
      );
      closeLateDialogs();
    } catch (mutationError) {
      setErrorMessage(
        mutationError instanceof Error
          ? mutationError.message
          : "Late attendance could not be updated.",
      );
    }
  }

  return (
    <>
      {detailEmployee ? (
        <section className="w-full space-y-8">
          <button
            type="button"
            onClick={() => setDetailEmployeeId(null)}
            className="inline-flex cursor-pointer items-center gap-3 text-[1.05rem] font-medium text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to employees
          </button>

          <div className="rounded-[1.35rem] border border-slate-200 bg-white px-7 py-7 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
            <div className="grid gap-7 xl:grid-cols-[1.15fr_1.85fr] xl:items-center">
              <div className="flex items-center gap-5 border-b border-slate-200 pb-7 xl:border-r xl:border-b-0 xl:pb-0 xl:pr-9">
                <div className="flex h-22 w-22 items-center justify-center rounded-full bg-stone-100 text-[1.9rem] font-medium text-slate-900">
                  {getInitials(detailEmployee.name)}
                </div>
                <div>
                  <h2 className="text-[1.9rem] font-semibold tracking-[-0.03em] text-slate-900">
                    {detailEmployee.name}
                  </h2>
                  <p className="mt-1 text-[1.15rem] text-slate-500">
                    {detailEmployee.roleLabel}
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
                <div>
                  <p className="text-[0.92rem] font-medium uppercase tracking-[0.03em] text-slate-500">
                    Employment
                  </p>
                  <p className="mt-3 text-[1rem] font-medium text-slate-900">
                    {detailEmployee.status}
                  </p>
                </div>
                <div>
                  <p className="text-[0.92rem] font-medium uppercase tracking-[0.03em] text-slate-500">
                    OKR
                  </p>
                  <p
                    className={cn(
                      "mt-3 text-[1rem] font-medium",
                      getOkrClasses(detailEmployee.okr),
                    )}
                  >
                    {detailEmployee.okr}
                  </p>
                </div>
                <div>
                  <p className="text-[0.92rem] font-medium uppercase tracking-[0.03em] text-slate-500">
                    Attendance
                  </p>
                  <p className="mt-3 text-[1rem] font-medium text-slate-900">
                    {detailEmployee.lateDates.length}/3 lates
                  </p>
                </div>
                <div>
                  <p className="text-[0.92rem] font-medium uppercase tracking-[0.03em] text-slate-500">
                    Responsibility
                  </p>
                  <p className="mt-3 text-[1rem] font-medium text-slate-900">
                    Level {detailEmployee.responsibilityLevel}
                  </p>
                </div>
                <div>
                  <p className="text-[0.92rem] font-medium uppercase tracking-[0.03em] text-slate-500">
                    Hired
                  </p>
                  <p className="mt-3 text-[1rem] font-medium text-slate-900">
                    {detailEmployee.contract}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-table-card">
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead className="admin-table-head">
                  <tr className="admin-table-header-row">
                    <th className="admin-table-th px-7">Benefits</th>
                    <th className="admin-table-th px-7">Status</th>
                    <th className="admin-table-th px-7">Reason</th>
                    <th className="admin-table-th px-7">Contract</th>
                    <th className="admin-table-th px-7">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {detailEmployee.benefits.map((benefit) => (
                    <tr
                      key={`${detailEmployee.id}-${benefit.id}`}
                      className="text-slate-900"
                    >
                      <td className="admin-table-cell px-7 text-[1rem] font-medium text-slate-900">
                        {benefit.name}
                      </td>
                      <td className="admin-table-cell px-7">
                        <div
                          className={cn(
                            "inline-flex items-center rounded-[0.8rem] border px-3.5 py-1.5 text-[0.95rem] font-medium",
                            getBenefitStatusClasses(benefit.status),
                          )}
                        >
                          {benefit.status}
                        </div>
                      </td>
                      <td className="admin-table-cell px-7 text-[1rem] text-slate-900">
                        {benefit.reason}
                      </td>
                      <td className="admin-table-cell px-7 text-[1rem] text-slate-900">
                        {benefit.contractLabel === "-" ? (
                          "-"
                        ) : (
                          <button
                            type="button"
                            className="cursor-pointer underline underline-offset-4 transition hover:text-slate-600"
                          >
                            {benefit.contractLabel}
                          </button>
                        )}
                      </td>
                      <td className="admin-table-cell px-7">
                        <button
                          type="button"
                          onClick={() =>
                            openOverrideDialog(detailEmployee, benefit)
                          }
                          className="cursor-pointer rounded-[0.95rem] border border-slate-200 bg-white px-4 py-2 text-[0.95rem] font-medium text-slate-700 shadow-[0_1px_3px_rgba(15,23,42,0.08)] transition hover:bg-slate-50"
                        >
                          Override
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : (
        <section className="w-full space-y-10">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h2 className="text-[2.15rem] font-semibold tracking-[-0.03em] text-slate-900">
                Employee list
              </h2>
              <p className="mt-3 text-[1.05rem] text-slate-500">
                View and edit all employees&apos; privileges.
              </p>
            </div>

            <div className="relative w-full xl:max-w-108">
              <Search className="pointer-events-none absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name..."
                className="h-14 rounded-2xl border-slate-200 bg-white pl-14 pr-5 text-[1.05rem] text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="border-b border-slate-200">
            <div className="flex flex-wrap gap-8">
              {departmentFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setSelectedDepartment(filter.value)}
                  className={cn(
                    "relative -mb-px cursor-pointer border-b-2 px-4 pb-4 text-[1.05rem] font-medium transition",
                    selectedDepartment === filter.value
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-900 hover:text-blue-600",
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[1.1rem] font-semibold text-slate-900">
              {filteredEmployees.length} Employees
            </h3>

            <div className="admin-table-card">
              <div className="admin-table-scroll">
                <table className="admin-table">
                  <thead className="admin-table-head">
                    <tr className="admin-table-header-row">
                      <th className="admin-table-th px-7">Workers</th>
                      <th className="admin-table-th px-6">Status</th>
                      <th className="admin-table-th px-6">Department</th>
                      <th className="admin-table-th px-6">Late</th>
                      <th className="admin-table-th px-6">Contract</th>
                      <th className="admin-table-th px-6">OKR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && employees.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="admin-table-cell px-10 py-12 text-center text-base text-slate-500"
                        >
                          <span className="inline-flex items-center gap-3">
                            <LoaderCircle className="h-5 w-5 animate-spin" />
                            Loading employees...
                          </span>
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="admin-table-cell px-10 py-12 text-center text-base text-rose-500"
                        >
                          {error.message}
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((employee) => {
                        const lateCount = employee.lateDates.length;

                        return (
                          <tr
                            key={employee.id}
                            onClick={() => setDetailEmployeeId(employee.id)}
                            className="cursor-pointer transition hover:bg-slate-50/70"
                          >
                            <td className="admin-table-cell px-7 py-4">
                              <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-[1.15rem] font-medium text-slate-900">
                                  {getInitials(employee.name)}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-[1rem] font-semibold text-slate-900">
                                    {employee.name}
                                  </p>
                                  <p className="truncate text-[0.95rem] text-slate-500">
                                    {employee.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="admin-table-cell px-6 py-4 text-[1rem] text-slate-900">
                              {employee.status}
                            </td>
                            <td className="admin-table-cell px-6 py-4 text-[1rem] text-slate-900">
                              {employee.roleLabel}
                            </td>
                            <td className="admin-table-cell px-6 py-4">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setLateDialogEmployeeId(employee.id);
                                  setPendingLateAction(null);
                                }}
                                className={cn(
                                  "inline-flex min-w-9 cursor-pointer items-center justify-center rounded-2xl px-3 py-1.5 text-[1rem] font-medium transition hover:opacity-85",
                                  getLateClasses(lateCount),
                                )}
                              >
                                {lateCount}
                              </button>
                            </td>
                            <td className="admin-table-cell px-6 py-4 text-[1rem] text-slate-900">
                              {employee.contract}
                            </td>
                            <td className="admin-table-cell px-6 py-4">
                              <div className="relative inline-flex">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setOpenOkrMenuId((currentValue) =>
                                      currentValue === employee.id
                                        ? null
                                        : employee.id,
                                    );
                                  }}
                                  className={cn(
                                    "inline-flex min-w-49 cursor-pointer items-center justify-between gap-3 rounded-md px-5 py-3 text-[1rem] font-medium",
                                    getOkrClasses(employee.okr),
                                  )}
                                >
                                  <span>{employee.okr}</span>
                                  <ChevronUp
                                    className={cn(
                                      "h-5 w-5 text-slate-900 transition-transform",
                                      openOkrMenuId === employee.id
                                        ? "rotate-0"
                                        : "rotate-180",
                                    )}
                                  />
                                </button>

                                {openOkrMenuId === employee.id ? (
                                  <div
                                    className="absolute top-full left-0 z-20 mt-1 min-w-49 overflow-hidden rounded-sm border border-stone-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.12)]"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    {(
                                      [
                                        "Success",
                                        "Submitted",
                                        "Failed",
                                      ] as OkrStatus[]
                                    ).map((status) => (
                                      <button
                                        key={status}
                                        type="button"
                                        onClick={async () => {
                                          await updateEmployeeOkr(
                                            employee.id,
                                            status,
                                          );
                                          setOpenOkrMenuId(null);
                                        }}
                                        className={cn(
                                          "flex w-full cursor-pointer items-center bg-white px-5 py-3 text-left text-[1rem] font-medium transition hover:bg-stone-50",
                                          getOkrClasses(status),
                                        )}
                                      >
                                        {status}
                                      </button>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                    {!loading && !error && filteredEmployees.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="admin-table-cell px-10 py-12 text-center text-base text-slate-500"
                        >
                          No employees matched this filter.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {selectedEmployee ? (
        <div
          className="fixed inset-y-0 left-0 right-0 z-40 bg-gray-900/25 md:left-60"
          onClick={closeLateDialogs}
        />
      ) : null}

      {selectedEmployee && !pendingLateAction ? (
        <div
          className="fixed inset-y-0 left-0 right-0 z-50 flex items-center justify-center p-4 md:left-60"
          onClick={closeLateDialogs}
        >
          <div
            className="w-full max-w-88 rounded-[1.6rem] border border-gray-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-[1.05rem] font-semibold text-gray-900">
              Days marked late
            </h3>

            <div className="mt-5 space-y-3">
              {selectedEmployee.lateDates.length > 0 ? (
                selectedEmployee.lateDates.map((date) => (
                  <div
                    key={date}
                    className="flex items-center justify-between gap-4 text-[1.05rem] text-gray-500"
                  >
                    <span>{formatLateDate(date)}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setPendingLateAction({
                          type: "delete",
                          employeeId: selectedEmployee.id,
                          date,
                        })
                      }
                      className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                      aria-label={`Delete late attendance for ${formatLateDate(date)}`}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  No late attendance records yet.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                setPendingLateAction({
                  type: "add",
                  employeeId: selectedEmployee.id,
                })
              }
              className="mt-6 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
              aria-label="Add late attendance"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {pendingLateAction ? (
        <div
          className="fixed inset-y-0 left-0 right-0 z-50 flex items-center justify-center p-4 md:left-60"
          onClick={closeLateDialogs}
        >
          <div
            className="w-full max-w-88 rounded-[1.6rem] border border-gray-200 bg-white px-6 py-7 text-center shadow-[0_18px_60px_rgba(15,23,42,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-[1.05rem] font-medium leading-9 text-gray-900">
              {pendingLateAction.type === "add"
                ? "Mark today's attendance as late?"
                : "Delete this late attendance record?"}
            </p>

            <div className="mt-7 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPendingLateAction(null)}
                className="inline-flex min-w-20 cursor-pointer items-center justify-center rounded-xl border border-gray-200 px-5 py-2 text-base font-medium text-gray-700 transition hover:bg-gray-50"
              >
                No
              </button>
              <button
                type="button"
                onClick={confirmLateAction}
                className="inline-flex min-w-20 cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-5 py-2 text-base font-medium text-white transition hover:bg-blue-700"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {overrideDialog ? (
        <div
          className="fixed inset-0 z-70 bg-slate-950/45 p-4"
          onClick={closeOverrideDialog}
        >
          <div className="flex min-h-full items-center justify-center">
            <div
              className="h-201 w-110.5 overflow-y-auto rounded-[1.7rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_22px_54px_rgba(15,23,42,0.18)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="w-100.5">
                  <h3 className="text-[20px] font-semibold  text-slate-900">
                    Manual Eligibility Override
                  </h3>

                  <p className=" text-[15px] text-slate-500">
                    Force the system to grant or revoke access to{" "}
                    <span className="text-slate-900">
                      {overrideDialog.benefitName}
                    </span>
                    . This action is permanently logged.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeOverrideDialog}
                  className="inline-flex h-4.5 w-4.5 cursor-pointer items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Close override dialog"
                >
                  <X className="h-7 w-7" />
                </button>
              </div>

              <div className="mt-5 w-100.5">
                <label className="mb-2 block text-font/size/sm font-medium text-slate-900">
                  Expiry date
                </label>

                <div className="h-12 w-full rounded-[0.9rem] border border-slate-200 px-4 flex items-center text-[0.95rem] font-medium text-slate-900">
                  {formatSelectedDate(overrideSelectedDate) || "Select date"}
                </div>
              </div>

              <div className="mt-5 w-100.5 border-t border-slate-200 pt-6">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      setOverrideMonth(
                        new Date(
                          overrideMonth.getFullYear(),
                          overrideMonth.getMonth() - 1,
                          1,
                        ),
                      )
                    }
                    className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>

                  <p className="text-[1.15rem] font-semibold text-slate-900">
                    {overrideMonth.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setOverrideMonth(
                        new Date(
                          overrideMonth.getFullYear(),
                          overrideMonth.getMonth() + 1,
                          1,
                        ),
                      )
                    }
                    className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-7 border-t border-slate-200 pt-5 text-center text-[13px] font-semibold text-slate-500">
                  {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
                    <div
                      key={day}
                      className="flex h-8 items-center justify-center"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-7 gap-y-4 text-center text-[13px]">
                  {calendarDays.map((day, index) => {
                    const cellDate =
                      day === null
                        ? null
                        : new Date(
                            overrideMonth.getFullYear(),
                            overrideMonth.getMonth(),
                            day,
                          );

                    const selected = isSameDay(cellDate, overrideSelectedDate);

                    return (
                      <div
                        key={`${day}-${index}`}
                        className="flex justify-center"
                      >
                        {day === null ? (
                          <div className="h-12 w-12" />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setOverrideSelectedDate(cellDate)}
                            disabled={overridePermanent}
                            className={cn(
                              "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[1rem] font-medium transition",
                              selected
                                ? "bg-blue-600 text-white"
                                : "text-slate-700 hover:bg-slate-100",
                              overridePermanent &&
                                "cursor-not-allowed opacity-40 hover:bg-transparent",
                            )}
                          >
                            {day}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-5 w-100.5 space-y-3">
                <p className="text-font/size/sm font-semibold text-slate-900">
                  No expiry (permanent override)
                </p>

                <label className="flex cursor-pointer items-start gap-3 text-font/size/sm text-slate-900">
                  <input
                    type="checkbox"
                    checked={overridePermanent}
                    onChange={(event) =>
                      setOverridePermanent(event.target.checked)
                    }
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                  <span className="leading-snug">
                    This override will not expire automatically.
                  </span>
                </label>
              </div>
              <div className="mt-5 w-100.5 space-y-3">
                <label
                  htmlFor="override-justification"
                  className="block text-font/size/sm font-semibold text-slate-900"
                >
                  Justification
                </label>

                <textarea
                  id="override-justification"
                  value={overrideJustification}
                  onChange={(event) =>
                    setOverrideJustification(event.target.value)
                  }
                  placeholder="Due to current team priorities, access to UX Engineer tools has been approved. You may proceed with using the tools as needed."
                  rows={4}
                  className=" w-full h-20 rounded-[1.1rem] border border-blue-500 px-2 py-2 text-font/size/sm leading-8 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600"
                />
              </div>
              <div className="mt-5 w-100.5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeOverrideDialog}
                  className="inline-flex h-9 cursor-pointer items-center justify-center rounded-[0.9rem] border border-slate-200 px-5 text-[0.95rem] font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveOverride}
                  disabled={savingOverride}
                  className="inline-flex h-9 cursor-pointer items-center justify-center rounded-[0.9rem] bg-blue-600 px-5 text-[0.95rem] font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingOverride ? "Saving..." : "Save Override"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {successMessage ? (
        <div className="pointer-events-none fixed right-6 bottom-6 z-60">
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-[0_18px_44px_rgba(15,23,42,0.12)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-700">Success</p>
              <p className="text-sm text-gray-600">{successMessage}</p>
            </div>
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="pointer-events-none fixed right-6 bottom-6 z-60">
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-white px-4 py-3 shadow-[0_18px_44px_rgba(15,23,42,0.12)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <X className="h-4 w-4" />
            </div>
            <div className="max-w-[18rem] text-sm text-slate-700">
              {errorMessage}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
