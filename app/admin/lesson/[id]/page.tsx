import { PrismaClient } from "@prisma/client";
import LessonDashboard from "./LessonDashboard";
import { useUser, userCanEditCourse } from "@/lib/user";

export default async function Module({ params }: { params: { id: string }}) {

    console.log('start');

    const prisma = new PrismaClient();
    const id = parseInt(params.id);

    const user = await useUser();

    if (!user || !user.canEdit) {
        throw new Error("You're not allowed to see that!");
    }

    const lesson = await prisma.lesson.findFirst({
        where: {
            id: id
        },
        include: {
            questions: {
                orderBy: {
                    index: 'asc'
                },
                include: {
                    feedbackRules: true
                }
            },
            module: {
                include: {
                    course: true
                }
            }
        }
    });

    if (!lesson) {
        throw new Error("Lesson not found!");
    }

    if (!userCanEditCourse(user.id, lesson.module.courseId, prisma)) {
        throw new Error("You're not allowed to see that!");
    }

    prisma.$disconnect();

    console.log('end');

    return <LessonDashboard lesson={lesson} />
}