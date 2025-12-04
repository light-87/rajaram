"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { TimeEntry } from "@/types/database";
import { Clock } from "lucide-react";
import TimeEntryForm from "@/components/time/TimeEntryForm";
import TodaysSummary from "@/components/time/TodaysSummary";
import WeeklyView from "@/components/time/WeeklyView";
import TimeEntriesList from "@/components/time/TimeEntriesList";
import Loading from "@/components/ui/Loading";

export default function TimePage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .order("date", { ascending: false });

      if (!error && data) {
        // Convert numeric string values to actual numbers
        const normalizedEntries = data.map((entry: any) => ({
          ...entry,
          hours: parseFloat(entry.hours),
          effort_points: parseFloat(entry.effort_points),
        }));
        setEntries(normalizedEntries);
      }
    } catch (error) {
      console.error("Error fetching time entries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loading text="Loading time entries..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Clock className="w-8 h-8 text-accent-secondary" />
        <h1 className="text-3xl font-bold text-text-primary">Time Tracker</h1>
      </div>

      <div className="space-y-8">
        <TimeEntryForm onEntryAdded={fetchEntries} />
        <TodaysSummary entries={entries} />
        <WeeklyView entries={entries} />
        <TimeEntriesList entries={entries} onRefresh={fetchEntries} />
      </div>
    </div>
  );
}
