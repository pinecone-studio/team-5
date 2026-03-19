import "./globals.css";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ClerkAppProvider } from "@/components/apollo-provider";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png", sizes: "53x57" }],
    shortcut: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/favicon.png", type: "image/png" }],
  },
};

/**
 * Root layout.
 * Clerk auth context-ийг бүх route group дээр reuse хийхийн тулд энд нэг удаа mount хийнэ.
 * Sidebar нь (employee) болон (manager) group-ийн layout-д байна.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className={cn("font-sans", geist.variable)}>
      <body>
        <ClerkAppProvider>{children}</ClerkAppProvider>
      </body>
    </html>
  );
}
