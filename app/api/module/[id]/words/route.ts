import { prisma } from "@/lib/db";
import { PrismaClient, Question } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: {id: string}}) {
    const moduleId = parseInt(context.params.id);

    const words = await prisma.word.findMany({where: {moduleId: moduleId}});

    let wordsToQuestions: {[id: number]: Question[]} = {};

    const promises = words.map(word => {
        return prisma.question.findMany({
            where: {
                moduleId: moduleId,
                wordHintsBackward: {
                    some: {
                        wordEntity: {
                            target: word.target.toLowerCase()
                        }
                    }
                }
            }
        });
    });

    const questions: Question[][] = await Promise.all(promises);

    wordsToQuestions = questions.reduce((prev, curr, index) => {
        return {...prev, [words[index].id]: curr};
    }, {});

    return NextResponse.json({words, wordsToQuestions});
}