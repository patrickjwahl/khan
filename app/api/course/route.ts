import { useUser } from "@/lib/user";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {

    const prisma = new PrismaClient();
    const requestData = await request.json();

    const user = await useUser();
    if (!user) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    const userData = await prisma.user.findFirst({where: {id: user.id}});
    if (!userData || !userData.canEdit) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    const course = await prisma.course.create({
        data: {
            language: requestData.language,
            ownerId: user.id,
            editors: {
                connect: {
                    id: user.id
                }
            }
        }
    });

    prisma.$disconnect();

    return NextResponse.json({code: 'OK', redirectId: course.id});

}