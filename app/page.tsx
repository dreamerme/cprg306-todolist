'use client';

import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import TodoList from './components/TodoList';

export default function Home() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Todo List</h1>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="mt-8">
        <TodoList />
      </main>
    </div>
  );
}
