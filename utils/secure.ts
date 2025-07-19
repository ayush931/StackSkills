import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 15;
const MAX_PASSWORD_LENGTH = 128;
const MIN_PASSWORD_LENGTH = 8;

interface PasswordStrength {
  isValid: boolean;
  score: number;
  feedback: string[];
}

export const validatePasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < MIN_PASSWORD_LENGTH) {
    feedback.push(`Password must be atleast ${MIN_PASSWORD_LENGTH} character long`);
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }

  // Character variety checks
  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  if (!/\d/.test(password)) {
    feedback.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    feedback.push('Password must contain at least one special character');
  } else {
    score += 1;
  }

  // Common password patterns
  const commonPatterns = [
    /(.)\1{2,}/, // Repeated characters
    /123456|654321|abcdef|qwerty|password|admin/i, // Common sequences
  ];

  commonPatterns.forEach(pattern => {
    if (pattern.test(password)) {
      feedback.push('Password contains common patterns and is easily guessable');
      score -= 2;
    }
  });

  const isValid = feedback.length === 0 && score >= 4;

  return {
    isValid,
    score: Math.max(0, score),
    feedback,
  };
};

export const hashPassword = async (
  userPassword: string
): Promise<{
  success: boolean;
  hash?: string;
  error?: string;
}> => {
  try {
    if (!userPassword || typeof userPassword !== 'string') {
      await new Promise(resolve => setTimeout(resolve, crypto.randomInt(100, 500)));
      return {
        success: false,
        error: 'Password is required and must be a string',
      };
    }

    if (userPassword.length > MAX_PASSWORD_LENGTH) {
      return {
        success: false,
        error: `Password exceeds maximum length of ${MAX_PASSWORD_LENGTH} characters`,
      };
    }

    const strengthCheck = validatePasswordStrength(userPassword);
    if (!strengthCheck.isValid) {
      return {
        success: false,
        error: `Password is too weak: ${strengthCheck.feedback.join(', ')}`,
      };
    }

    // Add pepper (server-side secret) for additional security
    const pepper = process.env.PASSWORD_PEPPER || 'default-password-pepper-for-additional-security';
    const pepperedPassword = userPassword + pepper;

    const salt = await bcrypt.genSalt(SALT_ROUNDS);

    const hashedPassword = await bcrypt.hash(pepperedPassword, salt);

    await new Promise(resolve => setTimeout(resolve, crypto.randomInt(100, 500)));

    return {
      success: true,
      hash: hashedPassword,
    };
  } catch (error) {
    await new Promise(resolve => setTimeout(resolve, crypto.randomInt(100, 500)));
    return {
      success: false,
      error: 'Failed to hash password',
    };
  }
};

export const comparePassword = async (
  userPassword: string,
  dbPassword: string
): Promise<{
  success: boolean;
  isMatch?: boolean;
  error?: string;
}> => {
  try {
    if (
      !userPassword ||
      !dbPassword ||
      typeof userPassword !== 'string' ||
      typeof dbPassword !== 'string'
    ) {
      await new Promise(resolve => setTimeout(resolve, crypto.randomInt(100, 500)));

      return {
        success: false,
        error: 'Invalid input parameters',
      };
    }

    if (userPassword.length > MAX_PASSWORD_LENGTH) {
      await new Promise(resolve => setTimeout(resolve, crypto.randomInt(100, 200)));

      return {
        success: false,
        error: 'Password exceeds maximum length',
      };
    }

    const pepper = process.env.PASSWORD_PEPPER || 'default-password-pepper-for-additional-security';
    const pepperedPassword = userPassword + pepper;

    const isMatch = await bcrypt.compare(pepperedPassword, dbPassword);

    await new Promise(resolve => setTimeout(resolve, crypto.randomInt(100, 500)));

    return {
      success: true,
      isMatch,
    };
  } catch (error) {
    await new Promise(resolve => setTimeout(resolve, crypto.randomInt(100, 500)));

    return {
      success: false,
      error: 'Failed to compare password',
    };
  }
};

// Rate limiting helper for the password attempts

const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

export const checkRateLimit = (
  identifier: string
): {
  allowed: boolean;
  remainingAttempts: number;
  resetTime?: number;
} => {
  const maxAttempts = 5;
  const windowMs = 15 * 60 * 1000;
  const now = Date.now();

  const attempts = loginAttempts.get(identifier);

  if (!attempts) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now });
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1,
    };
  }

  if (attempts.count > maxAttempts) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: attempts.lastAttempt + windowMs,
    };
  }

  // increment attempts
  attempts.count += 1;
  attempts.lastAttempt = now;

  return {
    allowed: true,
    remainingAttempts: maxAttempts - attempts.count,
  };
};

export const resetRateLimit = (identifier: string): void => {
  loginAttempts.delete(identifier);
};
