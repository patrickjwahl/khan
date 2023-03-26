import { prisma } from "@/lib/db";
import { useUser, userCanEditCourse } from "@/lib/user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, context: { params: {id: string}}) {

    const requestData = await request.json();

    const courseId = parseInt(context.params.id);

    const course = await prisma.course.findFirst({where: {id: courseId}, include: {editors: true}});

    const user = await useUser();
    if (!user || !courseId || !course || !user.canEdit || user.id !== course?.ownerId) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    const newEditor = await prisma.user.findFirst({where: {username: requestData.username}});
    if (!newEditor) {
        return NextResponse.json({code: 'NO_SUCH_USER'});
    }

    await prisma.course.update({
        where: {
            id: courseId
        },
        data: {
            editors: {
                connect: {
                    id: newEditor.id
                }
            }
        }
    });

    return NextResponse.json({code: 'OK'});
}

export async function DELETE(request: NextRequest, context: { params: {id: string}}) {

    const requestData = await request.json();

    const courseId = parseInt(context.params.id);

    const course = await prisma.course.findFirst({where: {id: courseId}, include: {editors: true}});

    const user = await useUser();
    if (!user || !courseId || !course || !user.canEdit || user.id !== course?.ownerId) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    await prisma.course.update({
        where: {
            id: courseId
        },
        data: {
            editors: {
                disconnect: {
                    id: requestData.id
                }
            }
        }
    });

    return NextResponse.json({code: 'OK'});
}