import { prisma } from "@/lib/db";
import { useUser, userCanEditCourse } from "@/lib/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: {id: string}}) {
    const id = parseInt(context.params.id);

    const user = await useUser();

    if (!user || !user.canEdit) {
        throw new Error("You're not allowed to see that!");
    }

    const module = await prisma.module.findFirst({
        where: {
            id: id
        },
        include: {
            lessons: { 
                include: {
                    questions: true
                },
                orderBy: {
                    index: 'asc'
                }
            },
            course: true
        }
    });

    if (!module) {
        return NextResponse.json({code: 'MODULE_NOT_FOUND'});
    }

    if (! await userCanEditCourse(user.id, module?.courseId, prisma)) {
        return NextResponse.json({code: 'NOT_AUTHORIZED'});
    }

    const moduleQuestions = await prisma.question.findMany({
        where: {
            moduleId: id
        }, 
        include: {
            feedbackRules: true,
            wordHintsForward: {
                orderBy: {
                    index: 'asc'
                },
                include: {
                    wordEntity: true
                }
            },
            wordHintsBackward: {
                orderBy: {
                    index: 'asc'
                },
                include: {
                    wordEntity: true
                }
            },
            lesson: true
        },
        orderBy: [
            {
                lesson: {
                    index: 'asc'
                }
            },
            {
                index: 'asc'
            }
        ]
    });

    return NextResponse.json({code: 'OK', moduleQuestions, module});
}

export async function POST(request: NextRequest, context: { params: {id: string}}) {

    const requestData = await request.json();

    const courseId = (await prisma.module.findFirst({ where: {id: parseInt(context.params.id)}}))?.courseId;

    const user = await useUser();
    if (!user || !courseId || !user.canEdit || !(await userCanEditCourse(user.id, courseId, prisma))) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    await prisma.module.update({
        where: {
            id: parseInt(context.params.id)
        },
        data: requestData
    });

    return NextResponse.json({code: 'OK'});
}

export async function DELETE(request: NextRequest, context: { params: { id: string }}) {

    const courseId = (await prisma.module.findFirst({ where: {id: parseInt(context.params.id)}}))?.courseId;

    const user = await useUser();
    if (!user || !courseId || !user.canEdit || !(await userCanEditCourse(user.id, courseId, prisma))) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    await prisma.module.delete({where: {id: parseInt(context.params.id)}});

    return NextResponse.json({code: 'OK'});

}