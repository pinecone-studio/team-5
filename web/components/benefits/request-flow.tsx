import { Button } from "@/components/ui/button";
import type { Benefit } from "@/lib/mock-data";

type RequestFlowProps = {
  benefit: Benefit;
  onComplete: () => void;
  onCancel: () => void;
};

export function RequestFlow({ benefit, onComplete, onCancel }: RequestFlowProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-xl font-semibold">Request: {benefit.title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{benefit.description}</p>
      <p className="mt-4 text-sm">
        This is a mock request flow. Click submit to finish.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={onComplete}>Submit</Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </section>
  );
}
