"use client";

import { Home } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Home className="w-8 h-8 text-accent-secondary" />
        <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
      </div>

      <div className="card p-12 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            Welcome to Vaibhav Life Tracker
          </h2>
          <p className="text-text-secondary mb-8 text-lg">
            <em>&ldquo;I&apos;m not building a business today. I&apos;m buying my freedom.&rdquo;</em>
          </p>
          <p className="text-text-secondary">
            Your personalized dashboard is being built. For now, use the navigation to access:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { name: "Loan Tracker", status: "✅ Ready" },
              { name: "Time Tracker", status: "🚧 In Progress" },
              { name: "Clients", status: "🚧 Coming Soon" },
              { name: "Journal", status: "🚧 Coming Soon" },
            ].map((item) => (
              <div key={item.name} className="p-4 rounded-lg bg-background border border-border">
                <p className="font-semibold text-text-primary text-sm mb-1">{item.name}</p>
                <p className="text-xs text-text-secondary">{item.status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
