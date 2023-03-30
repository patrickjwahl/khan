import { NextRequest, NextResponse } from "next/server";
import { parse } from 'csv-parse/sync';
import { prisma } from "@/lib/db";
import { useUser, userCanEditCourse } from "@/lib/user";

type Row = { target: string, native: string };

export async function POST(request: NextRequest, context: { params: { id: string }}) {

    const requestData = await request.formData();
    const file = requestData.get('file') as File;
    const text = await file.text();
    
    const moduleId = parseInt(context.params.id);
    const module = await prisma.module.findFirst({where: {id: moduleId}});
    if (!module) return NextResponse.json({code: 'NO_SUCH_MODULE'});

    const user = await useUser();
    if (!user || !user.canEdit || !(await userCanEditCourse(user.id, module.courseId, prisma))) {
        return NextResponse.json({'code': 'UNAUTHORIZED'});
    }

    await prisma.word.deleteMany({where: {moduleId: moduleId}});

    const data: Row[] = parse(text, {columns: ['target', 'native']});
    for (const row of data) {
        const word = await prisma.word.create({
            data: {
                target: row.target,
                moduleId: moduleId,
                native: row.native
            }
        });
    
        await prisma.wordHint.updateMany({
            where: {
                question: {
                    module: {
                        courseId: module.courseId
                    }
                },
                wordString: word.target,
                wordEntityId: null
            },
            data: {
                wordEntityId: word.id
            }
        });
    }
    
    return NextResponse.json({code: 'OK'});
}