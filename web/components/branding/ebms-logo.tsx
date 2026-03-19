import Image from "next/image";

import { cn } from "@/lib/utils";

interface EbmsLogoProps {
  variant?: "sidebar" | "login";
  className?: string;
  priority?: boolean;
}

export default function EbmsLogo({
  variant = "sidebar",
  className,
  priority = false,
}: EbmsLogoProps) {
  const isLogin = variant === "login";

  return (
    <div
      className={cn(
        "flex items-center",
        isLogin ? "gap-4" : "gap-2.5",
        className,
      )}
    >
      <div
        className={cn(
          "relative shrink-0",
          isLogin ? "h-[25px] w-[25px]" : "h-[25px] w-[25px]",
        )}
      >
        <Image
          src="/favicon.png"
          alt="EBMS logo"
          fill
          priority={priority}
          sizes={isLogin ? "25px" : "25px"}
          className="object-contain"
        />
      </div>

      <span
        className={cn(
          "font-semibold tracking-[-0.06em] text-[#111827]",
          isLogin ? "text-[25px] leading-none" : "text-[25px] leading-none",
        )}
      >
        EBMS
      </span>
    </div>
  );
}
