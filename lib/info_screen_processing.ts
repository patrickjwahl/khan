import { LessonQuestion } from "@/app/learn/lesson/[id]/page";
import { Question, Word } from "@prisma/client";
import { COMMENT_REGEX, SENTENCE_REGEX, VOCAB_WORD_REGEX } from "./settings";
import { prisma } from "./db";
import { getMainVariant, stripInnerDelimiter } from "./string_processing";
import { QuestionWithFeedback } from "@/app/admin/module/[id]/ScreenDisplay";

export const embedSentencesAndWords = async (q: QuestionWithFeedback, courseId: number): Promise<LessonQuestion> => {

    const wordsToReplace = q.info ? Array.from(q.info.matchAll(VOCAB_WORD_REGEX)).map(i => i[1]) : [];
    const wordEntityPromises = wordsToReplace.map(async word => {
        const wordEntity = await prisma.word.findFirst({
            where: {
                module: {
                    courseId
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
            return `<span class="lesson-sentence" data-id="${id}">${stripInnerDelimiter(getMainVariant(sentences[id].target))}</span>`
        }
        return '';
    });

    return {...q, question: null, answers: [], questionType: 'info', vocabWords, vocabSentences: sentences};
}