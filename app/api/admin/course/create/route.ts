import { AdminAuthenticatedRequest, authenticateAdmin } from '@/middleware/adminMiddleware';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaClient';
import { courseCreationSchema } from '@/schema/courseSchemaValidation';

export const POST = authenticateAdmin(async (request: AdminAuthenticatedRequest) => {
  try {
    const currentAdmin = request.admin;

    if (!currentAdmin) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const ADMIN_TOKEN = process.env.ADMIN_OPERATION_TOKEN

    let requestBody;

    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON in request body', error },
        { status: 400 }
      );
    }

    let validateData;

    try {
      validateData = courseCreationSchema.parse(requestBody);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', error },
        { status: 400 }
      );
    }

    const { title, description, thumbnail, price, slug, isPublished, content, adminToken } = validateData;

    if (ADMIN_TOKEN !== adminToken) {
      return NextResponse.json(
        { success: false, message: 'Give correct admin token to create course' },
        { status: 401 }
      )
    }

    if (!title || !description || !thumbnail || !price || !slug) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    if (content && !Array.isArray(content)) {
      return NextResponse.json(
        { success: false, message: 'Content must be an array' },
        { status: 400 }
      );
    }

    const existingCourse = await prisma.course.findUnique({
      where: { slug },
    });

    if (existingCourse) {
      return NextResponse.json(
        { success: false, message: 'Course with the slug already exists' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async tx => {
      const newCourse = await tx.course.create({
        data: {
          title,
          description,
          thumbnail,
          price: parseFloat(price.toString()),
          slug,
          isPublished: isPublished || false,
        },
      });

      const createdContent = [];

      if (content && content.length > 0) {
        for (let i = 0; i < content.length; i++) {
          const contentItem = content[i];

          if (!contentItem.title || !contentItem.description) {
            throw new Error(`Content item at index ${i} missing required fields`);
          }

          const createdContentItem = await tx.content.create({
            data: {
              title: contentItem.title,
              description: contentItem.description,
              imageUrl: contentItem.imageUrl || null,
              videoUrl: contentItem.videoUrl || null,
              order: contentItem.order || i + 1,
              isPublished: contentItem.isPublished || false,
              courseId: newCourse.id,
            },
          });

          createdContent.push(createdContentItem);
        }
      }

      const courseWithContent = await tx.course.findUnique({
        where: { id: newCourse.id },
        include: {
          content: {
            orderBy: { order: 'asc' },
          },
          coursePurchased: true,
        },
      });

      return courseWithContent;
    });

    return NextResponse.json(
      { success: true, message: 'course created successfully', course: result },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
});
