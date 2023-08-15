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

    const { feedbackRules, wordHintsForward, wordHintsBackward, ...requestDataNoFeedback } = requestData;
    const {id, ...requestDataNoId} = requestDataNoFeedback;

    let targetChanged = false;

    const existingQuestion = await prisma.question.findFirst({where: {id}});
    if (!existingQuestion || existingQuestion.target?.split('\n')[0] !== requestData.target?.split('\n')[0]) {
        if (requestData.type === 'QUESTION') {
            targetChanged = true;
        }
    }

    let nativeChanged = false;
    if (!existingQuestion || existingQuestion.native?.split('\n')[0] !== requestData.native?.split('\n')[0]) {
        if (requestData.type === 'QUESTION') {
            nativeChanged = true;
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

    await prisma.wordHint.deleteMany({where: {OR: {forwardQuestionId: updatedQuestion.id, backwardQuestionId: updatedQuestion.id}}});

    // Word hints for translating target to native
    if (targetChanged && updatedQuestion.target) {

        const newWords = updatedQuestion.target.split('\n')[0].replace(/[.,\/#!\?$%\^&\*;:{}=\-_`~()]/g,"").split(' ');
        let index = 0;
        for (const wordString of newWords) {
            const guessFromWordHints = await prisma.wordHint.findFirst({where: {backwardQuestion: {lesson: {module: {courseId: courseId}}}, wordString: {equals: wordString, mode: 'insensitive'}, wordEntityId: {not: null}}});
            if (guessFromWordHints) {
                await prisma.wordHint.create({
                    data: {
                        wordString: wordString,
                        backwardQuestionId: updatedQuestion.id,
                        wordEntityId: guessFromWordHints.wordEntityId,
                        index: index
                    }
                })
            } else {
                let guessFromWords = await prisma.word.findFirst({where: {module: { courseId: courseId}, target: {equals: wordString, mode: 'insensitive'}}});
                if (!guessFromWords) {
                    guessFromWords = await prisma.word.findFirst({where: {module: {courseId}, targetAlt: {contains: wordString, mode: 'insensitive'}}});
                }
                if (guessFromWords) {
                    await prisma.wordHint.create({
                        data: {
                            wordString: wordString,
                            backwardQuestionId: updatedQuestion.id,
                            wordEntityId: guessFromWords.id,
                            index: index
                        }
                    });
                } else {
                    await prisma.wordHint.create({
                        data: {
                            wordString: wordString,
                            backwardQuestionId: updatedQuestion.id,
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
            backwardQuestionId: wordHint.backwardQuestionId,
            wordString: wordHint.wordString,
            wordEntityId: wordHint.wordEntityId,
            index: wordHint.index
        }));

        await prisma.wordHint.createMany({data: wordHintCreates});
    }

     // Word hints for translating native to target
     if (nativeChanged && updatedQuestion.native) {

        const newWords = updatedQuestion.native.split('\n')[0].replace(/[.,\/#!\?$%\^&\*;:{}=\-_`~()]/g,"").split(' ');
        let index = 0;
        for (const wordString of newWords) {
            const guessFromWordHints = await prisma.wordHint.findFirst({where: {forwardQuestion: {lesson: {module: {courseId: courseId}}}, wordString: {equals: wordString, mode: 'insensitive'}, wordEntityId: {not: null}}});
            if (guessFromWordHints) {
                await prisma.wordHint.create({
                    data: {
                        wordString: wordString,
                        forwardQuestionId: updatedQuestion.id,
                        wordEntityId: guessFromWordHints.wordEntityId,
                        index: index
                    }
                })
            } else {
                let guessFromWords = await prisma.word.findFirst({where: {module: { courseId: courseId}, native: {equals: wordString, mode: 'insensitive'}}});
                if (!guessFromWords) {
                    guessFromWords = await prisma.word.findFirst({where: {module: {courseId}, nativeAlt: {contains: wordString, mode: 'insensitive'}}});
                }
                if (guessFromWords) {
                    await prisma.wordHint.create({
                        data: {
                            wordString: wordString,
                            forwardQuestionId: updatedQuestion.id,
                            wordEntityId: guessFromWords.id,
                            index: index
                        }
                    });
                } else {
                    await prisma.wordHint.create({
                        data: {
                            wordString: wordString,
                            forwardQuestionId: updatedQuestion.id,
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
            forwardQuestionId: wordHint.forwardQuestionId,
            wordString: wordHint.wordString,
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