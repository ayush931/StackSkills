import { AuthenticatedRequest, authenticateToken } from '@/middleware/authMiddleware';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaClient';

export const GET = authenticateToken(async (request: AuthenticatedRequest) => {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname.split('/');
    const userId = pathname[pathname.length - 1];

    if (!userId || userId === 'route') {
      return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
    }

    const currentUser = request.user;

    if (currentUser?.id !== userId) {
      return NextResponse.json(
        { success: false, message: 'Login with correct account' },
        { status: 401 }
      );
    }

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createAt: true,
      },
    });

    if (!user || user.role !== 'USER') {
      return NextResponse.json(
        { success: false, message: 'Unable to fetch user' },
        { status: 400 }
      );
    }

    const response = NextResponse.json(
      { success: true, message: 'User data fetched', user },
      { status: 200 }
    );

    return response;
  } catch (error) {
    return NextResponse.json({ error });
  }
});
