import { prisma } from "@/lib/db";
import { useUser } from "@/lib/user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {

    const username = (await request.json()).username;

    const user = await useUser();
    if (!user) return NextResponse.json({code: 'NOT_LOGGED_IN'});

    const friend = await prisma.user.findFirst({
        where: {
            OR: [
                {
                    username: username
                },
                {
                    email: username
                }
            ]
        }
    });

    if (!friend) return NextResponse.json({code: 'NO_SUCH_USER'});

    await prisma.user.update({
        where: {
            id: user.id
        },
        data: {
            friends: {
                connect: {
                    id: friend.id
                }
            }
        }
    });

    await prisma.user.update({
        where: {
            id: friend.id
        }, 
        data: {
            friends: {
                connect: {
                    id: user.id
                }
            }
        }
    })

    return NextResponse.json({code: 'OK'});
}