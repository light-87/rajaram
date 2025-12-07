import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/components/ui/Toast";
import AuthGuard from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "Vaibhav Life Tracker",
  description: "Track your finances, time, clients, and daily reflections",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vaibhav Life Tracker",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthProvider>
          <ToastProvider>
            <AuthGuard>{children}</AuthGuard>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
