import { NextRequest, NextResponse } from 'next/server';

// POST /api/admin/auth/login - Admin login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    // Get admin password from environment variable
    const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

    if (password === ADMIN_PASSWORD) {
      // In a real app, you'd generate a proper JWT token here
      const sessionData = {
        isAuthenticated: true,
        loginTime: new Date().toISOString(),
        sessionId: Math.random().toString(36).substr(2, 9),
      };

      return NextResponse.json({ 
        success: true, 
        session: sessionData 
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error during admin login:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}

// GET /api/admin/auth/verify - Verify admin session
export async function GET(request: NextRequest) {
  try {
    // In a real app, you'd validate a JWT token here
    // For now, we'll return a simple response
    return NextResponse.json({ 
      success: true, 
      message: 'Session verification endpoint' 
    });
  } catch (error) {
    console.error('Error verifying admin session:', error);
    return NextResponse.json(
      { success: false, error: 'Session verification failed' },
      { status: 500 }
    );
  }
} 