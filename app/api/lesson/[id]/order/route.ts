import { useUser, userCanEditCourse } from "@/lib/user";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, context: {params: {id: string}}) {

    const prisma = new PrismaClient();
    const requestData = await request.json();

    const courseId = (await prisma.module.findFirst({ where: {id: requestData.moduleId}}))?.courseId;

    const user = await useUser();
    if (!user || !courseId || !user.canEdit || !(await userCanEditCourse(user.id, courseId, prisma))) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    const questions = await prisma.question.findMany({where: {lessonId: parseInt(context.params.id)}, orderBy: {index: 'asc'}});

    const newOrder = requestData.order;

    for (let i = 0; i < newOrder.length; i++) {
        const oldIndex = newOrder[i];
        const newIndex = i;

        const idToChange = questions[oldIndex].id;
        await prisma.question.update({where: {id: idToChange}, data: {index: newIndex}});
    }    

    prisma.$disconnect();

    return NextResponse.json({code: 'OK'});
}