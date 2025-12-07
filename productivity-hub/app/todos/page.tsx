"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Todo, TodoStatus } from "@/types/database";
import TodoForm from "@/components/todos/TodoForm";
import TodoList from "@/components/todos/TodoList";
import Loading from "@/components/ui/Loading";
import { CheckCircle2, Clock, Circle, TrendingUp } from "lucide-react";

export default function TodosPage() {
  const { isAuthenticated } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTodos();
    }
  }, [isAuthenticated]);

  const fetchTodos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTodos(data || []);
    } catch (error) {
      console.error("Error fetching todos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  const pendingCount = todos.filter((t) => t.status === "pending").length;
  const inProgressCount = todos.filter((t) => t.status === "in_progress").length;
  const completedCount = todos.filter((t) => t.status === "completed").length;
  const completionRate = todos.length > 0
    ? Math.round((completedCount / todos.length) * 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Todo List</h1>
        <p className="text-text-secondary">
          Manage your tasks and stay organized
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Pending</p>
              <p className="text-2xl font-bold text-text-primary mt-1">
                {pendingCount}
              </p>
            </div>
            <Circle className="w-8 h-8 text-text-secondary" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">In Progress</p>
              <p className="text-2xl font-bold text-accent-secondary mt-1">
                {inProgressCount}
              </p>
            </div>
            <Clock className="w-8 h-8 text-accent-secondary" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Completed</p>
              <p className="text-2xl font-bold text-accent-success mt-1">
                {completedCount}
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-accent-success" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Completion Rate</p>
              <p className="text-2xl font-bold text-accent-primary mt-1">
                {completionRate}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-accent-primary" />
          </div>
        </div>
      </div>

      {/* Add Todo Form */}
      <TodoForm onTodoAdded={fetchTodos} />

      {/* Todo List */}
      <TodoList todos={todos} onTodoUpdated={fetchTodos} />
    </div>
  );
}
