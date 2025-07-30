import { AdminAuthenticatedRequest } from '@/middleware/adminMiddleware';
import { adminLoginSchema } from '@/schema/userSchemaValidation';
import { checkRateLimit, comparePassword } from '@/utils/secure';
import { generateToken, verifyToken } from '@/utils/token';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaClient';

export async function POST(request: AdminAuthenticatedRequest) {
  try {
    let existingToken = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!existingToken) {
      existingToken = request.cookies.get('admin-token')?.value;
    }

    if (existingToken) {
      const decode = verifyToken(existingToken);
      if (decode && decode.role === 'ADMIN') {
        const existingUser = await prisma.user.findUnique({
          where: { id: decode.id },
          select: {
            id: true,
            email: true,
            role: true,
          },
        });

        if (existingUser) {
          return NextResponse.json(
            { success: false, message: 'ADMIN is already logged in' },
            { status: 400 }
          );
        }
      }
    }

    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      return NextResponse.json(
        { success: false, message: 'SMTP token is not available' },
        { status: 400 }
      );
    }

    const adminLoginToken = process.env.ADMIN_LOGIN_TOKEN;

    let requestBody;

    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON or input in request body', error },
        { status: 400 }
      );
    }

    const requestWithToken = {
      ...requestBody,
      adminToken: requestBody.adminToken,
    };

    let validateData;

    try {
      validateData = adminLoginSchema.parse(requestWithToken);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', error },
        { status: 400 }
      );
    }

    const { email, password, adminToken } = validateData;

    if (!email || !password || !adminToken) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    if (adminToken !== adminLoginToken) {
      return NextResponse.json({ success: false, message: 'Invalid login token' }, { status: 401 });
    }

    const clientIP =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'undefined';

    const rateLimitCheck = checkRateLimit(`admin-login:${clientIP}`);

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many login attempt, Please try again!!!',
          resetTime: rateLimitCheck.resetTime,
        },
        { status: 429 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    const user = await prisma?.user.findUnique({
      where: { email },
      select: {
        id: true,
        password: true,
        role: true,
      },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'ADMIN does not exists, Please register!!!' },
        { status: 400 }
      );
    }

    const checkPassword = await comparePassword(password, String(user.password));

    if (!checkPassword.isMatch || !checkPassword.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials, Please try again' },
        { status: 401 }
      );
    }

    const jwtToken = generateToken({
      id: user.id,
      role: user.role,
    });

    if (!jwtToken) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch token' },
        { status: 401 }
      );
    }

    try {
      const testPayload = {
        id: 'admin-id',
        role: 'ADMIN',
      };
      generateToken(testPayload);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Authentication failed while creating token', error },
        { status: 401 }
      );
    }

    const response = NextResponse.json(
      { success: true, message: 'User logged in successfull', user },
      { status: 201 }
    );

    response.cookies.set({
      name: 'admin-token',
      value: jwtToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'strict',
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
