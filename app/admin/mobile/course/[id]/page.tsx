import { prisma } from '@/lib/db';
import styles from '../../Mobile.module.scss';
import { useUser, userCanEditCourse } from '@/lib/user';
import Image from 'next/image';

export async function generateMetadata({ params }: {params: {id: string}}) {
    const course = await prisma.course.findFirst({where: {id: parseInt(params.id)}});
    return {title: `${course?.language} | Genghis Khan Academy`};
}

export default async function CourseMobile({ params }: { params: { id: string }}) {

    const id = parseInt(params.id);

    const user = await useUser();

    if (!user || !user.canEdit) {
        throw new Error("You're not authorized!");
    }

    const course = await prisma.course.findFirst({
        where: {
            id: id
        },
        include: {
            modules: {
                include: {
                    lessons: true
                },
                orderBy: {
                    index: 'asc'
                }
            },
            editors: true,
            owner: true
        }
    });

    if (!course) {
        throw new Error("Course not found!");
    }

    if (! await userCanEditCourse(user.id, course.id, prisma)) {
        throw new Error("You're not allowed to see that!");
    }

    const promises = course.modules.map(module => {
        return prisma.question.count({
            where: {
                moduleId: module.id,
                type: 'QUESTION',
                recording: null
            }
        }).then(res => ({id: module.id, badQuestions: res}));
    });

    const badQuestions: {[id: number]: number} = (await Promise.all(promises)).reduce((prev, curr) => {
        return {...prev, [curr.id]: curr.badQuestions};
    }, {});

    const wordPromises = course.modules.map(module => {
        return prisma.word.count({
            where: {
                moduleId: module.id,
                recording: null
            }
        }).then(res => ({id: module.id, badWords: res}));
    });

    const badWords: {[id: number]: number} = (await Promise.all(wordPromises)).reduce((prev, curr) => {
        return {...prev, [curr.id]: curr.badWords};
    }, {});

    return (
        <div className={styles.container}>
            <div className={styles.imageRow}>
            {course.image ? (
                <div className={styles.imageContainer}>
                    <Image fill src={`${process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN}/images/${course.image}`} alt="Course image" />
                </div>
                ) : (null)}
            </div>
            <h1>{course.language}</h1>
            <p>Course editing functionality is limited to recording audio on mobile devices. For full functionality, use a desktop.</p>
            <ul className={styles.listContainer}>
                {course.modules.map(module => (
                    <a href={`/admin/mobile/module/${module.id}`}>
                        <li>
                            {module.image ? (
                                <div className={styles.imageContainer}>
                                    <Image fill src={`${process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN}/images/${module.image}`} alt="Course image" />
                                </div>
                                ) : (null)}
                            <div>
                                <h3>{module.title}</h3>
                                <p>{badQuestions[module.id] + badWords[module.id]} recordings needed</p>
                            </div>
                        </li>
                    </a>
                ))}
            </ul>
        </div>
    )
}