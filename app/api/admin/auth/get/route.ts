import { AdminAuthenticatedRequest, authenticateAdmin } from '@/middleware/adminMiddleware';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaClient';

export const GET = authenticateAdmin(async (request: AdminAuthenticatedRequest) => {
  try {
    const currentUser = request.admin;

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findMany();

    if (!user) {
      return NextResponse.json({ success: false, message: '' }, { status: 400 });
    }

    const response = NextResponse.json(
      { success: true, message: 'User details', user },
      { status: 200 }
    );

    return response;
  } catch (error) {
    return NextResponse.json({ error });
  }
});
