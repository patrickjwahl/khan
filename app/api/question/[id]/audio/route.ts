import { prisma } from "@/lib/db";
import { useUser, userCanEditCourse } from "@/lib/user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, context: { params: {id: string}}) {
    const requestData = await request.json();

    const user = await useUser();

    const questionId = parseInt(context.params.id);
    let courseId;

    const question = await prisma.question.findFirst({where: {id: questionId}, include: {module: true}});

    if (!question) {
        return NextResponse.json({'code': 'NO_SUCH_QUESTION'})
    } else {
        courseId = question.module.courseId;
    }

    if (!user || !user.canEdit || !(await userCanEditCourse(user.id, courseId, prisma))) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    await prisma.question.update({where: {id: questionId}, data: {recording: requestData.recording}});

    return NextResponse.json({code: 'OK'});
}
