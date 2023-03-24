import { PrismaClient } from "@prisma/client";
import ModuleDashboard from "./ModuleDashboard";
import { useUser, userCanEditCourse } from "@/lib/user";

export default async function Module({ params }: { params: { id: string }}) {
    const prisma = new PrismaClient();
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

    if (!module) {
        throw new Error("Course not found!");
    }

    prisma.$disconnect();

    return <ModuleDashboard module={module} />
}