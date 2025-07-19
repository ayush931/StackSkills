import { verifyToken } from '@/utils/token';
import { NextRequest, NextResponse } from 'next/server';

export interface AdminAuthenticatedRequest extends NextRequest {
  admin?: {
    id: string;
    role: string;
  };
}

export const authenticateAdmin = (
  handler: (req: AdminAuthenticatedRequest) => Promise<NextResponse>
) => {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      let token = req.headers.get('authorization')?.replace('Bearer ', '');

      if (!token) {
        token = req.cookies.get('admin-token')?.value;
      }

      if (!token) {
        return NextResponse.json(
          { success: false, message: 'Admin authentication required' },
          { status: 401 }
        );
      }

      const decode = verifyToken(token);

      if (!decode) {
        return NextResponse.json(
          { success: false, message: 'Invalid or expired admin token' },
          { status: 401 }
        );
      }

      if (decode.role !== 'ADMIN') {
        return NextResponse.json(
          { success: false, message: 'ADMIN access required' },
          { status: 403 }
        );
      }

      (req as AdminAuthenticatedRequest).admin = {
        id: decode.id,
        role: decode.role,
      };

      return handler(req as AdminAuthenticatedRequest);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'ADMIN authentication failed', error: error instanceof Error },
        { status: 401 }
      );
    }
  };
};

// for future use if needed different admin levels

export const requireSuperAdmin = (
  handler: (req: AdminAuthenticatedRequest) => Promise<NextResponse>
) => {
  return authenticateAdmin(async (req: AdminAuthenticatedRequest) => {
    // for different admin levels
    return handler(req);
  });
};

export const config = {
  matcher: ['/api/admin/logout'],
};
