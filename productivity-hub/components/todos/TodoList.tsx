"use client";

import { Todo } from "@/types/database";
import { List, Check, X, Trash2, Calendar, AlertCircle } from "lucide-react";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { CheckSquare } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/Toast";
import { format } from "date-fns";

interface TodoListProps {
  todos: Todo[];
  onRefresh: () => void;
}

type FilterType = "all" | "active" | "completed";

export default function TodoList({ todos, onRefresh }: TodoListProps) {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<FilterType>("all");
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const filteredTodos = todos.filter((todo) => {
    if (filter === "all") return true;
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  const toggleTodo = async (todo: Todo) => {
    setUpdatingIds((prev) => new Set(prev).add(todo.id));
    try {
      const { error } = await supabase
        .from("todos")
        .update({ completed: !todo.completed })
        .eq("id", todo.id);

      if (error) throw error;

      showToast(
        todo.completed ? "Todo marked as active" : "Todo completed!",
        "success"
      );
      onRefresh();
    } catch (error) {
      console.error("Error toggling todo:", error);
      showToast("Failed to update todo", "error");
    } finally {
      setUpdatingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(todo.id);
        return newSet;
      });
    }
  };

  const deleteTodo = async (id: string) => {
    if (!confirm("Are you sure you want to delete this todo?")) return;

    setUpdatingIds((prev) => new Set(prev).add(id));
    try {
      const { error } = await supabase.from("todos").delete().eq("id", id);

      if (error) throw error;

      showToast("Todo deleted successfully", "success");
      onRefresh();
    } catch (error) {
      console.error("Error deleting todo:", error);
      showToast("Failed to delete todo", "error");
    } finally {
      setUpdatingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "info";
      default:
        return "info";
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  if (todos.length === 0) {
    return (
      <div className="card p-6">
        <EmptyState
          icon={CheckSquare}
          title="No Todos Yet"
          description="Start adding todos to organize your tasks and boost your productivity."
        />
      </div>
    );
  }

  const activeTodos = todos.filter((t) => !t.completed).length;
  const completedTodos = todos.filter((t) => t.completed).length;

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
        <List className="w-6 h-6 text-accent-secondary" />
        Your Todos
      </h2>

      {/* Filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            filter === "all"
              ? "bg-accent-secondary text-white"
              : "bg-background text-text-secondary hover:bg-background-card"
          }`}
        >
          All ({todos.length})
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            filter === "active"
              ? "bg-accent-secondary text-white"
              : "bg-background text-text-secondary hover:bg-background-card"
          }`}
        >
          Active ({activeTodos})
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            filter === "completed"
              ? "bg-accent-secondary text-white"
              : "bg-background text-text-secondary hover:bg-background-card"
          }`}
        >
          Completed ({completedTodos})
        </button>
      </div>

      {/* Todos List */}
      <div className="space-y-3">
        {filteredTodos.length === 0 ? (
          <p className="text-center text-text-secondary py-8">
            No {filter === "all" ? "" : filter} todos
          </p>
        ) : (
          filteredTodos.map((todo) => {
            const overdue = isOverdue(todo.due_date);
            const isUpdating = updatingIds.has(todo.id);

            return (
              <div
                key={todo.id}
                className={`p-4 rounded-lg border transition-all ${
                  todo.completed
                    ? "bg-background/50 border-border/50"
                    : "bg-background-card border-border hover:border-accent-secondary/50"
                } ${isUpdating ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTodo(todo)}
                    disabled={isUpdating}
                    className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                      todo.completed
                        ? "bg-accent-success border-accent-success"
                        : "border-border hover:border-accent-secondary"
                    }`}
                  >
                    {todo.completed && <Check className="w-4 h-4 text-white" />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3
                          className={`text-base font-medium ${
                            todo.completed
                              ? "text-text-secondary line-through"
                              : "text-text-primary"
                          }`}
                        >
                          {todo.title}
                        </h3>
                        {todo.description && (
                          <p
                            className={`mt-1 text-sm ${
                              todo.completed
                                ? "text-text-secondary/70 line-through"
                                : "text-text-secondary"
                            }`}
                          >
                            {todo.description}
                          </p>
                        )}

                        {/* Metadata */}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {todo.priority && (
                            <Badge
                              variant={getPriorityColor(todo.priority)}
                              size="sm"
                            >
                              {todo.priority}
                            </Badge>
                          )}
                          {todo.due_date && (
                            <div
                              className={`flex items-center gap-1 text-xs ${
                                overdue && !todo.completed
                                  ? "text-red-500"
                                  : "text-text-secondary"
                              }`}
                            >
                              {overdue && !todo.completed && (
                                <AlertCircle className="w-3 h-3" />
                              )}
                              <Calendar className="w-3 h-3" />
                              <span>
                                {format(new Date(todo.due_date), "MMM d, yyyy")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        disabled={isUpdating}
                        className="flex-shrink-0 p-2 text-text-secondary hover:text-red-500 transition-colors"
                        title="Delete todo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary */}
      {filteredTodos.length > 0 && (
        <div className="mt-6 p-4 rounded-lg bg-background border border-border">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs text-text-secondary mb-1">Active</p>
              <p className="text-lg font-bold text-accent-secondary">
                {activeTodos}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">Completed</p>
              <p className="text-lg font-bold text-accent-success">
                {completedTodos}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
