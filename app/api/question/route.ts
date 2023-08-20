import { prisma } from "@/lib/db";
import { getMainVariant, getTokens } from "@/lib/string_processing";
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
    if (!existingQuestion || getMainVariant(existingQuestion.target) !== getMainVariant(requestData.target)) {
        if (requestData.type === 'QUESTION') {
            targetChanged = true;
        }
    }

    let nativeChanged = false;
    if (!existingQuestion || getMainVariant(existingQuestion.native) !== getMainVariant(requestData.native)) {
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

    await prisma.wordHint.deleteMany({
        where: {
            OR: [
                {
                    forwardQuestionId: updatedQuestion.id
                }, 
                {
                    backwardQuestionId: updatedQuestion.id
                }
            ]
        }
    });

    // Word hints for translating target to native
    if (targetChanged && updatedQuestion.target) {

        const tokens = getTokens(getMainVariant(updatedQuestion.target));
        let index = 0;
        for (const token of tokens) {
            const guessFromWordHints = await prisma.wordHint.findFirst({where: {backwardQuestion: {lesson: {module: {courseId: courseId}}}, wordString: {equals: token.token, mode: 'insensitive'}, wordEntityId: {not: null}}});
            if (guessFromWordHints) {
                await prisma.wordHint.create({
                    data: {
                        wordString: token.token,
                        backwardQuestionId: updatedQuestion.id,
                        wordEntityId: guessFromWordHints.wordEntityId,
                        index: index,
                        noSpace: token.noSpace
                    }
                })
            } else {
                let guessFromWords = await prisma.word.findFirst({where: {module: { courseId: courseId}, target: {equals: token.token, mode: 'insensitive'}}});
                if (!guessFromWords) {
                    guessFromWords = await prisma.word.findFirst({where: {module: {courseId}, targetAlt: {contains: token.token, mode: 'insensitive'}}});
                }
                if (guessFromWords) {
                    await prisma.wordHint.create({
                        data: {
                            wordString: token.token,
                            backwardQuestionId: updatedQuestion.id,
                            wordEntityId: guessFromWords.id,
                            index: index,
                            noSpace: token.noSpace
                        }
                    });
                } else {
                    await prisma.wordHint.create({
                        data: {
                            wordString: token.token,
                            backwardQuestionId: updatedQuestion.id,
                            wordEntityId: null,
                            index: index,
                            noSpace: token.noSpace
                        }
                    });
                }
            }
            index += 1;
        }
    } else {
        const wordHintCreates = wordHintsBackward.map((wordHint: WordHint) => ({
            backwardQuestionId: wordHint.backwardQuestionId,
            wordString: wordHint.wordString,
            wordEntityId: wordHint.wordEntityId,
            index: wordHint.index,
            noSpace: wordHint.noSpace
        }));

        await prisma.wordHint.createMany({data: wordHintCreates});
    }

     // Word hints for translating native to target
     if (nativeChanged && updatedQuestion.native) {

        const tokens = getTokens(getMainVariant(updatedQuestion.native));
        let index = 0;
        for (const token of tokens) {
            const guessFromWordHints = await prisma.wordHint.findFirst({where: {forwardQuestion: {lesson: {module: {courseId: courseId}}}, wordString: {equals: token.token, mode: 'insensitive'}, wordEntityId: {not: null}}});
            if (guessFromWordHints) {
                await prisma.wordHint.create({
                    data: {
                        wordString: token.token,
                        forwardQuestionId: updatedQuestion.id,
                        wordEntityId: guessFromWordHints.wordEntityId,
                        index: index,
                        noSpace: token.noSpace
                    }
                })
            } else {
                let guessFromWords = await prisma.word.findFirst({where: {module: { courseId: courseId}, native: {equals: token.token, mode: 'insensitive'}}});
                if (!guessFromWords) {
                    guessFromWords = await prisma.word.findFirst({where: {module: {courseId}, nativeAlt: {contains: token.token, mode: 'insensitive'}}});
                }
                if (guessFromWords) {
                    await prisma.wordHint.create({
                        data: {
                            wordString: token.token,
                            forwardQuestionId: updatedQuestion.id,
                            wordEntityId: guessFromWords.id,
                            index: index,
                            noSpace: token.noSpace
                        }
                    });
                } else {
                    await prisma.wordHint.create({
                        data: {
                            wordString: token.token,
                            forwardQuestionId: updatedQuestion.id,
                            wordEntityId: null,
                            index: index,
                            noSpace: token.noSpace
                        }
                    });
                }
            }
            index += 1;
        }
    } else {
        const wordHintCreates = wordHintsForward.map((wordHint: WordHint) => ({
            forwardQuestionId: wordHint.forwardQuestionId,
            wordString: wordHint.wordString,
            wordEntityId: wordHint.wordEntityId,
            index: wordHint.index,
            noSpace: wordHint.noSpace
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