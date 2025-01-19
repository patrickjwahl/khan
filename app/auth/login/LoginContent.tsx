'use client'

import styles from '../Auth.module.scss';
import '../../user_globals.scss';
import { FormEventHandler, useState } from 'react';
import { post } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DotLoader from '@/components/DotLoader';
import variables from '@/app/v.module.scss'

export default function LoginContent() {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [usernameError, setUsernameError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    const router = useRouter();

    const logIn: FormEventHandler = async e => {
        e.preventDefault();

        setIsSubmitting(true);

        const payload = {
            username, password
        };

        const res = await post('/api/auth/login', payload);
        const data = await res.json();

        if (data.code !== 'OK') {
            switch (data.code) {
                case 'INCORRECT_PASSWORD':
                    setPasswordError("Incorrect password 🤨");
                    break;
                case 'NO_USER_EXISTS':
                    setUsernameError("This user doesn't exist! Did you mean to sign up?");
            }
        } else {
            router.push('/');
            return;
        }

        setIsSubmitting(false);
    };

    return (
        <div className={styles.container}>
            <form onSubmit={logIn}>
                <h4>Welcome home, conqueror...</h4>
                <div>
                    <input type="text" placeholder='Email or username' value={username} onChange={e => { setUsernameError(''); setUsername(e.target.value) }} />
                    {usernameError && <div className={styles.errorMessage}><div>{usernameError}</div></div>}
                </div>
                <div>
                    <input type="password" placeholder='Password' value={password} onChange={e => { setPasswordError(''); setPassword(e.target.value) }} />
                    {passwordError && <div className={styles.errorMessage}><div>{passwordError}</div></div>}
                </div>
                <div>
                    <button className='orange' type="submit">
                        {isSubmitting ? <DotLoader color={variables.background} /> : 'LOG IN'}
                    </button>
                </div>
            </form>
            <div className={styles.bottomContainer}>
                <h5>Don't have an account yet?</h5>
                <Link href='/auth/signup'><button className='purple'>SIGN UP</button></Link>
            </div>
        </div>
    );
}