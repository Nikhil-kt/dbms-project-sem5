import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/context/auth-context";

export const metadata: Metadata = {
  title: "College Project Component Lending & Tracking System",
  description: "Enterprise Academic DBMS for Electronic Component Inventory, Project Lending, and Overdue Tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-slate-50 text-slate-900">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
