"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { StatCard } from "@/components/ui/stat-card";
import { WarningBanner } from "@/components/benefits/warning-banner";
import { BenefitGrid } from "@/components/benefits/benefit-grid";
import { RequestFlow } from "@/components/benefits/request-flow";
import { currentEmployee, myEligibility } from "@/lib/mock-data";
import type { Benefit } from "@/lib/mock-data";

export default function DashboardPage() {
  const [requestingBenefit, setRequestingBenefit] = useState<Benefit | null>(
    null,
  );

  const counts = useMemo(() => {
    const active = myEligibility.filter((e) => e.status === "active").length;
    const available = myEligibility.filter(
      (e) => e.status === "eligible",
    ).length;
    const locked = myEligibility.filter((e) => e.status === "locked").length;
    const pending = myEligibility.filter((e) => e.status === "pending").length;
    return { active, available, locked, pending };
  }, []);

  return (
    <div>
      <Header
        title="My Benefits"
        subtitle={`Welcome back, ${currentEmployee.nameEng}`}
        userName={currentEmployee.nameEng}
      />

      <div className="px-8 py-6 space-y-6">
        {currentEmployee.lateArrivalCount >= 2 && (
          <WarningBanner
            message={`You have ${currentEmployee.lateArrivalCount} late arrivals this month. One more and you'll lose access to Gym, Insurance, and Remote Work.`}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard value={counts.active} label="Active" variant="success" />
          <StatCard value={counts.available} label="Available" variant="info" />
          <StatCard value={counts.locked} label="Not yet" variant="default" />
          <StatCard value={counts.pending} label="Pending" variant="warning" />
        </div>

        {requestingBenefit ? (
          <RequestFlow
            benefit={requestingBenefit}
            onComplete={() => setRequestingBenefit(null)}
            onCancel={() => setRequestingBenefit(null)}
          />
        ) : (
          <BenefitGrid
            eligibilities={myEligibility}
            onRequest={setRequestingBenefit}
          />
        )}
      </div>
    </div>
  );
}
