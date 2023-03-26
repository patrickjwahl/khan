import { prisma } from "@/lib/db";
import { useUser, userCanEditCourse } from "@/lib/user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, context: { params: {id: string}}) {

    const requestData = await request.json();

    const courseId = parseInt(context.params.id);

    const user = await useUser();
    if (!user || !courseId || !user.canEdit || !(await userCanEditCourse(user.id, courseId, prisma))) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    const modules = await prisma.module.findMany({where: {courseId: courseId}, orderBy: {index: 'asc'}});

    const newOrder = requestData.order;

    for (let i = 0; i < newOrder.length; i++) {
        const oldIndex = newOrder[i];
        const newIndex = i;

        const idToChange = modules[oldIndex].id;
        await prisma.module.update({where: {id: idToChange}, data: {index: newIndex}});
    }    

    return NextResponse.json({code: 'OK'});
}