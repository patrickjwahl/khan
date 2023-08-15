import { prisma } from "@/lib/db";
import { useUser, userCanEditCourse } from "@/lib/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: {id: string}}) {
    const id = parseInt(context.params.id);

    const user = await useUser();

    if (!user || !user.canEdit) {
        return NextResponse.json({code: 'NOT_AUTHORIZED'});
    }

    const lesson = await prisma.lesson.findFirst({
        where: {
            id: id
        },
        include: {
            questions: {
                orderBy: {
                    index: 'asc'
                },
                include: {
                    wordHintsBackward: {
                        orderBy: {
                            index: 'asc'
                        },
                        include: {
                            wordEntity: true
                        }
                    },
                    wordHintsForward: {
                        orderBy: {
                            index: 'asc'
                        },
                        include: {
                            wordEntity: true
                        }
                    },
                    feedbackRules: true
                }
            },
            module: {
                include: {
                    course: true,
                    questions: {
                        where: {
                            lessonId: null
                        }
                    }
                }
            }
        }
    });

    if (!lesson) {
        return NextResponse.json({code: 'NO_SUCH_LESSON'});
    }

    if (! await userCanEditCourse(user.id, lesson.module.courseId, prisma)) {
        return NextResponse.json({code: 'NOT_AUTHORIZED'});
    }

    return NextResponse.json({code: 'OK', lesson});
}

export async function POST(request: NextRequest, context: { params: {id: string}}) {

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

    return NextResponse.json({code: 'OK'});
}

export async function DELETE(request: NextRequest, context: { params: { id: string }}) {

    const courseId = (await prisma.lesson.findFirst({ where: {id: parseInt(context.params.id)}, include: { module: true }}))?.module.courseId;

    const user = await useUser();
    if (!user || !courseId || !user.canEdit || !(await userCanEditCourse(user.id, courseId, prisma))) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    await prisma.lesson.delete({where: {id: parseInt(context.params.id)}});

    return NextResponse.json({code: 'OK'});

}