'use client'

import { useSelectedLayoutSegments } from 'next/navigation';
import styles from './Learn.module.scss';
import Link from 'next/link';

export default function Navbar({ isCourse = false }: { isCourse?: boolean }) {

    let current = isCourse ? 'course' : '';
    if (!current) current = useSelectedLayoutSegments()[0];

    console.log(useSelectedLayoutSegments());

    return (
        <div className={styles.navbarContainer}>
            <h4>GKA</h4>
            <Link href='/learn/course'><button className={current === 'course' ? 'purple' : 'blue'}>COURSE</button></Link>
            <Link href='/learn/profile/friends'><button className={current === 'friends' ? 'purple' : 'blue'}>FRIENDS</button></Link>
            <Link href='/learn/profile'><button className={current === 'profile' ? 'purple' : 'blue'}>PROFILE</button></Link>
        </div>
    );
}