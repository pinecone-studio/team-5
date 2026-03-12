import { Bell, Menu } from "lucide-react"
import SessionBadge from "@/components/session-badge"

interface HeaderProps {
  userName?: string
  onMenuClick?: () => void
}

export function Header({ userName = "User", onMenuClick }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6 lg:px-8 lg:py-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="relative rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
          <SessionBadge fallbackName={userName} />
        </div>
      </div>
    </header>
  )
}
