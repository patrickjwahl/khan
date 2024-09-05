import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: {id: string}}) {
    const moduleId = parseInt(context.params.id);

    const questions = await prisma.question.findMany({where: {moduleId: moduleId}});

    return NextResponse.json({questions});
}