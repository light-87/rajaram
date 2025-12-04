"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const auth = localStorage.getItem("productivity_hub_auth");
    if (auth === "authenticated") {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (pin: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (response.ok) {
        localStorage.setItem("productivity_hub_auth", "authenticated");
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Auth error:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("productivity_hub_auth");
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
