import { AuthenticatedRequest } from '@/middleware/authMiddleware';
import { blacklistToken, verifyToken } from '@/utils/token';
import { NextResponse } from 'next/server';

export async function GET(request: AuthenticatedRequest) {
  try {
    let token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      token = request.cookies.get('auth-token')?.value;
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No authentication provided' },
        { status: 401 }
      );
    }

    const decode = verifyToken(token);

    if (!decode || !decode.jti) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    blacklistToken(decode.jti);

    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );

    response.cookies.set({
      name: 'auth-token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      sameSite: 'strict',
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error });
  }
}
