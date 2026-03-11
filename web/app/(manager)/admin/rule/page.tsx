"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { benefits } from "@/lib/mock-data";
import { Plus, Pencil, X } from "lucide-react";

interface Rule {
  id: number;
  type: string;
  condition: string;
  failMessage: string;
}

const mockRules: Record<string, Rule[]> = {
  gym_pinefit: [
    {
      id: 1,
      type: "Employment Status",
      condition: "status = active",
      failMessage: "Must be an active employee",
    },
    {
      id: 2,
      type: "OKR Submitted",
      condition: "okr_submitted = true",
      failMessage: "Must submit current quarter OKR",
    },
    {
      id: 3,
      type: "Attendance",
      condition: "late_arrivals < 3",
      failMessage: "Must have fewer than 3 late arrivals",
    },
  ],
  private_insurance: [
    {
      id: 1,
      type: "Employment Status",
      condition: "status = active",
      failMessage: "Must be an active employee",
    },
    {
      id: 2,
      type: "OKR Submitted",
      condition: "okr_submitted = true",
      failMessage: "Must submit current quarter OKR",
    },
    {
      id: 3,
      type: "Attendance",
      condition: "late_arrivals < 3",
      failMessage: "Must have fewer than 3 late arrivals",
    },
  ],
  macbook: [
    {
      id: 1,
      type: "Employment Status",
      condition: "status = active",
      failMessage: "Must be an active employee",
    },
    {
      id: 2,
      type: "OKR Submitted",
      condition: "okr_submitted = true",
      failMessage: "Must submit current quarter OKR",
    },
    {
      id: 3,
      type: "Tenure",
      condition: "tenure >= 180 days",
      failMessage: "Must have at least 6 months tenure",
    },
  ],
  remote_work: [
    {
      id: 1,
      type: "Employment Status",
      condition: "status = active",
      failMessage: "Must be an active employee",
    },
    {
      id: 2,
      type: "OKR Submitted",
      condition: "okr_submitted = true",
      failMessage: "Must submit current quarter OKR",
    },
    {
      id: 3,
      type: "Attendance",
      condition: "late_arrivals < 3",
      failMessage: "Must have fewer than 3 late arrivals",
    },
  ],
};

export default function RulesPage() {
  const [selectedBenefitId, setSelectedBenefitId] = useState(benefits[0].id);

  const selectedBenefit = benefits.find((b) => b.id === selectedBenefitId)!;
  const rules = mockRules[selectedBenefitId] ?? [];

  return (
    <div>
      <Header
        title="Benefit Rules"
        subtitle="Configure eligibility rules for each benefit"
        userName="Sarnai M."
      />

      <div className="px-8 py-6 space-y-6">
        {/* Benefit selector */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Select benefit
          </label>
          <select
            value={selectedBenefitId}
            onChange={(e) => setSelectedBenefitId(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {benefits.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Rules table */}
        <div className="overflow-x-auto rounded-xl border border-[#e5e7eb]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="w-12 px-4 py-3">#</th>
                <th className="px-4 py-3">Rule type</th>
                <th className="px-4 py-3">Condition</th>
                <th className="px-4 py-3">Fail message</th>
                <th className="w-24 px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.length > 0 ? (
                rules.map((rule) => (
                  <tr
                    key={rule.id}
                    className="border-b border-gray-100 hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3 text-gray-400">{rule.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {rule.type}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {rule.condition}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {rule.failMessage}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                          title="Edit rule"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                          title="Remove rule"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    No rules configured for {selectedBenefit.name}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add rule */}
        <Button variant="outline" size="sm">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add rule
        </Button>

        {/* Preview impact */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900">
            Preview impact
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            0 employees will lose access, 0 employees will gain access.
          </p>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button>Submit for approval</Button>
        </div>
      </div>
    </div>
  );
}
