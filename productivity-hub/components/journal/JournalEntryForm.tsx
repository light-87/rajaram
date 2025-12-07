"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { JournalEntry } from "@/types/database";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { BookOpen, Save } from "lucide-react";

interface JournalEntryFormProps {
  onEntryAdded: () => void;
}

const moodEmojis = ["😢", "😕", "😐", "🙂", "😄"];
const moodLabels = ["Very Bad", "Bad", "Neutral", "Good", "Excellent"];
const energyEmojis = ["🔋", "🪫", "⚡", "⚡⚡", "🔥"];
const energyLabels = ["Drained", "Low", "Moderate", "High", "Energized"];

export default function JournalEntryForm({ onEntryAdded }: JournalEntryFormProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [existingEntry, setExistingEntry] = useState<JournalEntry | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    content: "",
    mood: 3 as 1 | 2 | 3 | 4 | 5,
    energy: 3 as 1 | 2 | 3 | 4 | 5,
  });

  // Check if entry exists for selected date
  useEffect(() => {
    checkExistingEntry();
  }, [formData.date]);

  const checkExistingEntry = async () => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("entry_date", formData.date)
        .single();

      if (data && !error) {
        setExistingEntry(data);
        setFormData({
          date: formData.date,
          content: data.content,
          mood: data.mood,
          energy: data.energy,
        });
      } else {
        setExistingEntry(null);
        // Reset form if switching to a date without an entry
        if (formData.content !== "" || formData.mood !== 3 || formData.energy !== 3) {
          setFormData({
            date: formData.date,
            content: "",
            mood: 3,
            energy: 3,
          });
        }
      }
    } catch (error) {
      console.error("Error checking existing entry:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (existingEntry) {
        // Update existing entry
        const { error } = await supabase
          .from("journal_entries")
          .update({
            content: formData.content,
            mood: formData.mood,
            energy: formData.energy,
          })
          .eq("id", existingEntry.id);

        if (error) throw error;
        showToast("Journal entry updated successfully!", "success");
      } else {
        // Create new entry
        const { error } = await supabase.from("journal_entries").insert({
          entry_date: formData.date,
          content: formData.content,
          mood: formData.mood,
          energy: formData.energy,
        });

        if (error) throw error;
        showToast("Journal entry saved successfully!", "success");
      }

      onEntryAdded();
      await checkExistingEntry(); // Refresh to show updated state
    } catch (error) {
      console.error("Error saving journal entry:", error);
      showToast("Failed to save journal entry", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-accent-secondary" />
        {existingEntry ? "Edit Entry" : "New Entry"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-sm focus:border-accent-secondary focus:outline-none focus:ring-2 focus:ring-accent-secondary/20"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Mood
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setFormData({ ...formData, mood: rating as 1 | 2 | 3 | 4 | 5 })}
                  className={`flex-1 px-2 py-2 rounded-lg border transition-all ${
                    formData.mood === rating
                      ? "bg-accent-secondary/20 border-accent-secondary"
                      : "bg-background border-border hover:border-accent-secondary/50"
                  }`}
                  title={moodLabels[rating - 1]}
                >
                  <span className="text-2xl">{moodEmojis[rating - 1]}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-text-secondary mt-1 text-center">
              {moodLabels[formData.mood - 1]}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Energy
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setFormData({ ...formData, energy: rating as 1 | 2 | 3 | 4 | 5 })}
                  className={`flex-1 px-2 py-2 rounded-lg border transition-all ${
                    formData.energy === rating
                      ? "bg-accent-success/20 border-accent-success"
                      : "bg-background border-border hover:border-accent-success/50"
                  }`}
                  title={energyLabels[rating - 1]}
                >
                  <span className="text-2xl">{energyEmojis[rating - 1]}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-text-secondary mt-1 text-center">
              {energyLabels[formData.energy - 1]}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Journal Entry
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="How was your day? What did you accomplish? What are you grateful for?"
            rows={8}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-sm focus:border-accent-secondary focus:outline-none focus:ring-2 focus:ring-accent-secondary/20 resize-y"
            required
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting || isChecking || !formData.content.trim()}
            className="min-w-32"
          >
            {isSubmitting ? (
              "Saving..."
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {existingEntry ? "Update Entry" : "Save Entry"}
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
