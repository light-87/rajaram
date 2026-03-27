"use client";

export const dynamic = "force-dynamic";

import { useEmployeeAuth } from "@/lib/employee-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart2 } from "lucide-react";
import SolarManagerView from "@/components/tools/SolarManagerView";

export default function ManagerPage() {
    const { isAdmin, isAuthenticated } = useEmployeeAuth();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated && !isAdmin) {
            router.push("/tools");
        }
    }, [isAdmin, isAuthenticated, router]);

    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="bg-yellow/10 border-b border-yellow/20 px-4 sm:px-6 lg:px-8 py-6">
                <div className="max-w-7xl mx-auto">
                    <Link
                        href="/tools"
                        className="text-yellow flex items-center gap-1 text-sm font-bold hover:underline mb-3"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Portal
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-yellow/10 text-yellow">
                            <BarChart2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-text-primary">Manager View</h1>
                            <p className="text-text-secondary text-sm">
                                Daily intern activity — Solar Vendor calls & lead updates
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <SolarManagerView />
            </main>
        </div>
    );
}
