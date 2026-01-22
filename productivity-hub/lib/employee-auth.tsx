"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Profile } from "@/types/database";

interface EmployeeAuthContextType {
    employee: Profile | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
}

const EmployeeAuthContext = createContext<EmployeeAuthContextType | undefined>(undefined);

export function EmployeeAuthProvider({ children }: { children: ReactNode }) {
    const [employee, setEmployee] = useState<Profile | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedAuth = localStorage.getItem("employee_auth");
        if (storedAuth) {
            try {
                const data = JSON.parse(storedAuth);
                setEmployee(data.profile);
                setIsAuthenticated(true);
            } catch (e) {
                localStorage.removeItem("employee_auth");
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            const response = await fetch("/api/auth/employee/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const { profile } = await response.json();
                localStorage.setItem("employee_auth", JSON.stringify({ profile }));
                setEmployee(profile);
                setIsAuthenticated(true);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Employee Auth error:", error);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem("employee_auth");
        setEmployee(null);
        setIsAuthenticated(false);
    };

    if (isLoading) {
        return null; // Or a loading spinner
    }

    return (
        <EmployeeAuthContext.Provider value={{
            employee,
            isAuthenticated,
            isAdmin: employee?.role === 'admin',
            login,
            logout
        }}>
            {children}
        </EmployeeAuthContext.Provider>
    );
}

export function useEmployeeAuth() {
    const context = useContext(EmployeeAuthContext);
    if (!context) {
        throw new Error("useEmployeeAuth must be used within EmployeeAuthProvider");
    }
    return context;
}
