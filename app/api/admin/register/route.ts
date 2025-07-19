import verifyEmailTemplate from '@/lib/verifyEmailTemplate';
import { adminRegistrationSchema } from '@/schema/userSchemaValidation';
import { sendEmail } from '@/utils/nodemailer';
import { checkRateLimit, hashPassword } from '@/utils/secure';
import { generateToken, getTokenPayload } from '@/utils/token';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      return NextResponse.json(
        { success: false, message: 'SMTP credentials are missing' },
        { status: 400 }
      );
    }

    let requestBody;

    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON in reuqest body', error: error },
        { status: 400 }
      );
    }

    let validateData;

    try {
      validateData = adminRegistrationSchema.parse(requestBody);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', error },
        { status: 401 }
      );
    }

    const { name, email, password, phone, adminToken } = validateData;

    const ADMIN_SECRET = process.env.ADMIN_REGISTRATION_TOKEN;

    if (adminToken !== ADMIN_SECRET) {
      return NextResponse.json({ success: false, message: 'Provide ADMIN token' }, { status: 401 });
    }

    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 401 }
      );
    }

    let token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      token = request.cookies.get('auth-token')?.value;
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authorization required!!!' },
        { status: 401 }
      );
    }

    const currentUser = getTokenPayload(token);
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Access denied, Only ADMIN can access this route' },
        { status: 403 }
      );
    }

    const clientIP =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    const rateLimitCheck = checkRateLimit(`admin-register:${currentUser.id}:${clientIP}`);

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many admin registration attempts. Please try again',
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

    const existingUser = await prisma?.user.findUnique({
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
        { success: false, message: hashedPassword.error || 'Failed to process hashing' },
        { status: 400 }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const mailSendResult = await sendEmail({
      to: email,
      subject: 'ADMIN account verification - Stack skills',
      html: verifyEmailTemplate(name, parseInt(otp)),
    });

    if (!mailSendResult.success) {
      return NextResponse.json(
        { success: false, message: 'Unable to send verification failed' },
        { status: 401 }
      );
    }

    try {
      const testPayload = {
        id: 'temp-id',
        role: 'ADMIN',
      };
      generateToken(testPayload);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Authentication service configuration error', error },
        { status: 500 }
      );
    }

    const adminUser = await prisma?.user.create({
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
        verifyEmail: true,
      },
    });

    if (!adminUser) {
      return NextResponse.json(
        { success: false, message: 'Failed to create admin user' },
        { status: 500 }
      );
    }

    const jwtToken = generateToken({
      id: adminUser.id,
      role: adminUser.role,
    });

    const response = NextResponse.json(
      { success: true, message: 'ADMIN registered successfully', adminUser },
      { status: 201 }
    );

    response.cookies.set({
      name: 'admin-token',
      value: jwtToken,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error });
  }
}
