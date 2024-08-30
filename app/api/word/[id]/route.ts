import { prisma } from "@/lib/db";
import { useUser, userCanEditCourse } from "@/lib/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: {params: { id: string }}) {
    const wordId = parseInt(context.params.id);

    const word = await prisma.word.findFirst({
        where: {
            id: wordId
        }
    });

    if (!word) return NextResponse.json({ code: 'NOT_FOUND' });

    return NextResponse.json({ code: 'OK', word });
}

export async function POST(request: NextRequest, context: { params: {id: string}}) {
    const requestData = await request.json();

    const wordId = parseInt(context.params.id);

    const courseId = (await prisma.word.findFirst({ where: {id: wordId}, include: {module: true}}))?.module.courseId;

    const user = await useUser();
    if (!user || !courseId || !user.canEdit || !(await userCanEditCourse(user.id, courseId, prisma))) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    const word = await prisma.word.update({
        where: {
            id: wordId
        },
        data: {
            target: requestData.target,
            targetAlt: requestData.targetAlt,
            moduleId: requestData.moduleId,
            native: requestData.native,
            nativeAlt: requestData.nativeAlt,
            recording: requestData.recording
        }
    });

    return NextResponse.json({code: 'OK'});
}

export async function DELETE(request: NextRequest, context: { params: {id: string}}) {

    const wordId = parseInt(context.params.id);

    const courseId = (await prisma.word.findFirst({ where: {id: wordId}, include: {module: true}}))?.module.courseId;

    const user = await useUser();
    if (!user || !courseId || !user.canEdit || !(await userCanEditCourse(user.id, courseId, prisma))) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    await prisma.word.delete({where: {id: wordId}});

    return NextResponse.json({code: 'OK'});
}