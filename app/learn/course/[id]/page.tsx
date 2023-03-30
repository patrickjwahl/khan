import { useUser, userCanEditCourse } from "@/lib/user";
import CourseContent from "./CourseContent";
import { prisma } from "@/lib/db";
import styles from '../../Learn.module.scss';
import Sidebar from "../Sidebar";
import SidebarContent from "../SidebarContent";

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
        throw new Error("Course does not exist!");
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

        moduleIndex = userCourse.currentModule.index;
        lessonIndex = userCourse.currentLesson.index;
        lessonCompletions = userCourse.lessonCompletions;
    } 
    
    if (!course.published && (!userCanEdit)) {
        throw new Error("You don't have access to this course!");
    }

    return (
        <div className={styles.courseContainer}>
            <CourseContent course={course} moduleIndex={moduleIndex} lessonIndex={lessonIndex} lessonCompletions={lessonCompletions} />
        </div>
    );
}

async function getSidebarContent() {
    const user = await useUser();
    
    if (!user) return <div>Log in to see your stats!</div>;

    const daysOfWeek = [6, 5, 4, 3, 2, 1, 0];

    const datesToGet = daysOfWeek.map(offset => {
        const d = new Date();
        d.setDate(d.getDate() - offset);
        return d.toDateString();
    });

    const promises = datesToGet.map(date => {
        return prisma.exp.aggregate({
            _sum: {
                amount: true
            },
            where: {
                date: date
            }
        });
    });

    const expData = (await Promise.all(promises)).map(entry => entry._sum.amount || 0);

    return <SidebarContent expData={expData} />
}