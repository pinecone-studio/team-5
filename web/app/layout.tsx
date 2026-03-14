import "./globals.css";
import { Geist } from "next/font/google";
import { ClerkAppProvider } from "@/components/apollo-provider";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

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
