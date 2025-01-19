import { prisma } from "@/lib/db"
import { useUser } from "@/lib/user"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
    const requestData = await request.json()
    const user = await useUser()

    if (!user) return NextResponse.json({code: 'SESSION_NOT_FOUND'})

    await prisma.user.update({
        where: {
            id: user.id
        },
        data: requestData
    })

    return NextResponse.json({code: 'OK'})
}