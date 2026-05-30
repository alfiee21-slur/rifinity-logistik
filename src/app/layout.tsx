import type { Metadata } from "next";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";
import { LanguageProvider } from "@/components/LanguageProvider";

export const metadata: Metadata = {
  title: "Rifinity Logistik | Smart Warehouse Management",
  description: "AI-Powered Logistics Management System for Vocational Schools",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <LanguageProvider>
          <AuthGuard>
            <AppShell>{children}</AppShell>
          </AuthGuard>
        </LanguageProvider>
      </body>
    </html>
  );
}
