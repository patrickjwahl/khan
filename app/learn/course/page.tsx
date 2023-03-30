import { prisma } from "@/lib/db";
import { useUser } from "@/lib/user";
import { redirect } from "next/navigation";

export default async function Course() {
    const user = await useUser();
    if (!user) redirect('/learn/courses');
    
    const currentCourse = await prisma.userCourse.findFirst({
        where: {
            userId: user.id,
            isCurrent: true
        }
    });

    if (!currentCourse) {
        redirect('/learn/courses');
    }

    redirect(`/learn/course/${currentCourse.courseId}`);
}