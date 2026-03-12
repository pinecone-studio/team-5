import { EmployeePagePanel } from "@/components/employee/employee-page-panel"

export default function EmployeeRequestsPage() {
  return (
    <EmployeePagePanel
      title="My Requests"
      description="Илгээсэн benefit request-үүдийн approval статус, тайлбар, сүүлийн шинэчлэлүүдийг эндээс хянаж болно."
      ctaLabel="New request"
    />
  )
}
