import { prisma } from "@/lib/db";
import { useUser, userCanEditCourse } from "@/lib/user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const requestData = await request.json();

    const courseId = requestData.courseId;

    const user = await useUser();
    if (!user || !user.canEdit || !(await userCanEditCourse(user.id, courseId, prisma))) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    const module = await prisma.module.create({
        data: {
            title: requestData.title,
            courseId: courseId,
            index: requestData.index
        }
    });

    return NextResponse.json({code: 'OK', redirectId: module.id});
}