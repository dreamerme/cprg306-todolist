import { auth } from '../firebase/config';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

async function getAuthToken() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user.getIdToken();
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  try {
    const token = await getAuthToken();
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred');
  }
}

export async function getTodos(): Promise<Todo[]> {
  const todos = await fetchWithAuth('/api/todos');
  return todos.map((todo: any) => ({
    ...todo,
    createdAt: new Date(todo.createdAt._seconds * 1000),
  }));
}

export async function createTodo(text: string): Promise<Todo> {
  const todo = await fetchWithAuth('/api/todos', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  return {
    ...todo,
    createdAt: new Date(todo.createdAt._seconds * 1000),
  };
}

export async function updateTodo(id: string, completed: boolean): Promise<Todo> {
  const todo = await fetchWithAuth('/api/todos', {
    method: 'PATCH',
    body: JSON.stringify({ id, completed }),
  });
  return {
    ...todo,
    createdAt: new Date(todo.createdAt._seconds * 1000),
  };
}

export async function deleteTodo(id: string): Promise<void> {
  await fetchWithAuth('/api/todos', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}
