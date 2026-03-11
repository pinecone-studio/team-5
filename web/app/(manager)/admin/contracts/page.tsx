"use client";

import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { benefits } from "@/lib/mock-data";
import { Upload } from "lucide-react";

export default function ContractsPage() {
  const contractBenefits = benefits.filter((b) => b.requiresContract);

  return (
    <div>
      <Header
        title="Contracts"
        subtitle={`${contractBenefits.length} benefits with contracts`}
        userName="Sarnai M."
      />

      <div className="px-8 py-6">
        <div className="overflow-x-auto rounded-xl border border-[#e5e7eb]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Benefit</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contractBenefits.map((benefit, idx) => (
                <tr
                  key={benefit.id}
                  className={`border-b border-gray-100 ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {benefit.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {benefit.vendorName}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    v{benefit.contractVersion}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="success">Active</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500">Dec 31, 2026</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="sm">
                      <Upload className="mr-1.5 h-3.5 w-3.5" />
                      Upload new version
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
