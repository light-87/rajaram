"use client";

import { useState } from "react";
import { useEmployeeAuth } from "@/lib/employee-auth";
import { useRouter } from "next/navigation";
import { Lock, User, ShieldAlert } from "lucide-react";
import Loading from "@/components/ui/Loading";

export default function EmployeeLoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useEmployeeAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        const success = await login(username, password);
        if (success) {
            router.push("/tools");
        } else {
            setError("Invalid username or password");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-dark flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="card p-8 space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-pink-purple" />

                    <div className="text-center space-y-2">
                        <h1 className="text-2xl font-bold text-text-primary">Employee Portal</h1>
                        <p className="text-text-secondary">Sign in to access tools & leads</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                                <User className="w-4 h-4" /> Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoFocus
                                className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl focus:border-pink/50 focus:ring-1 focus:ring-pink/50 outline-none transition-all text-text-primary"
                                placeholder="Enter your username"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                                <Lock className="w-4 h-4" /> Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl focus:border-pink/50 focus:ring-1 focus:ring-pink/50 outline-none transition-all text-text-primary"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                                <ShieldAlert className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-gradient-pink-purple text-white rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50"
                        >
                            {isLoading ? <Loading size="sm" /> : "Sign In"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
