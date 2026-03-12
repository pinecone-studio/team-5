import { Button } from "@/components/ui/button"

interface AdminPagePanelProps {
  title: string
  description: string
  ctaLabel?: string
}

export function AdminPagePanel({
  title,
  description,
  ctaLabel,
}: AdminPagePanelProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
        {ctaLabel ? (
          <Button variant="outline" className="mt-6">
            {ctaLabel}
          </Button>
        ) : null}
      </div>
    </section>
  )
}
