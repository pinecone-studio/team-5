"use client";

import { useEffect, useRef, useState } from "react";
import { SignOutButton, useUser } from "@clerk/react";
import { ChevronDown, LogOut } from "lucide-react";
import { normalizeRole } from "@/lib/auth";

interface SessionBadgeProps {
  fallbackName?: string;
}

export default function SessionBadge({
  fallbackName = "User",
}: SessionBadgeProps) {
  const { isLoaded, user } = useUser();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (!isLoaded) {
    return <div className="h-8 w-28 rounded-[10px] bg-gray-100" />;
  }

  const displayName =
    user?.fullName?.trim() ??
    user?.firstName ??
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ??
    fallbackName;
  const email =
    user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? "";
  const initial = displayName.trim().charAt(0).toUpperCase() || "U";
  const role = normalizeRole(user?.publicMetadata?.role);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-2.5 rounded-[10px] px-2 py-1.5 transition hover:bg-gray-100"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
          {initial}
        </div>
        <div className="hidden sm:flex sm:flex-col sm:items-start">
          <span className="text-[0.95rem] font-medium text-gray-700">{displayName}</span>
        </div>
        <ChevronDown
          className={`hidden h-4 w-4 text-gray-400 transition sm:block ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-[12px] border border-gray-200 bg-white p-2"
          role="menu"
        >
          <div className="border-b border-gray-100 px-3 py-2">
            <p className="truncate text-sm font-medium text-gray-900">{displayName}</p>
            {email ? (
              <p className="truncate text-xs text-gray-500">{email}</p>
            ) : null}
            <p className="mt-1 inline-flex rounded-[10px] bg-gray-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-600">
              {role}
            </p>
          </div>
          <SignOutButton redirectUrl="/">
            <button
              type="button"
              className="mt-2 flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 hover:text-gray-900"
              role="menuitem"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </SignOutButton>
        </div>
      ) : null}
    </div>
  );
}
