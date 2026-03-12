"use client"

import { useState } from "react"

const employees = [
  {
    name: "Болд Батбаяр",
    email: "bold@pinequest.mn",
    status: "Active",
    department: "Developer",
    okr: "Success",
    late: 1,
    contract: "Oct 20, 2025",
  },
  {
    name: "Саран Дорж",
    email: "saran@pinequest.mn",
    status: "Active",
    department: "Developer",
    okr: "Submitted",
    late: 0,
    contract: "Nov 12, 2025",
  },
  {
    name: "Тэмүүлэн Ганбат",
    email: "temuulen@pinequest.mn",
    status: "Active",
    department: "Developer",
    okr: "Success",
    late: 2,
    contract: "Mar 17, 2024",
  },
  {
    name: "Оюунаа Батсүх",
    email: "oyunaa@pinequest.mn",
    status: "Active",
    department: "Developer",
    okr: "Failed",
    late: 4,
    contract: "Jun 23, 2024",
  },
]

export default function EmployeesPage() {
  const [search, setSearch] = useState("")

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  const okrColor = (okr: string) => {
    if (okr === "Success") return "bg-green-100 text-green-700"
    if (okr === "Submitted") return "bg-yellow-100 text-yellow-700"
    return "bg-red-100 text-red-700"
  }

  return (
    <div className="p-10 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-semibold">Employee list</h1>
          <p className="text-sm text-gray-500">
            View and edit all employees’ privileges.
          </p>
        </div>

        <input
          placeholder="Search employees..."
          className="border rounded-lg px-4 py-2 text-sm w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mt-6">
        {["All", "Development", "Designer", "Marketing", "Backoffice"].map(
          (tab) => (
            <button
              key={tab}
              className="px-4 py-2 rounded-full text-sm bg-white border hover:bg-gray-100"
            >
              {tab}
            </button>
          )
        )}
      </div>

      <p className="text-sm text-gray-500 mt-6">
        {filtered.length} Employees
      </p>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-gray-500 border-b">
            <tr>
              <th className="text-left p-4">Workers</th>
              <th className="text-left">Status</th>
              <th className="text-left">Department</th>
              <th className="text-left">OKR</th>
              <th className="text-left">Late</th>
              <th className="text-left">Contract</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((emp, i) => (
              <tr key={i} className="border-b last:border-none">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div>
                      <p className="font-medium">{emp.name}</p>
                      <p className="text-xs text-gray-500">{emp.email}</p>
                    </div>
                  </div>
                </td>

                <td>{emp.status}</td>

                <td>{emp.department}</td>

                <td>
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${okrColor(
                      emp.okr
                    )}`}
                  >
                    {emp.okr}
                  </span>
                </td>

                <td>
                  <span className="bg-gray-100 px-2 py-1 rounded-md">
                    {emp.late}
                  </span>
                </td>

                <td>{emp.contract}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
