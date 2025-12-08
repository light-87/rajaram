"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface DayData {
  date: Date;
  hours: number;
  hasJournal: boolean;
  hasTodos: boolean;
}

interface ActivityCalendarProps {
  className?: string;
}

export default function ActivityCalendar({ className = "" }: ActivityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthData, setMonthData] = useState<Map<string, DayData>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);

  useEffect(() => {
    fetchMonthData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  const fetchMonthData = async () => {
    setIsLoading(true);
    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const startDate = format(monthStart, "yyyy-MM-dd");
      const endDate = format(monthEnd, "yyyy-MM-dd");

      // Fetch time entries for the month
      const { data: timeEntries } = await supabase
        .from("time_entries")
        .select("date, hours")
        .gte("date", startDate)
        .lte("date", endDate);

      // Fetch journal entries for the month
      const { data: journalEntries } = await supabase
        .from("journal_entries")
        .select("entry_date")
        .gte("entry_date", startDate)
        .lte("entry_date", endDate);

      // Fetch completed todos for the month
      const { data: todos } = await supabase
        .from("todos")
        .select("updated_at, completed")
        .eq("completed", true)
        .gte("updated_at", startDate)
        .lte("updated_at", endDate + "T23:59:59");

      // Build the data map
      const dataMap = new Map<string, DayData>();

      // Initialize all days of the month
      let day = monthStart;
      while (day <= monthEnd) {
        const dateKey = format(day, "yyyy-MM-dd");
        dataMap.set(dateKey, {
          date: new Date(day),
          hours: 0,
          hasJournal: false,
          hasTodos: false,
        });
        day = addDays(day, 1);
      }

      // Aggregate time entries by date
      timeEntries?.forEach((entry: any) => {
        const dateKey = entry.date;
        const existing = dataMap.get(dateKey);
        if (existing) {
          existing.hours += parseFloat(entry.hours || "0");
        }
      });

      // Mark days with journal entries
      journalEntries?.forEach((entry: any) => {
        const dateKey = entry.entry_date;
        const existing = dataMap.get(dateKey);
        if (existing) {
          existing.hasJournal = true;
        }
      });

      // Mark days with completed todos
      todos?.forEach((todo: any) => {
        const dateKey = todo.updated_at?.split("T")[0];
        const existing = dataMap.get(dateKey);
        if (existing) {
          existing.hasTodos = true;
        }
      });

      setMonthData(dataMap);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIntensityClass = (hours: number): string => {
    if (hours === 0) return "bg-background-elevated";
    if (hours < 3) return "bg-sky/30";
    if (hours < 6) return "bg-purple/50";
    if (hours < 10) return "bg-pink/60";
    return "bg-gradient-to-br from-pink via-purple to-sky animate-pulse-slow";
  };

  const getIntensityBorder = (hours: number): string => {
    if (hours === 0) return "border-border";
    if (hours < 3) return "border-sky/40";
    if (hours < 6) return "border-purple/50";
    if (hours < 10) return "border-pink/60";
    return "border-pink/80 shadow-glow-pink";
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-purple-sky">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-text-primary">Activity Calendar</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-lg bg-background-elevated border border-border hover:border-purple/50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-text-secondary" />
          </button>
          <span className="text-sm font-semibold text-text-primary min-w-[120px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-lg bg-background-elevated border border-border hover:border-purple/50 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-text-secondary py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const rows = [];
    let days = [];
    let day = startDate;
    const today = new Date();

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const dateKey = format(day, "yyyy-MM-dd");
        const dayData = monthData.get(dateKey);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, today);
        const hours = dayData?.hours || 0;

        days.push(
          <div
            key={day.toString()}
            className="relative aspect-square"
            onMouseEnter={() => isCurrentMonth && dayData && setHoveredDay(dayData)}
            onMouseLeave={() => setHoveredDay(null)}
          >
            <div
              className={`
                w-full h-full rounded-lg border flex items-center justify-center text-sm font-medium
                transition-all duration-200 cursor-default
                ${isCurrentMonth ? getIntensityClass(hours) : "bg-background/30"}
                ${isCurrentMonth ? getIntensityBorder(hours) : "border-transparent"}
                ${isToday ? "ring-2 ring-yellow ring-offset-1 ring-offset-background-card" : ""}
                ${!isCurrentMonth ? "opacity-30" : ""}
              `}
            >
              <span className={isCurrentMonth ? "text-text-primary" : "text-text-secondary"}>
                {format(day, "d")}
              </span>
              {/* Indicator dots */}
              {isCurrentMonth && (dayData?.hasJournal || dayData?.hasTodos) && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {dayData?.hasJournal && <div className="w-1 h-1 rounded-full bg-purple" />}
                  {dayData?.hasTodos && <div className="w-1 h-1 rounded-full bg-green" />}
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-1">
          {days}
        </div>
      );
      days = [];
    }

    return <div className="space-y-1">{rows}</div>;
  };

  const renderLegend = () => {
    return (
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-secondary">Less</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 rounded bg-background-elevated border border-border" title="0 hours" />
              <div className="w-4 h-4 rounded bg-sky/30 border border-sky/40" title="1-3 hours" />
              <div className="w-4 h-4 rounded bg-purple/50 border border-purple/50" title="4-6 hours" />
              <div className="w-4 h-4 rounded bg-pink/60 border border-pink/60" title="7-9 hours" />
              <div className="w-4 h-4 rounded bg-gradient-to-br from-pink via-purple to-sky border border-pink/80" title="10+ hours" />
            </div>
            <span className="text-xs text-text-secondary">More</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-purple" />
              <span className="text-xs text-text-secondary">Journal</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green" />
              <span className="text-xs text-text-secondary">Todos</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTooltip = () => {
    if (!hoveredDay) return null;

    return (
      <div className="mt-4 p-3 bg-background-elevated rounded-xl border border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-text-primary">
            {format(hoveredDay.date, "EEEE, MMM d")}
          </span>
          <span className={`text-sm font-bold ${hoveredDay.hours >= 10 ? "text-pink" : hoveredDay.hours >= 6 ? "text-purple" : hoveredDay.hours >= 3 ? "text-sky" : "text-text-secondary"}`}>
            {hoveredDay.hours.toFixed(1)} hours
          </span>
        </div>
        <div className="flex gap-3 mt-2">
          {hoveredDay.hasJournal && (
            <span className="text-xs text-purple flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-purple" /> Journaled
            </span>
          )}
          {hoveredDay.hasTodos && (
            <span className="text-xs text-green flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green" /> Completed todos
            </span>
          )}
          {!hoveredDay.hasJournal && !hoveredDay.hasTodos && hoveredDay.hours === 0 && (
            <span className="text-xs text-text-secondary">No activity recorded</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`card p-6 ${className}`}>
      {renderHeader()}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple" />
        </div>
      ) : (
        <>
          {renderDays()}
          {renderCells()}
          {renderLegend()}
          {renderTooltip()}
        </>
      )}
    </div>
  );
}
