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
                    wordHintsBackward: {
                        orderBy: {
                            index: 'asc'
                        },
                        include: {
                            wordEntity: true
                        }
                    },
                    wordHintsForward: {
                        orderBy: {
                            index: 'asc'
                        },
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

    if (! await userCanEditCourse(user.id, lesson.module.courseId, prisma)) {
        throw new Error("You're not allowed to see that!");
    }

    const next = await prisma.lesson.findFirst({
        where: {
            moduleId: lesson.moduleId,
            index: {
                gt: lesson.index
            }
        },
        orderBy: {
            index: 'desc'
        },
        select: {
            id: true
        }
    });

    const prev = await prisma.lesson.findFirst({
        where: {
            moduleId: lesson.moduleId,
            index: {
                lt: lesson.index
            }
        },
        orderBy: {
            index: 'asc'
        },
        select: {
            id: true
        }
    });

    return <LessonDashboard initLesson={lesson} nextId={next?.id} prevId={prev?.id} />
}