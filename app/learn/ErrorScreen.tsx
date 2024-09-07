'use client'

import Image from 'next/image';
import styles from '@/app/learn/Learn.module.scss';
import img from '@/public/images/khan-confused.jpeg';

export default function ErrorScreen({ error }: {error: string}) {
    return <div style={{width: '100%', paddingTop: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        <div className={styles.errorImageContainer}>
            <Image fill src={img} alt="The khan is confused" />
        </div>
        {error}
    </div>
}