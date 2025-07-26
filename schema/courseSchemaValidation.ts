import { z } from 'zod';

const slugSchema = z
  .string()
  .trim()
  .min(3, 'Slug must be at least 3 characters long')
  .max(100, 'Slug must not exceed 100 characters')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must contain only lowercase letters, numbers, and hyphens'
  )
  .refine(
    slug => !slug.startsWith('-') && !slug.endsWith('-'),
    'Slug cannot start or end with a hyphen'
  );

const titleSchema = z
  .string()
  .trim()
  .min(3, 'Title must be at least 3 characters long')
  .max(200, 'Title must not exceed 200 characters');

const descriptionSchema = z
  .string()
  .trim()
  .min(10, 'Description must be at least 10 characters long')
  .max(5000, 'Description must not exceed 5000 characters');

const thumbnailSchema = z
  .string()
  .url('Thumbnail must be a valid URL')
  .max(500, 'Thumbnail URL must not exceed 500 characters');

const priceSchema = z
  .number()
  .positive('Price must be a positive number')
  .max(99999999.99, 'Price must not exceed 99,999,999.99')
  .multipleOf(0.01, 'Price must have at most 2 decimal places');

const contentItemSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  imageUrl: z
    .string()
    .url('Image URL must be a valid URL')
    .max(500, 'Image URL must not exceed 500 characters')
    .optional()
    .nullable(),
  videoUrl: z
    .string()
    .url('Video URL must be a valid URL')
    .max(500, 'Video URL must not exceed 500 characters')
    .optional()
    .nullable(),
  order: z.number().int('Order must be an integer').min(0, 'Order must be 0 or greater').optional(),
  isPublished: z.boolean().optional().default(false),
});

export const courseCreationSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  thumbnail: thumbnailSchema,
  price: priceSchema,
  slug: slugSchema,
  adminToken: z.string()
    .min(5, 'ADMIN token must be at least 5 characters long')
    .max(50, 'ADMIN token must not exceed 50 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
      'Password must contain at least one special character'
    )
    .trim(),
  isPublished: z.boolean().optional().default(false),
  content: z
    .array(contentItemSchema)
    .max(100, 'Course cannot have more than 100 content items')
    .optional(),
});

export const contentCreationSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  imageUrl: z
    .string()
    .url('Image URL must be a valid URL')
    .max(500, 'Image URL must not exceed 500 characters')
    .optional()
    .nullable(),
  videoUrl: z
    .string()
    .url('Video URL must be a valid URL')
    .max(500, 'Video URL must not exceed 500 characters')
    .optional()
    .nullable(),
  order: z.number().int('Order must be an integer').min(0, 'Order must be 0 or greater').optional(),
  isPublished: z.boolean().optional().default(false),
  courseId: z.number().int().positive('Course ID must be a positive integer'),
});

export const courseUpdateSchema = courseCreationSchema
  .partial()
  .omit({ content: true })
  .extend({
    id: z.number().int().positive('Course ID must be a positive integer'),
  });

export type CourseCreationInput = z.infer<typeof courseCreationSchema>;
export type ContentCreationInput = z.infer<typeof contentCreationSchema>;
export type CourseUpdateInput = z.infer<typeof courseUpdateSchema>;
export type ContentItemInput = z.infer<typeof contentItemSchema>;
