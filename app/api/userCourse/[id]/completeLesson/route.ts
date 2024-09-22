import { prisma } from "@/lib/db";
import { EXP_FOR_LESSON_COMPLETE, EXP_FOR_MODULE_COMPLETE } from "@/lib/settings";
import { COMPLETIONS_FOR_LESSON_PASS } from "@/lib/settings";
import { EXP_FOR_ALREADY_FINISHED_LESSON } from "@/lib/settings";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, context: { params: {id: string}} ) {
    const requestData = await request.json();

    const lessonId = requestData.lessonId;
    const date = requestData.date;
    const id = parseInt(context.params.id);

    const userCourse = await prisma.userCourse.findFirst({
        where: {
            id: id
        },
        include: {
            user: true,
            course: {
                include: {
                    modules: {
                        where: {
                            published: true
                        },
                        orderBy: {
                            index: 'desc'
                        }
                    }
                }
            }
        }
    });

    if (!userCourse) return NextResponse.json({code: 'NO_SUCH_ITEM'});
    if (!userCourse.course.published) return NextResponse.json({code: 'OK'});

    const user = await prisma.user.findFirst({
        where: {
            id: userCourse.userId
        }
    });

    if (!user) {
        throw new Error("User not found!");
    }

    const lesson = await prisma.lesson.findFirst({
        where: {
            id: lessonId,
        },
        include: {
            module: true
        }
    });

    if (!lesson) return NextResponse.json({code: 'NO_SUCH_LESSON'});

    if (!lesson?.module.published) return NextResponse.json({code: 'OK'});

    const lastLessonDate = new Date(user.lastLesson || 'Thu Jan 01 1970');
    const now = new Date(date);

    let streak = 1;

    if (lastLessonDate.toDateString() === now.toDateString()) {
        // same day, streak stays same
        streak = user.streak;
    } else {
        lastLessonDate.setHours(lastLessonDate.getHours() + 24);
        if (lastLessonDate.toDateString() === now.toDateString()) {
            // one day later, streak increments
            streak = user.streak + 1;
        }
        // otherwise, the streak resets to 1
    }

    await prisma.user.update({
        where: {
            id: user.id
        },
        data: {
            streak,
            lastLesson: date
        }
    });

    if (lessonId !== userCourse.lessonId || lesson.moduleId !== userCourse.moduleId) {
        // Not the user's current lesson, give them credit for trying
        await addExp(EXP_FOR_ALREADY_FINISHED_LESSON, date, userCourse.id);
        return NextResponse.json({code: 'OK'});
    }

    if (userCourse.lessonCompletions < COMPLETIONS_FOR_LESSON_PASS - 1) {
        // hasn't passed the lesson, just update the number of completions

        await prisma.userCourse.update({
            where: {
                id: id
            },
            data: {
                lessonCompletions: userCourse.lessonCompletions + 1
            }
        });

        await addExp(EXP_FOR_LESSON_COMPLETE, date, userCourse.id);
    } else {
        const newLesson = await prisma.lesson.findFirst({
            where: {
                moduleId: userCourse.moduleId,
                index: {
                    gt: lesson.index
                }
            },
            orderBy: {
                index: 'asc'
            }
        });

        if (!newLesson) {
            // We're out of lessons, so we move to the next module
            const newModule = await prisma.module.findFirst({
                where: {
                    published: true,
                    courseId: userCourse.courseId,
                    index: {
                        gt: lesson.module.index
                    }
                },
                orderBy: {
                    index: 'asc'
                },
                include: {
                    lessons: {
                        orderBy: {
                            index: 'asc'
                        }
                    }
                }
            });

            if (!newModule) {
                // out of modules, user passes the course
                return NextResponse.json({code: 'THATS_ALL_FOLKS'});
            } else {
                await prisma.userCourse.update({
                    where: {
                        id: userCourse.id
                    },
                    data: {
                        moduleId: newModule.id,
                        lessonId: newModule.lessons[0].id,
                        lessonCompletions: 0
                    }
                });

                await addExp(EXP_FOR_MODULE_COMPLETE, date, userCourse.id);
            }
        } else {
            // move to next lesson
            await prisma.userCourse.update({
                where: {
                    id: userCourse.id
                },
                data: {
                    lessonId: newLesson.id,
                    lessonCompletions: 0
                }
            });

            await addExp(EXP_FOR_LESSON_COMPLETE, date, userCourse.id);
        }
    }

    return NextResponse.json({code: 'OK'});
}

async function addExp(amount: number, date: string, ucId: number) {
    const todayExp = await prisma.exp.findFirst({
        where: {
            userCourseId: ucId,
            date: date
        }
    });

    if (todayExp) {
        let exp = todayExp.amount;
        exp += amount;
        await prisma.exp.update({
            where: {
                id: todayExp.id
            },
            data: {
                amount: exp
            }
        });
    } else {
        await prisma.exp.create({
            data: {
                userCourseId: ucId,
                date: date,
                amount: amount
            }
        });
    }
}