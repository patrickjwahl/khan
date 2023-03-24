import { useUser } from "@/lib/user";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import Dashboard from "./Dashboard";

export default async function Admin() {
    const user = await useUser();

    if (!user || !user.canEdit) {
        throw new Error("You're not authorized!");
    }

    const prisma = new PrismaClient();

    const courses = await prisma.course.findMany({
        where: {
            editors: {
                some: {
                    id: user.id
                }
            }
        },
        include: {
            modules: true
        },
        orderBy: {
            published: 'desc'
        }
    });

    prisma.$disconnect();

    return <Dashboard user={user} courses={courses} />
}