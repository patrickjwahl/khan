import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async () => {
    await prisma.$transaction([
        prisma.course.deleteMany(),
        prisma.module.deleteMany(),
        prisma.question.deleteMany(),
        prisma.wordHint.deleteMany(),
        prisma.feedbackRule.deleteMany(),
        prisma.word.deleteMany(),
        prisma.user.deleteMany(),
        prisma.lesson.deleteMany(),
        prisma.exp.deleteMany(),
        prisma.userCourse.deleteMany()
    ]);
}