'use client'

import { useSelectedLayoutSegments } from 'next/navigation';
import styles from './Learn.module.scss';
import Link from 'next/link';
import img from '@/public/images/khan-civ.png';
import Image from 'next/image';

export default function Navbar({ isCourse = false }: { isCourse?: boolean }) {

    let current = isCourse ? 'course' : '';
    if (!current) current = useSelectedLayoutSegments()[0];

    return (
        <div className={styles.navbarContainer}>
            <div className={styles.navbarImageContainer}>
                <Image src={img} fill alt="logo" />
            </div>
            <Link href='/learn/course'><button className={current === 'course' ? 'purple' : 'blue'}>COURSE</button></Link>
            <Link href='/learn/profile/friends'><button className={current === 'friends' ? 'purple' : 'blue'}>FRIENDS</button></Link>
            <Link href='/learn/profile'><button className={current === 'profile' ? 'purple' : 'blue'}>PROFILE</button></Link>
            <a href='/admin'><button className='orange'>COURSE CREATOR</button></a>
        </div>
    );
}