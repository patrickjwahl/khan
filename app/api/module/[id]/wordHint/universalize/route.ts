import { prisma } from "@/lib/db";
import { useUser, userCanEditCourse } from "@/lib/user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, context: { params: {id: string}}) {

    const requestData = await request.json();
    const moduleId = parseInt(context.params.id)

    const courseId = (await prisma.module.findFirst({ where: {id: moduleId}}))?.courseId;

    const user = await useUser();
    if (!user || !courseId || !user.canEdit || !(await userCanEditCourse(user.id, courseId, prisma))) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    const moduleTerm = requestData.forwardQuestionId ? 'forwardQuestion' : 'backwardQuestion'

    await prisma.wordHint.updateMany({
        where: {
            [moduleTerm]: {
                moduleId
            },
            wordString: requestData.wordString
        },
        data: {
            wordEntityId: requestData.wordEntityId
        }
    })

    return NextResponse.json({code: 'OK'});
}