import { z } from 'zod';

const passwordSchema = z
  .string()
  .trim()
  .min(8, 'Password must be atleast 8 characters long')
  .max(128, 'Password exceeds maximum length of 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    'Password must contain at least one special character'
  )
  .refine(
    password => !/((.)\2{2,})/.test(password),
    'Password contains repeated characters and is easily guessable'
  )
  .refine(
    password => !/123456|654321|abcdef|qwerty|password|admin/i.test(password),
    'Password contains common patterns and is easily guessable'
  );

const phoneSchema = z
  .string()
  .trim()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number must not exceed 15 digits')
  .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format');

const nameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters long')
  .max(50, 'Name must not exceed 50 characters')
  .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')
  .trim();

const emailSchema = z
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters long')
  .max(254, 'Email must not exceed 254 characters')
  .toLowerCase()
  .trim();

const adminTokenSchema = z
  .string()
  .min(5, 'ADMIN token must be at least 5 characters long')
  .max(50, 'ADMIN token must not exceed 50 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    'Password must contain at least one special character'
  )
  .trim();

export const userRegistrationSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
});

export const adminRegistrationSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
  adminToken: adminTokenSchema,
});

export const userLoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const adminLoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  adminToken: adminTokenSchema,
});

export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;
