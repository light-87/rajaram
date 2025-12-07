"use client";

import { useState } from "react";
import { Todo, TodoStatus, TodoPriority } from "@/types/database";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/components/ui/Toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import {
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Calendar,
  AlertCircle,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { formatDate, isToday } from "@/lib/utils";

interface TodoListProps {
  todos: Todo[];
  onTodoUpdated: () => void;
}

export default function TodoList({ todos, onTodoUpdated }: TodoListProps) {
  const [filterStatus, setFilterStatus] = useState<TodoStatus | "all">("all");
  const [filterPriority, setFilterPriority] = useState<TodoPriority | "all">("all");
  const [expandedTodos, setExpandedTodos] = useState<Set<string>>(new Set());

  const toggleExpanded = (todoId: string) => {
    const newExpanded = new Set(expandedTodos);
    if (newExpanded.has(todoId)) {
      newExpanded.delete(todoId);
    } else {
      newExpanded.add(todoId);
    }
    setExpandedTodos(newExpanded);
  };

  const filteredTodos = todos.filter((todo) => {
    if (filterStatus !== "all" && todo.status !== filterStatus) return false;
    if (filterPriority !== "all" && todo.priority !== filterPriority) return false;
    return true;
  });

  const handleStatusChange = async (todoId: string, newStatus: TodoStatus) => {
    try {
      const updateData: any = { status: newStatus };

      if (newStatus === "completed") {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }

      const { error } = await supabase
        .from("todos")
        .update(updateData)
        .eq("id", todoId);

      if (error) throw error;

      showToast("Todo updated successfully!", "success");
      onTodoUpdated();
    } catch (error) {
      console.error("Error updating todo:", error);
      showToast("Failed to update todo", "error");
    }
  };

  const handleDelete = async (todoId: string) => {
    if (!confirm("Are you sure you want to delete this todo?")) return;

    try {
      const { error } = await supabase.from("todos").delete().eq("id", todoId);

      if (error) throw error;

      showToast("Todo deleted successfully!", "success");
      onTodoUpdated();
    } catch (error) {
      console.error("Error deleting todo:", error);
      showToast("Failed to delete todo", "error");
    }
  };

  const getStatusIcon = (status: TodoStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-accent-success" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-accent-secondary" />;
      default:
        return <Circle className="w-5 h-5 text-text-secondary" />;
    }
  };

  const getPriorityColor = (priority: TodoPriority) => {
    switch (priority) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-accent-primary";
      case "low":
        return "text-accent-success";
    }
  };

  const isPastDue = (dueDate: string | undefined) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  const isDueToday = (dueDate: string | undefined) => {
    if (!dueDate) return false;
    return isToday(dueDate);
  };

  if (todos.length === 0) {
    return (
      <EmptyState
        title="No todos yet"
        description="Add your first todo to get started"
        icon={<CheckCircle2 className="w-12 h-12" />}
      />
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-text-primary">
          Your Todos ({filteredTodos.length})
        </h2>

        <div className="flex gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TodoStatus | "all")}
            className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as TodoPriority | "all")}
            className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {filteredTodos.length === 0 ? (
        <p className="text-text-secondary text-center py-8">
          No todos match your filters
        </p>
      ) : (
        <div className="space-y-3">
          {filteredTodos.map((todo) => {
            const isExpanded = expandedTodos.has(todo.id);
            const pastDue = isPastDue(todo.due_date);
            const dueToday = isDueToday(todo.due_date);

            return (
              <div
                key={todo.id}
                className={`border border-border rounded-lg p-4 transition-all ${
                  todo.status === "completed" ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => {
                      const statusOrder: TodoStatus[] = ["pending", "in_progress", "completed"];
                      const currentIndex = statusOrder.indexOf(todo.status);
                      const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
                      handleStatusChange(todo.id, nextStatus);
                    }}
                    className="mt-0.5 hover:scale-110 transition-transform"
                  >
                    {getStatusIcon(todo.status)}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3
                          className={`text-text-primary font-medium ${
                            todo.status === "completed" ? "line-through" : ""
                          }`}
                        >
                          {todo.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant={
                            todo.status === "completed" ? "success" :
                            todo.status === "in_progress" ? "info" : "default"
                          }>
                            {todo.status.replace("_", " ")}
                          </Badge>

                          <span className={`text-xs font-medium ${getPriorityColor(todo.priority)}`}>
                            {todo.priority.toUpperCase()}
                          </span>

                          {todo.due_date && (
                            <div className={`flex items-center gap-1 text-xs ${
                              pastDue ? "text-red-500" :
                              dueToday ? "text-accent-primary" :
                              "text-text-secondary"
                            }`}>
                              {pastDue && <AlertCircle className="w-3 h-3" />}
                              <Calendar className="w-3 h-3" />
                              <span>
                                {dueToday ? "Due Today" :
                                 pastDue ? "Overdue" :
                                 `Due ${new Date(todo.due_date).toLocaleDateString()}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {todo.description && (
                          <button
                            onClick={() => toggleExpanded(todo.id)}
                            className="text-text-secondary hover:text-text-primary transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5" />
                            ) : (
                              <ChevronRight className="w-5 h-5" />
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(todo.id)}
                          className="text-text-secondary hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && todo.description && (
                      <p className="mt-3 text-sm text-text-secondary whitespace-pre-wrap">
                        {todo.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
