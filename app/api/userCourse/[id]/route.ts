import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, context: { params: {id: string}} ) {
    const requestData = await request.json();

    const id = parseInt(context.params.id);

    await prisma.userCourse.updateMany({
        where: {
            id: id,
            course: {
                published: true
            }
        },
        data: requestData
    });

    return NextResponse.json({code: 'OK'});
}