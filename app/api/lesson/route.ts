import { useUser, userCanEditCourse } from "@/lib/user";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {

    const prisma = new PrismaClient();
    const requestData = await request.json();

    const courseId = (await prisma.module.findFirst({ where: {id: requestData.moduleId}}))?.courseId;

    const user = await useUser();
    if (!user || !courseId || !user.canEdit || !(await userCanEditCourse(user.id, courseId, prisma))) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    const lesson = await prisma.lesson.create({
        data: {
            title: requestData.title,
            moduleId: requestData.moduleId
        }
    });

    prisma.$disconnect();

    return NextResponse.json({code: 'OK', redirectId: lesson.id});
}