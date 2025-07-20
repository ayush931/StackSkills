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
        { success: false, message: 'User already logged out' },
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

    try {
      blacklistToken(decode.jti);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to blacklist token', error },
        { status: 400 }
      );
    }

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
    const response = NextResponse.json(
      { success: false, message: 'An error during logout' },
      { status: 500 }
    );

    response.cookies.set({
      name: 'auth-token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      sameSite: 'strict',
    });
  }
}
