import { useUser, userCanEditCourse } from "@/lib/user";
import { PrismaClient, FeedbackRule } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {

    const prisma = new PrismaClient();
    const requestData = await request.json();

    const user = await useUser();

    let courseId;

    const question = await prisma.question.findFirst({where: {id: requestData.id}, include: {lesson: {include: {module: true}}}});

    if (!question) {
        const lesson = await prisma.lesson.findFirst({where: {id: requestData.lessonId}, include: {module: true}});
        if (!lesson) {
            return NextResponse.json({code: 'NO_SUCH_LESSON'});
        }

        courseId = lesson.module.courseId;
    } else {
        courseId = question.lesson.module.courseId;
    }

    if (!user || !user.canEdit || !(await userCanEditCourse(user.id, courseId, prisma))) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    const { feedbackRules, ...requestDataNoFeedback } = requestData;
    const {id: _, ...requestDataNoId} = requestDataNoFeedback;

    const updatedQuestion = await prisma.question.upsert({
        where: {
            id: requestData.id,
        }, 
        update: requestDataNoFeedback,
        create: requestDataNoId
    });

    const feedbackRuleCreates = feedbackRules.map((rule: FeedbackRule) => ({
        trigger: rule.trigger,
        feedback: rule.feedback,
        questionId: updatedQuestion.id
    }));

    await prisma.feedbackRule.deleteMany({where: {questionId: updatedQuestion.id}});
    await prisma.feedbackRule.createMany({data: feedbackRuleCreates});

    prisma.$disconnect();

    return NextResponse.json({code: 'OK', questionId: updatedQuestion.id});
}

export async function DELETE(request: NextRequest) {
    const prisma = new PrismaClient();
    const requestData = await request.json();

    const user = await useUser();

    let courseId;

    const question = await prisma.question.findFirst({where: {id: requestData.id}, include: {lesson: {include: {module: true}}}});

    if (!question) {
        return NextResponse.json({code: 'NO_SUCH_QUESTION'});
    }

    courseId = question.lesson.module.courseId;

    if (!user || !user.canEdit || !(await userCanEditCourse(user.id, courseId, prisma))) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    await prisma.question.delete({where: {id: requestData.id}});

    return NextResponse.json({code: 'OK'});
}