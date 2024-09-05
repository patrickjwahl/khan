import { prisma } from "@/lib/db";
import CourseDashboard from "./CourseDashboard";
import { useUser, userCanEditCourse } from "@/lib/user";

export async function generateMetadata({ params }: {params: {id: string}}) {
    const course = await prisma.course.findFirst({where: {id: parseInt(params.id)}});
    return {title: `${course?.language} | Genghis Khan Academy`};
}

export default async function Course({ params }: { params: { id: string }}) {
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
            },
            editors: true,
            owner: true
        }
    });

    if (!course) {
        throw new Error("Course not found!");
    }

    if (! await userCanEditCourse(user.id, course.id, prisma)) {
        throw new Error("You're not allowed to see that!");
    }

    const promises = course.modules.map(module => {
        return prisma.question.count({
            where: {
                lesson: {
                    moduleId: module.id,
                },
                type: 'QUESTION',
                recording: null
            }
        }).then(res => ({id: module.id, badQuestions: res}));
    });

    const badQuestions = (await Promise.all(promises)).reduce((prev, curr) => {
        return {...prev, [curr.id]: curr.badQuestions};
    }, {});

    return <CourseDashboard course={course} badQuestionsPerModule={badQuestions} user={user} />
}