import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/firebase/admin';

// Helper function to verify auth token
async function verifyAuthToken(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
      console.log('No token provided');
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }
    
    console.log('Token:', token.substring(0, 10) + '...');
    const decodedToken = await adminAuth.verifyIdToken(token);
    console.log('Token verified for user:', decodedToken.uid);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid token' },
      { status: 401 }
    );
  }
}

// GET /api/todos
export async function GET(request: NextRequest) {
  console.log('GET /api/todos - Start');
  try {
    const decodedToken = await verifyAuthToken(request);
    
    // Check if verifyAuthToken returned an error response
    if (decodedToken instanceof NextResponse) {
      console.log('Auth error:', decodedToken);
      return decodedToken;
    }

    const userId = decodedToken.uid;
    console.log('Fetching todos for user:', userId);
    
    const todosRef = adminDb.collection(`users/${userId}/todos`);
    const snapshot = await todosRef.orderBy('createdAt', 'desc').get();
    
    const todos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('Successfully fetched todos:', todos.length);
    return NextResponse.json(todos);
  } catch (error) {
    console.error('Error in GET /api/todos:', error);
    // 确保错误响应始终是 JSON 格式
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal Server Error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/todos
export async function POST(request: NextRequest) {
  console.log('POST /api/todos - Start');
  try {
    const decodedToken = await verifyAuthToken(request);
    
    // Check if verifyAuthToken returned an error response
    if (decodedToken instanceof NextResponse) {
      console.log('Auth error:', decodedToken);
      return decodedToken;
    }

    const userId = decodedToken.uid;
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid todo text' },
        { status: 400 }
      );
    }

    const todoRef = adminDb.collection(`users/${userId}/todos`).doc();
    const todo = {
      text,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await todoRef.set(todo);
    console.log('Created new todo:', todoRef.id);

    return NextResponse.json({
      id: todoRef.id,
      ...todo
    });
  } catch (error) {
    console.error('Error in POST /api/todos:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal Server Error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// PATCH /api/todos
export async function PATCH(request: NextRequest) {
  console.log('PATCH /api/todos - Start');
  try {
    const decodedToken = await verifyAuthToken(request);
    
    // Check if verifyAuthToken returned an error response
    if (decodedToken instanceof NextResponse) {
      console.log('Auth error:', decodedToken);
      return decodedToken;
    }

    const userId = decodedToken.uid;
    const { id, completed } = await request.json();

    if (!id || typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const todoRef = adminDb.collection(`users/${userId}/todos`).doc(id);
    const todo = await todoRef.get();

    if (!todo.exists) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    await todoRef.update({
      completed,
      updatedAt: new Date()
    });

    console.log('Updated todo:', id);
    return NextResponse.json({
      id,
      ...todo.data(),
      completed
    });
  } catch (error) {
    console.error('Error in PATCH /api/todos:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal Server Error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE /api/todos
export async function DELETE(request: NextRequest) {
  console.log('DELETE /api/todos - Start');
  try {
    const decodedToken = await verifyAuthToken(request);
    
    // Check if verifyAuthToken returned an error response
    if (decodedToken instanceof NextResponse) {
      console.log('Auth error:', decodedToken);
      return decodedToken;
    }

    const userId = decodedToken.uid;
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Todo ID is required' },
        { status: 400 }
      );
    }

    const todoRef = adminDb.collection(`users/${userId}/todos`).doc(id);
    const todo = await todoRef.get();

    if (!todo.exists) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    await todoRef.delete();
    console.log('Deleted todo:', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/todos:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal Server Error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
