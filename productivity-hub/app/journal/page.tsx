"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { JournalEntry } from "@/types/database";
import { BookOpen } from "lucide-react";
import JournalEntryForm from "@/components/journal/JournalEntryForm";
import JournalEntriesList from "@/components/journal/JournalEntriesList";
import Loading from "@/components/ui/Loading";

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .order("entry_date", { ascending: false });

      if (!error && data) {
        setEntries(data);
      }
    } catch (error) {
      console.error("Error fetching journal entries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loading text="Loading journal entries..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <BookOpen className="w-8 h-8 text-accent-secondary" />
        <h1 className="text-3xl font-bold text-text-primary">Journal</h1>
      </div>

      <div className="space-y-8">
        <JournalEntryForm onEntryAdded={fetchEntries} />
        <JournalEntriesList entries={entries} onRefresh={fetchEntries} />
      </div>
    </div>
  );
}
