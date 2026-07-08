import { NextRequest, NextResponse } from 'next/server';

const ADMIN_EMAIL = 'admin@portstudio.in';
const ADMIN_PASSWORD = 'adminportstudio@123';
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'fallback_secret';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Create a simple encoded session token
      const token = Buffer.from(
        JSON.stringify({ email, role: 'admin', ts: Date.now(), secret: SESSION_SECRET })
      ).toString('base64');

      const response = NextResponse.json({ success: true });
      response.cookies.set('admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
      });

      return response;
    }

    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
