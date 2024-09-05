import { prisma } from "@/lib/db";
import { useUser, userCanEditCourse } from "@/lib/user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, context: { params: {id: string}}) {
    const requestData = await request.json();

    const user = await useUser();

    const wordId = parseInt(context.params.id);
    let courseId;

    const word = await prisma.word.findFirst({where: {id: wordId}, include: {module: true}});

    if (!word) {
        return NextResponse.json({'code': 'NO_SUCH_QUESTION'})
    } else {
        courseId = word.module.courseId;
    }

    if (!user || !user.canEdit || !(await userCanEditCourse(user.id, courseId, prisma))) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    await prisma.question.update({where: {id: wordId}, data: {recording: requestData.recording}});

    return NextResponse.json({code: 'OK'});
}
