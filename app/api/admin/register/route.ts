import verifyEmailTemplate from '@/lib/verifyEmailTemplate';
import { adminRegistrationSchema } from '@/schema/userSchemaValidation';
import { sendEmail } from '@/utils/nodemailer';
import { checkRateLimit, hashPassword } from '@/utils/secure';
import { generateToken } from '@/utils/token';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaClient';
import { authenticateAdmin, AdminAuthenticatedRequest } from '@/middleware/adminMiddleware';

export const POST = authenticateAdmin(async (request: AdminAuthenticatedRequest) => {
  try {
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      return NextResponse.json(
        { success: false, message: 'SMTP credentials are missing' },
        { status: 500 }
      );
    }

    const currentAdmin = request.admin;

    if (!currentAdmin || currentAdmin.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Access Denied. Only ADMIN can access this route' },
        { status: 401 }
      );
    }

    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON in request body', error },
        { status: 400 }
      );
    }

    let validateData;
    try {
      validateData = adminRegistrationSchema.parse(requestBody);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', error },
        { status: 400 }
      );
    }

    const { name, email, password, phone, adminToken } = validateData;

    const ADMIN_SECRET = process.env.ADMIN_REGISTRATION_TOKEN;

    if (adminToken !== ADMIN_SECRET) {
      return NextResponse.json({ success: false, message: 'Invalid admin token' }, { status: 401 });
    }

    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    const clientIP =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    const rateLimitCheck = checkRateLimit(`admin-register:${currentAdmin.id}:${clientIP}`);

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many admin registration attempts. Please try again later',
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

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User already exists, Please login!!!' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    if (!hashedPassword.success || !hashedPassword.hash) {
      return NextResponse.json(
        { success: false, message: hashedPassword.error || 'Failed to process password hashing' },
        { status: 500 }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const mailSendResult = await sendEmail({
      to: email,
      subject: 'ADMIN account verification - StackSkills',
      html: verifyEmailTemplate(name, parseInt(otp)),
    });

    if (!mailSendResult.success) {
      return NextResponse.json(
        { success: false, message: mailSendResult.message || 'Unable to send verification email' },
        { status: 500 }
      );
    }

    try {
      const testPayload = {
        id: 'temp-admin-id',
        role: 'ADMIN',
      };
      generateToken(testPayload);
    } catch (tokenError) {
      console.error('Token generation test failed:', tokenError);
      return NextResponse.json(
        { success: false, message: 'Authentication service configuration error' },
        { status: 500 }
      );
    }

    const adminUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword.hash,
        phone,
        role: 'ADMIN',
        otp: otp,
        otpExpiry: new Date(Date.now() + 15 * 60 * 1000),
        verifyEmail: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: false,
        role: true,
        otp: false,
        otpExpiry: true,
        verifyEmail: true,
      },
    });

    const jwtToken = generateToken({
      id: adminUser.id,
      role: adminUser.role,
    });

    const response = NextResponse.json(
      { success: true, message: 'ADMIN registered successfully', user: adminUser },
      { status: 201 }
    );

    response.cookies.set({
      name: 'admin-token',
      value: jwtToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'strict',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Admin registration error:', error);

    let errorMessage = 'Internal server error';

    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        errorMessage = 'Email already exists';
      } else if (error.message.includes('Database')) {
        errorMessage = 'Database connection error';
      } else if (error.message.includes('JWT') || error.message.includes('audience')) {
        errorMessage = 'Authentication service error';
      } else {
        console.error('Unexpected error during admin registration:', error.message);
        errorMessage = 'Admin registration failed. Please try again.';
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status: 500 }
    );
  }
});
