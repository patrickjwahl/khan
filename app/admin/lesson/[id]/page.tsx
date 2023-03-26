import { prisma } from "@/lib/db";
import LessonDashboard from "./LessonDashboard";
import { useUser, userCanEditCourse } from "@/lib/user";

export async function generateMetadata({ params }: {params: {id: string}}) {
    const lesson = await prisma.lesson.findFirst({where: {id: parseInt(params.id)}});
    return {title: `${lesson?.title} | Genghis Khan Academy`};
}

export default async function Lesson({ params }: { params: { id: string }}) {

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
                    wordHints: {
                        include: {
                            wordEntity: true
                        }
                    },
                    feedbackRules: true
                }
            },
            module: {
                include: {
                    course: true,
                    questions: {
                        where: {
                            lessonId: null
                        }
                    }
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

    return <LessonDashboard initLesson={lesson} />
}