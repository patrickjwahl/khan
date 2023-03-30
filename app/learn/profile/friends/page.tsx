import { prisma } from "@/lib/db";
import { useUser } from "@/lib/user";
import { redirect } from "next/navigation";
import FriendsContent from "./FriendsContent";

export default async function Friends() {
    const user = await useUser();
    if (!user) {
        redirect('/auth/login');
    }

    const friends = (await prisma.user.findFirst({
        where: {
            id: user.id
        },
        include: {
            friends: true
        }
    }))?.friends || [];

    return <FriendsContent friends={friends} />
}