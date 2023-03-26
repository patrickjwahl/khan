import { prisma } from "@/lib/db";
import { useUser, userCanEditCourse } from "@/lib/user";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, context: { params: {id: string}}) {

    const requestData = await request.json();

    const courseId = parseInt(context.params.id);

    const user = await useUser();
    if (!user || !courseId || !user.canEdit || !(await userCanEditCourse(user.id, courseId, prisma))) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    await prisma.course.update({
        where: {
            id: courseId
        },
        data: requestData
    });

    prisma.$disconnect();

    return NextResponse.json({code: 'OK'});
}

export async function DELETE(request: NextRequest, context: { params: { id: string }}) {
    const prisma = new PrismaClient();

    const courseId = parseInt(context.params.id);

    const user = await useUser();
    if (!user || !courseId || !user.canEdit || !(await userCanEditCourse(user.id, courseId, prisma))) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    await prisma.course.delete({where: {id: courseId}});

    return NextResponse.json({code: 'OK'});

}