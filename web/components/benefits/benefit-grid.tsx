import { Button } from "@/components/ui/button";
import type { Benefit, BenefitEligibility, BenefitStatus } from "@/lib/mock-data";

type BenefitGridProps = {
  eligibilities: BenefitEligibility[];
  onRequest?: (benefit: Benefit) => void;
};

const statusClass: Record<BenefitStatus, string> = {
  active: "bg-emerald-100 text-emerald-800",
  eligible: "bg-blue-100 text-blue-800",
  locked: "bg-muted text-muted-foreground",
  pending: "bg-amber-100 text-amber-800",
};

export function BenefitGrid({ eligibilities, onRequest }: BenefitGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {eligibilities.map((item) => (
        <article
          key={item.benefit.id}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">{item.benefit.title}</h3>
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${statusClass[item.status]}`}
            >
              {item.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {item.benefit.description}
          </p>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => onRequest?.(item.benefit)}
              disabled={item.status === "locked" || item.status === "pending"}
            >
              Request
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
