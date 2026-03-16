import { Button } from "@/components/ui/button"

interface EmployeePagePanelProps {
  title: string
  description: string
  ctaLabel?: string
}

export function EmployeePagePanel({
  title,
  description,
  ctaLabel,
}: EmployeePagePanelProps) {
  return (
    <section className="space-y-6">
      <div className="border-b border-[#dfe6f0] pb-4">
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#17243d]">
          {title}
        </h1>
      </div>

      <div className="rounded-[1rem] border border-[#d9e1ef] bg-white p-7">
        <div className="max-w-2xl">
          <p className="text-[0.95rem] leading-7 text-[#607089]">{description}</p>
          {ctaLabel ? (
            <Button
              className="mt-8 h-10 rounded-[0.95rem] px-6 text-[0.9rem] font-medium"
              variant="outline"
            >
              {ctaLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  )
}
