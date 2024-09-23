import { Question } from "@prisma/client";
import { useUser, userCanEditCourse } from "@/lib/user";
import { prisma } from "@/lib/db";
import ModuleMobileDashboard from "./ModuleMobileDashboard";

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
        }
    });

    if (!module) {
        throw new Error("Module not found!");
    }

    if (! await userCanEditCourse(user.id, module?.courseId, prisma)) {
        throw new Error("You're not allowed to see that!");
    }

    const moduleQuestions = await prisma.question.findMany({
        where: {
            moduleId: id,
            type: {
                not: {
                    equals: "INFO"
                }
            }
        }
    });

    const moduleWords = await prisma.word.findMany({
        where: {
            moduleId: id
        }
    });

    return <ModuleMobileDashboard initQuestions={moduleQuestions} initWords={moduleWords} module={module} />
}