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
  {
    href: "/todos",
    label: "Todos",
    icon: CheckSquare,
    color: "pink",
    activeClasses: "bg-pink/15 text-pink border-pink/30",
    hoverClasses: "hover:bg-pink/10 hover:text-pink",
  },
  {
    href: "/time",
    label: "Time",
    icon: Clock,
    color: "sky",
    activeClasses: "bg-sky/15 text-sky border-sky/30",
    hoverClasses: "hover:bg-sky/10 hover:text-sky",
  },
  {
    href: "/journal",
    label: "Journal",
    icon: BookOpen,
    color: "purple",
    activeClasses: "bg-purple/15 text-purple border-purple/30",
    hoverClasses: "hover:bg-purple/10 hover:text-purple",
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: Home,
    color: "yellow",
    activeClasses: "bg-yellow/15 text-yellow border-yellow/30",
    hoverClasses: "hover:bg-yellow/10 hover:text-yellow",
  },
  {
    href: "/clients",
    label: "Clients",
    icon: Users,
    color: "green",
    activeClasses: "bg-green/15 text-green border-green/30",
    hoverClasses: "hover:bg-green/10 hover:text-green",
  },
  {
    href: "/loans",
    label: "Loans",
    icon: Banknote,
    color: "coral",
    activeClasses: "bg-coral/15 text-coral border-coral/30",
    hoverClasses: "hover:bg-coral/10 hover:text-coral",
  },
];

export default function Navigation() {
  const pathname = usePathname();
  const { logout, isAuthenticated } = useAuth();

  return (
    <nav className="border-b border-border/50 bg-background-card/70 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold">
                <span className="text-gradient-pink-purple">Vaibhav</span>{" "}
                <span className="text-text-primary">Life Tracker</span>
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
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border border-transparent",
                      isActive
                        ? item.activeClasses
                        : `text-text-secondary ${item.hoverClasses}`
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
              className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-pink transition-colors rounded-lg hover:bg-pink/10"
              title="Lock app"
            >
              <LockOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Lock</span>
            </button>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-1 overflow-x-auto pb-3 -mx-1 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap border border-transparent",
                  isActive
                    ? item.activeClasses
                    : `text-text-secondary ${item.hoverClasses}`
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
