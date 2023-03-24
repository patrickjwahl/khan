import { useUser, userCanEditCourse } from "@/lib/user";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, context: { params: {id: string}}) {

    const prisma = new PrismaClient();
    const requestData = await request.json();

    const courseId = (await prisma.module.findFirst({ where: {id: requestData.moduleId}}))?.courseId;

    const user = await useUser();
    if (!user || !courseId || !user.canEdit || !(await userCanEditCourse(user.id, courseId, prisma))) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    await prisma.lesson.update({
        where: {
            id: parseInt(context.params.id)
        },
        data: {
            title: requestData.title
        }
    });

    prisma.$disconnect();

    return NextResponse.json({code: 'OK'});
}

export async function DELETE(request: NextRequest, context: { params: { id: string }}) {
    const prisma = new PrismaClient();

    const courseId = (await prisma.lesson.findFirst({ where: {id: parseInt(context.params.id)}, include: { module: true }}))?.module.courseId;

    const user = await useUser();
    if (!user || !courseId || !user.canEdit || !(await userCanEditCourse(user.id, courseId, prisma))) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    await prisma.lesson.delete({where: {id: parseInt(context.params.id)}});

    prisma.$disconnect();

    return NextResponse.json({code: 'OK'});

}