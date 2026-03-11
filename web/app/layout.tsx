import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

/**
 * Root layout — sidebar нь (employee) болон (manager) group-ийн layout-д байна.
 * (public) нь sidebar-гүй.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className={cn("font-sans", geist.variable)}>
      <body>{children}</body>
    </html>
  );
}
