import { prisma } from "@/lib/db";
import { useUser } from "@/lib/user";
import SidebarContent from "./SidebarContent";

export default async function Sidebar({ }: {   }) {
    
    const user = await useUser();
    
    if (!user) return <div>Log in to see your stats!</div>;

    const daysOfWeek = [0, 1, 2, 3, 4, 5, 6];

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
                date: date,
                userCourse: {
                    userId: user.id
                }
            }
        });
    });

    const expData = (await Promise.all(promises)).map(entry => entry._sum.amount || 0);

    const otherCourses = (await prisma.userCourse.findMany({
        where: {
            isCurrent: false,
            userId: user.id
        },
        include: {
            course: true
        }
    })).map(course => course.course);

    const friends = (await prisma.user.findFirst({
        where: {
            id: user.id
        },
        include: {
            friends: true
        }
    }))?.friends;

    if (!friends) {
        throw new Error("Something went wrong");
    }

    const friendIds = friends.map(friend => friend.id);

    const friendPromises = friendIds.map(id => {
        return prisma.exp.aggregate({
            where: {
                userCourse: {
                    userId: id
                },
                date: new Date().toDateString()
            },
            _sum: {
                amount: true
            }
        })
    });

    const friendProgress = (await Promise.all(friendPromises)).map((entry, index) => {
        return {...friends[index], exp: entry._sum.amount || 0}
    }).sort((a, b) => {
        return b.exp - a.exp;
    });
    
    return <SidebarContent expData={expData} otherCourses={otherCourses} friendData={friendProgress} />
}