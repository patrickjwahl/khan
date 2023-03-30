import { cookies } from 'next/headers'
import { sessionOptions } from './session'
import { unsealData } from 'iron-session';
import { Prisma, PrismaClient, User as PrismaUser } from '@prisma/client';

export type User = {
    isLoggedIn: boolean,
    email: string,
    id: number,
    username: string,
    canEdit: boolean
}

type UserWithEditingPrivileges = Prisma.UserGetPayload<{ include: { editableCourses: true }}>;

export async function useUser(): Promise<User | null> {
    const cookie = cookies().get(sessionOptions.cookieName);
    
    if (cookie?.value) {
        const data = await unsealData(cookie.value, {password: sessionOptions.password});
        const user = data?.user as User;

        if (user?.isLoggedIn) {
            return { ...user, isLoggedIn: true };
        }
    }

    return null;
}

export async function userCanEditCourse(userId: number, courseId: number, prismaClient: PrismaClient): Promise<boolean> {
    const user = await prismaClient.user.findFirst({where: {id: userId}, include: {editableCourses: true}});
    if (!user || !user.canEdit || !user.editableCourses.map(course => course.id).some(el => el === courseId)) {
        return false;
    }

    return true;
}