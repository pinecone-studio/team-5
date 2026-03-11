import { cn } from "@/lib/utils";

type StatCardProps = {
  value: number;
  label: string;
  variant?: "success" | "info" | "warning" | "default";
};

const variantClass: Record<NonNullable<StatCardProps["variant"]>, string> = {
  success: "bg-emerald-100 text-emerald-800",
  info: "bg-blue-100 text-blue-800",
  warning: "bg-amber-100 text-amber-800",
  default: "bg-muted text-foreground",
};

export function StatCard({ value, label, variant = "default" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div
        className={cn(
          "inline-flex rounded-md px-2 py-1 text-xs font-medium",
          variantClass[variant],
        )}
      >
        {label}
      </div>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}
