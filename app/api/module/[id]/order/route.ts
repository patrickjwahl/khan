import { prisma } from "@/lib/db";
import { useUser, userCanEditCourse } from "@/lib/user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, context: { params: {id: string}}) {
    const requestData = await request.json();

    const courseId = (await prisma.module.findFirst({ where: {id: parseInt(context.params.id)}}))?.courseId;

    const user = await useUser();
    if (!user || !courseId || !user.canEdit || !(await userCanEditCourse(user.id, courseId, prisma))) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    const lessons = await prisma.lesson.findMany({where: {moduleId: parseInt(context.params.id)}, orderBy: {index: 'asc'}});

    const newOrder = requestData.order;

    for (let i = 0; i < newOrder.length; i++) {
        const oldIndex = newOrder[i];
        const newIndex = i;

        const idToChange = lessons[oldIndex].id;
        await prisma.lesson.update({where: {id: idToChange}, data: {index: newIndex}});
    }    

    return NextResponse.json({code: 'OK'});
}