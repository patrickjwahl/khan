import { prisma } from "@/lib/db";
import { useUser, userCanEditCourse } from "@/lib/user";
import { FeedbackRule, WordHint } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const requestData = await request.json();

    const user = await useUser();

    let courseId;

    const question = await prisma.question.findFirst({where: {id: requestData.id}, include: {module: true, lesson: {include: {module: true}}}});

    if (!question) {
        const module = await prisma.module.findFirst({where: {id: requestData.moduleId}});
        if (!module) {
            return NextResponse.json({code: 'NO_SUCH_MODULE'});
        }

        courseId = module.courseId;
    } else {
        courseId = question.module.courseId;
    }

    if (!user || !user.canEdit || !(await userCanEditCourse(user.id, courseId, prisma))) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    const { feedbackRules, wordHints, ...requestDataNoFeedback } = requestData;
    const {id, ...requestDataNoId} = requestDataNoFeedback;

    let targetChanged = false;

    const existingQuestion = await prisma.question.findFirst({where: {id}});
    if (!existingQuestion || existingQuestion.target?.split('\n')[0] !== requestData.target?.split('\n')[0]) {
        if (requestData.type === 'QUESTION') {
            targetChanged = true;
        }
    }

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

    await prisma.wordHint.deleteMany({where: {questionId: updatedQuestion.id}});
    if (targetChanged && updatedQuestion.target) {

        const newWords = updatedQuestion.target.split('\n')[0].replace(/[.,\/#!\?$%\^&\*;:{}=\-_`~()]/g,"").split(' ');
        let index = 0;
        for (const wordString of newWords) {
            const guessFromWordHints = await prisma.wordHint.findFirst({where: {question: {lesson: {module: {courseId: courseId}}}, wordString: wordString.toLowerCase(), wordEntityId: {not: null}}});
            if (guessFromWordHints) {
                await prisma.wordHint.create({
                    data: {
                        wordString: wordString.toLowerCase(),
                        questionId: updatedQuestion.id,
                        wordEntityId: guessFromWordHints.wordEntityId,
                        index: index
                    }
                })
            } else {
                const guessFromWords = await prisma.word.findFirst({where: {module: { courseId: courseId}, target: wordString.toLowerCase()}});
                if (guessFromWords) {
                    await prisma.wordHint.create({
                        data: {
                            wordString: wordString.toLowerCase(),
                            questionId: updatedQuestion.id,
                            wordEntityId: guessFromWords.id,
                            index: index
                        }
                    });
                } else {
                    await prisma.wordHint.create({
                        data: {
                            wordString: wordString.toLowerCase(),
                            questionId: updatedQuestion.id,
                            wordEntityId: null,
                            index: index
                        }
                    });
                }
            }
            index += 1;
        }
    } else {
        const wordHintCreates = wordHints.map((wordHint: WordHint) => ({
            questionId: wordHint.questionId,
            wordString: wordHint.wordString.toLowerCase(),
            wordEntityId: wordHint.wordEntityId,
            index: wordHint.index
        }));

        await prisma.wordHint.createMany({data: wordHintCreates});
    }

    return NextResponse.json({code: 'OK', questionId: updatedQuestion.id});
}

export async function DELETE(request: NextRequest) {
    const requestData = await request.json();

    const user = await useUser();

    let courseId;

    const question = await prisma.question.findFirst({where: {id: requestData.id}, include: {module: true, lesson: {include: {module: true}}}});

    if (!question) {
        return NextResponse.json({code: 'NO_SUCH_QUESTION'});
    }

    courseId = question.module.courseId;

    if (!user || !user.canEdit || !(await userCanEditCourse(user.id, courseId, prisma))) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    await prisma.question.delete({where: {id: requestData.id}});

    return NextResponse.json({code: 'OK'});
}