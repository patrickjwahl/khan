import { useUser, userCanEditCourse } from "@/lib/user";
import CourseContent from "./CourseContent";
import { prisma } from "@/lib/db";
import styles from '../../Learn.module.scss';
import ErrorScreen from "../../ErrorScreen";

export const revalidate = 0

export default async function Course({ params }: { params: { id: string }}) {

    const courseId = parseInt(params.id);

    let moduleIndex = -1;
    let lessonIndex = -1;
    let lessonCompletions = -1;

    const user = await useUser();

    const userCanEdit = user && await userCanEditCourse(user.id, courseId, prisma);

    const course = await prisma.course.findFirst({
        where: {
            id: courseId
        },
        include: {
            modules: {
                where: {
                    OR: [
                        {
                            published: true
                        },
                        {
                            published: !userCanEdit
                        }
                    ]
                },
                include: {
                    lessons: {
                        orderBy: {
                            index: 'asc'
                        }
                    }
                },
                orderBy: {
                    index: 'asc'
                }
            }
        }
    });

    if (!course) {
        return <ErrorScreen error="You're looking for a course that doesn't exist!" />
    }

    if (user) {

        await prisma.userCourse.updateMany({
            where: {
                userId: user.id,
                isCurrent: true
            },
            data: {
                isCurrent: false
            }
        });

        let userCourse = await prisma.userCourse.findFirst({where: {userId: user.id, courseId: courseId},
            include: {
                currentLesson: true,
                currentModule: true
            }});
        if (!userCourse) {
            if (course.modules.length > 0 && course.modules[0].lessons.length > 0) {
                userCourse = await prisma.userCourse.create({
                    data: {
                        userId: user.id,
                        courseId: courseId,
                        moduleId: course.modules[0].id,
                        lessonId: course.modules[0].lessons[0].id
                    },
                    include: {
                        currentLesson: true,
                        currentModule: true,
                    }
                });
            }
            
        } else {
            await prisma.userCourse.update({
                where: {
                    id: userCourse.id
                },
                data: {
                    isCurrent: true
                }
            });
        }

        moduleIndex = userCourse?.currentModule.index || 0;
        lessonIndex = userCourse?.currentLesson?.index || 0;
        lessonCompletions = userCourse?.lessonCompletions || 0;
    } 
    
    if (!course.published && (!userCanEdit)) {
        return <ErrorScreen error="You don't have access to this course!" />
    }

    return (
        <div className={styles.courseContainer}>
            <CourseContent course={course} moduleIndex={moduleIndex} lessonIndex={lessonIndex} lessonCompletions={lessonCompletions} />
        </div>
    );
}