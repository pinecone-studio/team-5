"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

type OkrStatus = "Success" | "Submitted" | "Failed";
type Department = "Development" | "Designer" | "Marketing" | "Backoffice";

type Employee = {
  id: number;
  name: string;
  email: string;
  status: "Active" | "Inactive";
  department: Department;
  role: string;
  okr: OkrStatus;
  late: number;
  contractDate: string;
};

const DEPARTMENTS: Array<Department | "All"> = [
  "All",
  "Development",
  "Designer",
  "Marketing",
  "Backoffice",
];

const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 1,
    name: "Болд Батбаяр",
    email: "bold@pinequest.mn",
    status: "Active",
    department: "Development",
    role: "Developer",
    okr: "Success",
    late: 1,
    contractDate: "Oct 20, 2025",
  },
  {
    id: 2,
    name: "Саран Дорж",
    email: "saran@pinequest.mn",
    status: "Active",
    department: "Development",
    role: "Developer",
    okr: "Submitted",
    late: 0,
    contractDate: "Nov 12, 2025",
  },
  {
    id: 3,
    name: "Тэмүүлэн Ганбат",
    email: "temuulen@pinequest.mn",
    status: "Active",
    department: "Development",
    role: "Developer",
    okr: "Success",
    late: 2,
    contractDate: "Mar 17, 2024",
  },
  {
    id: 4,
    name: "Оюунаа Батсүх",
    email: "oyunaa@pinequest.mn",
    status: "Active",
    department: "Development",
    role: "Developer",
    okr: "Failed",
    late: 4,
    contractDate: "Jun 23, 2024",
  },
  {
    id: 5,
    name: "Мөнхтулга Эрдэнэ",
    email: "munkhtulga@pinequest.mn",
    status: "Active",
    department: "Development",
    role: "Developer",
    okr: "Success",
    late: 1,
    contractDate: "Jan 08, 2026",
  },
];

const okrBadgeClass: Record<OkrStatus, string> = {
  Success: "bg-emerald-100 text-emerald-800",
  Submitted: "bg-amber-100 text-amber-800",
  Failed: "bg-rose-100 text-rose-700",
};
const OKR_OPTIONS: OkrStatus[] = ["Success", "Submitted", "Failed"];

export default function AdminUsersPage() {
  const [selectedDepartment, setSelectedDepartment] =
    useState<(typeof DEPARTMENTS)[number]>("Development");
  const [search, setSearch] = useState("");
  const [employeeRows, setEmployeeRows] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [openOkrMenuFor, setOpenOkrMenuFor] = useState<number | null>(null);

  const employees = useMemo(() => {
    return employeeRows.filter((employee) => {
      const matchesDepartment =
        selectedDepartment === "All" ||
        employee.department === selectedDepartment;
      const normalized = search.trim().toLowerCase();
      const matchesSearch =
        normalized.length === 0 ||
        employee.name.toLowerCase().includes(normalized) ||
        employee.email.toLowerCase().includes(normalized);
      return matchesDepartment && matchesSearch;
    });
  }, [employeeRows, search, selectedDepartment]);

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Ажилтнуудын жагсаалт
          </h1>
          <p className="mt-1 text-muted-foreground">
            Бүх ажилтнуудын давуу эрхийн төлөв харах, өөрчлөлт
          </p>
        </div>
        <label className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="h-11 w-full rounded-xl border border-border bg-background pr-4 pl-9 text-sm outline-none focus:border-ring"
            placeholder="Search employees..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-border md:grid-cols-5">
        {DEPARTMENTS.map((item) => {
          const active = item === selectedDepartment;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setSelectedDepartment(item)}
              className={`h-12 text-sm font-medium transition ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "bg-background text-foreground hover:bg-muted"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        <h2 className="text-3xl font-semibold">{employees.length} Employees</h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid grid-cols-12 border-b border-border px-6 py-4 text-sm font-semibold text-muted-foreground">
            <div className="col-span-4">Workers</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Department</div>
            <div className="col-span-2">OKR</div>
            <div className="col-span-1">Late</div>
            <div className="col-span-1">Contract</div>
          </div>

          {employees.map((employee) => (
            <div
              key={employee.id}
              className="grid grid-cols-12 items-center border-b border-border px-6 py-4 last:border-b-0"
            >
              <div className="col-span-4 flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-muted" />
                <div>
                  <p className="font-semibold">{employee.name}</p>
                  <p className="text-muted-foreground">{employee.email}</p>
                </div>
              </div>
              <div className="col-span-2 text-base">{employee.status}</div>
              <div className="col-span-2 text-base">{employee.role}</div>
              <div className="col-span-2">
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenOkrMenuFor((prev) =>
                        prev === employee.id ? null : employee.id,
                      )
                    }
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${okrBadgeClass[employee.okr]}`}
                  >
                    {employee.okr}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>

                  {openOkrMenuFor === employee.id ? (
                    <div className="absolute top-10 left-0 z-20 min-w-36 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
                      {OKR_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setEmployeeRows((prev) =>
                              prev.map((row) =>
                                row.id === employee.id
                                  ? { ...row, okr: option }
                                  : row,
                              ),
                            );
                            setOpenOkrMenuFor(null);
                          }}
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="col-span-1">
                <span
                  className={`rounded-lg px-2 py-1 text-sm font-semibold ${
                    employee.late > 2
                      ? "bg-rose-100 text-rose-700"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {employee.late}
                </span>
              </div>
              <div className="col-span-1 text-base">
                {employee.contractDate}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
