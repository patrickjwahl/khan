import { prisma } from "@/lib/db";
import { useUser, userCanEditCourse } from "@/lib/user";
import { Prisma, Question, Word } from "@prisma/client";
import { COMMENT_REGEX, MAX_QUESTIONS_PER_LESSON, MAX_QUESTIONS_PER_TEST, SENTENCE_REGEX, VOCAB_WORD_REGEX } from "@/lib/settings";
import '@/app/vocab-word.scss'
import { getAllVariants, getMainVariant, stripInnerDelimiter } from "@/lib/string_processing";
import { shuffleArray } from "@/lib/util";
import ErrorScreen from "../../../ErrorScreen";
import LessonContent from "@/app/learn/lesson/[id]/LessonContent";

export type QuestionType = 'forward' | 'backward' | 'audio' | 'info';
export type LessonQuestion = Prisma.QuestionGetPayload<{include: {feedbackRules: true, wordHintsBackward: {include: {wordEntity: true}}, wordHintsForward: {include: {wordEntity: true}}}}> & {question: string | null, answers: string[], questionType: QuestionType, vocabWords: {[w: string]: Word}, vocabSentences: {[id: number]: Question}};

export async function generateMetadata({ params }: {params: {id: string}}) {
    const course = await prisma.course.findFirst({where: {id: parseInt(params.id)}});
    return {title: `${course?.language} Challenge | Genghis Khan Academy`};
}

export default async function Lesson({ params }: { params: { id: string }}) {

    const moduleId = parseInt(params.id);

    const user = await useUser();

    const module = await prisma.module.findFirst({
        where: {
            id: moduleId
        },
        include: {
            course: true
        }
    });

    if (!module) {
        return <ErrorScreen error="This module doesn't exist!" />
    }

    if (!module.course.published && (!user || ! await userCanEditCourse(user.id, module.course.id, prisma))) {
        return <ErrorScreen error="You're not allowed to see this!" />
    }

    let questions = await prisma.question.findMany({
        where: {
            moduleId: moduleId
        },
        include: {
            feedbackRules: true,
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
            }
        },
        orderBy: {
            index: 'asc'
        }
    });

    const userCourse = user && await prisma.userCourse.findFirst({
        where: {
            userId: user.id, 
            courseId: module.courseId
        },
        include: {
            currentLesson: {
                include: {
                    module: true
                }
            }
        }
    });

    if (!userCourse) {
        return <ErrorScreen error="You're not subscribed to this course!" />
    }

    if (((userCourse.currentLesson?.module.index || 0) <= module.index && !userCourse.onTest) && module.course.published && module.published ) {
        return <ErrorScreen error="You haven't unlocked this yet!" />
    }

    // practicing, so shuffle questions,
    // and take a sampling of those
    questions = questions.filter(q => q.type === 'QUESTION');
    questions = shuffleArray(questions);
    questions = questions.slice(0, MAX_QUESTIONS_PER_TEST);

    const questionsWithTypePromises = questions.map(async (q): Promise<LessonQuestion> => {

        let possibleTypes: QuestionType[] = [];
        if (q.backwardEnabled) {
            possibleTypes.push('backward');
        }
        if (q.forwardEnabled) {
            // Make forward translations more likely on test since they're more challenging IMO
            possibleTypes.push('forward');
            possibleTypes.push('forward');
        } 
        if (q.recording && q.recordingEnabled) possibleTypes.push('audio');

        const type = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];

        if (!q.target || !q.native) {
            throw new Error('Lesson not available!');
        }

        if (type === 'backward' || type === 'audio') {
            return {...q, questionType: type, question: getMainVariant(q.target), answers: getAllVariants(q.native), vocabWords: {}, vocabSentences: {}};
        }

        return {...q, questionType: type, question: getMainVariant(q.native), answers: getAllVariants(q.target), vocabWords: {}, vocabSentences: {}};
    });

    const questionsWithType = await Promise.all(questionsWithTypePromises);

    return <LessonContent module={module} mode="test" questions={questionsWithType} userCourse={userCourse} numLessons={-1} />;
}