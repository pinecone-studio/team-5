"use client";

import { useEffect, useState } from "react";
import { Check, Minus, Plus, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DepartmentFilter =
  | "all"
  | "development"
  | "designer"
  | "marketing"
  | "backoffice";
type OkrStatus = "Success" | "Submitted" | "Failed";

interface EmployeeItem {
  name: string;
  email: string;
  status: "Active";
  department: Exclude<DepartmentFilter, "all">;
  roleLabel: string;
  okr: OkrStatus;
  lateDates: string[];
  contract: string;
}

const departmentFilters: Array<{ label: string; value: DepartmentFilter }> = [
  { label: "All", value: "all" },
  { label: "Development", value: "development" },
  { label: "Designer", value: "designer" },
  { label: "Marketing", value: "marketing" },
  { label: "Backoffice", value: "backoffice" },
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
  },
];

type PendingLateAction =
  | { type: "add"; employeeEmail: string }
  | { type: "delete"; employeeEmail: string; date: string };

function getOkrClasses(status: OkrStatus) {
  switch (status) {
    case "Success":
      return "bg-green-100 text-green-800";
    case "Submitted":
      return "bg-amber-100 text-amber-800";
    case "Failed":
      return "bg-red-100 text-red-700";
  }
}

function getLateClasses(value: number) {
  return value >= 4 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700";
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
  const [selectedEmployeeEmail, setSelectedEmployeeEmail] = useState<
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

  const selectedEmployee = selectedEmployeeEmail
    ? (employees.find((employee) => employee.email === selectedEmployeeEmail) ??
      null)
    : null;

  function closeLateDialogs() {
    setSelectedEmployeeEmail(null);
    setPendingLateAction(null);
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
      <section className="w-full space-y-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Employee list
            </h2>
            <p className="mt-2 text-base text-gray-500">
              View and edit all employees&apos; privileges.
            </p>
          </div>

          <div className="relative w-full xl:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employees..."
              className="h-12 rounded-xl border-gray-200 bg-white pl-12 pr-4 text-base placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-1.5">
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 xl:grid-cols-5">
            {departmentFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setSelectedDepartment(filter.value)}
                className={cn(
                  "min-h-12 rounded-xl px-4 py-3 text-center text-base font-medium transition",
                  selectedDepartment === filter.value
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-900 hover:bg-gray-50",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[1.7rem] font-semibold text-gray-900">
            {filteredEmployees.length} Employees
          </h3>

          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-base text-gray-900">
                    <th className="px-10 py-6 font-medium">Workers</th>
                    <th className="px-6 py-6 font-medium">Status</th>
                    <th className="px-6 py-6 font-medium">Department</th>
                    <th className="px-6 py-6 font-medium">OKR</th>
                    <th className="px-6 py-6 font-medium">Late</th>
                    <th className="px-6 py-6 font-medium">Contract</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => {
                    const lateCount = employee.lateDates.length;

                    return (
                      <tr
                        key={employee.email}
                        className="border-b border-gray-200 last:border-b-0"
                      >
                        <td className="px-10 py-5">
                          <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-500">
                              {getInitials(employee.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[1.05rem] font-medium text-gray-900">
                                {employee.name}
                              </p>
                              <p className="truncate text-sm text-gray-500">
                                {employee.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-[1.05rem] text-gray-900">
                          {employee.status}
                        </td>
                        <td className="px-6 py-5 text-[1.05rem] text-gray-900">
                          {employee.roleLabel}
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-3.5 py-1.5 text-sm font-medium",
                              getOkrClasses(employee.okr),
                            )}
                          >
                            {employee.okr}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEmployeeEmail(employee.email);
                              setPendingLateAction(null);
                            }}
                            className={cn(
                              "inline-flex min-w-8 items-center justify-center rounded-xl px-2.5 py-1 text-sm font-medium transition hover:opacity-85",
                              getLateClasses(lateCount),
                            )}
                          >
                            {lateCount}
                          </button>
                        </td>
                        <td className="px-6 py-5 text-[1.05rem] text-gray-900">
                          {employee.contract}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-10 py-12 text-center text-base text-gray-500"
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
