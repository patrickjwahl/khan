import { prisma } from "@/lib/db";
import { useUser } from "@/lib/user"
import styles from './Mobile.module.scss';
import Image from "next/image";
import ErrorScreen from "@/app/learn/ErrorScreen";

export async function generateMetadata({ params }: {params: {id: string}}) {
    return {title: 'Mobile Admin | Genghis Khan Academy'}
}

export default async function Mobile() {
    const user = await useUser()

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

    return (
        <div className={styles.container}>
            <h1>Mobile Dashboard</h1>
            <p>Course editing functionality is limited to recording audio on mobile devices. For full functionality, use a desktop.</p>
            <ul className={styles.listContainer}>
                {courses.map(course => (
                    <a href={`/admin/mobile/course/${course.id}`}>
                        <li>
                            {course.image ? (
                                <div className={styles.imageContainer}>
                                    <Image fill src={`${process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN}/images/${course.image}`} alt="Course image" />
                                </div>
                                ) : (null)}
                            <h3>{course.language}</h3>
                        </li>
                    </a>
                ))}
            </ul>
        </div>
    )
}