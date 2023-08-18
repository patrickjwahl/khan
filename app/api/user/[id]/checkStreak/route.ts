import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, context: { params: {id: string}} ) {
    const requestData = await request.json();
    const date = requestData.date;

    const id = parseInt(context.params.id);

    const user = await prisma.user.findFirst({
        where: {
            id: id
        }
    });

    if (!user) {
        throw new Error("User not found!");
    }

    const lastLessonDate = new Date(user.lastLesson || 'Thu Jan 01 1970');
    const now = new Date(date);

    let streak = 0;

    console.log('we in dis');
    console.log(user.streak);

    if (lastLessonDate.toDateString() === now.toDateString()) {
        // same day, streak stays same
        streak = user.streak;
    } else {
        lastLessonDate.setHours(lastLessonDate.getHours() + 24);
        if (lastLessonDate.toDateString() === now.toDateString()) {
            // one day later, streak still same
            streak = user.streak;
        }
        // otherwise, the streak resets to 0
    }

    await prisma.user.update({
        where: {
            id: user.id
        },
        data: {
            streak
        }
    });

    return NextResponse.json({code: 'OK', streak: streak});
}