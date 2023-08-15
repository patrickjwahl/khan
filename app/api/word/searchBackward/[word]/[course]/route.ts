import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: {params: {word: string, course: string}}) {

    const courseId = parseInt(context.params.course);

    let wordEntity = await prisma.word.findFirst({where: {target: context.params.word, module: {courseId: courseId}}});

    if (!wordEntity) {
        wordEntity = await prisma.word.findFirst({where: {targetAlt: {contains: context.params.word}, module: {courseId} }});

        if (!wordEntity) {
            return NextResponse.json({code: 'NO_WORD_FOUND'});
        }
    } 

    return NextResponse.json({code: 'OK', word: wordEntity});
}