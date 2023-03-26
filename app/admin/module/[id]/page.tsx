import { Question } from "@prisma/client";
import ModuleDashboard from "./ModuleDashboard";
import { useUser, userCanEditCourse } from "@/lib/user";
import { prisma } from "@/lib/db";

export async function generateMetadata({ params }: {params: {id: string}}) {
    const module = await prisma.module.findFirst({where: {id: parseInt(params.id)}});
    return {title: `${module?.title} | Genghis Khan Academy`};
}

export default async function Module({ params }: { params: { id: string }}) {
    const id = parseInt(params.id);

    const user = await useUser();

    if (!user || !user.canEdit) {
        throw new Error("You're not allowed to see that!");
    }

    const module = await prisma.module.findFirst({
        where: {
            id: id
        },
        include: {
            lessons: { 
                include: {
                    questions: true
                },
                orderBy: {
                    index: 'asc'
                }
            },
            course: true
        }
    });

    if (!module) {
        throw new Error("Module not found!");
    }

    if (!userCanEditCourse(user.id, module?.courseId, prisma)) {
        throw new Error("You're not allowed to see that!");
    }

    const moduleQuestions = await prisma.question.findMany({
        where: {
            moduleId: id
        }, 
        include: {
            feedbackRules: true,
            wordHints: {
                include: {
                    wordEntity: true
                }
            },
            lesson: true
        },
        orderBy: [
            {
                lesson: {
                    index: 'asc'
                }
            },
            {
                index: 'asc'
            }
        ]
    });

    const moduleWords = await prisma.word.findMany({
        where: {
            moduleId: id
        }
    });

    let wordsToQuestions: {[id: number]: Question[]} = {};

    const promises = moduleWords.map(word => {
        return prisma.question.findMany({
            where: {
                moduleId: id,
                wordHints: {
                    some: {
                        wordEntity: {
                            target: word.target.toLowerCase()
                        }
                    }
                }
            }
        });
    });

    const questions: Question[][] = await Promise.all(promises);

    wordsToQuestions = questions.reduce((prev, curr, index) => {
        return {...prev, [moduleWords[index].id]: curr};
    }, {});

    const next = await prisma.module.findFirst({
        where: {
            courseId: module.courseId,
            index: {
                gt: module.index
            }
        },
        orderBy: {
            index: 'desc'
        },
        select: {
            id: true
        }
    });

    const prev = await prisma.module.findFirst({
        where: {
            courseId: module.courseId,
            index: {
                lt: module.index
            }
        },
        orderBy: {
            index: 'asc'
        },
        select: {
            id: true
        }
    });

    return <ModuleDashboard initModule={module} prevId={prev?.id} nextId={next?.id} initModuleQuestions={moduleQuestions} words={moduleWords} wordsToQuestions={wordsToQuestions} />
}