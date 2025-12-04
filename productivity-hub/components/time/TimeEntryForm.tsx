"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { TimeCategory } from "@/types/database";
import { calculateEffortPoints } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Plus } from "lucide-react";

interface TimeEntryFormProps {
  onEntryAdded: () => void;
}

const categories: TimeCategory[] = [
  "UK Job",
  "Solar App",
  "Factory App",
  "Personal",
  "Uni",
  "Gym",
];

export default function TimeEntryForm({ onEntryAdded }: TimeEntryFormProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "UK Job" as TimeCategory,
    hours: "",
    description: "",
  });

  const isGym = formData.category === "Gym";
  const effortPoints = isGym
    ? 1
    : formData.hours
    ? calculateEffortPoints(formData.category, parseFloat(formData.hours))
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const hours = isGym ? 1 : parseFloat(formData.hours);
      const points = calculateEffortPoints(formData.category, hours);

      const { error } = await supabase.from("time_entries").insert({
        date: formData.date,
        category: formData.category,
        hours,
        effort_points: points,
        description: formData.description || null,
      });

      if (error) throw error;

      showToast("Time entry logged successfully!", "success");
      setFormData({
        ...formData,
        hours: "",
        description: "",
      });
      onEntryAdded();
    } catch (error) {
      console.error("Error logging time entry:", error);
      showToast("Failed to log time entry", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
        <Plus className="w-6 h-6 text-accent-secondary" />
        Quick Log
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value as TimeCategory })
            }
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-sm focus:border-accent-secondary focus:outline-none focus:ring-2 focus:ring-accent-secondary/20"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {!isGym && (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Hours
            </label>
            <input
              type="number"
              step="0.25"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
              placeholder="1.5"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-sm focus:border-accent-secondary focus:outline-none focus:ring-2 focus:ring-accent-secondary/20"
              required
            />
          </div>
        )}

        {isGym && (
          <div className="flex items-end">
            <div className="px-4 py-2 bg-accent-success/10 border border-accent-success/30 rounded-lg">
              <p className="text-sm text-accent-success font-semibold">
                ✓ Workout (1 point)
              </p>
            </div>
          </div>
        )}

        <div className={isGym ? "md:col-span-2" : ""}>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Description (Optional)
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="What did you work on?"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-sm focus:border-accent-secondary focus:outline-none focus:ring-2 focus:ring-accent-secondary/20"
          />
        </div>

        <div className="flex flex-col justify-end">
          <Button type="submit" disabled={isSubmitting || (!isGym && !formData.hours)}>
            {isSubmitting ? "Logging..." : `Log (${effortPoints} pts)`}
          </Button>
        </div>
      </form>
    </div>
  );
}
