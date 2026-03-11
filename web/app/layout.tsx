import "./globals.css";
import ApolloProvider from "@/components/apollo-provider";
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
      <body className="min-h-screen bg-background">
        <ApolloProvider>{children}</ApolloProvider>
      </body>
    </html>
  );
}
