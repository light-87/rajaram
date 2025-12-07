"use client";

import { TimeEntry } from "@/types/database";
import { Target, TrendingUp } from "lucide-react";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";

interface TodaysSummaryProps {
  entries: TimeEntry[];
}

export default function TodaysSummary({ entries }: TodaysSummaryProps) {
  const today = new Date().toISOString().split("T")[0];
  const todaysEntries = entries.filter((e) => e.date === today);

  console.log('Today:', today); // Debug
  console.log('Total entries:', entries.length); // Debug
  console.log('Todays entries:', todaysEntries); // Debug

  const totalPoints = todaysEntries.reduce((sum, e) => sum + Number(e.effort_points), 0);
  const goalPercentage = (totalPoints / 50) * 100;
  const pointsNeeded = Math.max(0, 50 - totalPoints);

  console.log('Total points:', totalPoints); // Debug

  const categoryBreakdown = todaysEntries.reduce((acc, entry) => {
    acc[entry.category] = (acc[entry.category] || 0) + Number(entry.effort_points);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
        <Target className="w-6 h-6 text-accent-primary" />
        Today&apos;s Summary
      </h2>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-3xl font-bold text-text-primary">{totalPoints}</span>
          <span className="text-sm text-text-secondary">/ 50 points</span>
        </div>
        <ProgressBar percentage={goalPercentage} showLabel={false} size="lg" />
        {totalPoints >= 50 ? (
          <p className="text-sm text-accent-success mt-2 font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Goal achieved! Keep up the momentum!
          </p>
        ) : (
          <p className="text-sm text-text-secondary mt-2">
            {pointsNeeded} more points needed to reach your goal
          </p>
        )}
      </div>

      {Object.keys(categoryBreakdown).length > 0 && (
        <div>
          <p className="text-sm font-medium text-text-primary mb-3">
            Breakdown by Category
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoryBreakdown).map(([category, points]) => (
              <Badge key={category} variant="info" size="md">
                {category}: {points} pts
              </Badge>
            ))}
          </div>
        </div>
      )}

      {todaysEntries.length === 0 && (
        <p className="text-center text-text-secondary py-4">
          No entries logged today. Start tracking your time!
        </p>
      )}
    </div>
  );
}
