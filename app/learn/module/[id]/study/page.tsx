import ErrorScreen from "@/app/learn/ErrorScreen";
import { prisma } from "@/lib/db";
import { useUser, userCanEditCourse } from "@/lib/user";
import StudyContent from "./StudyContent";
import { embedSentencesAndWords } from "@/lib/info_screen_processing";
import '@/app/vocab-word.scss';

export async function generateMetadata() {
    return {title: `Study | Genghis Khan Academy`};
}

export default async function Study({ params }: { params: { id: string }}) {
    const moduleId = parseInt(params.id);

    const user = await useUser();

    const module = await prisma.module.findFirst({
        where: {
            id: moduleId
        },
        include: {
            course: true
        }
    })

    if (!module) {
        return <ErrorScreen error="This module doesn't exist!" />
    }

    if (!module.course.published && (!user || ! await userCanEditCourse(user.id, module.course.id, prisma))) {
        return <ErrorScreen error="You're not allowed to see this!" />
    }

    const screens = await prisma.question.findMany({
        where: {
            moduleId: moduleId,
            type: 'INFO'
        }, 
        include: {
            feedbackRules: true,
            wordHintsBackward: {
                include: {
                    wordEntity: true
                }
            },
            wordHintsForward: {
                include: {
                    wordEntity: true
                }
            }
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
    })

    const embeddedScreens = await Promise.all(screens.map(screen => embedSentencesAndWords(screen, module.courseId)))

    return <StudyContent screens={embeddedScreens} module={module} />
}