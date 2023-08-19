import { prisma } from "@/lib/db";
import LessonContent from "./LessonContent";
import { useUser, userCanEditCourse } from "@/lib/user";
import { Prisma, Question, Word } from "@prisma/client";
import { COMMENT_REGEX, MAX_QUESTIONS_PER_LESSON, SENTENCE_REGEX, VOCAB_WORD_REGEX } from "@/lib/settings";
import '../../../vocab-word.scss';
import { getAllVariants, getMainVariant } from "@/lib/string_processing";
import { shuffleArray } from "@/lib/util";

export type QuestionType = 'forward' | 'backward' | 'audio' | 'info';
export type LessonQuestion = Prisma.QuestionGetPayload<{include: {feedbackRules: true, wordHintsBackward: {include: {wordEntity: true}}, wordHintsForward: {include: {wordEntity: true}}}}> & {question: string | null, answers: string[], questionType: QuestionType, vocabWords: {[w: string]: Word}, vocabSentences: {[id: number]: Question}};

enum LessonMode {
    Preview,
    FirstPass,
    OtherPass
}

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

    let mode: LessonMode;

    if (!lesson) {
        throw new Error("This lesson doesn't exist!");
    }

    if (!lesson.module.course.published && (!user || ! await userCanEditCourse(user.id, lesson.module.course.id, prisma))) {
        throw new Error("You're not allowed to see this!");
    }

    let questions = await prisma.question.findMany({
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

    const userCourse = user && await prisma.userCourse.findFirst({
        where: {
            userId: user.id, 
            courseId: lesson.module.courseId
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
        throw new Error("You're not subscribed to this course!");
    }

    if (!lesson.module.course.published || !lesson.module.published) {
        mode = LessonMode.Preview;
    } else if (userCourse.currentLesson.module.index < lesson.module.index || (userCourse.moduleId === lesson.moduleId && userCourse.currentLesson.index < lesson.index)) {
        throw new Error("You haven't unlocked this lesson yet!");
    } else if (userCourse.currentLesson.id === lessonId && userCourse.lessonCompletions === 0) {
        // This is the user's current lesson and they haven't completed it once yet
        mode = LessonMode.FirstPass;
    } else {
        mode = LessonMode.OtherPass;
    }

    if (mode === LessonMode.FirstPass) {
        // only take first pass questions and info screens, in order
        questions = questions.filter(q => q.firstPass || q.type === 'INFO');
    } else if (mode === LessonMode.OtherPass) {
        // one or more passes, so remove info screens, shuffle remaining questions,
        // and take a sampling of those
        questions = questions.filter(q => q.type === 'QUESTION');
        questions = shuffleArray(questions);
        questions = questions.slice(0, MAX_QUESTIONS_PER_LESSON);
    }
    // otherwise, we're in preview mode, so show every screen in order

    const questionsWithTypePromises = questions.map(async (q): Promise<LessonQuestion> => {

        if (q.type === 'INFO') {

            // process word and sentence embeddings if the question is an info screen

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
                    return `<span class="lesson-sentence" data-id="${id}">${getMainVariant(sentences[id].target)}</span>`
                }
                return '';
            });

            console.log(q.info);

            return {...q, question: null, answers: [], questionType: 'info', vocabWords, vocabSentences: sentences};
        }

        // OTHERWISE, the question is actually a question screen

        let possibleTypes: QuestionType[] = [];
        if (q.backwardEnabled) possibleTypes.push('backward');
        if (q.forwardEnabled) {
            // Make forward translations more likely since they're more rewarding IMO
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

    return <LessonContent lesson={lesson} questions={questionsWithType} userCourse={userCourse} numLessons={lesson.module.lessons.length} />;
}