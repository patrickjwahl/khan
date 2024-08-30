import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, context: {params: {course: string}}) {

    const courseId = parseInt(context.params.course);
    const requestData = await request.json();
    const word = requestData.word.toLowerCase();

    let wordEntity = await prisma.word.findFirst({where: {target: word, module: {courseId: courseId}}});

    if (!wordEntity) {
        wordEntity = await prisma.word.findFirst({where: {targetAlt: {contains: word}, module: {courseId} }});

        if (!wordEntity) {
            wordEntity = await prisma.word.findFirst({where: {native: word, module: {courseId: courseId}}});

            if (!wordEntity) {
                wordEntity = await prisma.word.findFirst({where: {nativeAlt: {contains: word}, module: {courseId}}});

                if (!wordEntity) {
                    return NextResponse.json({code: 'NO_WORD_FOUND'});
                }
            }
        }
    }

    return NextResponse.json({code: 'OK', word: wordEntity});
}