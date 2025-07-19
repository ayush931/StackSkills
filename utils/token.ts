import jwt from 'jsonwebtoken';
import crypto from 'crypto';

interface PayloadToken {
  id: string;
  role: string;
}

interface JWTPayload extends PayloadToken {
  jti?: string;
  iss?: string;
  aud?: string;
  exp?: number
}

const JWT_TOKEN = process.env.JWT_TOKEN as string;
const JWT_EXPIRY = process.env.JWT_EXPIRY as unknown as number;

if (!JWT_TOKEN || JWT_TOKEN.length < 32) {
  throw new Error("JWT_TOKEN must be at least 32 character long")
}

export const generateToken = (user: PayloadToken): string => {
  const payload: JWTPayload = {
    id: user.id,
    role: user.role,
    jti: crypto.randomUUID(),
  }

  const options: jwt.SignOptions = {
    expiresIn: JWT_EXPIRY || '7d',
    algorithm: "HS256",
    issuer: "stackskills",
    audience: 'stackskills-users'
  };

  return jwt.sign(payload, JWT_TOKEN, options)
}

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const options: jwt.VerifyOptions = {
      algorithms: ['HS256'],
      issuer: 'stackskills',
      audience: 'stackskills-users'
    }

    const decode = jwt.verify(token, JWT_TOKEN, options) as JWTPayload

    if (!decode.id || !decode.role) {
      return null;
    }

    return decode;
  } catch (error) {
    return null;
  }
}

export const refreshToken = (oldToken: string): string | null => {
  try {
    const decode = verifyToken(oldToken);

    if (!decode) {
      return null;
    }

    // check if token is close to expiry (within 1 hour)
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = (decode.exp || 0) - now;

    if (timeUntilExpiry > 3600) {
      // if token still has more than 1 hr, don't refresh
      return null
    }

    return generateToken({
      id: decode.id,
      role: decode.role
    })
  } catch (error) {
    return null;
  }
}

export const getTokenPayload = (token: string): PayloadToken | null => {
  try {
    const decode = verifyToken(token)

    if (!decode) {
      return null;
    }

    return {
      id: decode.id,
      role: decode.role
    }
  } catch (error) {
    return null;
  }
}

const tokenBlacklist = new Set<string>();

export const blacklistToken = (jti: string): void => {
  tokenBlacklist.add(jti)
}

export const isTokenBlacklisted = (jti: string): boolean => {
  return tokenBlacklist.has(jti)
}

export const validateTokenNotBlacklisted = (token: string): boolean => {
  const decode = verifyToken(token);

  if (!decode || !decode.jti) {
    return false;
  }

  return !isTokenBlacklisted(decode.jti);
}