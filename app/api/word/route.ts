import { prisma } from "@/lib/db";
import { useUser, userCanEditCourse } from "@/lib/user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const requestData = await request.json();

    const courseId = (await prisma.module.findFirst({ where: {id: requestData.moduleId}}))?.courseId;

    const user = await useUser();
    if (!user || !courseId || !user.canEdit || !(await userCanEditCourse(user.id, courseId, prisma))) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    const word = await prisma.word.create({
        data: {
            target: requestData.target,
            moduleId: requestData.moduleId,
            native: requestData.native,
            recording: requestData.recording
        }
    });

    await prisma.wordHint.updateMany({
        where: {
            question: {
                module: {
                    courseId: courseId
                }
            },
            wordString: word.target,
            wordEntityId: null
        },
        data: {
            wordEntityId: word.id
        }
    });

    return NextResponse.json({code: 'OK'});
}