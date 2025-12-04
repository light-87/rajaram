"use client";

import { TimeEntry } from "@/types/database";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Calendar } from "lucide-react";
import { useState, useMemo } from "react";
import { startOfWeek, endOfWeek, format, addDays } from "date-fns";

interface WeeklyViewProps {
  entries: TimeEntry[];
}

export default function WeeklyView({ entries }: WeeklyViewProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(currentWeekStart, i);
      return format(date, "yyyy-MM-dd");
    });
  }, [currentWeekStart]);

  const weekData = useMemo(() => {
    return weekDays.map((date) => {
      const dayEntries = entries.filter((e) => e.date === date);
      const points = dayEntries.reduce((sum, e) => sum + e.effort_points, 0);

      return {
        day: format(new Date(date), "EEE"),
        date,
        points,
        meetsGoal: points >= 50,
      };
    });
  }, [weekDays, entries]);

  const totalPoints = weekData.reduce((sum, day) => sum + day.points, 0);
  const avgPoints = totalPoints / 7;
  const daysMetGoal = weekData.filter((d) => d.meetsGoal).length;

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
        <Calendar className="w-6 h-6 text-accent-secondary" />
        This Week
      </h2>

      <div className="mb-6">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={weekData}>
            <XAxis dataKey="day" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#151821",
                border: "1px solid #2D3748",
                borderRadius: "8px",
                color: "#E8E8E8",
              }}
              labelStyle={{ color: "#E8E8E8" }}
            />
            <Bar dataKey="points" radius={[8, 8, 0, 0]}>
              {weekData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.meetsGoal ? "#10B981" : entry.points > 0 ? "#F59E0B" : "#4B5563"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-background border border-border text-center">
          <p className="text-sm text-text-secondary mb-1">Total Points</p>
          <p className="text-2xl font-bold text-text-primary">{totalPoints}</p>
        </div>
        <div className="p-4 rounded-lg bg-background border border-border text-center">
          <p className="text-sm text-text-secondary mb-1">Daily Average</p>
          <p className="text-2xl font-bold text-text-primary">{avgPoints.toFixed(1)}</p>
        </div>
        <div className="p-4 rounded-lg bg-background border border-border text-center">
          <p className="text-sm text-text-secondary mb-1">Days ≥ 50</p>
          <p className="text-2xl font-bold text-accent-success">{daysMetGoal}/7</p>
        </div>
      </div>

      {/* Goal line reference */}
      <div className="mt-4 flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-accent-success" />
          <span className="text-text-secondary">≥ 50 points</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-accent-primary" />
          <span className="text-text-secondary">&lt; 50 points</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-600" />
          <span className="text-text-secondary">No entries</span>
        </div>
      </div>
    </div>
  );
}
