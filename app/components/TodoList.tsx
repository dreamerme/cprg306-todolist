'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTodos, createTodo, updateTodo, deleteTodo } from '../utils/api';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchTodos() {
      try {
        setError(null);
        const fetchedTodos = await getTodos();
        setTodos(fetchedTodos);
      } catch (error) {
        console.error('Error fetching todos:', error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('Failed to load todos. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchTodos();
  }, [user]);

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!newTodo.trim()) {
      setError('Todo text cannot be empty');
      return;
    }

    try {
      setError(null);
      const todo = await createTodo(newTodo.trim());
      setTodos(prev => [todo, ...prev]);
      setNewTodo('');
    } catch (error) {
      console.error('Error adding todo:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to add todo. Please try again.');
      }
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    if (!user) return;

    try {
      setError(null);
      const updatedTodo = await updateTodo(id, completed);
      setTodos(prev =>
        prev.map(todo =>
          todo.id === id ? updatedTodo : todo
        )
      );
    } catch (error) {
      console.error('Error updating todo:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to update todo. Please try again.');
      }
    }
  };

  const removeTodo = async (id: string) => {
    if (!user) return;

    try {
      setError(null);
      await deleteTodo(id);
      setTodos(prev => prev.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to delete todo. Please try again.');
      }
    }
  };

  if (!user) {
    return (
      <div className="text-center p-4">
        <p>Please sign in to manage your todos.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <form onSubmit={addTodo} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add a new todo..."
            className="flex-1 p-2 border rounded focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
          >
            Add
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center">
          <p>Loading todos...</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id, !todo.completed)}
                className="h-5 w-5"
              />
              <span className={`flex-1 ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                {todo.text}
              </span>
              <button
                onClick={() => removeTodo(todo.id)}
                className="px-2 py-1 text-red-600 hover:bg-red-100 rounded"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && todos.length === 0 && (
        <div className="text-center text-gray-500">
          <p>No todos yet. Add one above!</p>
        </div>
      )}
    </div>
  );
}
