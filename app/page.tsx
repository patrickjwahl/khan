import Image from 'next/image';
import styles from './page.module.scss';
import './user_globals.scss';
import img from '../public/images/khan-himself.jpeg';
import { useUser } from '@/lib/user';
import { prisma } from '@/lib/db';

export const metadata = {
    title: 'Genghis Khan Academy | Learn a language. Build an empire.'
};

export default async function Page() {

    const courseId = parseInt(process.env.DEFAULT_COURSE || '0')

    const course = await prisma.course.findFirst({
        where: {
            id: courseId
        }
    })

    const user = await useUser()

    return (
        <main className={styles.container}>
            <div className={styles.bigTitles}>
                <h1>GENGHIS KHAN ACADEMY</h1>
                <h4>LEARN A LANGUAGE. BUILD AN EMPIRE.</h4>
                <div>
                    <Image src={img} alt="The man himself - Genghis Khan" fill />
                </div>
            </div>
            {user && user.isLoggedIn ? <div className={styles.usernameString}>Welcome, <b>{user.username}</b> ... heir to the Khan... </div> : (null)}
            <div className={styles.buttonContainer}>
                {user && user.isLoggedIn ? <a href='/admin'><button className='blue'>COURSE EDITOR</button></a> : 
                <a href='/auth/signup'><button>CREATE AN ACCOUNT</button></a>}
                {user && user.isLoggedIn ? <a href={`/learn/course/${course?.id || ''}`}><button className="orange">START LEARNING {course?.language.toUpperCase() || 'MONGOLIAN'}</button></a> : 
                <a href='/auth/login'><button className='orange'>SIGN IN</button></a>}
            </div>
        </main>
    );
}
