"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, ChevronUp, Minus, Plus, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DepartmentFilter =
  | "all"
  | "development"
  | "designer"
  | "marketing"
  | "backoffice";
type OkrStatus = "Success" | "Submitted" | "Failed";
type BenefitStatus = "Active" | "Available" | "Pending" | "Not Yet Available";

interface EmployeeBenefit {
  name: string;
  status: BenefitStatus;
  reason: string;
  contractLabel: string;
}

interface EmployeeItem {
  name: string;
  email: string;
  status: "Active";
  department: Exclude<DepartmentFilter, "all">;
  roleLabel: string;
  okr: OkrStatus;
  lateDates: string[];
  contract: string;
  responsibilityLevel: number;
  benefits: EmployeeBenefit[];
}

const departmentFilters: Array<{ label: string; value: DepartmentFilter }> = [
  { label: "All", value: "all" },
  { label: "Development", value: "development" },
  { label: "Designer", value: "designer" },
  { label: "Marketing", value: "marketing" },
  { label: "Backoffice", value: "backoffice" },
];

const defaultBenefits: EmployeeBenefit[] = [
  {
    name: "Gym - Pinefit",
    status: "Active",
    reason: "Approved Oct 20, 2025",
    contractLabel: "Gym - PineFit PDF",
  },
  {
    name: "Remote Work",
    status: "Active",
    reason: "Approved Oct 20, 2025",
    contractLabel: "-",
  },
  {
    name: "Digital Wellness",
    status: "Active",
    reason: "Auto (core)",
    contractLabel: "Gym - PineFit PDF",
  },
  {
    name: "Down Payment Assistance",
    status: "Available",
    reason: "All eligibility rules met",
    contractLabel: "Gym - PineFit PDF",
  },
  {
    name: "Notebook",
    status: "Pending",
    reason: "Under manager review",
    contractLabel: "Gym - PineFit PDF",
  },
  {
    name: "Housing Support",
    status: "Not Yet Available",
    reason: "Eligibility period not reached",
    contractLabel: "Gym - PineFit PDF",
  },
];

const initialEmployees: EmployeeItem[] = [
  {
    name: "Болд Батбаяр",
    email: "bold@pinequest.mn",
    status: "Active",
    department: "development",
    roleLabel: "Developer",
    okr: "Success",
    lateDates: ["2025-10-20"],
    contract: "Oct 20, 2025",
    responsibilityLevel: 2,
    benefits: defaultBenefits,
  },
  {
    name: "Саран Дорж",
    email: "saran@pinequest.mn",
    status: "Active",
    department: "development",
    roleLabel: "Developer",
    okr: "Submitted",
    lateDates: [],
    contract: "Nov 12, 2025",
    responsibilityLevel: 1,
    benefits: defaultBenefits,
  },
  {
    name: "Тэмүүлэн Ганбат",
    email: "temuulen@pinequest.mn",
    status: "Active",
    department: "development",
    roleLabel: "Developer",
    okr: "Success",
    lateDates: ["2024-03-17", "2026-03-11"],
    contract: "Mar 17, 2024",
    responsibilityLevel: 2,
    benefits: defaultBenefits,
  },
  {
    name: "Оюунаа Батсүх",
    email: "oyunaa@pinequest.mn",
    status: "Active",
    department: "development",
    roleLabel: "Developer",
    okr: "Failed",
    lateDates: ["2024-06-23", "2024-10-09", "2025-08-14", "2026-02-18"],
    contract: "Jun 23, 2024",
    responsibilityLevel: 3,
    benefits: defaultBenefits,
  },
  {
    name: "Номин Эрдэнэ",
    email: "nomin@pinequest.mn",
    status: "Active",
    department: "development",
    roleLabel: "Frontend Developer",
    okr: "Success",
    lateDates: [],
    contract: "Jan 14, 2026",
    responsibilityLevel: 1,
    benefits: defaultBenefits,
  },
  {
    name: "Ануужин Төгөлдөр",
    email: "anujin@pinequest.mn",
    status: "Active",
    department: "designer",
    roleLabel: "Product Designer",
    okr: "Success",
    lateDates: ["2025-09-02"],
    contract: "Sep 2, 2025",
    responsibilityLevel: 2,
    benefits: defaultBenefits,
  },
  {
    name: "Энхбаяр Мөнх",
    email: "enkhbayar@pinequest.mn",
    status: "Active",
    department: "marketing",
    roleLabel: "Marketing Lead",
    okr: "Submitted",
    lateDates: [],
    contract: "Aug 11, 2025",
    responsibilityLevel: 3,
    benefits: defaultBenefits,
  },
  {
    name: "Гэрэлмаа Сүх",
    email: "gerelmaa@pinequest.mn",
    status: "Active",
    department: "backoffice",
    roleLabel: "HR Operations",
    okr: "Success",
    lateDates: ["2024-12-18"],
    contract: "Dec 18, 2024",
    responsibilityLevel: 2,
    benefits: defaultBenefits,
  },
];

type PendingLateAction =
  | { type: "add"; employeeEmail: string }
  | { type: "delete"; employeeEmail: string; date: string };

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
      return "text-emerald-600";
    case "Available":
      return "text-blue-600";
    case "Pending":
      return "text-amber-500";
    case "Not Yet Available":
      return "text-stone-500";
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

function getTodayDateKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function EmployeesBoard() {
  const [employees, setEmployees] = useState(initialEmployees);
  const [search, setSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] =
    useState<DepartmentFilter>("development");
  const [detailEmployeeEmail, setDetailEmployeeEmail] = useState<string | null>(
    null,
  );
  const [openOkrMenuEmail, setOpenOkrMenuEmail] = useState<string | null>(null);
  const [lateDialogEmployeeEmail, setLateDialogEmployeeEmail] = useState<
    string | null
  >(null);
  const [pendingLateAction, setPendingLateAction] =
    useState<PendingLateAction | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    if (!openOkrMenuEmail) {
      return;
    }

    function handleWindowClick() {
      setOpenOkrMenuEmail(null);
    }

    window.addEventListener("click", handleWindowClick);

    return () => window.removeEventListener("click", handleWindowClick);
  }, [openOkrMenuEmail]);

  const filteredEmployees = employees.filter((employee) => {
    const matchesDepartment =
      selectedDepartment === "all" ||
      employee.department === selectedDepartment;
    const keyword = search.trim().toLowerCase();
    const matchesSearch =
      keyword.length === 0 ||
      employee.name.toLowerCase().includes(keyword) ||
      employee.email.toLowerCase().includes(keyword);

    return matchesDepartment && matchesSearch;
  });

  const detailEmployee = detailEmployeeEmail
    ? (employees.find((employee) => employee.email === detailEmployeeEmail) ??
      null)
    : null;

  const selectedEmployee = lateDialogEmployeeEmail
    ? (employees.find((employee) => employee.email === lateDialogEmployeeEmail) ??
      null)
    : null;

  function closeLateDialogs() {
    setLateDialogEmployeeEmail(null);
    setPendingLateAction(null);
  }

  function updateEmployeeOkr(employeeEmail: string, okr: OkrStatus) {
    setEmployees((currentEmployees) =>
      currentEmployees.map((employee) =>
        employee.email === employeeEmail ? { ...employee, okr } : employee,
      ),
    );
  }

  function confirmLateAction() {
    if (!pendingLateAction) {
      return;
    }

    const todayDate = getTodayDateKey();

    setEmployees((currentEmployees) =>
      currentEmployees.map((employee) => {
        if (employee.email !== pendingLateAction.employeeEmail) {
          return employee;
        }

        if (pendingLateAction.type === "add") {
          if (employee.lateDates.includes(todayDate)) {
            return employee;
          }

          return {
            ...employee,
            lateDates: [...employee.lateDates, todayDate].sort(),
          };
        }

        return {
          ...employee,
          lateDates: employee.lateDates.filter(
            (date) => date !== pendingLateAction.date,
          ),
        };
      }),
    );

    setSuccessMessage(
      pendingLateAction.type === "add"
        ? "Late attendance marked successfully."
        : "Late attendance removed successfully.",
    );
    closeLateDialogs();
  }

  return (
    <>
      {detailEmployee ? (
        <section className="w-full space-y-8">
          <button
            type="button"
            onClick={() => setDetailEmployeeEmail(null)}
            className="inline-flex items-center gap-3 text-[1.05rem] font-medium text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to employees
          </button>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
            <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
              <div className="flex items-center gap-4 border-b border-slate-200 pb-6 xl:border-r xl:border-b-0 xl:pb-0 xl:pr-6">
                <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-stone-100 text-[1.6rem] font-medium text-slate-900">
                  {getInitials(detailEmployee.name)}
                </div>
                <div>
                  <h2 className="text-[1.8rem] font-semibold text-slate-900">
                    {detailEmployee.name}
                  </h2>
                  <p className="text-[1.15rem] text-slate-500">
                    {detailEmployee.roleLabel}
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.03em] text-slate-500">
                    Employment
                  </p>
                  <p className="mt-2 text-[1rem] font-medium text-slate-900">
                    {detailEmployee.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.03em] text-slate-500">
                    OKR
                  </p>
                  <p className={cn("mt-2 text-[1rem] font-medium", getOkrClasses(detailEmployee.okr))}>
                    {detailEmployee.okr}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.03em] text-slate-500">
                    Attendance
                  </p>
                  <p className="mt-2 text-[1rem] font-medium text-slate-900">
                    {detailEmployee.lateDates.length}/3 lates
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.03em] text-slate-500">
                    Responsibility
                  </p>
                  <p className="mt-2 text-[1rem] font-medium text-slate-900">
                    Level {detailEmployee.responsibilityLevel}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.03em] text-slate-500">
                    Hired
                  </p>
                  <p className="mt-2 text-[1rem] font-medium text-slate-900">
                    {detailEmployee.contract}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[0.95rem] uppercase tracking-[0.03em] text-slate-500">
                    <th className="px-6 py-6 font-medium">Benefits</th>
                    <th className="px-6 py-6 font-medium">Status</th>
                    <th className="px-6 py-6 font-medium">Reason</th>
                    <th className="px-6 py-6 font-medium">Contract</th>
                    <th className="px-6 py-6 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {detailEmployee.benefits.map((benefit) => (
                    <tr
                      key={`${detailEmployee.email}-${benefit.name}`}
                      className="border-b border-slate-200 last:border-b-0"
                    >
                      <td className="px-6 py-5 text-[1rem] font-medium text-slate-900">
                        {benefit.name}
                      </td>
                      <td className="px-6 py-5">
                        <div className={cn("inline-flex items-center gap-2 text-[1rem] font-medium", getBenefitStatusClasses(benefit.status))}>
                          <span className="h-2.5 w-2.5 rounded-full bg-current" />
                          {benefit.status}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-[1rem] text-slate-900">
                        {benefit.reason}
                      </td>
                      <td className="px-6 py-5 text-[1rem] text-slate-900">
                        {benefit.contractLabel}
                      </td>
                      <td className="px-6 py-5">
                        <button
                          type="button"
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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

            <div className="relative w-full xl:max-w-[27rem]">
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
                    "relative -mb-px border-b-2 px-4 pb-4 text-[1.05rem] font-medium transition",
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

            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[0.95rem] uppercase tracking-[0.03em] text-slate-500">
                      <th className="px-7 py-6 font-medium">Workers</th>
                      <th className="px-6 py-6 font-medium">Status</th>
                      <th className="px-6 py-6 font-medium">Department</th>
                      <th className="px-6 py-6 font-medium">Late</th>
                      <th className="px-6 py-6 font-medium">Contract</th>
                      <th className="px-6 py-6 font-medium">OKR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((employee) => {
                      const lateCount = employee.lateDates.length;

                      return (
                        <tr
                          key={employee.email}
                          onClick={() => setDetailEmployeeEmail(employee.email)}
                          className="cursor-pointer border-b border-slate-200 transition hover:bg-slate-50/70 last:border-b-0"
                        >
                          <td className="px-7 py-4">
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
                          <td className="px-6 py-4 text-[1rem] text-slate-900">
                            {employee.status}
                          </td>
                          <td className="px-6 py-4 text-[1rem] text-slate-900">
                            {employee.roleLabel}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setLateDialogEmployeeEmail(employee.email);
                                setPendingLateAction(null);
                              }}
                              className={cn(
                                "inline-flex min-w-9 items-center justify-center rounded-2xl px-3 py-1.5 text-[1rem] font-medium transition hover:opacity-85",
                                getLateClasses(lateCount),
                              )}
                            >
                              {lateCount}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-[1rem] text-slate-900">
                            {employee.contract}
                          </td>
                          <td className="px-6 py-4">
                            <div className="relative inline-flex">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setOpenOkrMenuEmail((currentValue) =>
                                    currentValue === employee.email
                                      ? null
                                      : employee.email,
                                  );
                                }}
                                className={cn(
                                  "inline-flex min-w-[12.25rem] items-center justify-between gap-3 rounded-md bg-stone-50 px-5 py-3 text-[1rem] font-medium",
                                  getOkrClasses(employee.okr),
                                )}
                              >
                                <span>{employee.okr}</span>
                                <ChevronUp
                                  className={cn(
                                    "h-5 w-5 text-slate-900 transition-transform",
                                    openOkrMenuEmail === employee.email
                                      ? "rotate-0"
                                      : "rotate-180",
                                  )}
                                />
                              </button>

                              {openOkrMenuEmail === employee.email ? (
                                <div
                                  className="absolute top-full left-0 z-20 mt-1 min-w-[12.25rem] overflow-hidden rounded-sm border border-stone-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.12)]"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  {(
                                    ["Success", "Submitted", "Failed"] as OkrStatus[]
                                  ).map((status) => (
                                    <button
                                      key={status}
                                      type="button"
                                      onClick={() => {
                                        updateEmployeeOkr(employee.email, status);
                                        setOpenOkrMenuEmail(null);
                                      }}
                                      className={cn(
                                        "flex w-full items-center bg-white px-5 py-3 text-left text-[1rem] font-medium transition hover:bg-stone-50",
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
                    })}
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-10 py-12 text-center text-base text-slate-500"
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
            className="w-full max-w-[22rem] rounded-[1.6rem] border border-gray-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.18)]"
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
                          employeeEmail: selectedEmployee.email,
                          date,
                        })
                      }
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
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
                  employeeEmail: selectedEmployee.email,
                })
              }
              className="mt-6 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
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
            className="w-full max-w-[22rem] rounded-[1.6rem] border border-gray-200 bg-white px-6 py-7 text-center shadow-[0_18px_60px_rgba(15,23,42,0.18)]"
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
                className="inline-flex min-w-20 items-center justify-center rounded-xl border border-gray-200 px-5 py-2 text-base font-medium text-gray-700 transition hover:bg-gray-50"
              >
                No
              </button>
              <button
                type="button"
                onClick={confirmLateAction}
                className="inline-flex min-w-20 items-center justify-center rounded-xl bg-blue-600 px-5 py-2 text-base font-medium text-white transition hover:bg-blue-700"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {successMessage ? (
        <div className="pointer-events-none fixed right-6 bottom-6 z-[60]">
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
    </>
  );
}
