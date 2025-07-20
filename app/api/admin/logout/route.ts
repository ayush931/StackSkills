import { AdminAuthenticatedRequest } from "@/middleware/adminMiddleware";
import { blacklistToken, verifyToken } from "@/utils/token";
import { NextResponse } from "next/server";

export async function GET(request: AdminAuthenticatedRequest) {
  try {
    let token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      token = request.cookies.get('admin-token')?.value
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'ADMIN already logged out' },
        { status: 400 }
      )
    }

    const decode = verifyToken(token);

    if (!decode || !decode.jti) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    if (decode.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Only ADMIN can access this route' },
        { status: 401 }
      )
    }

    try {
      blacklistToken(decode.jti)
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to blacklist token', error },
        { status: 401 }
      )
    }

    const response = NextResponse.json(
      { success: true, message: 'Admin logged out successfully' },
      { status: 200 }
    )

    response.cookies.set({
      name: 'admin-token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      sameSite: 'strict'
    })

    return response;
  } catch (error) {
    const response = NextResponse.json(
      { success: false, message: 'Failed to logout', error },
      { status: 500 }
    )

    response.cookies.set({
      name: 'admin-token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      sameSite: 'strict'
    })
  }
}