import { AdminAuthenticatedRequest, authenticateAdmin } from '@/middleware/adminMiddleware';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaClient';

export const GET = authenticateAdmin(async (request: AdminAuthenticatedRequest) => {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname.split('/');
    const userId = pathname[pathname.length - 1];

    if (!userId || userId === 'route') {
      return NextResponse.json(
        { success: false, message: 'Invalid path is given' },
        { status: 400 }
      );
    }

    const currentAdmin = request.admin;

    if (!currentAdmin) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (currentAdmin.id !== userId) {
      return NextResponse.json(
        { success: false, message: 'Login with correct account' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'unable to fetch user' },
        { status: 401 }
      );
    }

    const response = NextResponse.json(
      { success: true, message: 'User details fetch', user },
      { status: 200 }
    );

    return response;
  } catch (error) {
    return NextResponse.json({ error });
  }
});
