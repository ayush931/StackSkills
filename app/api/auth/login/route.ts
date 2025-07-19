import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaClient';
import { checkRateLimit, comparePassword } from '@/utils/secure';
import { generateToken } from '@/utils/token';
import { userLoginSchema } from '@/schema/userSchemaValidation';

export async function POST(request: NextRequest) {
  try {
    let requestBody;

    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON or input in request body', error },
        { status: 500 }
      );
    }

    let validateData;

    try {
      validateData = userLoginSchema.parse(requestBody);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', error },
        { status: 401 }
      );
    }

    const { email, password } = validateData;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    const clientIP =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    const rateLimitCheck = checkRateLimit(`login:${email}:${clientIP}`);

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many login attempt, Please try again',
          resetTime: rateLimitCheck.resetTime,
        },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        password: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not exists, Please register!!!' },
        { status: 400 }
      );
    }

    const checkPassword = await comparePassword(password, String(user.password));

    if (!checkPassword.success || !checkPassword.isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials!!!' },
        { status: 400 }
      );
    }

    const token = generateToken({
      id: user.id!,
      role: user.role!,
    });

    try {
      const testPayload = {
        id: 'test-id',
        role: 'USER',
      };
      generateToken(testPayload);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Authentication failed while creating token', error },
        { status: 401 }
      );
    }

    const response = NextResponse.json(
      { success: true, message: 'User logged in successfully', user },
      { status: 200 }
    );

    response.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'strict',
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error });
  }
}
