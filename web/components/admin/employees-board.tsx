"use client";

import { useState } from "react";
import { Search } from "lucide-react";

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
  late: number;
  contract: string;
}

const departmentFilters: Array<{ label: string; value: DepartmentFilter }> = [
  { label: "All", value: "all" },
  { label: "Development", value: "development" },
  { label: "Designer", value: "designer" },
  { label: "Marketing", value: "marketing" },
  { label: "Backoffice", value: "backoffice" },
];

const employees: EmployeeItem[] = [
  {
    name: "Болд Батбаяр",
    email: "bold@pinequest.mn",
    status: "Active",
    department: "development",
    roleLabel: "Developer",
    okr: "Success",
    late: 1,
    contract: "Oct 20, 2025",
  },
  {
    name: "Саран Дорж",
    email: "saran@pinequest.mn",
    status: "Active",
    department: "development",
    roleLabel: "Developer",
    okr: "Submitted",
    late: 0,
    contract: "Nov 12, 2025",
  },
  {
    name: "Тэмүүлэн Ганбат",
    email: "temuulen@pinequest.mn",
    status: "Active",
    department: "development",
    roleLabel: "Developer",
    okr: "Success",
    late: 2,
    contract: "Mar 17, 2024",
  },
  {
    name: "Оюунаа Батсүх",
    email: "oyunaa@pinequest.mn",
    status: "Active",
    department: "development",
    roleLabel: "Developer",
    okr: "Failed",
    late: 4,
    contract: "Jun 23, 2024",
  },
  {
    name: "Номин Эрдэнэ",
    email: "nomin@pinequest.mn",
    status: "Active",
    department: "development",
    roleLabel: "Frontend Developer",
    okr: "Success",
    late: 0,
    contract: "Jan 14, 2026",
  },
  {
    name: "Ануужин Төгөлдөр",
    email: "anujin@pinequest.mn",
    status: "Active",
    department: "designer",
    roleLabel: "Product Designer",
    okr: "Success",
    late: 1,
    contract: "Sep 2, 2025",
  },
  {
    name: "Энхбаяр Мөнх",
    email: "enkhbayar@pinequest.mn",
    status: "Active",
    department: "marketing",
    roleLabel: "Marketing Lead",
    okr: "Submitted",
    late: 0,
    contract: "Aug 11, 2025",
  },
  {
    name: "Гэрэлмаа Сүх",
    email: "gerelmaa@pinequest.mn",
    status: "Active",
    department: "backoffice",
    roleLabel: "HR Operations",
    okr: "Success",
    late: 1,
    contract: "Dec 18, 2024",
  },
];

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

export default function EmployeesBoard() {
  const [search, setSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] =
    useState<DepartmentFilter>("development");

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

  return (
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
                {filteredEmployees.map((employee) => (
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
                      <span
                        className={cn(
                          "inline-flex min-w-8 items-center justify-center rounded-xl px-2.5 py-1 text-sm font-medium",
                          getLateClasses(employee.late),
                        )}
                      >
                        {employee.late}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-[1.05rem] text-gray-900">
                      {employee.contract}
                    </td>
                  </tr>
                ))}
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
  );
}
