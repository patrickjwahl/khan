import { useUser } from "@/lib/user";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import Dashboard from "./Dashboard";
import { prisma } from "@/lib/db";
import ErrorScreen from "../learn/ErrorScreen";

export const metadata = {
    title: 'Admin Dashboard | Genghis Khan Academy'
};

export default async function Admin() {
    const user = await useUser();

    if (!user || !user.canEdit) {
        return <ErrorScreen error="You're not authorized!" />
    }

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

    return <Dashboard user={user} courses={courses} />
}