"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { TodoPriority } from "@/types/database";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface TodoFormProps {
  onTodoAdded: () => void;
}

const priorities: TodoPriority[] = ["low", "medium", "high"];

export default function TodoForm({ onTodoAdded }: TodoFormProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as TodoPriority,
    due_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("todos").insert({
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority,
        due_date: formData.due_date || null,
        completed: false,
      });

      if (error) throw error;

      showToast("Todo added successfully!", "success");
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        due_date: "",
      });
      onTodoAdded();
    } catch (error) {
      console.error("Error adding todo:", error);
      showToast("Failed to add todo", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-primary mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What needs to be done?"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-sm focus:border-accent-secondary focus:outline-none focus:ring-2 focus:ring-accent-secondary/20"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add more details..."
              rows={3}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-sm focus:border-accent-secondary focus:outline-none focus:ring-2 focus:ring-accent-secondary/20 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value as TodoPriority })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-sm focus:border-accent-secondary focus:outline-none focus:ring-2 focus:ring-accent-secondary/20"
            >
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Due Date (Optional)
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-sm focus:border-accent-secondary focus:outline-none focus:ring-2 focus:ring-accent-secondary/20"
            />
          </div>
        </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !formData.title.trim()}>
          {isSubmitting ? "Adding..." : "Add Todo"}
        </Button>
      </div>
    </form>
  );
}
