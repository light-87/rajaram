"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Banknote,
  Clock,
  Users,
  BookOpen,
  CheckSquare,
  Lock,
  LockOpen,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/todos", label: "Todos", icon: CheckSquare },
  { href: "/time", label: "Time Tracker", icon: Clock },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/loans", label: "Loan Tracker", icon: Banknote },
];

export default function Navigation() {
  const pathname = usePathname();
  const { logout, isAuthenticated } = useAuth();

  return (
    <nav className="border-b border-border bg-background-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-text-primary">
                Vaibhav <span className="text-accent-primary">Life Tracker</span>
              </h1>
            </div>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "bg-accent-secondary/10 text-accent-secondary"
                        : "text-text-secondary hover:text-text-primary hover:bg-background/50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {isAuthenticated && (
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-accent-primary transition-colors"
              title="Lock app"
            >
              <LockOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Lock</span>
            </button>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-1 overflow-x-auto pb-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                  isActive
                    ? "bg-accent-secondary/10 text-accent-secondary"
                    : "text-text-secondary"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
