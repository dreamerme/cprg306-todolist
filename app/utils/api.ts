import { auth } from '../firebase/config';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

interface FirestoreTodo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: {
    _seconds: number;
  };
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
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const finalUrl = !options.method || options.method === 'GET'
      ? `${url}?userId=${user.uid}`
      : url;

    console.log('Making API request to:', finalUrl);
    
    const response = await fetch(finalUrl, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Request failed:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
}

export async function getTodos(): Promise<Todo[]> {
  const todos = await fetchWithAuth('/api/todos') as FirestoreTodo[];
  return todos.map((todo) => ({
    ...todo,
    createdAt: new Date(todo.createdAt._seconds * 1000),
  }));
}

export async function createTodo(text: string): Promise<Todo> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const todo = await fetchWithAuth('/api/todos', {
    method: 'POST',
    body: JSON.stringify({ text, userId: user.uid }),
  }) as FirestoreTodo;

  return {
    ...todo,
    createdAt: new Date(todo.createdAt._seconds * 1000),
  };
}

export async function updateTodo(id: string, completed: boolean): Promise<Todo> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const todo = await fetchWithAuth('/api/todos', {
    method: 'PATCH',
    body: JSON.stringify({ id, completed, userId: user.uid }),
  }) as FirestoreTodo;

  return {
    ...todo,
    createdAt: new Date(todo.createdAt._seconds * 1000),
  };
}

export async function deleteTodo(id: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  await fetchWithAuth('/api/todos', {
    method: 'DELETE',
    body: JSON.stringify({ id, userId: user.uid }),
  });
}
