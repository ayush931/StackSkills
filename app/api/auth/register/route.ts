import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaClient';
import { checkRateLimit, hashPassword } from '@/utils/secure';
import { sendEmail } from '@/utils/nodemailer';
import verifyEmailTemplate from '@/lib/verifyEmailTemplate';
import { generateToken } from '@/utils/token';
import { userRegistrationSchema } from '@/schema/userSchemaValidation';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      console.error('Missing SMTP configuration');
      return NextResponse.json(
        { success: false, message: 'Email service not configured' },
        { status: 500 }
      );
    }

    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    let validatedData;
    try {
      validatedData = userRegistrationSchema.parse(requestBody);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: error,
        },
        { status: 400 }
      );
    }

    const { name, email, password, phone } = validatedData;

    if (!name || !email || !password || !phone) {
      return NextResponse.json({ success: false, message: 'All fields required' }, { status: 400 });
    }

    const clientIP =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    const rateLimitCheck = checkRateLimit(`register:${clientIP}`);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many registration attempts, Please try later',
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

    const checkUser = await prisma.user.findUnique({
      where: { email },
    });

    if (checkUser) {
      return NextResponse.json(
        { success: false, error: 'User already exists, Please login!!!' },
        { status: 400 }
      );
    }

    const hashResult = await hashPassword(password);
    if (!hashResult.success || !hashResult.hash) {
      return NextResponse.json(
        {
          success: false,
          message: 'Password must have a lowercase, uppercase and special character in it',
        },
        { status: 500 }
      );
    }
    const hashedPassword = hashResult.hash;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const mailSendResult = await sendEmail({
      to: email,
      subject: 'Verification Email from StackSkills',
      html: verifyEmailTemplate(email, parseInt(otp)),
    });

    if (!mailSendResult.success) {
      return NextResponse.json(
        { success: false, message: mailSendResult.message || 'Unable to send verification email' },
        { status: 500 }
      );
    }

    try {
      const testPayload = {
        id: 'temp-id',
        role: 'USER',
      };
      generateToken(testPayload);
    } catch (tokenError) {
      console.error('Token generation test failed:', tokenError);
      return NextResponse.json(
        { success: false, message: 'Authentication service configuration error' },
        { status: 500 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        otp: otp,
        otpExpiry: new Date(Date.now() + 15 * 60 * 1000),
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

    const token = generateToken({
      id: user.id!,
      role: user.role!,
    });

    const response = NextResponse.json(
      { success: true, message: 'Registration successful', user },
      { status: 201 }
    );

    response.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'strict',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);

    let errorMessage = 'Internal server error';

    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        errorMessage = 'Email already exists';
      } else if (error.message.includes('Database')) {
        errorMessage = 'Database connection error';
      } else if (error.message.includes('JWT') || error.message.includes('audience')) {
        errorMessage = 'Authentication service error';
      } else {
        console.error('Unexpected error during registration:', error.message);
        errorMessage = 'Registration failed. Please try again.';
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
}
