"use client";

import { Header } from "@/components/layout/header";
import { AuditTable } from "@/components/admin/audit-table";
import { auditLog } from "@/lib/mock-data";

export default function AuditPage() {
  return (
    <div>
      <Header
        title="Audit Log"
        subtitle={`${auditLog.length} entries`}
        userName="Sarnai M."
      />

      <div className="px-8 py-6">
        <AuditTable entries={auditLog} />
      </div>
    </div>
  );
}
