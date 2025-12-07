"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Todo } from "@/types/database";
import { CheckSquare } from "lucide-react";
import TodoForm from "@/components/todos/TodoForm";
import TodoList from "@/components/todos/TodoList";
import Loading from "@/components/ui/Loading";

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setTodos(data);
      }
    } catch (error) {
      console.error("Error fetching todos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loading text="Loading todos..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <CheckSquare className="w-8 h-8 text-accent-secondary" />
        <h1 className="text-3xl font-bold text-text-primary">Todos</h1>
      </div>

      <div className="space-y-8">
        <TodoForm onTodoAdded={fetchTodos} />
        <TodoList todos={todos} onRefresh={fetchTodos} />
      </div>
    </div>
  );
}
