'use client'

import styles from '../Auth.module.scss';
import '../../user_globals.scss';
import { FormEventHandler, useState } from 'react';
import { post } from '@/lib/api';
import cn from 'classnames';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupContent() {

    const [ email, setEmail ] = useState('');
    const [ username, setUsername ] = useState('');
    const [ password, setPassword ] = useState('');

    const [ emailError, setEmailError ] = useState('');
    const [ usernameError, setUsernameError ] = useState('');
    const [ passwordError, setPasswordError ] = useState('');

    const [ isSubmitting, setIsSubmitting ] = useState(false);

    const router = useRouter();

    const signUp: FormEventHandler = async e => {
        e.preventDefault();

        setIsSubmitting(true);

        const payload = {
            email, username, password
        };

        const res = await post('/api/auth/signup', payload);
        const data = await res.json();

        if (data.code === 'VALIDATION_ERRORS') {
            data.errors.forEach((error: string) => {
                switch (error) {
                    case 'email':
                        setEmailError('You must enter a valid email address!');
                        break;
                    case 'password_strength':
                        setPasswordError("Password must contain letters of both cases and numbers!");
                        break;
                    case 'password_length':
                        setPasswordError("Password must be 8 characters long!");
                        break;
                    case 'username':
                        setUsernameError("Username must only contain alphanumeric characters and dashes!");
                }
            });
        }

        if (data.code === 'MATCHING_ERRORS') {
            data.errors.forEach((error: string) => {
                switch (error) {
                    case 'email':
                        setEmailError('That email is already in use! Did you mean to log in?');
                        break;
                    case 'username':
                        setUsernameError("That username is taken 😒");
                }
            });
        }

        if (data.code === 'OK') {
            router.push('/');
            return;
        }

        setIsSubmitting(false);
    };

    return (
        <div className={styles.container}>
            <form onSubmit={signUp}>
                <h4>Begin your adventure...</h4>
                <div>
                    <input type="email" placeholder='Email' value={email} onChange={e => {setEmailError(''); setEmail(e.target.value)}} />
                    {emailError && <div className={styles.errorMessage}><div>{emailError}</div></div>}
                </div>
                <div>
                    <input type="text" placeholder='Username' value={username} onChange={e => {setUsernameError(''); setUsername(e.target.value)}} />
                    {usernameError && <div className={styles.errorMessage}><div>{usernameError}</div></div>}
                </div>
                <div>
                    <input type="password" placeholder='Password' value={password} onChange={e => {setPasswordError(''); setPassword(e.target.value)}} />
                    {passwordError && <div className={styles.errorMessage}><div>{passwordError}</div></div>}
                </div>
                <div>
                    <input className={cn('purple', {'working': isSubmitting})} type="submit" value={isSubmitting ? '...' : 'CREATE ACCOUNT'} />
                </div>
            </form>
            <div className={styles.bottomContainer}>
                <h5>Already have an account?</h5>
                <Link href='/auth/login'><button className='orange'>LOG IN</button></Link>
            </div>
        </div>
    );
}