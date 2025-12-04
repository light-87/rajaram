"use client";

import { useAuth } from "@/lib/auth";
import PINEntry from "./ui/PINEntry";
import Navigation from "./Navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, login } = useAuth();

  if (!isAuthenticated) {
    return <PINEntry onSubmit={login} />;
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">{children}</main>
    </>
  );
}
