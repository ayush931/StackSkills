import { AdminAuthenticatedRequest, authenticateAdmin } from '@/middleware/adminMiddleware';
import { contentCreationSchema } from '@/schema/courseSchemaValidation';
import { NextResponse } from 'next/server';

export const POST = authenticateAdmin(async (request: AdminAuthenticatedRequest) => {
  try {
    const currentAdmin = request.admin;

    if (!currentAdmin) {
      return NextResponse.json({ success: false, message: 'Authenticate Admin' }, { status: 401 });
    }

    const ADMIN_TOKEN = process.env.ADMIN_OPERATION_TOKEN;

    let requestBody;

    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON in request body', error },
        { status: 400 }
      );
    }

    const requestWithToken = {
      ...requestBody,
      adminToken: requestBody.adminToken,
    };

    let validateData;

    try {
      validateData = contentCreationSchema.parse(requestWithToken);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Validation error', error },
        { status: 400 }
      );
    }

    const { title, description, imageUrl, videoUrl, order, isPublished, courseId, adminToken } =
      validateData;

    if (adminToken !== ADMIN_TOKEN) {
      return NextResponse.json({ success: false, message: '' }, { status: 400 });
    }

    if (!title || !description || !courseId) {
      return NextResponse.json(
        { success: false, message: 'Title, Description and CourseId is required' },
        { status: 400 }
      );
    }

    const existingCourse = await prisma?.course.findUnique({
      where: { id: courseId },
      include: {
        content: {
          orderBy: { order: 'desc' },
          take: 1,
        },
      },
    });

    if (!existingCourse) {
      return NextResponse.json({ success: false, message: 'Course not found' }, { status: 400 });
    }

    // Determine the order of the new content
    let contentOrder = order;
    if (!contentOrder) {
      const lastContentOrder = existingCourse.content[0];
      contentOrder = lastContentOrder ? lastContentOrder.order! + 1 : 1;
    }

    if (order) {
      const existingContentWithOrder = await prisma?.content.findFirst({
        where: {
          courseId: courseId,
          order: order,
        },
      });

      if (existingContentWithOrder) {
        return NextResponse.json(
          { success: false, message: `Content with order ${order} already exists.` },
          { status: 409 }
        );
      }
    }

    const result = await prisma?.$transaction(async tx => {
      const newContent = await prisma?.content.create({
        data: {
          title,
          description,
          imageUrl: imageUrl || null,
          videoUrl: videoUrl || null,
          order: contentOrder,
          isPublished: isPublished || false,
          courseId: courseId,
        },
      });

      const updatedCourse = await tx.course.findUnique({
        where: { id: courseId },
        include: {
          content: {
            orderBy: { order: 'asc' },
          },
          coursePurchased: true,
        },
      });

      return {
        newContent,
        updatedCourse,
      };
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Course added successfully',
        content: result?.newContent,
        course: result?.updatedCourse,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error });
  }
});
