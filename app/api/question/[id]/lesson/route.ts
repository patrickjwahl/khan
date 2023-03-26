import { prisma } from "@/lib/db";
import { useUser, userCanEditCourse } from "@/lib/user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, context: { params: {id: string}}) {
    const requestData = await request.json();

    const user = await useUser();

    const questionId = parseInt(context.params.id);
    let courseId;

    const question = await prisma.question.findFirst({where: {id: questionId}, include: {module: true, lesson: {include: {module: true}}}});

    if (!question) {
        const module = await prisma.module.findFirst({where: {id: requestData.moduleId}});
        if (!module) {
            return NextResponse.json({code: 'NO_SUCH_MODULE'});
        }

        courseId = module.courseId;
    } else {
        courseId = question.module.courseId;
    }

    if (!user || !user.canEdit || !(await userCanEditCourse(user.id, courseId, prisma))) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    const index = (await prisma.question.aggregate({
        where: {lessonId: requestData.lessonId},
        _max: {index: true}
    }))._max.index || 0;

    await prisma.question.update({where: {id: questionId}, data: {lessonId: requestData.lessonId, index: index + 1}});

    return NextResponse.json({code: 'OK'});
}
