"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Todo } from "@/types/database";
import { CheckSquare, Plus } from "lucide-react";
import TodoForm from "@/components/todos/TodoForm";
import TodoList from "@/components/todos/TodoList";
import Loading from "@/components/ui/Loading";
import Modal from "@/components/ui/Modal";

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleTodoAdded = () => {
    fetchTodos();
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loading text="Loading todos..." />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-accent-secondary" />
            <h1 className="text-3xl font-bold text-text-primary">Todos</h1>
          </div>

          {/* Desktop Add Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-accent-secondary text-white rounded-lg hover:bg-accent-secondary/90 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Todo
          </button>
        </div>

        <TodoList todos={todos} onRefresh={fetchTodos} />
      </div>

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-accent-secondary text-white rounded-full shadow-lg hover:bg-accent-secondary/90 transition-all flex items-center justify-center z-40 hover:scale-110"
        aria-label="Add todo"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add Todo Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Todo"
        size="lg"
      >
        <TodoForm onTodoAdded={handleTodoAdded} />
      </Modal>
    </>
  );
}
