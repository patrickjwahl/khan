import { NextRequest, NextResponse } from "next/server";
import { parse } from 'csv-parse/sync';
import { prisma } from "@/lib/db";
import { useUser, userCanEditCourse } from "@/lib/user";
import { getMainVariant, getTokens } from "@/lib/string_processing";

type Row = { target: string, native: string, lesson: string, pass: string, forwardEnabled: string, backwardEnabled: string, audioEnabled: string};

export async function POST(request: NextRequest,  context: { params: { id: string }}) {
    const requestData = await request.formData();
    const file = requestData.get('file') as File;
    const text = await file.text();
    
    const moduleId = parseInt(context.params.id);
    const module = await prisma.module.findFirst({where: {id: moduleId}});
    if (!module) return NextResponse.json({code: 'NO_SUCH_MODULE'});

    const user = await useUser();
    if (!user || !user.canEdit || !(await userCanEditCourse(user.id, module.courseId, prisma))) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    await prisma.lesson.deleteMany({where: {moduleId: moduleId}});
    await prisma.question.deleteMany({where: {moduleId: moduleId}});

    const data: Row[] = parse(text, {skip_empty_lines: true, fromLine: 2, columns: ['lesson', 'target', 'native', 'pass', 'forwardEnabled', 'backwardEnabled', 'audioEnabled']});

    const lessons: {[name: string]: {id: number, index: number}} = {};
    let lessonIndex = 0;

    for (const row of data) {
        const lesson = row.lesson;
        let lessonId, questionIndex;
        if (lesson) {
            if (lessons[lesson]) {
                lessonId = lessons[lesson].id;
                questionIndex = lessons[lesson].index;
            } else  {
                const newLesson = await prisma.lesson.create({
                    data: {
                        title: lesson,
                        moduleId: moduleId,
                        index: lessonIndex
                    }
                });
                lessonId = newLesson.id;
                questionIndex = 0;
                lessonIndex += 1;
            }

            lessons[lesson] = {id: lessonId, index: questionIndex + 1};
        }

        const native = row.native.split(';').map(v => splitString(v)).flat().join('\n');
        const target = row.target.split(';').map(v => splitString(v)).flat().join('\n');
        const firstPass = row.pass == '1';
        const forwardEnabled = row.forwardEnabled != "f";
        const backwardEnabled = row.backwardEnabled != "f";
        const audioEnabled = row.audioEnabled != "f";

        const newQuestion = await prisma.question.create({
            data: {
                native: native,
                target: target,
                firstPass: firstPass,
                forwardEnabled: forwardEnabled,
                backwardEnabled: backwardEnabled,
                recordingEnabled: audioEnabled,
                moduleId: moduleId,
                lessonId: lessonId || null,
                index: questionIndex || 0,
                type: 'QUESTION'
            }
        });

        if (!newQuestion.target || !newQuestion.native) return NextResponse.json({code: 'NULL_SENTENCE'});

        // backward translation hints
        let newWords = getTokens(getMainVariant(newQuestion.target));
        let i = 0;
        for (const wordString of newWords) {
            const guessFromWordHints = await prisma.wordHint.findFirst({where: {backwardQuestion: {lesson: {module: {courseId: module.courseId}}}, wordString: {equals: wordString, mode: 'insensitive'}, wordEntityId: {not: null}}});
            if (guessFromWordHints) {
                await prisma.wordHint.create({
                    data: {
                        wordString: wordString.toLowerCase(),
                        backwardQuestionId: newQuestion.id,
                        wordEntityId: guessFromWordHints.wordEntityId,
                        index: i
                    }
                })
            } else {
                let guessFromWords = await prisma.word.findFirst({where: {module: { courseId: module.courseId}, target: {equals: wordString, mode: 'insensitive'}}});
                if (!guessFromWords) {
                    guessFromWords = await prisma.word.findFirst({where: {module: { courseId: module.courseId}, targetAlt: {contains: wordString, mode: 'insensitive'}}});
                }
                if (guessFromWords) {
                    await prisma.wordHint.create({
                        data: {
                            wordString: wordString.toLowerCase(),
                            backwardQuestionId: newQuestion.id,
                            wordEntityId: guessFromWords.id,
                            index: i
                        }
                    });
                } else {
                    await prisma.wordHint.create({
                        data: {
                            wordString: wordString.toLowerCase(),
                            backwardQuestionId: newQuestion.id,
                            wordEntityId: null,
                            index: i
                        }
                    });
                }
            }
            i++;
        }

        // forward translation hints
        newWords = getTokens(getMainVariant(newQuestion.native));
        i = 0;
        for (const wordString of newWords) {
            const guessFromWordHints = await prisma.wordHint.findFirst({where: {forwardQuestion: {lesson: {module: {courseId: module.courseId}}}, wordString: {equals: wordString, mode: 'insensitive'}, wordEntityId: {not: null}}});
            if (guessFromWordHints) {
                await prisma.wordHint.create({
                    data: {
                        wordString: wordString.toLowerCase(),
                        forwardQuestionId: newQuestion.id,
                        wordEntityId: guessFromWordHints.wordEntityId,
                        index: i
                    }
                })
            } else {
                let guessFromWords = await prisma.word.findFirst({where: {module: { courseId: module.courseId}, native: {equals: wordString, mode: 'insensitive'}}});
                if (!guessFromWords) {
                    guessFromWords = await prisma.word.findFirst({where: {module: { courseId: module.courseId}, nativeAlt: {contains: wordString, mode: 'insensitive'}}});
                }
                if (guessFromWords) {
                    await prisma.wordHint.create({
                        data: {
                            wordString: wordString.toLowerCase(),
                            forwardQuestionId: newQuestion.id,
                            wordEntityId: guessFromWords.id,
                            index: i
                        }
                    });
                } else {
                    await prisma.wordHint.create({
                        data: {
                            wordString: wordString.toLowerCase(),
                            forwardQuestionId: newQuestion.id,
                            wordEntityId: null,
                            index: i
                        }
                    });
                }
            }
            i++;
        }
    }

    return NextResponse.json({code: 'OK'});
}

const splitString: (input: string) => string[] = (input: string) => {
    const bracketSections = input.match(/\[(.*?)\]/g);
    if (!bracketSections || bracketSections?.length === 0) return [input];

    const bracketVariations = bracketSections[0].slice(1, -1).split('/');
    const variations = bracketVariations.map(v => {
        const newInput = input.replace(/\[(.*?)\]/, v);
        return splitString(newInput).flat();
    });

    return variations.flat().map(v => v.replace(/ +/g, ' '));
}