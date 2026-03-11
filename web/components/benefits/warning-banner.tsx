import { AlertTriangle } from "lucide-react";

type WarningBannerProps = {
  message: string;
};

export function WarningBanner({ message }: WarningBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
