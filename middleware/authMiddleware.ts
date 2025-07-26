import { validateTokenNotBlacklisted, verifyToken } from '@/utils/token';
import { NextRequest, NextResponse } from 'next/server';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    role: string;
  };
  token?: string;
}

export const authenticateToken = (
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) => {
  return async (req: AuthenticatedRequest): Promise<NextResponse> => {
    try {
      let token = req.headers.get('authorization')?.replace('Bearer ', '');

      if (!token) {
        token = req.cookies.get('auth-token')?.value;
      }

      if (!token) {
        return NextResponse.json(
          { success: false, message: 'Access token required' },
          { status: 401 }
        );
      }

      const decode = verifyToken(token);

      if (!decode) {
        return NextResponse.json(
          { success: false, message: 'Invalid or expired token' },
          { status: 401 }
        );
      }

      if (!validateTokenNotBlacklisted(token)) {
        return NextResponse.json(
          { success: false, message: 'Token has been revoked' },
          { status: 401 }
        );
      }

      (req as AuthenticatedRequest).user = {
        id: decode.id,
        role: decode.role,
      };

      return handler(req as AuthenticatedRequest);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Authentication failed', error: error instanceof Error },
        { status: 401 }
      );
    }
  };
};

export const requiredRole = (allowedRoles: string[]) => {
  return (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
    return authenticateToken(async (req: AuthenticatedRequest) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return NextResponse.json(
          { success: false, message: 'Insufficient permissions' },
          { status: 403 }
        );
      }
      return handler(req);
    });
  };
};

export const config = {
  matcher: ['/api/auth/logout'],
};
