"use client";

import { useState } from "react";
import { TodoPriority } from "@/types/database";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";

interface TodoFormProps {
  onTodoAdded: () => void;
}

export default function TodoForm({ onTodoAdded }: TodoFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TodoPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast("Please enter a title", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("todos").insert([
        {
          title: title.trim(),
          description: description.trim() || null,
          priority,
          due_date: dueDate || null,
          status: "pending",
        },
      ]);

      if (error) throw error;

      showToast("Todo added successfully!", "success");

      // Reset form
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate("");

      onTodoAdded();
    } catch (error) {
      console.error("Error adding todo:", error);
      showToast("Failed to add todo", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card p-6 mb-6">
      <h2 className="text-xl font-semibold text-text-primary mb-4">Add New Todo</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter todo title"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter todo description (optional)"
              rows={3}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TodoPriority)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          {isSubmitting ? "Adding..." : "Add Todo"}
        </Button>
      </form>
    </div>
  );
}
