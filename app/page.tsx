import Image from 'next/image';
import styles from './page.module.scss';
import './user_globals.scss';
import img from '../public/images/khan-himself.jpeg';
import Link from 'next/link';

export const metadata = {
    title: 'Genghis Khan Academy | Learn a language. Build an empire.'
};

export default function Page() {
    return (
        <main className={styles.container}>
            <div className={styles.bigTitles}>
                <h1>GENGHIS KHAN ACADEMY</h1>
                <h4>LEARN A LANGUAGE. BUILD AN EMPIRE.</h4>
                <div>
                    <Image src={img} alt="The man himself - Genghis Khan" fill />
                </div>
            </div>
            <div className={styles.buttonContainer}>
                <Link href='/auth/signup'><button>CREATE AN ACCOUNT</button></Link>
                <button className="orange">START LEARNING MONGOLIAN</button>
            </div>
        </main>
    );
}
