import { prisma } from "@/lib/db";
import LessonContent from "./LessonContent";
import { useUser, userCanEditCourse } from "@/lib/user";
import { Prisma } from "@prisma/client";

export type QuestionType = 'forward' | 'backward' | 'audio' | 'info';
export type LessonQuestion = Prisma.QuestionGetPayload<{include: {feedbackRules: true, wordHintsBackward: {include: {wordEntity: true}}, wordHintsForward: {include: {wordEntity: true}}}}> & {question: string | null, answers: string[], questionType: QuestionType};

export default async function Lesson({ params }: { params: { id: string }}) {

    const lessonId = parseInt(params.id);

    const user = await useUser();

    const lesson = await prisma.lesson.findFirst({
        where: {
            id: lessonId
        },
        include: {
            module: {
                include: {
                    course: true,
                    lessons: true
                }
            }
        }
    });

    if (!lesson) {
        throw new Error("This lesson doesn't exist!");
    }

    if (!lesson.module.course.published && (!user || ! await userCanEditCourse(user.id, lesson.module.course.id, prisma))) {
        throw new Error("You're not allowed to see this!");
    }

    const questions = await prisma.question.findMany({
        where: {
            lessonId: lessonId
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

    const userCourse = user && await prisma.userCourse.findFirst({where: {userId: user.id, courseId: lesson.module.courseId}});

    const questionsWithType: LessonQuestion[] = questions.map(q => {

        if (q.type === 'INFO') {
            return {...q, question: null, answers: [], questionType: 'info'}
        }

        let possibleTypes: QuestionType[] = [];
        if (q.backwardEnabled) possibleTypes.push('backward');
        if (q.forwardEnabled) possibleTypes.push('forward');
        if (q.recording && q.recordingEnabled) possibleTypes.push('audio');

        const type = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];

        if (!q.target || !q.native) {
            throw new Error('Lesson not available!');
        }

        if (type === 'backward' || type === 'audio') {
            return {...q, questionType: type, question: q.target.split('\n')[0], answers: q.native.split('\n')};
        }

        return {...q, questionType: type, question: q.native.split('\n')[0], answers: q.target.split('\n')};
    });


    return <LessonContent lesson={lesson} questions={questionsWithType} userCourse={userCourse} numLessons={lesson.module.lessons.length} />;
}