"use client";

import { EmployeeAuthProvider, useEmployeeAuth } from "@/lib/employee-auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Navigation from "@/components/Navigation"; // We might need a separate nav for tools
import ToastContainer from "@/components/ui/Toast";

function EmployeeAuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useEmployeeAuth();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated && pathname !== "/tools/login") {
            router.push("/tools/login");
        }
    }, [isAuthenticated, pathname, router]);

    // Register service worker for PWA install support
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").catch(() => {});
        }
    }, []);

    if (!isAuthenticated && pathname !== "/tools/login") {
        return null;
    }

    return (
        <>
            <main className="min-h-screen bg-background">
                {children}
            </main>
            <ToastContainer />
        </>
    );
}

export default function ToolsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <EmployeeAuthProvider>
            <EmployeeAuthGuard>{children}</EmployeeAuthGuard>
        </EmployeeAuthProvider>
    );
}
