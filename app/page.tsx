import Image from 'next/image';
import styles from './page.module.scss';
import './user_globals.scss';
import img from '../public/images/khan-himself.jpeg';
import { useUser } from '@/lib/user';

export const metadata = {
    title: 'Genghis Khan Academy | Learn a language. Build an empire.'
};

export default async function Page() {

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
            {user && user.isLoggedIn ? <div className={styles.usernameString}>Logged in as <b>{user.username}</b></div> : (null)}
            <div className={styles.buttonContainer}>
                {user && user.isLoggedIn ? <a href='/admin'><button className='blue'>COURSE EDITOR</button></a> : 
                <a href='/auth/signup'><button>CREATE AN ACCOUNT</button></a>}
                <a href='/learn/course/12'><button className="orange">START LEARNING MONGOLIAN</button></a>
            </div>
        </main>
    );
}
