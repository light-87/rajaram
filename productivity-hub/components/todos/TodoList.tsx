"use client";

import { Todo } from "@/types/database";
import { List, Check, X, Trash2, Calendar, AlertCircle, Clock, Star, FileText } from "lucide-react";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { CheckSquare } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/Toast";
import { format, isToday, isThisWeek, isPast, startOfDay } from "date-fns";

interface TodoListProps {
  todos: Todo[];
  onRefresh: () => void;
}

type FilterType = "all" | "active" | "completed";

type TodoSection = "overdue" | "today" | "thisWeek" | "highPriority" | "mediumPriority" | "lowPriority" | "other" | "completed";

export default function TodoList({ todos, onRefresh }: TodoListProps) {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<FilterType>("all");
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const getPriorityValue = (priority?: string): number => {
    switch (priority) {
      case "high": return 3;
      case "medium": return 2;
      case "low": return 1;
      default: return 0;
    }
  };

  const getTodoSection = (todo: Todo): TodoSection => {
    if (todo.completed) return "completed";

    const now = new Date();
    const dueDate = todo.due_date ? new Date(todo.due_date) : null;

    if (dueDate) {
      const dueDateStart = startOfDay(dueDate);
      const todayStart = startOfDay(now);

      if (dueDateStart < todayStart) return "overdue";
      if (isToday(dueDate)) return "today";
      if (isThisWeek(dueDate, { weekStartsOn: 1 })) return "thisWeek";
    }

    // No due date, sort by priority
    if (todo.priority === "high") return "highPriority";
    if (todo.priority === "medium") return "mediumPriority";
    if (todo.priority === "low") return "lowPriority";

    return "other";
  };

  const sortTodos = (todos: Todo[]): Todo[] => {
    return [...todos].sort((a, b) => {
      const sectionA = getTodoSection(a);
      const sectionB = getTodoSection(b);

      // Define section order
      const sectionOrder: TodoSection[] = [
        "overdue",
        "today",
        "thisWeek",
        "highPriority",
        "mediumPriority",
        "lowPriority",
        "other",
        "completed"
      ];

      const orderA = sectionOrder.indexOf(sectionA);
      const orderB = sectionOrder.indexOf(sectionB);

      if (orderA !== orderB) return orderA - orderB;

      // Within same section, sort by:
      // 1. Due date sections: earliest first
      if (["overdue", "today", "thisWeek"].includes(sectionA)) {
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
      }

      // 2. Priority sections: then by due date if exists
      if (["highPriority", "mediumPriority", "lowPriority"].includes(sectionA)) {
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        if (a.due_date && !b.due_date) return -1;
        if (!a.due_date && b.due_date) return 1;
      }

      // 3. Completed: most recent first
      if (sectionA === "completed") {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }

      // 4. Other: by priority, then created date
      const priorityDiff = getPriorityValue(b.priority) - getPriorityValue(a.priority);
      if (priorityDiff !== 0) return priorityDiff;

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  };

  const groupedTodos = (todos: Todo[]) => {
    const groups: Record<TodoSection, Todo[]> = {
      overdue: [],
      today: [],
      thisWeek: [],
      highPriority: [],
      mediumPriority: [],
      lowPriority: [],
      other: [],
      completed: []
    };

    todos.forEach(todo => {
      const section = getTodoSection(todo);
      groups[section].push(todo);
    });

    return groups;
  };

  const filteredTodos = todos.filter((todo) => {
    if (filter === "all") return true;
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  const sortedTodos = sortTodos(filteredTodos);
  const grouped = groupedTodos(sortedTodos);

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
        return "danger";
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
      <div className="space-y-6">
        {filteredTodos.length === 0 ? (
          <p className="text-center text-text-secondary py-8">
            No {filter === "all" ? "" : filter} todos
          </p>
        ) : (
          <>
            {/* Overdue Section */}
            {grouped.overdue.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-red-500/30">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wide">
                    Overdue ({grouped.overdue.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {grouped.overdue.map((todo) => renderTodo(todo, true))}
                </div>
              </div>
            )}

            {/* Due Today Section */}
            {grouped.today.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-accent-primary/30">
                  <Clock className="w-4 h-4 text-accent-primary" />
                  <h3 className="text-sm font-semibold text-accent-primary uppercase tracking-wide">
                    Today ({grouped.today.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {grouped.today.map((todo) => renderTodo(todo))}
                </div>
              </div>
            )}

            {/* This Week Section */}
            {grouped.thisWeek.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-accent-secondary/30">
                  <Calendar className="w-4 h-4 text-accent-secondary" />
                  <h3 className="text-sm font-semibold text-accent-secondary uppercase tracking-wide">
                    This Week ({grouped.thisWeek.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {grouped.thisWeek.map((todo) => renderTodo(todo))}
                </div>
              </div>
            )}

            {/* High Priority Section */}
            {grouped.highPriority.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-red-500/20">
                  <Star className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
                    High Priority ({grouped.highPriority.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {grouped.highPriority.map((todo) => renderTodo(todo))}
                </div>
              </div>
            )}

            {/* Medium Priority Section */}
            {grouped.mediumPriority.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
                  <Star className="w-4 h-4 text-accent-primary" />
                  <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
                    Medium Priority ({grouped.mediumPriority.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {grouped.mediumPriority.map((todo) => renderTodo(todo))}
                </div>
              </div>
            )}

            {/* Low Priority Section */}
            {grouped.lowPriority.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
                  <Star className="w-4 h-4 text-accent-secondary" />
                  <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
                    Low Priority ({grouped.lowPriority.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {grouped.lowPriority.map((todo) => renderTodo(todo))}
                </div>
              </div>
            )}

            {/* Other Section */}
            {grouped.other.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
                  <FileText className="w-4 h-4 text-text-secondary" />
                  <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                    Other ({grouped.other.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {grouped.other.map((todo) => renderTodo(todo))}
                </div>
              </div>
            )}

            {/* Completed Section */}
            {grouped.completed.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-accent-success/30">
                  <Check className="w-4 h-4 text-accent-success" />
                  <h3 className="text-sm font-semibold text-accent-success uppercase tracking-wide">
                    Completed ({grouped.completed.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {grouped.completed.map((todo) => renderTodo(todo))}
                </div>
              </div>
            )}
          </>
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

  // Helper function to render a single todo
  function renderTodo(todo: Todo, highlight = false) {
    const overdue = isOverdue(todo.due_date);
    const isUpdating = updatingIds.has(todo.id);

    return (
      <div
        key={todo.id}
        className={`p-4 rounded-lg border transition-all ${
          highlight && !todo.completed
            ? "bg-red-500/5 border-red-500/30"
            : todo.completed
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
  }
}
