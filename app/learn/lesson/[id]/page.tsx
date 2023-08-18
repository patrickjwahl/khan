import { prisma } from "@/lib/db";
import LessonContent from "./LessonContent";
import { useUser, userCanEditCourse } from "@/lib/user";
import { Prisma, Question, Word } from "@prisma/client";
import { COMMENT_REGEX, SENTENCE_REGEX, VOCAB_WORD_REGEX } from "@/lib/settings";
import '../../../vocab-word.scss';

export type QuestionType = 'forward' | 'backward' | 'audio' | 'info';
export type LessonQuestion = Prisma.QuestionGetPayload<{include: {feedbackRules: true, wordHintsBackward: {include: {wordEntity: true}}, wordHintsForward: {include: {wordEntity: true}}}}> & {question: string | null, answers: string[], questionType: QuestionType, vocabWords: {[w: string]: Word}, vocabSentences: {[id: number]: Question}};

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

    const questionsWithTypePromises = questions.map(async (q): Promise<LessonQuestion> => {

        if (q.type === 'INFO') {

            const wordsToReplace = q.info ? Array.from(q.info.matchAll(VOCAB_WORD_REGEX)).map(i => i[1]) : [];
            const wordEntityPromises = wordsToReplace.map(async word => {
                const wordEntity = await prisma.word.findFirst({
                    where: {
                        module: {
                            courseId: lesson.module.courseId
                        },
                        target: {equals: word, mode: 'insensitive'}
                    }
                });
                return [word, wordEntity];
            });

            const wordEntityMappings = await Promise.all(wordEntityPromises);
            const vocabWords: {[id: string]: Word} = wordEntityMappings.reduce((prev, curr) => {
                if (curr[1] && typeof curr[0] === "string") {
                    return {...prev, [curr[0].toLowerCase()]: curr[1]};
                }

                return prev;
            }, {});

            // replace bracket words with their entity hint form
            q.info = q.info ? q.info.replace(VOCAB_WORD_REGEX, (match, token) => {
                const lowerCaseToken = token.toLowerCase();
                if (vocabWords[lowerCaseToken]) {
                    return `<span class="lesson-vocab-word" data-word="${token}">${token}</span>`;
                }
                return token;
            }) : '';

            q.info = q.info.replaceAll(COMMENT_REGEX, '\n');

            const sentencesToReplace = Array.from(q.info.matchAll(SENTENCE_REGEX)).map(i => parseInt(i[1]));
            const sentenceEntityPromises = sentencesToReplace.map(async sentenceId => {
                const sentenceEntity = await prisma.question.findFirst({
                    where: { id: sentenceId }
                });
                return [sentenceId, sentenceEntity];
            });

            const sentenceEntityMappings = await Promise.all(sentenceEntityPromises);
            const sentences: {[id: number]: Question} = sentenceEntityMappings.reduce((prev, curr) => {
                if (curr[1] && typeof curr[0] === 'number') {
                    return {...prev, [curr[0]]: curr[1]};
                }
                return prev;
            }, {});

            // replace sentence IDs with their entity form
            q.info = q.info.replace(SENTENCE_REGEX, (match, token) => {
                const id = parseInt(token);
                if (sentences[id] && sentences[id].type === 'QUESTION') {
                    return `<span class="lesson-sentence" data-id="${id}">${sentences[id].target}</span>`
                }
                return '';
            });

            console.log(q.info);

            return {...q, question: null, answers: [], questionType: 'info', vocabWords, vocabSentences: sentences};
        }

        // OTHERWISE, the question is actually a question screen

        let possibleTypes: QuestionType[] = [];
        if (q.backwardEnabled) possibleTypes.push('backward');
        if (q.forwardEnabled) possibleTypes.push('forward');
        if (q.recording && q.recordingEnabled) possibleTypes.push('audio');

        const type = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];

        if (!q.target || !q.native) {
            throw new Error('Lesson not available!');
        }

        if (type === 'backward' || type === 'audio') {
            return {...q, questionType: type, question: q.target.split('\n')[0], answers: q.native.split('\n'), vocabWords: {}, vocabSentences: {}};
        }

        return {...q, questionType: type, question: q.native.split('\n')[0], answers: q.target.split('\n'), vocabWords: {}, vocabSentences: {}};
    });

    const questionsWithType = await Promise.all(questionsWithTypePromises);

    return <LessonContent lesson={lesson} questions={questionsWithType} userCourse={userCourse} numLessons={lesson.module.lessons.length} />;
}