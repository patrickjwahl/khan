import { PrismaClient } from "@prisma/client";
import CourseDashboard from "./CourseDashboard";
import { useUser } from "@/lib/user";

export default async function Course({ params }: { params: { id: string }}) {
    const prisma = new PrismaClient();
    const id = parseInt(params.id);

    const user = await useUser();

    if (!user || !user.canEdit) {
        throw new Error("You're not authorized!");
    }

    const course = await prisma.course.findFirst({
        where: {
            id: id
        },
        include: {
            modules: {
                include: {
                    lessons: true
                },
                orderBy: {
                    index: 'asc'
                }
            }
        }
    });

    if (!course) {
        throw new Error("Course not found!");
    }

    const promises = course.modules.map(module => {
        return prisma.question.count({
            where: {
                lesson: {
                    moduleId: module.id,
                },
                type: 'LISTENING',
                recording: null
            }
        }).then(res => ({id: module.id, badQuestions: res}));
    });

    const badQuestions = (await Promise.all(promises)).reduce((prev, curr) => {
        return {...prev, [curr.id]: curr.badQuestions};
    }, {});

    prisma.$disconnect();

    return <CourseDashboard course={course} badQuestionsPerModule={badQuestions} />
}